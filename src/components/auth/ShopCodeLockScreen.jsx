import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldCheck,
  Lock,
  Unlock,
  KeyRound,
  ArrowRight,
  Store,
  Eye,
  EyeOff,
  AlertCircle,
  LogOut,
  Sparkles,
  Delete,
  RotateCcw,
} from 'lucide-react';
import Button from '../common/Button';

export default function ShopCodeLockScreen({
  businessProfile,
  user,
  onUnlock,
  onLogout,
  onProfileUpdate,
}) {
  const [shopCodeInput, setShopCodeInput] = useState('');
  const [showCode, setShowCode] = useState(false);
  const [error, setError] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [showPasswordFallback, setShowPasswordFallback] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [newShopCodeInput, setNewShopCodeInput] = useState('');
  const [isResettingCode, setIsResettingCode] = useState(false);

  const inputRef = useRef(null);

  const businessName = businessProfile?.business_name || 'Saree Business ERP';
  const shopNickname = businessProfile?.business_nickname || user?.username || 'Saree Store';
  const expectedShopCode = (businessProfile?.shop_code || '').trim();

  useEffect(() => {
    // Auto-focus input for immediate entry
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [showPasswordFallback]);

  // Handle Shop Code Unlock Verification
  const handleUnlock = async (codeToTest = null) => {
    setError(null);
    const code = (codeToTest !== null ? codeToTest : shopCodeInput).trim();

    if (!code) {
      setError('దయచేసి మీ షాప్ కోడ్ ఎంటర్ చేయండి (Please enter your Shop Code).');
      return;
    }

    setIsVerifying(true);

    try {
      // 1. If profile has shop_code, test locally first for instantaneous zero-latency unlock
      if (expectedShopCode) {
        if (code === expectedShopCode) {
          triggerSuccessUnlock();
          return;
        }
      }

      // 2. Call backend verification endpoint (handles sync and fallback)
      const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
      const res = await fetch('/api/auth/verify-shop-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ shop_code: code }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        triggerSuccessUnlock();
      } else {
        // Fallback: If no code was ever set, accept standard default '1234'
        if (!expectedShopCode && (code === '1234' || code === '0000')) {
          triggerSuccessUnlock();
          return;
        }
        throw new Error(data.error || 'తప్పు షాప్ కోడ్ (Incorrect Shop Code). Please re-enter.');
      }
    } catch (err) {
      setError(err.message || 'Incorrect Shop Code.');
      setShopCodeInput('');
      if (inputRef.current) inputRef.current.focus();
    } finally {
      setIsVerifying(false);
    }
  };

  const triggerSuccessUnlock = () => {
    // Record unlock in sessionStorage for active browser window
    sessionStorage.setItem('device_unlocked', 'true');
    if (onUnlock) {
      onUnlock();
    }
  };

  // Form submit on Enter key
  const handleSubmit = (e) => {
    e.preventDefault();
    handleUnlock();
  };

  // Handle on-screen Keypad taps
  const handleKeypadPress = (val) => {
    setError(null);
    if (val === 'CLEAR') {
      setShopCodeInput('');
    } else if (val === 'BACK') {
      setShopCodeInput((prev) => prev.slice(0, -1));
    } else {
      const next = shopCodeInput + val;
      setShopCodeInput(next);
      // Auto-submit if reaches expected code length (if configured)
      if (expectedShopCode && next.length === expectedShopCode.length) {
        handleUnlock(next);
      }
    }
  };

  // Password Verification for Code Reset or Bypass
  const handlePasswordUnlock = async (e) => {
    e.preventDefault();
    setError(null);

    if (!passwordInput) {
      setError('Please enter your account password.');
      return;
    }

    setIsVerifying(true);

    try {
      // Authenticate with user's password
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: user?.username || businessProfile?.business_nickname || 'owner',
          password: passwordInput,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Invalid password. Cannot unlock.');
      }

      // If user provided a new shop code to reset:
      if (newShopCodeInput.trim()) {
        const updateRes = await fetch('/api/business-profile', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${data.token || localStorage.getItem('auth_token')}`,
          },
          body: JSON.stringify({
            business_name: businessProfile?.business_name || 'Saree Store',
            business_address: businessProfile?.business_address || 'Main Store',
            business_nickname: businessProfile?.business_nickname || 'Saree Shop',
            shop_code: newShopCodeInput.trim(),
          }),
        });
        const updateData = await updateRes.json();
        if (updateData.success && onProfileUpdate) {
          onProfileUpdate(updateData.data);
        }
      }

      triggerSuccessUnlock();
    } catch (err) {
      setError(err.message || 'Verification failed.');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {/* Lock Brand Header */}
        <div style={styles.header}>
          <div style={styles.shieldBadge}>
            <ShieldCheck size={34} color="#ffffff" />
          </div>

          <div style={styles.storePill}>
            <Store size={14} color="#2563eb" />
            <span>{shopNickname}</span>
          </div>

          <h1 style={styles.title}>Store Protected • Quick Lock</h1>
          <p style={styles.subtitle}>
            మీ వ్యాపార లెక్కలు &amp; డాష్‌బోర్డ్ తెరవడానికి <strong>షాప్ కోడ్</strong> ఎంటర్ చేయండి
          </p>
          <span style={styles.securityHint}>
            🔒 100% Private: Customer / phone glance protection active
          </span>
        </div>

        {error && (
          <div style={styles.errorAlert}>
            <AlertCircle size={18} style={{ minWidth: 18, marginTop: 2 }} />
            <span>{error}</span>
          </div>
        )}

        {/* VIEW A: Standard Shop Code PIN Unlock */}
        {!showPasswordFallback ? (
          <div>
            <form onSubmit={handleSubmit} style={styles.form}>
              <div style={styles.inputWrapper}>
                <KeyRound size={20} color="#2563eb" style={styles.inputIcon} />
                <input
                  ref={inputRef}
                  type={showCode ? 'text' : 'password'}
                  value={shopCodeInput}
                  onChange={(e) => setShopCodeInput(e.target.value)}
                  placeholder="Enter Shop Code (e.g. 1234)"
                  style={styles.pinInput}
                  disabled={isVerifying}
                  autoComplete="off"
                />
                <button
                  type="button"
                  onClick={() => setShowCode(!showCode)}
                  style={styles.eyeBtn}
                  title={showCode ? 'Hide Code' : 'Show Code'}
                  tabIndex={-1}
                >
                  {showCode ? <EyeOff size={18} color="#64748b" /> : <Eye size={18} color="#64748b" />}
                </button>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isVerifying}
                icon={!isVerifying ? Unlock : undefined}
                style={{ width: '100%', padding: '13px', fontSize: '15px' }}
              >
                UNLOCK DASHBOARD
              </Button>
            </form>

            {/* Mobile & Touch Friendly Quick Keypad */}
            <div style={styles.keypadGrid}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleKeypadPress(String(num))}
                  style={styles.keypadBtn}
                >
                  {num}
                </button>
              ))}
              <button
                type="button"
                onClick={() => handleKeypadPress('CLEAR')}
                style={{ ...styles.keypadBtn, fontSize: '12px', color: '#64748b' }}
                title="Clear all digits"
              >
                CLEAR
              </button>
              <button
                type="button"
                onClick={() => handleKeypadPress('0')}
                style={styles.keypadBtn}
              >
                0
              </button>
              <button
                type="button"
                onClick={() => handleKeypadPress('BACK')}
                style={{ ...styles.keypadBtn, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                title="Backspace"
              >
                <Delete size={18} color="#64748b" />
              </button>
            </div>

            {/* Sub-actions */}
            <div style={styles.subActions}>
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setShowPasswordFallback(true);
                }}
                style={styles.linkBtn}
              >
                Forgot Shop Code? Unlock with Account Password
              </button>

              <button
                type="button"
                onClick={onLogout}
                style={styles.logoutBtn}
                title="Log out and return to username & password screen"
              >
                <LogOut size={13} />
                <span>Switch Account / Logout</span>
              </button>
            </div>
          </div>
        ) : (
          /* VIEW B: Password Fallback & Shop Code Reset */
          <form onSubmit={handlePasswordUnlock} style={styles.form}>
            <div style={styles.passwordFallbackNotice}>
              <strong>Unlock with Account Password</strong>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                Enter your master login password to unlock and optionally update your Shop Code.
              </div>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Account Password</label>
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="Enter account password"
                style={styles.input}
                disabled={isVerifying}
                required
                autoFocus
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>New 4-Digit Shop Code (Optional)</label>
              <input
                type="text"
                value={newShopCodeInput}
                onChange={(e) => setNewShopCodeInput(e.target.value)}
                placeholder="e.g. 1234 or SRI01"
                style={styles.input}
                disabled={isVerifying}
              />
              <span style={{ fontSize: '11px', color: '#64748b' }}>
                Leave blank to keep existing code, or enter a new code to save.
              </span>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isVerifying}
              icon={!isVerifying ? Unlock : undefined}
              style={{ width: '100%', marginTop: '4px' }}
            >
              VERIFY &amp; UNLOCK
            </Button>

            <button
              type="button"
              onClick={() => {
                setError(null);
                setShowPasswordFallback(false);
              }}
              style={{ ...styles.linkBtn, marginTop: '8px', alignSelf: 'center' }}
            >
              ← Back to Shop Code PIN
            </button>
          </form>
        )}

        <div style={styles.footerNote}>
          <ShieldCheck size={14} color="#10b981" />
          <span>Device Auto-Lock Protection • ZippyTech Systems</span>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)',
    padding: '24px 16px',
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    boxSizing: 'border-box',
  },
  card: {
    width: '100%',
    maxWidth: '420px',
    backgroundColor: '#ffffff',
    borderRadius: '20px',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.45)',
    padding: '32px 26px',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    textAlign: 'center',
    marginBottom: '20px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  shieldBadge: {
    width: '64px',
    height: '64px',
    borderRadius: '18px',
    backgroundColor: '#1d4ed8',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 14px auto',
    boxShadow: '0 8px 16px rgba(29, 78, 216, 0.35)',
  },
  storePill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    background: '#eff6ff',
    border: '1px solid #bfdbfe',
    color: '#1d4ed8',
    borderRadius: '9999px',
    padding: '4px 14px',
    fontSize: '0.82rem',
    fontWeight: '700',
    marginBottom: '10px',
  },
  title: {
    fontSize: '20px',
    fontWeight: '800',
    color: '#0f172a',
    margin: '0 0 6px 0',
  },
  subtitle: {
    fontSize: '13px',
    color: '#475569',
    margin: '0 0 4px 0',
    lineHeight: '1.45',
  },
  securityHint: {
    fontSize: '11px',
    color: '#10b981',
    fontWeight: '600',
    marginTop: '4px',
  },
  errorAlert: {
    backgroundColor: '#fef2f2',
    color: '#b91c1c',
    borderRadius: '8px',
    padding: '10px 14px',
    fontSize: '13px',
    marginBottom: '16px',
    display: 'flex',
    alignItems: 'flex-start',
    gap: '8px',
    border: '1px solid #fee2e2',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '5px',
  },
  label: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#334155',
  },
  inputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: '14px',
    pointerEvents: 'none',
  },
  eyeBtn: {
    position: 'absolute',
    right: '12px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '6px',
  },
  pinInput: {
    width: '100%',
    padding: '13px 46px 13px 44px',
    fontSize: '18px',
    fontWeight: '700',
    letterSpacing: '0.12em',
    textAlign: 'center',
    borderRadius: '12px',
    border: '2px solid #2563eb',
    backgroundColor: '#f8fafc',
    color: '#0f172a',
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
    transition: 'border-color 0.2s',
  },
  input: {
    width: '100%',
    padding: '11px 14px',
    fontSize: '14px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    backgroundColor: '#f8fafc',
    color: '#0f172a',
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
  },
  keypadGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '8px',
    marginTop: '16px',
  },
  keypadBtn: {
    padding: '12px',
    fontSize: '18px',
    fontWeight: '700',
    color: '#1e293b',
    backgroundColor: '#f1f5f9',
    border: '1px solid #e2e8f0',
    borderRadius: '10px',
    cursor: 'pointer',
    userSelect: 'none',
    transition: 'background-color 0.15s, transform 0.05s',
  },
  subActions: {
    marginTop: '18px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '10px',
    borderTop: '1px solid #f1f5f9',
    paddingTop: '14px',
  },
  linkBtn: {
    background: 'none',
    border: 'none',
    color: '#2563eb',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
    textDecoration: 'underline',
  },
  logoutBtn: {
    background: 'none',
    border: 'none',
    color: '#64748b',
    fontSize: '12px',
    fontWeight: '500',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '4px 8px',
  },
  passwordFallbackNotice: {
    backgroundColor: '#eff6ff',
    border: '1px solid #bfdbfe',
    borderRadius: '8px',
    padding: '10px 14px',
    fontSize: '13px',
    color: '#1e40af',
  },
  footerNote: {
    marginTop: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    fontSize: '11px',
    color: '#64748b',
  },
};
