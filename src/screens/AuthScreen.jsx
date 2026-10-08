import React, { useState, useEffect } from 'react';
import {
  Store,
  Lock,
  User,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  PiggyBank,
  BookX,
  Sparkles,
  Eye,
  EyeOff,
} from 'lucide-react';
import Button from '../components/common/Button';
import { apiPost, setAuthToken } from '../utils/api';

export default function AuthScreen({ onAuthSuccess }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [unlocked, setUnlocked] = useState(false);

  // Aggressively prevent browser autofill on page load so credentials are NEVER exposed to others
  useEffect(() => {
    setUsername('');
    setPassword('');
    setConfirmPassword('');

    const clearNativeInputs = () => {
      if (!unlocked) {
        const u = document.getElementById('secret_shop_user_field');
        const p = document.getElementById('secret_shop_pass_field');
        const cp = document.getElementById('secret_shop_confirm_pass_field');
        if (u && u.value) {
          u.value = '';
          setUsername('');
        }
        if (p && p.value) {
          p.value = '';
          setPassword('');
        }
        if (cp && cp.value) {
          cp.value = '';
          setConfirmPassword('');
        }
      }
    };

    clearNativeInputs();
    const t1 = setTimeout(clearNativeInputs, 50);
    const t2 = setTimeout(clearNativeInputs, 150);
    const t3 = setTimeout(clearNativeInputs, 350);
    const t4 = setTimeout(clearNativeInputs, 700);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [isSignUp, unlocked]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const cleanUsername = username.trim();
    if (!cleanUsername) {
      setError('Username is required.');
      return;
    }

    if (cleanUsername.length < 3 || cleanUsername.length > 50) {
      setError('Username must be between 3 and 50 characters.');
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(cleanUsername)) {
      setError('Username can only contain letters, numbers, and underscores.');
      return;
    }

    if (!password) {
      setError('Password is required.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (isSignUp && password !== confirmPassword) {
      setError('Password and confirmation password do not match.');
      return;
    }

    setLoading(true);

    try {
      const endpoint = isSignUp ? '/api/auth/signup' : '/api/auth/login';
      const payload = isSignUp
        ? { username: cleanUsername, password, confirmPassword }
        : { username: cleanUsername, password };

      // apiPost validates same-origin URL, sets headers, verifies content-type,
      // and guarantees JSON parsing without crashing on HTML
      const data = await apiPost(endpoint, payload);

      if (!data.success) {
        throw new Error(data.error || 'Authentication failed. Please check credentials.');
      }

      // Store session token in sessionStorage for maximum privacy & secrecy
      // When the browser tab or app is closed, session is automatically cleared!
      if (data.token) {
        setAuthToken(data.token, false);
      }

      if (onAuthSuccess) {
        onAuthSuccess({
          ...data,
          is_signup: isSignUp,
        });
      }
    } catch (err) {
      let displayMsg = err.message || 'An unexpected error occurred.';
      if (err.isHtml) {
        displayMsg = `Hostinger server returned an HTML error page (${err.status || 500}). Please ensure the Node.js application is active on Hostinger.`;
      }
      setError(displayMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-container">
      {/* Top Banner: Value Proposition Header */}
      <div className="auth-header-banner">
        <div className="auth-header-pill">
          <Sparkles size={14} />
          <span>SAREE BUSINESS ERP</span>
        </div>

        <h1 className="auth-header-title">
          Saree Business Management &amp; Accountant App
        </h1>

        <p className="auth-header-subtitle">
          అకౌంటెంట్ జీతం ఆదా చేసుకోండి • మీ చీరల వ్యాపార లెక్కలు &amp; స్టాక్ మీరే సులువుగా నిర్వహించుకోండి
        </p>

        <div className="auth-highlights-row">
          <span className="auth-highlight-pill">
            <PiggyBank size={14} color="#10b981" />
            <span>నెలకు ₹25,000+ ఆదా</span>
          </span>
          <span className="auth-highlight-pill">
            <BookX size={14} color="#f59e0b" />
            <span>నో పేపర్ బుక్స్ &amp; ఎక్సెల్</span>
          </span>
          <span className="auth-highlight-pill">
            <ShieldCheck size={14} color="#2563eb" />
            <span>100% పర్సనల్ &amp; సేఫ్</span>
          </span>
        </div>
      </div>

      {/* Centered Login / Sign Up Card */}
      <div className="auth-form-card">
        <div style={styles.header}>
          <div style={styles.logoBadge}>
            <Store size={28} color="#2563eb" />
          </div>
          <h2 style={styles.appTitle}>
            {isSignUp ? 'Create Owner Account' : 'Business Owner Login'}
          </h2>
          <p style={styles.subtitle}>
            {isSignUp
              ? 'Start managing your shop and saving accountant costs'
              : 'Enter your credentials to access your business ledger'}
          </p>
        </div>

        {error && (
          <div style={styles.errorAlert}>
            <AlertCircle size={18} style={{ minWidth: 18, marginTop: 2 }} />
            <span>{error}</span>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          style={styles.form}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="none"
          spellCheck="false"
          data-lpignore="true"
          data-form-type="other"
        >
          {/* Decoy hidden fields to absorb browser autofill */}
          <input
            type="text"
            name="prevent_browser_autofill_user"
            tabIndex={-1}
            autoComplete="off"
            style={{ position: 'absolute', top: -9999, left: -9999, opacity: 0, height: 0, width: 0 }}
          />
          <input
            type="password"
            name="prevent_browser_autofill_pass"
            tabIndex={-1}
            autoComplete="new-password"
            style={{ position: 'absolute', top: -9999, left: -9999, opacity: 0, height: 0, width: 0 }}
          />

          <div style={styles.inputGroup}>
            <label style={styles.label}>Username</label>
            <div style={styles.inputWrapper}>
              <User size={18} color="#64748b" style={styles.inputIcon} />
              <input
                type="text"
                name="secret_shop_user_field"
                id="secret_shop_user_field"
                autoComplete="one-time-code"
                data-lpignore="true"
                data-form-type="other"
                readOnly={!unlocked}
                onFocus={() => setUnlocked(true)}
                onClick={() => setUnlocked(true)}
                onTouchStart={() => setUnlocked(true)}
                value={username}
                onChange={(e) => {
                  setUnlocked(true);
                  setUsername(e.target.value);
                }}
                placeholder="Enter username"
                style={styles.input}
                disabled={loading}
                required
              />
            </div>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Password</label>
            <div style={styles.inputWrapper}>
              <Lock size={18} color="#64748b" style={styles.inputIcon} />
              <input
                type={showPassword ? 'text' : 'password'}
                name="secret_shop_pass_field"
                id="secret_shop_pass_field"
                autoComplete="one-time-code"
                data-lpignore="true"
                data-form-type="other"
                readOnly={!unlocked}
                onFocus={() => setUnlocked(true)}
                onClick={() => setUnlocked(true)}
                onTouchStart={() => setUnlocked(true)}
                value={password}
                onChange={(e) => {
                  setUnlocked(true);
                  setPassword(e.target.value);
                }}
                placeholder="Enter password (min 6 chars)"
                style={{ ...styles.input, paddingRight: '42px' }}
                disabled={loading}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={styles.eyeBtn}
                title={showPassword ? 'Hide password' : 'Show password'}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={18} color="#64748b" /> : <Eye size={18} color="#64748b" />}
              </button>
            </div>
          </div>

          {isSignUp && (
            <div style={styles.inputGroup}>
              <label style={styles.label}>Confirm Password</label>
              <div style={styles.inputWrapper}>
                <Lock size={18} color="#64748b" style={styles.inputIcon} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="secret_shop_confirm_pass_field"
                  id="secret_shop_confirm_pass_field"
                  autoComplete="one-time-code"
                  data-lpignore="true"
                  data-form-type="other"
                  readOnly={!unlocked}
                  onFocus={() => setUnlocked(true)}
                  onClick={() => setUnlocked(true)}
                  onTouchStart={() => setUnlocked(true)}
                  value={confirmPassword}
                  onChange={(e) => {
                    setUnlocked(true);
                    setConfirmPassword(e.target.value);
                  }}
                  placeholder="Re-enter password"
                  style={styles.input}
                  disabled={loading}
                  required
                />
              </div>
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={loading}
            icon={!loading ? ArrowRight : undefined}
            style={{ width: '100%', marginTop: '10px' }}
          >
            {isSignUp ? 'CREATE ACCOUNT' : 'LOGIN'}
          </Button>
        </form>

        <div style={styles.footer}>
          {isSignUp ? (
            <div style={styles.toggleText}>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(false);
                  setError(null);
                }}
                style={styles.toggleBtn}
              >
                LOGIN
              </button>
            </div>
          ) : (
            <div style={styles.toggleText}>
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(true);
                  setError(null);
                }}
                style={styles.toggleBtn}
              >
                SIGN UP
              </button>
            </div>
          )}
        </div>

        <div style={styles.securityNotice}>
          <ShieldCheck size={14} color="#10b981" />
          <span>Encrypted with scrypt • Multi-device cloud sync enabled</span>
        </div>
      </div>
    </div>
  );
}

const styles = {
  header: {
    textAlign: 'center',
    marginBottom: '22px',
  },
  logoBadge: {
    width: '52px',
    height: '52px',
    borderRadius: '14px',
    backgroundColor: '#eff6ff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 14px auto',
  },
  appTitle: {
    fontSize: '21px',
    fontWeight: '700',
    color: '#0f172a',
    margin: '0 0 6px 0',
  },
  subtitle: {
    fontSize: '13px',
    color: '#64748b',
    margin: 0,
    lineHeight: '1.4',
  },
  errorAlert: {
    backgroundColor: '#fef2f2',
    color: '#b91c1c',
    borderRadius: '8px',
    padding: '12px 14px',
    fontSize: '13px',
    marginBottom: '20px',
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
    border: '1px solid #fee2e2',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    position: 'relative',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
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
    left: '12px',
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
    padding: '4px',
  },
  input: {
    width: '100%',
    padding: '11px 12px 11px 38px',
    fontSize: '14px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    backgroundColor: '#f8fafc',
    color: '#0f172a',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s, background-color 0.2s',
  },
  submitBtn: {
    marginTop: '6px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '13px',
    backgroundColor: '#2563eb',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    letterSpacing: '0.025em',
    transition: 'background-color 0.2s, transform 0.1s',
  },
  footer: {
    marginTop: '22px',
    textAlign: 'center',
    borderTop: '1px solid #f1f5f9',
    paddingTop: '16px',
  },
  toggleText: {
    fontSize: '13px',
    color: '#64748b',
  },
  toggleBtn: {
    background: 'none',
    border: 'none',
    color: '#2563eb',
    fontWeight: '700',
    cursor: 'pointer',
    padding: '0 4px',
    fontSize: '13px',
  },
  securityNotice: {
    marginTop: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    fontSize: '11px',
    color: '#64748b',
  },
};
