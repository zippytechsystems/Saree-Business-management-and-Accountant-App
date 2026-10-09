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
  User,
  CheckCircle2,
} from 'lucide-react';
import Button from '../common/Button';
import { setAuthToken } from '../../utils/api';

export default function ShopCodeLockScreen({
  businessProfile,
  user,
  onUnlock,
  onLogout,
  onProfileUpdate,
}) {
  // Modes: 'pin' (default PIN unlock) | 'forgot_step1' (ask username & password) | 'forgot_step2' (set new shop code)
  const [mode, setMode] = useState('pin');

  // PIN Unlock State
  const [shopCodeInput, setShopCodeInput] = useState('');
  const [showCode, setShowCode] = useState(false);
  const [error, setError] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);

  // Forgot Shop Code Flow - Step 1: Verify Username & Password
  const [forgotUsername, setForgotUsername] = useState(user?.username || businessProfile?.business_nickname || '');
  const [forgotPassword, setForgotPassword] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  // Forgot Shop Code Flow - Step 2: Set New Shop Code
  const [newShopCode, setNewShopCode] = useState('');
  const [confirmNewShopCode, setConfirmNewShopCode] = useState('');
  const [showNewCode, setShowNewCode] = useState(false);
  const [verifiedToken, setVerifiedToken] = useState(null);

  const inputRef = useRef(null);

  const businessName = businessProfile?.business_name || 'Saree Business ERP';
  const shopNickname = businessProfile?.business_nickname || user?.username || 'Saree Store';
  const expectedShopCode = (businessProfile?.shop_code || '').trim() || '1234';

  useEffect(() => {
    // Auto-focus input when in PIN mode
    if (mode === 'pin' && inputRef.current) {
      inputRef.current.focus();
    }
  }, [mode]);

  // Keep forgotUsername in sync if user prop updates
  useEffect(() => {
    if (user?.username && !forgotUsername) {
      setForgotUsername(user.username);
    }
  }, [user]);

  // =========================================================================
  // 1. PIN Unlock Verification (STRICT: Never unlock on wrong code)
  // =========================================================================
  const handleUnlock = async (codeToTest = null) => {
    setError(null);
    const code = (codeToTest !== null ? codeToTest : shopCodeInput).trim();

    if (!code) {
      setError('దయచేసి మీ షాప్ కోడ్ ఎంటర్ చేయండి (Please enter your Shop Code).');
      return;
    }

    setIsVerifying(true);

    try {
      const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
      const res = await fetch('/api/auth/verify-shop-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ shop_code: code }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        triggerSuccessUnlock();
      } else {
        throw new Error(data.error || 'తప్పు షాప్ కోడ్ (Incorrect Shop Code). దయచేసి సరైన కోడ్ నమోదు చేయండి.');
      }
    } catch (err) {
      setError(err.message || 'తప్పు షాప్ కోడ్ (Incorrect Shop Code).');
      setShopCodeInput('');
      if (inputRef.current) inputRef.current.focus();
    } finally {
      setIsVerifying(false);
    }
  };

  const triggerSuccessUnlock = () => {
    sessionStorage.setItem('device_unlocked', 'true');
    if (onUnlock) {
      onUnlock();
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleUnlock();
  };

  const handleKeypadPress = (val) => {
    setError(null);
    if (val === 'CLEAR') {
      setShopCodeInput('');
    } else if (val === 'BACK') {
      setShopCodeInput((prev) => prev.slice(0, -1));
    } else {
      const next = shopCodeInput + val;
      setShopCodeInput(next);
      // Auto-verify if typed length matches expected code length (if code is set)
      if (expectedShopCode && next.length === expectedShopCode.length) {
        handleUnlock(next);
      }
    }
  };

  // =========================================================================
  // 2. Forgot Shop Code: STEP 1 - Verify Username & Password
  // =========================================================================
  const handleVerifyCredentials = async (e) => {
    e.preventDefault();
    setError(null);

    const cleanUsername = forgotUsername.trim();
    if (!cleanUsername) {
      setError('దయచేసి యూజర్ నేమ్ నమోదు చేయండి (Please enter your Username).');
      return;
    }

    if (!forgotPassword) {
      setError('దయచేసి పాస్‌వర్డ్ నమోదు చేయండి (Please enter your account password).');
      return;
    }

    setIsVerifying(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: cleanUsername,
          password: forgotPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'తప్పు యూజర్ నేమ్ లేదా పాస్‌వర్డ్ (Invalid Username or Password). Please try again.');
      }

      // Valid credentials! Store session token and move to Step 2
      if (data.token) {
        setAuthToken(data.token, true);
        setVerifiedToken(data.token);
      }

      if (data.business_profile && onProfileUpdate) {
        onProfileUpdate(data.business_profile);
      }

      // Clear password from state and transition to Step 2
      setForgotPassword('');
      setError(null);
      setMode('forgot_step2');
    } catch (err) {
      setError(err.message || 'ధృవీకరణ విఫలమైంది (Verification failed). Please check your Username & Password.');
    } finally {
      setIsVerifying(false);
    }
  };

  // =========================================================================
  // 3. Forgot Shop Code: STEP 2 - Set & Confirm New Shop Code
  // =========================================================================
  const handleSaveNewShopCode = async (e) => {
    e.preventDefault();
    setError(null);

    const cleanNewCode = newShopCode.trim();
    const cleanConfirmCode = confirmNewShopCode.trim();

    if (!cleanNewCode) {
      setError('దయచేసి క్రొత్త షాప్ కోడ్ నమోదు చేయండి (Please enter your new Shop Code).');
      return;
    }

    if (cleanNewCode.length < 3) {
      setError('షాప్ కోడ్ కనీసం 3 లేదా 4 అంకెలు ఉండాలి (Shop Code must be at least 3 digits).');
      return;
    }

    if (cleanNewCode !== cleanConfirmCode) {
      setError('షాప్ కోడ్స్ సరిపోలడం లేదు (Shop Codes do not match). దయచేసి నిర్ధారణ కోడ్ మళ్లీ సరిచూడండి.');
      return;
    }

    setIsVerifying(true);

    try {
      const token = verifiedToken || localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
      const res = await fetch('/api/auth/reset-shop-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          shop_code: cleanNewCode,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'షాప్ కోడ్ సేవ్ చేయడం విఫలమైంది (Failed to update Shop Code).');
      }

      // Update parent profile state so settings & dashboard reflect the new code immediately
      const updatedProfile = data.business_profile || data.data || {
        ...businessProfile,
        shop_code: cleanNewCode,
      };

      if (onProfileUpdate) {
        onProfileUpdate(updatedProfile);
      }

      // Unlock and proceed to dashboard
      triggerSuccessUnlock();
    } catch (err) {
      setError(err.message || 'షాప్ కోడ్ అప్‌డేట్ విఫలమైంది (Failed to update Shop Code).');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {/* Lock Brand Header */}
        <div style={styles.header}>
          <div style={mode === 'forgot_step2' ? styles.successBadge : styles.shieldBadge}>
            {mode === 'forgot_step2' ? (
              <CheckCircle2 size={34} color="#ffffff" />
            ) : mode === 'forgot_step1' ? (
              <KeyRound size={34} color="#ffffff" />
            ) : (
              <ShieldCheck size={34} color="#ffffff" />
            )}
          </div>

          <div style={styles.storePill}>
            <Store size={14} color="#2563eb" />
            <span>{shopNickname}</span>
          </div>

          <h1 style={styles.title}>
            {mode === 'forgot_step1'
              ? 'Forgot Shop Code • Verify Identity'
              : mode === 'forgot_step2'
              ? 'Set New Shop Code'
              : 'Store Protected • Quick Lock'}
          </h1>
          <p style={styles.subtitle}>
            {mode === 'forgot_step1'
              ? 'షాప్ కోడ్ రీసెట్ చేయడానికి మీ యూజర్ నేమ్ & పాస్‌వర్డ్ నమోదు చేయండి'
              : mode === 'forgot_step2'
              ? 'మీ స్టోర్ డాష్‌బోర్డ్ తెరవడానికి క్రొత్త 4-అంకెల పిన్ నమోదు చేయండి'
              : 'మీ వ్యాపార లెక్కలు & డాష్‌బోర్డ్ తెరవడానికి షాప్ కోడ్ ఎంటర్ చేయండి'}
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

        {/* ================================================================= */}
        {/* VIEW 1: STANDARD SHOP CODE PIN UNLOCK                             */}
        {/* ================================================================= */}
        {mode === 'pin' && (
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
                  setMode('forgot_step1');
                }}
                style={styles.linkBtn}
              >
                Forgot Shop Code? (షాప్ కోడ్ మర్చిపోయారా?)
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
        )}

        {/* ================================================================= */}
        {/* VIEW 2: FORGOT STEP 1 - ASK USERNAME & PASSWORD                   */}
        {/* ================================================================= */}
        {mode === 'forgot_step1' && (
          <form onSubmit={handleVerifyCredentials} style={styles.form}>
            <div style={styles.noticeBox}>
              <div style={{ fontWeight: '700', color: '#1e40af', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <KeyRound size={15} />
                <span>Step 1: ఖాతా భద్రత ధృవీకరణ (Verify Account)</span>
              </div>
              <div style={{ fontSize: '12px', color: '#475569', marginTop: '4px', lineHeight: '1.4' }}>
                ఎవరైనా మీ డేటా చూడకుండా ఉండటానికి, దయచేసి మీ <strong>యూజర్ నేమ్</strong> మరియు <strong>పాస్‌వర్డ్</strong> నమోదు చేయండి. అవి సరిగ్గా ఉంటేనే క్రొత్త షాప్ కోడ్ ఆప్షన్ వస్తుంది.
              </div>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>
                <User size={13} style={{ display: 'inline', marginRight: '4px' }} />
                User Name (యూజర్ నేమ్)
              </label>
              <input
                type="text"
                value={forgotUsername}
                onChange={(e) => setForgotUsername(e.target.value)}
                placeholder="Enter your login username"
                style={styles.input}
                disabled={isVerifying}
                required
                autoFocus
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>
                <Lock size={13} style={{ display: 'inline', marginRight: '4px' }} />
                Account Password (ఖాతా పాస్‌వర్డ్)
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  type={showForgotPassword ? 'text' : 'password'}
                  value={forgotPassword}
                  onChange={(e) => setForgotPassword(e.target.value)}
                  placeholder="Enter your account password"
                  style={{ ...styles.input, paddingRight: '40px' }}
                  disabled={isVerifying}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(!showForgotPassword)}
                  style={styles.eyeBtn}
                  tabIndex={-1}
                >
                  {showForgotPassword ? <EyeOff size={16} color="#64748b" /> : <Eye size={16} color="#64748b" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isVerifying}
              icon={!isVerifying ? ArrowRight : undefined}
              style={{ width: '100%', marginTop: '6px' }}
            >
              ధృవీకరించండి (VERIFY CREDENTIALS)
            </Button>

            <button
              type="button"
              onClick={() => {
                setError(null);
                setMode('pin');
              }}
              style={{ ...styles.linkBtn, marginTop: '10px', alignSelf: 'center' }}
            >
              ← Back to Shop Code PIN
            </button>
          </form>
        )}

        {/* ================================================================= */}
        {/* VIEW 3: FORGOT STEP 2 - SET & CONFIRM NEW SHOP CODE               */}
        {/* ================================================================= */}
        {mode === 'forgot_step2' && (
          <form onSubmit={handleSaveNewShopCode} style={styles.form}>
            <div style={styles.verifiedBox}>
              <div style={{ fontWeight: '700', color: '#065f46', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle2 size={16} color="#10b981" />
                <span>ఖాతా ధృవీకరించబడింది (Identity Verified ✓)</span>
              </div>
              <div style={{ fontSize: '12px', color: '#047857', marginTop: '4px' }}>
                User <strong>{forgotUsername}</strong> ధృవీకరించబడింది. ఇప్పుడు మీ వ్యాపారం కోసం క్రొత్త షాప్ కోడ్ (PIN) సెట్ చేయండి.
              </div>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>
                <KeyRound size={13} style={{ display: 'inline', marginRight: '4px' }} />
                క్రొత్త షాప్ కోడ్ (New 4-Digit Shop Code)
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  type={showNewCode ? 'text' : 'password'}
                  value={newShopCode}
                  onChange={(e) => setNewShopCode(e.target.value)}
                  placeholder="e.g. 1234 or 5678"
                  style={{ ...styles.input, paddingRight: '40px', fontWeight: '700', letterSpacing: '0.08em' }}
                  disabled={isVerifying}
                  required
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowNewCode(!showNewCode)}
                  style={styles.eyeBtn}
                  tabIndex={-1}
                >
                  {showNewCode ? <EyeOff size={16} color="#64748b" /> : <Eye size={16} color="#64748b" />}
                </button>
              </div>
              <span style={{ fontSize: '11px', color: '#64748b' }}>
                ఈ కోడ్ ద్వారా మాత్రమే భవిష్యత్తులో యాప్ అన్‌లాక్ అవుతుంది.
              </span>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>
                షాప్ కోడ్ నిర్ధారించండి (Confirm New Shop Code)
              </label>
              <input
                type={showNewCode ? 'text' : 'password'}
                value={confirmNewShopCode}
                onChange={(e) => setConfirmNewShopCode(e.target.value)}
                placeholder="Re-enter new shop code"
                style={{ ...styles.input, fontWeight: '700', letterSpacing: '0.08em' }}
                disabled={isVerifying}
                required
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isVerifying}
              icon={!isVerifying ? Unlock : undefined}
              style={{ width: '100%', marginTop: '6px', background: '#059669' }}
            >
              కోడ్ సేవ్ చేసి డాష్‌బోర్డ్ తెరవండి (SAVE &amp; UNLOCK)
            </Button>

            <button
              type="button"
              onClick={() => {
                setError(null);
                setMode('pin');
              }}
              style={{ ...styles.linkBtn, marginTop: '10px', alignSelf: 'center' }}
            >
              Cancel &amp; Return to Lock Screen
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
  successBadge: {
    width: '64px',
    height: '64px',
    borderRadius: '18px',
    backgroundColor: '#10b981',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 14px auto',
    boxShadow: '0 8px 16px rgba(16, 185, 129, 0.35)',
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
    display: 'flex',
    alignItems: 'center',
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
  noticeBox: {
    backgroundColor: '#eff6ff',
    border: '1px solid #bfdbfe',
    borderRadius: '10px',
    padding: '12px 14px',
    fontSize: '13px',
  },
  verifiedBox: {
    backgroundColor: '#ecfdf5',
    border: '1px solid #a7f3d0',
    borderRadius: '10px',
    padding: '12px 14px',
    fontSize: '13px',
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
