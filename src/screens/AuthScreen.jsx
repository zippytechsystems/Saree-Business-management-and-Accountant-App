import React, { useState } from 'react';
import {
  Store,
  Lock,
  User,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  PiggyBank,
  BookX,
  FileSpreadsheet,
  Boxes,
  CheckCircle,
  Sparkles,
} from 'lucide-react';

const VALUE_POINTS = [
  {
    icon: PiggyBank,
    color: '#10b981',
    bgColor: 'rgba(16, 185, 129, 0.2)',
    title: 'అకౌంటెంట్ జీతం ఆదా! (Save Salary)',
    desc: 'నెలకు వేల రూపాయల అకౌంటెంట్ జీతం ఖర్చు లేకుండా మీ షాప్ లెక్కలు మీరే 1 నిమిషంలో చేసుకోండి.',
  },
  {
    icon: BookX,
    color: '#f59e0b',
    bgColor: 'rgba(245, 158, 11, 0.2)',
    title: 'నోట్స్ & బుక్స్ అవసరం లేదు (No Books)',
    desc: 'పుస్తకాల్లో రాసే తలనొప్పి, కాలిక్యులేషన్ తప్పులు పోతాయి. ప్రతీ రూపాయి ఖచ్చితంగా రికార్డ్ అవుతుంది.',
  },
  {
    icon: FileSpreadsheet,
    color: '#38bdf8',
    bgColor: 'rgba(56, 189, 248, 0.2)',
    title: 'ఎక్సెల్ శ్రమ లేదు (No Excel Hassle)',
    desc: 'ఎక్సెల్ ఫార్ములాలు వెతకక్కర్లేదు — డైలీ సేల్స్, టర్నోవర్, మరియు నెట్ లాభాలు ఆటోమేటిక్‌గా రెడీ.',
  },
  {
    icon: Boxes,
    color: '#c084fc',
    bgColor: 'rgba(192, 132, 252, 0.2)',
    title: 'పర్సనల్ డేటా 100% సేఫ్ & ప్రైవేట్',
    desc: 'మీ బిజినెస్ సీక్రెట్స్ పూర్తిగా మీ చేతుల్లోనే క్లౌడ్‌లో సురక్షితం. మొబైల్ లేదా లాప్‌టాప్‌లో ఎప్పుడైనా యాక్సెస్.',
  },
];

export default function AuthScreen({ onAuthSuccess }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const cleanUsername = username.trim();
    if (!cleanUsername) {
      setError('Username is required.');
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
      setError('Confirm password does not match.');
      return;
    }

    setLoading(true);

    try {
      const endpoint = isSignUp ? '/api/auth/signup' : '/api/auth/login';
      const payload = isSignUp
        ? { username: cleanUsername, password, confirmPassword }
        : { username: cleanUsername, password };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Authentication failed. Please check credentials.');
      }

      // Store only the secure JWT/session token - NEVER store passwords in localStorage
      if (data.token) {
        localStorage.setItem('auth_token', data.token);
      }

      if (onAuthSuccess) {
        onAuthSuccess(data);
      }
    } catch (err) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-container">
      <div className="auth-layout-grid">
        {/* Left Hero Section: Visual Showcase & Value Proposition */}
        <div className="auth-hero-banner">
          <div className="auth-hero-pill">
            <Sparkles size={14} />
            <span>SMART BUSINESS & ACCOUNTANT ERP</span>
          </div>

          <h1 className="auth-hero-title">
            ఈజీ స్టాక్ & అకౌంటెంట్ మేనేజ్‌మెంట్ <br />
            <span className="auth-hero-title-highlight">
              పుస్తకాల్లో లెక్కలు మానేయండి • అకౌంటెంట్ జీతం ఆదా!
            </span>
          </h1>

          <p className="auth-hero-desc">
            పెద్ద షాపులైనా, చిన్న వ్యాపారాలైనా... ఎక్సెల్ శ్రమ లేకుండా, పేపర్ నోట్స్ లేకుండా మీ మొబైల్ లేదా కంప్యూటర్‌లోనే ఖచ్చితమైన లాభాలు మరియు స్టాక్ లెక్కలు మీరే స్వయంగా సులువుగా మెయింటైన్ చేసుకోండి.
          </p>

          {/* Generated Showcase Graphic */}
          <div className="auth-hero-image-box">
            <img
              src="/save_accountant_money.jpg"
              alt="Save Accountant Salary & Smart Business Management"
              className="auth-hero-img"
            />
            <div className="auth-image-badge">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <PiggyBank size={18} color="#10b981" />
                <span>నెలకు ₹25,000+ అకౌంటెంట్ జీతం ఆదా చేసుకోండి</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#38bdf8' }}>
                <CheckCircle size={15} />
                <span>100% ప్రైవేట్</span>
              </div>
            </div>
          </div>

          {/* 4 Feature Highlights Grid */}
          <div className="auth-benefits-grid">
            {VALUE_POINTS.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div key={idx} className="auth-benefit-card">
                  <div
                    className="auth-benefit-icon-box"
                    style={{ backgroundColor: item.bgColor, color: item.color }}
                  >
                    <Icon size={22} />
                  </div>
                  <div className="auth-benefit-text-box">
                    <div className="auth-benefit-card-title">{item.title}</div>
                    <div className="auth-benefit-card-desc">{item.desc}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Section: Crisp Form Card */}
        <div className="auth-form-card-container">
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

            <form onSubmit={handleSubmit} style={styles.form}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Username</label>
                <div style={styles.inputWrapper}>
                  <User size={18} color="#64748b" style={styles.inputIcon} />
                  <input
                    type="text"
                    autoComplete="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
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
                    type="password"
                    autoComplete={isSignUp ? 'new-password' : 'current-password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password (min 6 chars)"
                    style={styles.input}
                    disabled={loading}
                    required
                  />
                </div>
              </div>

              {isSignUp && (
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Confirm Password</label>
                  <div style={styles.inputWrapper}>
                    <Lock size={18} color="#64748b" style={styles.inputIcon} />
                    <input
                      type="password"
                      autoComplete="new-password"
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
                style={{
                  ...styles.submitBtn,
                  opacity: loading ? 0.7 : 1,
                  cursor: loading ? 'not-allowed' : 'pointer',
                }}
                disabled={loading}
              >
                <span>{loading ? 'Please wait...' : isSignUp ? 'CREATE ACCOUNT' : 'LOGIN'}</span>
                {!loading && <ArrowRight size={18} />}
              </button>
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
      </div>
    </div>
  );
}

const styles = {
  header: {
    textAlign: 'center',
    marginBottom: '24px',
  },
  logoBadge: {
    width: '56px',
    height: '56px',
    borderRadius: '14px',
    backgroundColor: '#eff6ff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 16px auto',
  },
  appTitle: {
    fontSize: '22px',
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
    gap: '18px',
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
    marginTop: '24px',
    textAlign: 'center',
    borderTop: '1px solid #f1f5f9',
    paddingTop: '18px',
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
