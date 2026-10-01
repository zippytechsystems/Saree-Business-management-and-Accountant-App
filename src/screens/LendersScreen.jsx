import React, { useState, useEffect } from 'react';
import {
  HandCoins,
  UserPlus,
  Phone,
  MapPin,
  Calendar,
  RotateCw,
  Wallet,
  IndianRupee,
  Edit2,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
} from 'lucide-react';
import Card from '../components/common/Card';
import Modal from '../components/common/Modal';
import Toast from '../components/common/Toast';
import { formatCurrency, formatDate, getTodayDateString } from '../utils/formatters';

export default function LendersScreen() {
  const [lenders, setLenders] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // Search / Filter
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingLender, setEditingLender] = useState(null);
  const [payingLender, setPayingLender] = useState(null);
  const [deletingLender, setDeletingLender] = useState(null);

  // Form states
  const [addForm, setAddForm] = useState({
    name: '',
    mobile: '',
    place: '',
    amount_given: '',
    amount_paid: '0',
    loan_date: getTodayDateString(),
    notes: '',
  });

  const [repaymentAmount, setRepaymentAmount] = useState('');
  const [modalError, setModalError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadLenderData = async () => {
    setLoading(true);
    try {
      const [listRes, sumRes] = await Promise.all([
        fetch('/api/lenders').then((r) => r.json()),
        fetch('/api/lenders/summary').then((r) => r.json()),
      ]);

      if (listRes.success) setLenders(listRes.data);
      if (sumRes.success) setSummary(sumRes.data);
    } catch (err) {
      setToast({ type: 'error', message: 'Failed to load lender data: ' + err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLenderData();
  }, []);

  // Open Add Modal
  const openAddModal = () => {
    setAddForm({
      name: '',
      mobile: '',
      place: '',
      amount_given: '',
      amount_paid: '0',
      loan_date: getTodayDateString(),
      notes: '',
    });
    setModalError('');
    setIsAddModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (lender) => {
    setEditingLender(lender);
    setAddForm({
      name: lender.name,
      mobile: lender.mobile,
      place: lender.place,
      amount_given: String(lender.amount_given),
      amount_paid: String(lender.amount_paid),
      loan_date: lender.loan_date,
      notes: lender.notes || '',
    });
    setModalError('');
  };

  // Open Repayment Modal
  const openRepaymentModal = (lender) => {
    setPayingLender(lender);
    setRepaymentAmount('');
    setModalError('');
  };

  // Handle Create or Update Lender
  const handleSaveLender = async (e) => {
    e.preventDefault();
    if (!addForm.name.trim()) {
      setModalError('Lender name is required.');
      return;
    }
    if (!addForm.mobile.trim()) {
      setModalError('Mobile number is required.');
      return;
    }
    if (!addForm.place.trim()) {
      setModalError('Place / location is required.');
      return;
    }
    const numGiven = Number(addForm.amount_given);
    if (isNaN(numGiven) || numGiven < 0) {
      setModalError('Amount Given must be a valid number.');
      return;
    }

    setModalError('');
    setIsSubmitting(true);

    try {
      const isEditing = Boolean(editingLender);
      const url = isEditing ? `/api/lenders/${editingLender.id}` : '/api/lenders';
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: addForm.name.trim(),
          mobile: addForm.mobile.trim(),
          place: addForm.place.trim(),
          amount_given: numGiven,
          amount_paid: Number(addForm.amount_paid || 0),
          loan_date: addForm.loan_date,
          notes: addForm.notes,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to save lender.');

      setToast({
        type: 'success',
        message: isEditing
          ? `Updated lender account for "${data.data.name}"`
          : `Created lender account for "${data.data.name}" with balance ${formatCurrency(data.data.balance)}`,
      });

      setIsAddModalOpen(false);
      setEditingLender(null);
      loadLenderData();
    } catch (err) {
      setModalError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Record Repayment
  const handleRecordRepayment = async (e) => {
    e.preventDefault();
    const payNum = Number(repaymentAmount);
    if (isNaN(payNum) || payNum <= 0) {
      setModalError('Repayment amount must be greater than 0.');
      return;
    }
    if (payNum > payingLender.balance) {
      setModalError(`Repayment cannot exceed remaining balance (${formatCurrency(payingLender.balance)}).`);
      return;
    }

    setModalError('');
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/lenders/${payingLender.id}/pay`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payment_amount: payNum }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to record repayment.');

      setToast({
        type: 'success',
        message: `Recorded payment of ${formatCurrency(payNum)} from ${payingLender.name}. New Balance: ${formatCurrency(data.data.balance)}`,
      });

      setPayingLender(null);
      loadLenderData();
    } catch (err) {
      setModalError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Delete Lender
  const handleConfirmDelete = async () => {
    if (!deletingLender) return;
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/lenders/${deletingLender.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to delete lender.');

      setToast({ type: 'success', message: `Lender account "${deletingLender.name}" deleted.` });
      setDeletingLender(null);
      loadLenderData();
    } catch (err) {
      setToast({ type: 'error', message: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter lenders by search query
  const filteredLenders = lenders.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.name.toLowerCase().includes(q) ||
      item.mobile.toLowerCase().includes(q) ||
      item.place.toLowerCase().includes(q)
    );
  });

  return (
    <div>
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1 className="page-title">
              <HandCoins size={24} style={{ color: 'var(--accent-amber)' }} />
              <span>Lender Management</span>
            </h1>
            <p className="page-subtitle">
              Manage party loans, credit records, repayments, and live balance dues
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button className="btn btn-secondary btn-sm" onClick={loadLenderData} title="Refresh lender data">
              <RotateCw size={15} />
              <span>Refresh</span>
            </button>
            <button className="btn btn-primary" onClick={openAddModal}>
              <UserPlus size={18} />
              <span>Add Lender</span>
            </button>
          </div>
        </div>
      </div>

      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

      {/* TOP KPI LENDER DASHBOARD SUMMARY */}
      <div className="kpi-grid kpi-grid-3">
        <Card
          title="Total Amount Given"
          icon={<IndianRupee size={18} />}
          value={loading ? '...' : formatCurrency(summary?.total_amount_given ?? 0)}
          subtext="Total principal capital disbursed"
          accent="blue"
        />
        <Card
          title="Total Amount Paid"
          icon={<Wallet size={18} />}
          value={loading ? '...' : formatCurrency(summary?.total_amount_paid ?? 0)}
          subtext="Total repayments recovered"
          accent="green"
        />
        <Card
          title="Total Due / Balance"
          icon={<HandCoins size={18} />}
          value={loading ? '...' : formatCurrency(summary?.total_lender_due ?? 0)}
          subtext="Remaining outstanding capital"
          accent="amber"
        />
      </div>

      {/* Search & Header Row */}
      <div className="section-heading" style={{ justifyContent: 'space-between', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <HandCoins size={18} style={{ color: 'var(--accent-amber)' }} />
          <span>Lender Records Directory</span>
        </div>
        <div style={{ minWidth: '220px' }}>
          <input
            type="text"
            className="form-input"
            style={{ minHeight: '38px', padding: '6px 12px', fontSize: '0.85rem' }}
            placeholder="Search by name, place, phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* LENDERS LIST / CARDS */}
      {loading ? (
        <div className="empty-state">
          <div className="empty-state-text">Loading lenders directory...</div>
        </div>
      ) : filteredLenders.length === 0 ? (
        <div className="empty-state">
          <HandCoins size={36} className="empty-state-icon" />
          <div className="empty-state-text">
            {searchQuery ? 'No lenders match your search.' : 'No lender accounts registered yet.'}
          </div>
          <button className="btn btn-secondary btn-sm" onClick={openAddModal} style={{ marginTop: '12px' }}>
            <UserPlus size={14} />
            <span>Add Lender Account</span>
          </button>
        </div>
      ) : (
        <div className="lender-card-grid">
          {filteredLenders.map((lender) => {
            const isSettled = lender.balance === 0;

            return (
              <div key={lender.id} className="lender-card">
                <div>
                  <div className="lender-header">
                    <div>
                      <div className="lender-name">{lender.name}</div>
                      <div className="lender-meta">
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Phone size={13} />
                          <span>{lender.mobile}</span>
                        </span>
                        <span>•</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <MapPin size={13} />
                          <span>{lender.place}</span>
                        </span>
                      </div>
                    </div>
                    {isSettled ? (
                      <span className="badge badge-settled">
                        <CheckCircle2 size={12} />
                        <span>SETTLED</span>
                      </span>
                    ) : (
                      <span className="badge badge-due">
                        <Clock size={12} />
                        <span>DUE</span>
                      </span>
                    )}
                  </div>

                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                    Loan Date: {formatDate(lender.loan_date)}
                    {lender.notes && <span> • {lender.notes}</span>}
                  </div>
                </div>

                {/* Financial Balance Calculation Box */}
                <div className="lender-balance-box">
                  <div className="lender-numbers-row">
                    <span>Amount Given:</span>
                    <strong style={{ color: 'var(--text-primary)' }}>{formatCurrency(lender.amount_given)}</strong>
                  </div>
                  <div className="lender-numbers-row">
                    <span>Amount Paid:</span>
                    <strong style={{ color: '#34d399' }}>{formatCurrency(lender.amount_paid)}</strong>
                  </div>
                  <div className="lender-balance-row">
                    <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>Balance Due:</span>
                    <span
                      style={{
                        fontSize: '1.2rem',
                        fontWeight: 800,
                        color: isSettled ? '#34d399' : '#fbbf24',
                      }}
                    >
                      {formatCurrency(lender.balance)}
                    </span>
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="lender-actions">
                  <button
                    className="btn-ghost"
                    onClick={() => openEditModal(lender)}
                    title="Edit lender details"
                    style={{ padding: '8px' }}
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    className="btn-ghost"
                    onClick={() => setDeletingLender(lender)}
                    title="Delete lender account"
                    style={{ padding: '8px', color: '#fb7185' }}
                  >
                    <Trash2 size={16} />
                  </button>
                  {!isSettled && (
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => openRepaymentModal(lender)}
                    >
                      <Wallet size={14} />
                      <span>Record Payment</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL 1: Add / Edit Lender */}
      <Modal
        isOpen={isAddModalOpen || Boolean(editingLender)}
        title={editingLender ? 'Edit Lender Account' : 'Add New Lender Account'}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingLender(null);
        }}
      >
        <form onSubmit={handleSaveLender}>
          <div className="form-group">
            <label className="form-label">Name *</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Ramesh Kumar"
              value={addForm.name}
              onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
              autoFocus
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">Mobile Number *</label>
              <input
                type="tel"
                className="form-input"
                placeholder="e.g. 9876543210"
                value={addForm.mobile}
                onChange={(e) => setAddForm({ ...addForm, mobile: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Place / Location *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Surat Market"
                value={addForm.place}
                onChange={(e) => setAddForm({ ...addForm, place: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">Amount Given (₹) *</label>
              <input
                type="number"
                min="0"
                step="any"
                className="form-input"
                placeholder="e.g. 50000"
                value={addForm.amount_given}
                onChange={(e) => setAddForm({ ...addForm, amount_given: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Initial Amount Paid (₹)</label>
              <input
                type="number"
                min="0"
                step="any"
                className="form-input"
                placeholder="e.g. 0"
                value={addForm.amount_paid}
                onChange={(e) => setAddForm({ ...addForm, amount_paid: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Date *</label>
            <input
              type="date"
              className="form-input"
              value={addForm.loan_date}
              onChange={(e) => setAddForm({ ...addForm, loan_date: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Optional Notes</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Silk trade credit for 30 days"
              value={addForm.notes}
              onChange={(e) => setAddForm({ ...addForm, notes: e.target.value })}
            />
          </div>

          {modalError && <div className="form-error" style={{ marginBottom: '12px' }}>{modalError}</div>}

          <div className="modal-footer" style={{ padding: '16px 0 0 0' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setIsAddModalOpen(false);
                setEditingLender(null);
              }}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : editingLender ? 'Update Lender' : 'Save Lender'}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: Record Repayment */}
      <Modal
        isOpen={Boolean(payingLender)}
        title={`Record Repayment — ${payingLender?.name}`}
        onClose={() => setPayingLender(null)}
      >
        <form onSubmit={handleRecordRepayment}>
          <div
            style={{
              background: '#f8fafc',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              padding: '14px',
              marginBottom: '16px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Amount Given:</span>
              <strong>{formatCurrency(payingLender?.amount_given)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Amount Already Paid:</span>
              <strong style={{ color: '#059669' }}>{formatCurrency(payingLender?.amount_paid)}</strong>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '0.95rem',
                borderTop: '1px dashed var(--border-color)',
                paddingTop: '6px',
                marginTop: '6px',
              }}
            >
              <span style={{ fontWeight: 600 }}>Current Remaining Balance:</span>
              <strong style={{ color: '#d97706', fontSize: '1.1rem' }}>
                {formatCurrency(payingLender?.balance)}
              </strong>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Payment Amount (₹) *</label>
            <input
              type="number"
              min="0.01"
              max={payingLender?.balance || 0}
              step="any"
              inputMode="decimal"
              className="form-input form-input-lg"
              placeholder="e.g. 10000"
              value={repaymentAmount}
              onChange={(e) => setRepaymentAmount(e.target.value)}
              autoFocus
            />
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Maximum payable: {formatCurrency(payingLender?.balance)}
            </div>
          </div>

          {modalError && <div className="form-error" style={{ marginBottom: '12px' }}>{modalError}</div>}

          <div className="modal-footer" style={{ padding: '16px 0 0 0' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setPayingLender(null)}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-success" disabled={isSubmitting}>
              {isSubmitting ? 'Recording...' : 'Record Payment'}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL 3: Delete Lender Confirmation */}
      <Modal
        isOpen={Boolean(deletingLender)}
        title="Confirm Lender Deletion"
        onClose={() => setDeletingLender(null)}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div className="card-icon icon-red" style={{ width: '42px', height: '42px' }}>
              <AlertTriangle size={20} />
            </div>
            <div>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                Delete lender "{deletingLender?.name}"?
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Remaining Balance Due: <strong>{formatCurrency(deletingLender?.balance)}</strong>
              </div>
            </div>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            This will permanently delete this lender profile and its balance from your records.
          </p>

          <div className="modal-footer" style={{ padding: '16px 0 0 0', marginTop: '16px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setDeletingLender(null)}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-danger"
              onClick={handleConfirmDelete}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Deleting...' : 'Delete Lender'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
