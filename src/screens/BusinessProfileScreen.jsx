import React, { useState } from 'react';
import { Building2, MapPin, Tag, ArrowRight, ShieldCheck, AlertCircle, KeyRound, Eye, EyeOff } from 'lucide-react';
import Button from '../components/common/Button';

export default function BusinessProfileScreen({ onProfileComplete, initialProfile = null }) {
  const [businessName, setBusinessName] = useState(initialProfile?.business_name || '');
  const [businessAddress, setBusinessAddress] = useState(initialProfile?.business_address || '');
  const [businessNickname, setBusinessNickname] = useState(initialProfile?.business_nickname || '');
  const [shopCode, setShopCode] = useState(initialProfile?.shop_code || '');
  const [showShopCode, setShowShopCode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const cleanName = businessName.trim();
    const cleanAddress = businessAddress.trim();
    const cleanNickname = businessNickname.trim();
    const cleanShopCode = shopCode.trim();

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

    if (!cleanShopCode) {
      setError('Shop Code is required for device security (e.g. 1234 or your 4-digit PIN).');
      return;
    }

    if (cleanShopCode.length < 3) {
      setError('Shop Code must be at least 3 characters or digits.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/business-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token') || ''}`,
        },
        body: JSON.stringify({
          business_name: cleanName,
          business_address: cleanAddress,
          business_nickname: cleanNickname,
          shop_code: cleanShopCode,
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
          <h1 style={styles.title}>Step 2: Business Account Setup</h1>
          <p style={styles.subtitle}>Enter your shop &amp; business details to launch your secure dashboard</p>
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
                placeholder="e.g. Sri Lakshmi Sarees Pvt Ltd"
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
                style={{ ...styles.input, minHeight: '70px', paddingTop: '10px' }}
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
                placeholder="e.g. Sri Lakshmi Sarees"
                style={styles.input}
                disabled={loading}
                required
              />
            </div>
            <span style={styles.helpText}>Short display name used on the dashboard &amp; header</span>
          </div>

          {/* CRITICAL: Shop Code / Quick Unlock PIN */}
          <div style={styles.inputGroup}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ ...styles.label, color: '#1e40af', fontWeight: '700' }}>
                Shop Code (శీఘ్ర అన్‌లాక్ కోడ్ / Quick PIN)
              </label>
              <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 600 }}>🔒 Phone Security</span>
            </div>
            <div style={styles.inputWrapper}>
              <KeyRound size={18} color="#2563eb" style={styles.inputIcon} />
              <input
                type={showShopCode ? 'text' : 'password'}
                value={shopCode}
                onChange={(e) => setShopCode(e.target.value)}
                placeholder="Set 4-digit code (e.g. 1234 or SRI01)"
                style={{ ...styles.input, borderColor: '#93c5fd', backgroundColor: '#eff6ff', paddingRight: '42px', fontWeight: '600' }}
                disabled={loading}
                required
              />
              <button
                type="button"
                onClick={() => setShowShopCode(!showShopCode)}
                style={styles.eyeBtn}
                title={showShopCode ? 'Hide code' : 'Show code'}
                tabIndex={-1}
              >
                {showShopCode ? <EyeOff size={18} color="#64748b" /> : <Eye size={18} color="#64748b" />}
              </button>
            </div>
            <span style={{ ...styles.helpText, color: '#1e40af', lineHeight: '1.4' }}>
              💡 <strong>ఎందుకు?</strong> మీరు యాప్ మళ్ళీ ఓపెన్ చేసినప్పుడు డాష్‌బోర్డ్ లెక్కలు ఇతరులు చూడకుండా ఈ కోడ్ అడుగుతుంది. మీ ఫోన్ వేరే వాళ్ల చేతికి వెళ్లినా వ్యాపార లెక్కలు 100% సేఫ్!
            </span>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={loading}
            icon={!loading ? ArrowRight : undefined}
            style={{ width: '100%', marginTop: '10px' }}
          >
            SAVE DETAILS &amp; ENTER DASHBOARD
          </Button>
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
    background: 'linear-gradient(135deg, #f8fafc 0%, #eff6ff 50%, #f1f5f9 100%)',
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
    transition: 'border-color 0.2s',
  },
  helpText: {
    fontSize: '11px',
    color: '#94a3b8',
    marginLeft: '2px',
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
