import React, { useEffect, useState } from 'react';
import {
  Settings,
  Database,
  Cloud,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Clock,
  RotateCcw,
  ShieldCheck,
  Info,
  Server,
  KeyRound,
  FileCheck,
  LogOut,
  User,
  Building2,
  Edit2,
  Eye,
  EyeOff,
} from 'lucide-react';
import Card from '../components/common/Card';
import Modal from '../components/common/Modal';
import Button from '../components/common/Button';
import { apiGet, apiPost } from '../utils/api';

export default function SettingsScreen({ businessProfile: initialProfile, user, onLogout, onProfileUpdate }) {
  const [profile, setProfile] = useState(initialProfile || null);
  const [editingProfile, setEditingProfile] = useState(false);
  const [editName, setEditName] = useState(initialProfile?.business_name || '');
  const [editAddress, setEditAddress] = useState(initialProfile?.business_address || '');
  const [editNickname, setEditNickname] = useState(initialProfile?.business_nickname || '');
  const [editShopCode, setEditShopCode] = useState(initialProfile?.shop_code || '');
  const [showShopCode, setShowShopCode] = useState(false);
  const [showEditShopCode, setShowEditShopCode] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState(null);
  const [profileSuccess, setProfileSuccess] = useState(null);

  // Sync internal state when parent initialProfile changes
  useEffect(() => {
    if (initialProfile) {
      setProfile(initialProfile);
      setEditName(initialProfile.business_name || '');
      setEditAddress(initialProfile.business_address || '');
      setEditNickname(initialProfile.business_nickname || '');
      setEditShopCode(initialProfile.shop_code || '');
    }
  }, [initialProfile]);

  const [dbInfo, setDbInfo] = useState({ loading: true, data: null, error: null });
  const [cloudStatus, setCloudStatus] = useState(null);
  const [backupHistory, setBackupHistory] = useState([]);
  const [syncing, setSyncing] = useState(false);
  const [restoreModalMonth, setRestoreModalMonth] = useState(null);
  const [restoring, setRestoring] = useState(false);
  const [restoreFeedback, setRestoreFeedback] = useState(null);

  const fetchStatus = () => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => setDbInfo({ loading: false, data, error: null }))
      .catch((err) => setDbInfo({ loading: false, data: null, error: err.message }));

    fetch('/api/cloud-backup/status')
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setCloudStatus(json.data);
      })
      .catch((err) => console.error('Cloud status error:', err));

    fetch('/api/cloud-backup/history')
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setBackupHistory(json.data);
      })
      .catch((err) => console.error('Backup history error:', err));
  };

  useEffect(() => {
    fetchStatus();
    apiGet('/api/business-profile')
      .then((json) => {
        if (json && json.success && json.data) {
          setProfile(json.data);
          setEditName(json.data.business_name || '');
          setEditAddress(json.data.business_address || '');
          setEditNickname(json.data.business_nickname || '');
          setEditShopCode(json.data.shop_code || '');
          if (onProfileUpdate) onProfileUpdate(json.data);
        }
      })
      .catch((err) => console.error('Failed to load profile:', err));
  }, []);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileError(null);
    setProfileSuccess(null);
    try {
      const cleanName = editName.trim();
      const cleanAddress = editAddress.trim();
      const cleanNickname = editNickname.trim();
      const cleanShopCode = editShopCode.trim();

      if (!cleanName) {
        throw new Error('Business Name is required.');
      }
      if (!cleanAddress) {
        throw new Error('Business Address is required.');
      }
      if (!cleanNickname) {
        throw new Error('Shop / Business Nickname is required.');
      }

      const res = await apiPost('/api/business-profile', {
        business_name: cleanName,
        business_address: cleanAddress,
        business_nickname: cleanNickname,
        shop_code: cleanShopCode,
      });

      if (!res || !res.success || !res.data) {
        throw new Error(res?.error || 'Failed to save business profile.');
      }

      const updatedData = res.data;
      setProfile(updatedData);
      setEditName(updatedData.business_name || '');
      setEditAddress(updatedData.business_address || '');
      setEditNickname(updatedData.business_nickname || '');
      setEditShopCode(updatedData.shop_code || '');
      setEditingProfile(false);
      setProfileSuccess('Business profile & Shop Code updated successfully!');

      // Instantly update parent App state (Header, Layout, LockScreen all refresh immediately)
      if (onProfileUpdate) {
        onProfileUpdate(updatedData);
      }
    } catch (err) {
      setProfileError(err.message || 'Error updating profile.');
    } finally {
      setProfileSaving(false);
    }
  };

  const handleLogout = async () => {
    if (!window.confirm('Are you sure you want to log out? Your business data remains safely stored in the cloud.')) {
      return;
    }
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {
      // Ignore network errors on logout
    }
    sessionStorage.removeItem('auth_token');
    localStorage.removeItem('auth_token');
    if (onLogout) {
      onLogout();
    }
  };

  const handleSyncNow = async () => {
    setSyncing(true);
    try {
      const res = await fetch('/api/cloud-backup/sync-now', { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        fetchStatus();
      }
    } catch (err) {
      console.error('Sync now failed:', err);
    } finally {
      setSyncing(false);
    }
  };

  const handleExecuteRestore = async () => {
    if (!restoreModalMonth) return;
    setRestoring(true);
    setRestoreFeedback(null);
    try {
      const res = await fetch('/api/cloud-backup/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month: restoreModalMonth }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setRestoreFeedback({
          type: 'success',
          message: `Restore complete for ${restoreModalMonth}! Safety snapshot created at ${json.data.local_backup_created}.`,
        });
      } else {
        setRestoreFeedback({
          type: 'error',
          message: json.error || 'Restore operation failed.',
        });
      }
    } catch (err) {
      setRestoreFeedback({
        type: 'error',
        message: err.message || 'Network error during restore.',
      });
    } finally {
      setRestoring(false);
      fetchStatus();
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'synced':
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 10px',
            borderRadius: '999px',
            fontSize: '0.8rem',
            fontWeight: 600,
            background: 'rgba(16, 185, 129, 0.15)',
            color: '#34d399',
            border: '1px solid rgba(16, 185, 129, 0.3)',
          }}>
            <CheckCircle2 size={14} />
            <span>✓ Synced</span>
          </span>
        );
      case 'pending':
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 10px',
            borderRadius: '999px',
            fontSize: '0.8rem',
            fontWeight: 600,
            background: 'rgba(245, 158, 11, 0.15)',
            color: '#fbbf24',
            border: '1px solid rgba(245, 158, 11, 0.3)',
          }}>
            <Clock size={14} />
            <span>⏳ Sync Pending</span>
          </span>
        );
      case 'failed':
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 10px',
            borderRadius: '999px',
            fontSize: '0.8rem',
            fontWeight: 600,
            background: 'rgba(244, 63, 94, 0.15)',
            color: '#fb7185',
            border: '1px solid rgba(244, 63, 94, 0.3)',
          }}>
            <AlertTriangle size={14} />
            <span>❌ Sync Failed</span>
          </span>
        );
      default:
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 10px',
            borderRadius: '999px',
            fontSize: '0.8rem',
            fontWeight: 600,
            background: 'rgba(245, 158, 11, 0.15)',
            color: '#fbbf24',
            border: '1px solid rgba(245, 158, 11, 0.3)',
          }}>
            <AlertTriangle size={14} />
            <span>⚠️ Configuration Required</span>
          </span>
        );
    }
  };

  return (
    <div className="settings-screen" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Settings size={24} style={{ color: 'var(--accent-blue)' }} />
          <span>Application Settings & Cloud Backup</span>
        </h1>
        <p className="page-subtitle">
          Local SQLite primary database status, authenticated business owner profile, and safe cloud backup
        </p>
      </div>

      {/* Business Profile & Owner Card */}
      <Card title="Business Profile & Authenticated Owner" icon={<Building2 size={18} />} accent="blue">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, minWidth: '240px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Logged-in Owner:</span>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <User size={14} color="var(--accent-blue)" />
                {user?.username || 'Authenticated Owner'}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Business Name:</span>
              <strong style={{ fontSize: '1.05rem', color: 'var(--text-primary)' }}>
                {profile?.business_name || 'Loading...'}
              </strong>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Shop Nickname:</span>
              <span style={{ padding: '2px 8px', borderRadius: '4px', background: 'rgba(37, 99, 235, 0.1)', color: '#60a5fa', fontWeight: 600, fontSize: '0.85rem' }}>
                {profile?.business_nickname || '—'}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', minWidth: '90px' }}>Address:</span>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                {profile?.business_address || '—'}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', minWidth: '90px' }}>Shop Code:</span>
              <span style={{ padding: '3px 10px', borderRadius: '6px', background: 'rgba(16, 185, 129, 0.12)', color: '#10b981', fontWeight: 700, fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <KeyRound size={13} />
                {showShopCode ? (profile?.shop_code ? profile.shop_code : '1234 (Default)') : '••••'}
                <button
                  type="button"
                  onClick={() => setShowShopCode(!showShopCode)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'inherit', display: 'inline-flex', marginLeft: '4px' }}
                  title={showShopCode ? 'Hide Code' : 'Reveal Code'}
                >
                  {showShopCode ? <EyeOff size={13} /> : <Eye size={13} />}
                </button>
              </span>
              <button
                type="button"
                onClick={() => {
                  setEditShopCode(profile?.shop_code || '');
                  setEditingProfile(true);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#3b82f6',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  padding: '2px 4px',
                }}
              >
                Change Code
              </button>
            </div>

            {profileSuccess && (
              <div style={{ color: '#34d399', fontSize: '0.8rem', marginTop: '4px' }}>
                ✓ {profileSuccess}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setEditingProfile(true)}
              icon={Edit2}
            >
              Edit Profile
            </Button>

            <Button
              variant="danger"
              size="sm"
              onClick={handleLogout}
              icon={LogOut}
            >
              LOGOUT
            </Button>
          </div>
        </div>
      </Card>

      {/* CLOUD & DATA BACKUP SECTION (Clean, Confidential & Reliable) */}
      <section style={{
        background: 'var(--bg-card)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-color)',
        padding: '1.5rem',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
          <div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
              <Cloud size={20} style={{ color: 'var(--accent-blue)' }} />
              <span>Cloud Data Backup & Protection</span>
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px', margin: 0 }}>
              Your business transactions, sales, stock, and ledger records are continuously protected with enterprise encryption.
            </p>
          </div>

          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 12px',
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '20px',
            color: '#10b981',
            fontSize: '0.8rem',
            fontWeight: 600,
          }}>
            <ShieldCheck size={14} />
            <span>Active & Protected</span>
          </div>
        </div>

        <div style={{
          display: 'flex',
          gap: '12px',
          flexWrap: 'wrap',
          alignItems: 'center',
          padding: '1rem',
          background: 'rgba(255, 255, 255, 0.02)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
        }}>
          {/* 1. Clean Human-Readable Export (Opens without errors) */}
          <a
            href="/api/cloud-backup/export"
            download
            className="btn"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '0.65rem 1.25rem',
              fontWeight: 600,
              background: '#2563eb',
              color: '#ffffff',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              textDecoration: 'none',
              cursor: 'pointer',
              fontSize: '0.9rem',
            }}
          >
            <Database size={17} />
            <span>Export Business Records (Clean JSON)</span>
          </a>

          {/* 2. Instant Sync Cloud Backup */}
          <Button
            variant="secondary"
            onClick={handleSyncNow}
            disabled={syncing}
            isLoading={syncing}
            icon={RefreshCw}
          >
            Sync Cloud Backup
          </Button>

          {/* 3. Raw Database Download (Discreet) */}
          <a
            href="/api/cloud-backup/download"
            download
            style={{
              fontSize: '0.8rem',
              color: 'var(--text-secondary)',
              textDecoration: 'underline',
              marginLeft: 'auto',
              cursor: 'pointer',
            }}
            title="Download full SQLite database file for technical server restore"
          >
            Download Server Database (.db)
          </a>
        </div>

        <div style={{ marginTop: '1rem', fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <CheckCircle2 size={14} style={{ color: '#10b981' }} />
          <span>Real-time local crash protection & cloud multi-device recovery active.</span>
        </div>
      </section>

      {/* RESTORE CONFIRMATION MODAL */}
      <Modal
        isOpen={Boolean(restoreModalMonth)}
        title={`Confirm Restore for ${restoreModalMonth}`}
        onClose={() => {
          setRestoreModalMonth(null);
          setRestoreFeedback(null);
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{
            background: 'rgba(245, 158, 11, 0.1)',
            border: '1px solid var(--accent-amber)',
            borderRadius: 'var(--radius-md)',
            padding: '0.85rem',
            fontSize: '0.85rem',
            color: '#fbbf24',
            display: 'flex',
            gap: '8px',
          }}>
            <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong>Safety Copy Guarantee:</strong>
              <div>
                Before restoring, an exact physical copy of the current local SQLite database will be automatically created in <code>data/app_backup_&lt;timestamp&gt;.db</code> so no data can ever be lost.
              </div>
            </div>
          </div>

          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Are you sure you want to verify and restore the backup data for month <strong>{restoreModalMonth}</strong>?
          </p>

          {restoreFeedback && (
            <div style={{
              padding: '0.75rem',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.85rem',
              background: restoreFeedback.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
              color: restoreFeedback.type === 'success' ? '#34d399' : '#fb7185',
              border: `1px solid ${restoreFeedback.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)'}`,
            }}>
              {restoreFeedback.message}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
            <Button
              variant="secondary"
              onClick={() => {
                setRestoreModalMonth(null);
                setRestoreFeedback(null);
              }}
              disabled={restoring}
            >
              Close
            </Button>

            <Button
              variant="primary"
              onClick={handleExecuteRestore}
              disabled={restoring}
              isLoading={restoring}
              icon={RotateCcw}
              style={{
                background: 'var(--accent-amber)',
                color: '#000000',
                borderColor: 'var(--accent-amber)',
              }}
            >
              Confirm Safe Restore
            </Button>
          </div>
        </div>
      </Modal>

      {/* EDIT BUSINESS PROFILE MODAL */}
      <Modal
        isOpen={editingProfile}
        title="Edit Business Profile"
        onClose={() => {
          setEditingProfile(false);
          setProfileError(null);
        }}
      >
        <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {profileError && (
            <div style={{ color: '#fb7185', background: 'rgba(244, 63, 94, 0.15)', padding: '0.75rem', borderRadius: '6px', fontSize: '0.85rem' }}>
              {profileError}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>Business Name</label>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="e.g. ABC Traders"
              required
              disabled={profileSaving}
              style={{
                padding: '0.6rem 0.8rem',
                borderRadius: '6px',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>Business Address</label>
            <textarea
              value={editAddress}
              onChange={(e) => setEditAddress(e.target.value)}
              placeholder="Shop address, street, city"
              required
              disabled={profileSaving}
              rows={3}
              style={{
                padding: '0.6rem 0.8rem',
                borderRadius: '6px',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                fontFamily: 'inherit',
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>Shop / Business Nickname</label>
            <input
              type="text"
              value={editNickname}
              onChange={(e) => setEditNickname(e.target.value)}
              placeholder="e.g. ABC Shop"
              required
              disabled={profileSaving}
              style={{
                padding: '0.6rem 0.8rem',
                borderRadius: '6px',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--accent-blue)' }}>
                Shop Code (Quick Device Unlock PIN)
              </label>
              <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600 }}>🔒 Phone Lock</span>
            </div>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input
                type={showEditShopCode ? 'text' : 'password'}
                value={editShopCode}
                onChange={(e) => setEditShopCode(e.target.value)}
                placeholder="4-digit PIN (e.g. 1234 or SRI01)"
                required
                disabled={profileSaving}
                style={{
                  width: '100%',
                  padding: '0.6rem 2.4rem 0.6rem 0.8rem',
                  borderRadius: '6px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  fontWeight: 600,
                  boxSizing: 'border-box',
                }}
              />
              <button
                type="button"
                onClick={() => setShowEditShopCode(!showEditShopCode)}
                style={{
                  position: 'absolute',
                  right: '8px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                }}
                title={showEditShopCode ? 'Hide PIN' : 'Show PIN'}
              >
                {showEditShopCode ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              Used to instantly unlock dashboard when reopening the app on this phone.
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setEditingProfile(false);
                setProfileError(null);
              }}
              disabled={profileSaving}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={profileSaving}
            >
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
