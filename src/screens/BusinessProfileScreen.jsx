import React, { useState } from 'react';
import { Building2, MapPin, Tag, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';

export default function BusinessProfileScreen({ onProfileComplete, initialProfile = null }) {
  const [businessName, setBusinessName] = useState(initialProfile?.business_name || '');
  const [businessAddress, setBusinessAddress] = useState(initialProfile?.business_address || '');
  const [businessNickname, setBusinessNickname] = useState(initialProfile?.business_nickname || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const cleanName = businessName.trim();
    const cleanAddress = businessAddress.trim();
    const cleanNickname = businessNickname.trim();

    if (!cleanName) {
      setError('Business Name is required.');
      return;
    }

    if (!cleanAddress) {
      setError('Business Address is required.');
      return;
    }

    if (!cleanNickname) {
      setError('Business / Shop Nickname is required.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/business-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_name: cleanName,
          business_address: cleanAddress,
          business_nickname: cleanNickname,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to save business profile.');
      }

      if (onProfileComplete) {
        onProfileComplete(data.data);
      }
    } catch (err) {
      setError(err.message || 'An unexpected error occurred while saving profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <div style={styles.iconCircle}>
            <Building2 size={30} color="#2563eb" />
          </div>
          <h1 style={styles.title}>Welcome to Business Management</h1>
          <p style={styles.subtitle}>Complete your business profile to get started</p>
        </div>

        {error && (
          <div style={styles.errorAlert}>
            <AlertCircle size={18} style={{ minWidth: 18, marginTop: 2 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Business Name</label>
            <div style={styles.inputWrapper}>
              <Building2 size={18} color="#64748b" style={styles.inputIcon} />
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="e.g. ABC Traders Pvt Ltd"
                style={styles.input}
                disabled={loading}
                required
              />
            </div>
            <span style={styles.helpText}>Official registered name of your business firm</span>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Business Address</label>
            <div style={styles.inputWrapper}>
              <MapPin size={18} color="#64748b" style={styles.inputIcon} />
              <textarea
                value={businessAddress}
                onChange={(e) => setBusinessAddress(e.target.value)}
                placeholder="Shop number, street, city, pin code"
                style={{ ...styles.input, minHeight: '75px', paddingTop: '10px' }}
                disabled={loading}
                required
              />
            </div>
            <span style={styles.helpText}>Physical shop / office address for reports</span>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Business / Shop Nickname</label>
            <div style={styles.inputWrapper}>
              <Tag size={18} color="#64748b" style={styles.inputIcon} />
              <input
                type="text"
                value={businessNickname}
                onChange={(e) => setBusinessNickname(e.target.value)}
                placeholder="e.g. ABC Shop"
                style={styles.input}
                disabled={loading}
                required
              />
            </div>
            <span style={styles.helpText}>Short display name used on the dashboard & header</span>
          </div>

          <button
            type="submit"
            style={{
              ...styles.submitBtn,
              opacity: loading ? 0.7 : 1,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
            disabled={loading}
          >
            <span>{loading ? 'Saving Profile...' : 'CONTINUE TO DASHBOARD'}</span>
            {!loading && <ArrowRight size={18} />}
          </button>
        </form>

        <div style={styles.securityNotice}>
          <ShieldCheck size={14} color="#10b981" />
          <span>Synced across all your devices • Secure cloud backup</span>
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
    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
    padding: '24px 20px',
    fontFamily: 'Inter, system-ui, sans-serif',
  },
  card: {
    width: '100%',
    maxWidth: '480px',
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.08)',
    padding: '36px 32px',
    boxSizing: 'border-box',
  },
  header: {
    textAlign: 'center',
    marginBottom: '26px',
  },
  iconCircle: {
    width: '60px',
    height: '60px',
    borderRadius: '16px',
    backgroundColor: '#eff6ff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 16px auto',
  },
  title: {
    fontSize: '21px',
    fontWeight: '700',
    color: '#0f172a',
    margin: '0 0 6px 0',
  },
  subtitle: {
    fontSize: '13px',
    color: '#64748b',
    margin: 0,
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
    top: '12px',
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
    fontFamily: 'inherit',
    transition: 'border-color 0.2s',
  },
  helpText: {
    fontSize: '11px',
    color: '#94a3b8',
    marginLeft: '2px',
  },
  submitBtn: {
    marginTop: '10px',
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
    transition: 'background-color 0.2s',
  },
  securityNotice: {
    marginTop: '22px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    fontSize: '12px',
    color: '#64748b',
    borderTop: '1px solid #f1f5f9',
    paddingTop: '16px',
  },
};
