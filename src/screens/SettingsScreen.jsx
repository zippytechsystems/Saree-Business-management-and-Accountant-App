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
} from 'lucide-react';
import Card from '../components/common/Card';
import Modal from '../components/common/Modal';

export default function SettingsScreen({ businessProfile: initialProfile, user, onLogout, onProfileUpdate }) {
  const [profile, setProfile] = useState(initialProfile || null);
  const [editingProfile, setEditingProfile] = useState(false);
  const [editName, setEditName] = useState(initialProfile?.business_name || '');
  const [editAddress, setEditAddress] = useState(initialProfile?.business_address || '');
  const [editNickname, setEditNickname] = useState(initialProfile?.business_nickname || '');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState(null);
  const [profileSuccess, setProfileSuccess] = useState(null);

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
    fetch('/api/business-profile')
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data) {
          setProfile(json.data);
          setEditName(json.data.business_name || '');
          setEditAddress(json.data.business_address || '');
          setEditNickname(json.data.business_nickname || '');
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
      const res = await fetch('/api/business-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_name: editName.trim(),
          business_address: editAddress.trim(),
          business_nickname: editNickname.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to save business profile.');
      }
      setProfile(data.data);
      setEditingProfile(false);
      setProfileSuccess('Business profile updated successfully!');
      if (onProfileUpdate) onProfileUpdate(data.data);
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

            {profileSuccess && (
              <div style={{ color: '#34d399', fontSize: '0.8rem', marginTop: '4px' }}>
                ✓ {profileSuccess}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setEditingProfile(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer' }}
            >
              <Edit2 size={14} />
              <span>Edit Profile</span>
            </button>

            <button
              type="button"
              onClick={handleLogout}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: '#ef4444',
                color: '#ffffff',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.9rem',
              }}
            >
              <LogOut size={16} />
              <span>LOGOUT</span>
            </button>
          </div>
        </div>
      </Card>

      {/* Primary Status KPIs */}
      <div className="kpi-grid kpi-grid-3">
        <Card title="Primary Local Database" icon={<Database size={18} />} accent="green">
          {dbInfo.loading ? (
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Checking local DB...</div>
          ) : (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#34d399', fontWeight: 600 }}>
                <CheckCircle2 size={16} />
                <span>SQLite Active (Primary)</span>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Mode: WAL • {dbInfo.data?.database?.tables?.length || 0} Tables Active
              </div>
            </div>
          )}
        </Card>

        <Card title="Secondary Cloud Backup" icon={<Cloud size={18} />} accent="blue">
          {cloudStatus ? (
            <div>
              <div style={{ marginBottom: '4px' }}>
                {getStatusBadge(cloudStatus.status)}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Provider: <strong>{cloudStatus.provider.toUpperCase()}</strong> • Always Automatic
              </div>
            </div>
          ) : (
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Loading status...</div>
          )}
        </Card>

        <Card title="Application Scope" icon={<Info size={18} />} accent="purple">
          <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            Version 1.0 • Production Ready
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Local-First Architecture • Secondary Cloud Recovery
          </div>
        </Card>
      </div>

      {/* CLOUD DATABASE BACKUP SECTION */}
      <section style={{
        background: 'var(--bg-card)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-color)',
        padding: '1.25rem',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Cloud size={20} style={{ color: 'var(--accent-blue)' }} />
              <span>Automatic Monthly Cloud Database Backup</span>
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Every local change (sales, expenses, stock, lenders) is automatically synced to the cloud. No manual switch required.
            </p>
          </div>

          <button
            className="btn btn-secondary"
            onClick={handleSyncNow}
            disabled={syncing}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '0.55rem 1rem',
              fontWeight: 600,
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
            }}
          >
            <RefreshCw size={16} className={syncing ? 'animate-spin' : ''} />
            <span>{syncing ? 'Syncing...' : 'Sync Pending Now'}</span>
          </button>
        </div>

        {/* Cloud Status Details Grid */}
        {cloudStatus && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '0.85rem',
            background: 'rgba(255, 255, 255, 0.02)',
            padding: '1rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            marginBottom: '1.25rem',
          }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Backup Engine Status</div>
              <div style={{ marginTop: '4px' }}>{getStatusBadge(cloudStatus.status)}</div>
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Current Backup Month</div>
              <div style={{ fontSize: '0.9rem', fontWeight: 600, marginTop: '4px', color: 'var(--accent-blue)' }}>
                {cloudStatus.current_month || 'YYYY-MM'}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Configured Cloud Service</div>
              <div style={{ fontSize: '0.9rem', fontWeight: 600, marginTop: '4px' }}>
                {cloudStatus.is_configured ? cloudStatus.provider.toUpperCase() : 'None (Real Cloud Required)'}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Last Sync Attempt</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', marginTop: '4px' }}>
                {cloudStatus.last_sync_time ? new Date(cloudStatus.last_sync_time).toLocaleString() : 'Never'}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Last Successful Backup</div>
              <div style={{ fontSize: '0.85rem', color: cloudStatus.last_successful_backup ? '#34d399' : 'var(--text-secondary)', marginTop: '4px', fontWeight: 500 }}>
                {cloudStatus.last_successful_backup ? new Date(cloudStatus.last_successful_backup).toLocaleString() : 'None'}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Pending / Failed In Queue</div>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, marginTop: '4px', color: cloudStatus.failed_count > 0 ? '#fb7185' : 'var(--text-primary)' }}>
                {cloudStatus.pending_count} pending • {cloudStatus.failed_count} failed
              </div>
            </div>
          </div>
        )}

        {/* Configuration Notice if not connected to live cloud */}
        {cloudStatus && !cloudStatus.is_configured && (
          <div style={{
            background: 'rgba(245, 158, 11, 0.08)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            borderRadius: 'var(--radius-md)',
            padding: '1rem',
            marginBottom: '1.25rem',
            display: 'flex',
            gap: '12px',
          }}>
            <KeyRound size={22} style={{ color: 'var(--accent-amber)', flexShrink: 0, marginTop: '2px' }} />
            <div style={{ fontSize: '0.85rem', lineHeight: '1.5' }}>
              <strong style={{ color: 'var(--accent-amber)' }}>Real Cloud Credentials Notice:</strong>
              <div style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
                In accordance with production safety specifications, this application strictly avoids fake/mock cloud storage. Local SQLite data is 100% persistent and primary. To enable live secondary cloud mirroring, add your provider credentials to <code>.env</code>:
              </div>
              <pre style={{
                background: 'rgba(0,0,0,0.3)',
                padding: '8px 12px',
                borderRadius: '6px',
                marginTop: '6px',
                fontSize: '0.8rem',
                color: '#93c5fd',
                overflowX: 'auto',
              }}>
                # Options: supabase | firebase | turso{'\n'}
                CLOUD_BACKUP_PROVIDER=supabase{'\n'}
                SUPABASE_URL=https://xyzcompany.supabase.co{'\n'}
                SUPABASE_KEY=your_service_role_key
              </pre>
            </div>
          </div>
        )}

        {/* Monthly Backup History Table */}
        <div>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <FileCheck size={16} style={{ color: 'var(--accent-green)' }} />
            <span>Monthly Backup History & Safe Restore</span>
          </h3>

          <div className="table-container" style={{ borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.02)' }}>
                  <th style={{ padding: '8px 12px' }}>Month</th>
                  <th style={{ padding: '8px 12px' }}>Total Mutations</th>
                  <th style={{ padding: '8px 12px' }}>Status</th>
                  <th style={{ padding: '8px 12px' }}>Last Sync</th>
                  <th style={{ padding: '8px 12px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {backupHistory.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ padding: '1.25rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                      No cloud backup history recorded yet. Mutations will automatically log here.
                    </td>
                  </tr>
                ) : (
                  backupHistory.map((m) => (
                    <tr key={m.month} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '8px 12px', fontWeight: 600 }}>
                        {m.month} {m.is_current_month && <span style={{ fontSize: '0.7rem', color: 'var(--accent-blue)', marginLeft: '4px' }}>(Current)</span>}
                      </td>
                      <td style={{ padding: '8px 12px' }}>{m.total_mutations} records logged</td>
                      <td style={{ padding: '8px 12px' }}>{getStatusBadge(m.status)}</td>
                      <td style={{ padding: '8px 12px', color: 'var(--text-secondary)' }}>
                        {m.last_sync ? new Date(m.last_sync).toLocaleString() : 'Pending'}
                      </td>
                      <td style={{ padding: '8px 12px', textAlign: 'right' }}>
                        <button
                          className="btn-ghost"
                          onClick={() => setRestoreModalMonth(m.month)}
                          style={{
                            fontSize: '0.8rem',
                            color: 'var(--accent-amber)',
                            cursor: 'pointer',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            border: '1px solid rgba(245, 158, 11, 0.3)',
                            background: 'transparent',
                          }}
                        >
                          <RotateCcw size={13} style={{ marginRight: '4px', verticalAlign: '-1px' }} />
                          <span>Restore</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
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
            <button
              className="btn btn-secondary"
              onClick={() => {
                setRestoreModalMonth(null);
                setRestoreFeedback(null);
              }}
              disabled={restoring}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-color)',
                cursor: 'pointer',
              }}
            >
              Close
            </button>

            <button
              className="btn btn-primary"
              onClick={handleExecuteRestore}
              disabled={restoring}
              style={{
                padding: '0.5rem 1.25rem',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--accent-amber)',
                color: '#000000',
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              {restoring ? <RefreshCw size={14} className="animate-spin" /> : <RotateCcw size={14} />}
              <span>{restoring ? 'Verifying & Restoring...' : 'Confirm Safe Restore'}</span>
            </button>
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

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setEditingProfile(false);
                setProfileError(null);
              }}
              disabled={profileSaving}
              style={{ padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={profileSaving}
              style={{ padding: '0.5rem 1.25rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
            >
              {profileSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
