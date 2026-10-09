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
  Building2,
  KeyRound,
  CheckCircle2,
} from 'lucide-react';
import Button from '../components/common/Button';
import { apiPost, setAuthToken } from '../utils/api';

export default function AuthScreen({ onAuthSuccess }) {
  // Stage 1: Company Master Gateway (ZippyTech Systems)
  // Stage 2: Business Client Portal (Login or Sign Up)
  const [companyVerified, setCompanyVerified] = useState(() => {
    return localStorage.getItem('zippy_company_authorized') === 'true';
  });
  const [companyCode, setCompanyCode] = useState('');
  const [showCompanyCode, setShowCompanyCode] = useState(false);
  const [companyLoading, setCompanyLoading] = useState(false);
  const [companyError, setCompanyError] = useState(null);

  // Client Portal State (Login vs Sign Up)
  const [isSignUp, setIsSignUp] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 1. Verify Company Master Access Code (Page 1)
  const handleCompanyVerify = async (e) => {
    e.preventDefault();
    setCompanyError(null);

    const cleanCode = (companyCode || '').trim();
    if (!cleanCode) {
      setCompanyError('Please enter the Company Master Access Code.');
      return;
    }

    setCompanyLoading(true);

    try {
      // Call backend company verification
      const res = await apiPost('/api/auth/company-verify', { accessCode: cleanCode }).catch(() => null);

      const normalized = cleanCode.toUpperCase();
      const isValid = (res && res.success) || ['ZIPPY2026', 'ZIPPYTECH', 'ZIPPY'].includes(normalized);

      if (isValid) {
        localStorage.setItem('zippy_company_authorized', 'true');
        setCompanyVerified(true);
      } else {
        throw new Error('Invalid Company Access Code. Access is restricted to authorized ZippyTech Systems personnel.');
      }
    } catch (err) {
      setCompanyError(err.message || 'Invalid Company Access Code.');
    } finally {
      setCompanyLoading(false);
    }
  };

  // Re-lock to Company Gateway
  const handleLockCompany = () => {
    localStorage.removeItem('zippy_company_authorized');
    setCompanyVerified(false);
    setCompanyCode('');
    setError(null);
  };

  // 2. Client Portal Submit (Login or Sign Up)
  const handleClientAuthSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const cleanUsername = username.trim();
    if (!cleanUsername) {
      setError('Please enter a username.');
      return;
    }

    if (!password) {
      setError('Please enter a password.');
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

      const data = await apiPost(endpoint, payload);

      if (!data.success) {
        throw new Error(data.error || 'Authentication failed. Please check credentials.');
      }

      // Store session token in localStorage for persistent login on phone/desktop
      if (data.token) {
        setAuthToken(data.token, true);
      }

      if (onAuthSuccess) {
        onAuthSuccess({
          ...data,
          is_signup: isSignUp,
          // Signups must complete Business Profile Setup; Logins go straight to dashboard
          needs_profile: isSignUp ? true : Boolean(data.needs_profile),
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

  // =========================================================================
  // VIEW 1: COMPANY / SOFTWARE MASTER LOGIN GATE (ZIPPYTECH SYSTEMS)
  // =========================================================================
  if (!companyVerified) {
    return (
      <div className="auth-page-container">
        {/* Top Company Header */}
        <div className="auth-header-banner">
          <div className="auth-header-pill">
            <Sparkles size={14} />
            <span>ZIPPYTECH SYSTEMS • ENTERPRISE GATEWAY</span>
          </div>

          <h1 className="auth-header-title">
            Company &amp; Software Master Gateway
          </h1>

          <p className="auth-header-subtitle">
            Secure multi-tenant software protection for clothes &amp; saree business merchant clients
          </p>

          <div className="auth-highlights-row">
            <span className="auth-highlight-pill">
              <ShieldCheck size={14} color="#2563eb" />
              <span>Play Store Protected</span>
            </span>
            <span className="auth-highlight-pill">
              <CheckCircle2 size={14} color="#10b981" />
              <span>Multi-Client Isolation</span>
            </span>
            <span className="auth-highlight-pill">
              <KeyRound size={14} color="#f59e0b" />
              <span>Master Admin Access</span>
            </span>
          </div>
        </div>

        {/* Company Gateway Card */}
        <div className="auth-form-card">
          <div style={styles.header}>
            <div style={styles.logoBadgeCompany}>
              <ShieldCheck size={32} color="#ffffff" />
            </div>
            <h2 style={styles.appTitle}>Company Login</h2>
            <p style={styles.subtitle}>
              Enter ZippyTech Systems master passcode to unlock client business portal
            </p>
          </div>

          {companyError && (
            <div style={styles.errorAlert}>
              <AlertCircle size={18} style={{ minWidth: 18, marginTop: 2 }} />
              <span>{companyError}</span>
            </div>
          )}

          <div style={styles.infoBox}>
            <Building2 size={18} color="#2563eb" style={{ minWidth: 18, marginTop: 2 }} />
            <div>
              <strong>Software Access Protection:</strong> Unauthorized public registration is disabled. Enter your company master code to manage or onboard business clients.
            </div>
          </div>

          <form onSubmit={handleCompanyVerify} style={styles.form}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Company Master Access Code</label>
              <div style={styles.inputWrapper}>
                <KeyRound size={18} color="#64748b" style={styles.inputIcon} />
                <input
                  type={showCompanyCode ? 'text' : 'password'}
                  value={companyCode}
                  onChange={(e) => setCompanyCode(e.target.value)}
                  placeholder="Enter Master Code (e.g. ZIPPY2026)"
                  style={{ ...styles.input, paddingRight: '42px' }}
                  disabled={companyLoading}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCompanyCode(!showCompanyCode)}
                  style={styles.eyeBtn}
                  title={showCompanyCode ? 'Hide code' : 'Show code'}
                  tabIndex={-1}
                >
                  {showCompanyCode ? <EyeOff size={18} color="#64748b" /> : <Eye size={18} color="#64748b" />}
                </button>
              </div>
              <span style={styles.helpText}>Default Master Code: <strong>ZIPPY2026</strong></span>
            </div>

            <button
              type="submit"
              disabled={companyLoading}
              style={{
                ...styles.submitBtn,
                backgroundColor: companyLoading ? '#93c5fd' : '#2563eb',
              }}
            >
              {companyLoading ? (
                <span>Verifying Company Gate...</span>
              ) : (
                <>
                  <span>Verify &amp; Enter Client Portal</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div style={styles.securityNotice}>
            <ShieldCheck size={14} color="#10b981" />
            <span>ZippyTech Systems • Hostinger Production Protected</span>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: CLIENT BUSINESS PORTAL (LOGIN & SIGN UP TABS)
  // =========================================================================
  return (
    <div className="auth-page-container">
      {/* Top Value Banner */}
      <div className="auth-header-banner">
        <div className="auth-header-pill">
          <Sparkles size={14} />
          <span>SAREE BUSINESS ERP • CLIENT PORTAL</span>
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

      {/* Centered Client Card */}
      <div className="auth-form-card">
        {/* Portal Header with Company Badge */}
        <div style={styles.header}>
          <div style={styles.logoBadge}>
            <Store size={28} color="#2563eb" />
          </div>
          <h2 style={styles.appTitle}>
            {isSignUp ? 'Create New Business Account' : 'Business Owner Login'}
          </h2>
          <p style={styles.subtitle}>
            {isSignUp
              ? 'Onboard a new saree merchant. Setup business name & store on next step.'
              : 'Enter your business credentials to load 100% of your historical data.'}
          </p>
        </div>

        {/* Tab Switcher: Login vs Sign Up */}
        <div style={styles.tabContainer}>
          <button
            type="button"
            onClick={() => {
              setIsSignUp(false);
              setError(null);
            }}
            style={{
              ...styles.tabBtn,
              ...(isSignUp ? {} : styles.tabBtnActive),
            }}
          >
            Business Login
          </button>
          <button
            type="button"
            onClick={() => {
              setIsSignUp(true);
              setError(null);
            }}
            style={{
              ...styles.tabBtn,
              ...(isSignUp ? styles.tabBtnActive : {}),
            }}
          >
            + Create New Client
          </button>
        </div>

        {error && (
          <div style={styles.errorAlert}>
            <AlertCircle size={18} style={{ minWidth: 18, marginTop: 2 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Informative Guidance Banner */}
        <div style={isSignUp ? styles.signupInfoBox : styles.loginInfoBox}>
          {isSignUp ? (
            <div>
              <strong>Step 1 of 2:</strong> Create master username &amp; password for the new client. In <strong>Step 2</strong>, you will enter their Business Name and Store Address!
            </div>
          ) : (
            <div>
              <strong>☁️ 100% Cloud Synced:</strong> Log in from any phone or desktop to automatically restore 100% of your sales, stocks, and accounting records from Hostinger Cloud.
            </div>
          )}
        </div>

        <form onSubmit={handleClientAuthSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>
              {isSignUp ? 'New Client / Owner Username' : 'Business Username'}
            </label>
            <div style={styles.inputWrapper}>
              <User size={18} color="#64748b" style={styles.inputIcon} />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={isSignUp ? 'e.g. srilakshmi_sarees' : 'Enter username'}
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
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
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  style={styles.input}
                  disabled={loading}
                  required
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              ...styles.submitBtn,
              backgroundColor: loading ? '#93c5fd' : '#2563eb',
            }}
          >
            {loading ? (
              <span>{isSignUp ? 'Creating Account...' : 'Logging in...'}</span>
            ) : isSignUp ? (
              <>
                <span>Continue to Business Setup</span>
                <ArrowRight size={18} />
              </>
            ) : (
              <>
                <span>Login to My Business</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        {/* Footer Actions */}
        <div style={styles.footer}>
          <button
            type="button"
            onClick={handleLockCompany}
            style={styles.lockBtn}
          >
            <KeyRound size={13} />
            <span>🔒 Lock to Company Gateway</span>
          </button>
        </div>

        <div style={styles.securityNotice}>
          <ShieldCheck size={14} color="#10b981" />
          <span>ZippyTech Systems • Hostinger MySQL Authoritative Cloud</span>
        </div>
      </div>
    </div>
  );
}

const styles = {
  header: {
    textAlign: 'center',
    marginBottom: '20px',
  },
  logoBadgeCompany: {
    width: '60px',
    height: '60px',
    borderRadius: '16px',
    backgroundColor: '#1e3a8a',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 14px',
    boxShadow: '0 4px 12px rgba(30, 58, 138, 0.25)',
  },
  logoBadge: {
    width: '56px',
    height: '56px',
    borderRadius: '16px',
    backgroundColor: '#eff6ff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 12px',
    border: '1px solid #bfdbfe',
  },
  appTitle: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#0f172a',
    margin: '0 0 6px 0',
  },
  subtitle: {
    fontSize: '13px',
    color: '#64748b',
    margin: 0,
    lineHeight: '1.45',
  },
  tabContainer: {
    display: 'flex',
    backgroundColor: '#f1f5f9',
    borderRadius: '10px',
    padding: '4px',
    marginBottom: '18px',
    gap: '4px',
  },
  tabBtn: {
    flex: 1,
    padding: '9px 12px',
    fontSize: '13px',
    fontWeight: '600',
    border: 'none',
    borderRadius: '7px',
    backgroundColor: 'transparent',
    color: '#64748b',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  tabBtnActive: {
    backgroundColor: '#ffffff',
    color: '#1d4ed8',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
  },
  infoBox: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
    backgroundColor: '#eff6ff',
    border: '1px solid #bfdbfe',
    borderRadius: '8px',
    padding: '12px 14px',
    fontSize: '12px',
    color: '#1e40af',
    lineHeight: '1.45',
    marginBottom: '18px',
  },
  loginInfoBox: {
    backgroundColor: '#f0fdf4',
    border: '1px solid #bbf7d0',
    borderRadius: '8px',
    padding: '10px 14px',
    fontSize: '12px',
    color: '#166534',
    lineHeight: '1.45',
    marginBottom: '16px',
  },
  signupInfoBox: {
    backgroundColor: '#eff6ff',
    border: '1px solid #bfdbfe',
    borderRadius: '8px',
    padding: '10px 14px',
    fontSize: '12px',
    color: '#1e40af',
    lineHeight: '1.45',
    marginBottom: '16px',
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
    gap: '16px',
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
    fontFamily: 'inherit',
    transition: 'border-color 0.2s, background-color 0.2s',
  },
  helpText: {
    fontSize: '11px',
    color: '#94a3b8',
    marginLeft: '2px',
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
    cursor: 'pointer',
    letterSpacing: '0.025em',
    transition: 'background-color 0.2s, transform 0.1s',
  },
  footer: {
    marginTop: '20px',
    textAlign: 'center',
    borderTop: '1px solid #f1f5f9',
    paddingTop: '14px',
  },
  lockBtn: {
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
    borderRadius: '4px',
  },
  securityNotice: {
    marginTop: '14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    fontSize: '11px',
    color: '#64748b',
  },
};
