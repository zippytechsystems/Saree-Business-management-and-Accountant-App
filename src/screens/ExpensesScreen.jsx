import React, { useState, useEffect } from 'react';
import {
  Receipt,
  Plus,
  Trash2,
  Edit2,
  Calendar,
  RotateCw,
  Tag,
  CreditCard,
  AlertTriangle,
} from 'lucide-react';
import Card from '../components/common/Card';
import Modal from '../components/common/Modal';
import Toast from '../components/common/Toast';
import Button from '../components/common/Button';
import { formatCurrency, formatDate, getTodayDateString } from '../utils/formatters';

const APPROVED_CATEGORIES = [
  'Bills',
  'Rent',
  'Stock/Purchase expenses',
  'Supplier payments',
  'Other expenses',
];

export default function ExpensesScreen() {
  const [expenses, setExpenses] = useState([]);
  const [todayTotal, setTodayTotal] = useState(0);
  const [monthlyTotal, setMonthlyTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // Filters
  const [selectedFilterCategory, setSelectedFilterCategory] = useState('');
  const [viewFilter, setViewFilter] = useState('today'); // 'today' or 'all'

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [deletingExpense, setDeletingExpense] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    expense_date: getTodayDateString(),
    expense_type: 'Bills',
    amount: '',
    description: '',
  });
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadExpensesData = async () => {
    setLoading(true);
    try {
      const [todayRes, listRes, monthlyRes] = await Promise.all([
        fetch('/api/expenses/today').then((r) => r.json()),
        fetch('/api/expenses?limit=100').then((r) => r.json()),
        fetch('/api/expenses/monthly').then((r) => r.json()),
      ]);

      if (todayRes.success) {
        setTodayTotal(todayRes.data.today_expenses);
      }
      if (listRes.success) {
        setExpenses(listRes.data);
      }
      if (monthlyRes.success) {
        setMonthlyTotal(monthlyRes.data.monthly_expenses);
      }
    } catch (err) {
      setToast({ type: 'error', message: 'Failed to load expenses: ' + err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExpensesData();
  }, []);

  // Open Add Modal
  const openAddModal = () => {
    setFormData({
      expense_date: getTodayDateString(),
      expense_type: 'Bills',
      amount: '',
      description: '',
    });
    setFormError('');
    setIsAddModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (expense) => {
    setEditingExpense(expense);
    setFormData({
      expense_date: expense.expense_date,
      expense_type: expense.expense_type,
      amount: String(expense.amount),
      description: expense.description || '',
    });
    setFormError('');
  };

  // Submit Add or Edit Expense
  const handleSaveExpense = async (e) => {
    e.preventDefault();
    const num = Number(formData.amount);
    if (isNaN(num) || num <= 0) {
      setFormError('Amount must be a number strictly greater than 0.');
      return;
    }
    if (!formData.expense_date) {
      setFormError('Date is required.');
      return;
    }
    if (!APPROVED_CATEGORIES.includes(formData.expense_type)) {
      setFormError('Please select a valid expense category.');
      return;
    }

    setFormError('');
    setIsSubmitting(true);

    try {
      const isEditing = Boolean(editingExpense);
      const url = isEditing ? `/api/expenses/${editingExpense.id}` : '/api/expenses';
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expense_date: formData.expense_date,
          expense_type: formData.expense_type,
          amount: num,
          description: formData.description,
        }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to save expense.');
      }

      setToast({
        type: 'success',
        message: isEditing
          ? `Updated expense of ${formatCurrency(num)}`
          : `Added ${formData.expense_type} expense of ${formatCurrency(num)}`,
      });

      setIsAddModalOpen(false);
      setEditingExpense(null);
      loadExpensesData();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Expense Confirmation
  const handleConfirmDelete = async () => {
    if (!deletingExpense) return;
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/expenses/${deletingExpense.id}`, { method: 'DELETE' });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to delete expense.');
      }

      setToast({
        type: 'success',
        message: `Deleted ${deletingExpense.expense_type} expense of ${formatCurrency(deletingExpense.amount)}`,
      });
      setDeletingExpense(null);
      loadExpensesData();
    } catch (err) {
      setToast({ type: 'error', message: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const todayStr = getTodayDateString();

  // Filter expenses list based on active tab and category
  const filteredExpenses = expenses.filter((item) => {
    if (viewFilter === 'today' && item.expense_date !== todayStr) {
      return false;
    }
    if (selectedFilterCategory && item.expense_type !== selectedFilterCategory) {
      return false;
    }
    return true;
  });

  return (
    <div>
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1 className="page-title">
              <Receipt size={24} style={{ color: 'var(--accent-red)' }} />
              <span>Daily Expenses</span>
            </h1>
            <p className="page-subtitle">
              Record and audit operational expenses across 5 approved categories
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <Button
              variant="secondary"
              size="sm"
              onClick={loadExpensesData}
              isLoading={loading}
              title="Refresh expenses"
              icon={RotateCw}
            >
              Refresh
            </Button>
            <Button
              variant="primary"
              onClick={openAddModal}
              icon={Plus}
            >
              Add Expense
            </Button>
          </div>
        </div>
      </div>

      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

      {/* KPI Cards */}
      <div className="kpi-grid kpi-grid-2">
        <Card
          title="Today's Total Expenses"
          icon={<Receipt size={18} />}
          value={loading ? '...' : formatCurrency(todayTotal)}
          subtext="Total expenditures recorded for today"
          accent="red"
        />
        <Card
          title="Monthly Total Expenses"
          icon={<CreditCard size={18} />}
          value={loading ? '...' : formatCurrency(monthlyTotal)}
          subtext="Accumulated expenses for this calendar month"
          accent="amber"
        />
      </div>

      {/* Filter Toolbar */}
      <div
        className="ui-card"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          padding: '12px 16px',
          marginBottom: '20px',
        }}
      >
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button
            size="sm"
            variant={viewFilter === 'today' ? 'primary' : 'secondary'}
            onClick={() => setViewFilter('today')}
          >
            Today's Entries
          </Button>
          <Button
            size="sm"
            variant={viewFilter === 'all' ? 'primary' : 'secondary'}
            onClick={() => setViewFilter('all')}
          >
            All History
          </Button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Tag size={15} style={{ color: 'var(--text-secondary)' }} />
          <select
            className="form-select"
            style={{ minHeight: '36px', padding: '6px 12px', fontSize: '0.8rem' }}
            value={selectedFilterCategory}
            onChange={(e) => setSelectedFilterCategory(e.target.value)}
          >
            <option value="">All 5 Categories</option>
            {APPROVED_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="section-heading">
        <Receipt size={18} style={{ color: 'var(--accent-red)' }} />
        <span>{viewFilter === 'today' ? "Today's Expense Entries" : 'Expense Records History'}</span>
      </div>

      <div className="data-table-container">
        {loading ? (
          <div className="empty-state">
            <div className="empty-state-text">Loading expenses...</div>
          </div>
        ) : filteredExpenses.length === 0 ? (
          <div className="empty-state">
            <Receipt size={36} className="empty-state-icon" />
            <div className="empty-state-text">
              {viewFilter === 'today'
                ? "No expenses logged for today yet."
                : 'No expenses found matching the selected filters.'}
            </div>
            <Button variant="secondary" size="sm" onClick={openAddModal} icon={Plus} style={{ marginTop: '12px' }}>
              Record Expense
            </Button>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Category</th>
                <th>Description</th>
                <th style={{ textAlign: 'right' }}>Amount</th>
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredExpenses.map((item) => (
                <tr key={item.id}>
                  <td style={{ whiteSpace: 'nowrap', color: 'var(--text-secondary)' }}>
                    {formatDate(item.expense_date)}
                  </td>
                  <td>
                    <span className="badge badge-category">{item.expense_type}</span>
                  </td>
                  <td style={{ color: 'var(--text-primary)' }}>{item.description || '--'}</td>
                  <td style={{ textAlign: 'right', fontWeight: 700, color: '#fb7185' }}>
                    {formatCurrency(item.amount)}
                  </td>
                  <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditModal(item)}
                      title="Edit expense"
                      icon={Edit2}
                      style={{ padding: '6px', marginRight: '4px' }}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeletingExpense(item)}
                      title="Delete expense"
                      icon={Trash2}
                      style={{ padding: '6px', color: '#fb7185' }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* MODAL: Add / Edit Expense */}
      <Modal
        isOpen={isAddModalOpen || Boolean(editingExpense)}
        title={editingExpense ? 'Edit Expense' : 'Record New Expense'}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingExpense(null);
        }}
      >
        <form onSubmit={handleSaveExpense}>
          <div className="form-group">
            <label className="form-label">Category *</label>
            <div className="category-pill-group">
              {APPROVED_CATEGORIES.map((cat) => (
                <button
                  type="button"
                  key={cat}
                  className={`category-pill ${formData.expense_type === cat ? 'active' : ''}`}
                  onClick={() => setFormData({ ...formData, expense_type: cat })}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Expense Amount (₹) *</label>
            <input
              type="number"
              min="0.01"
              step="any"
              inputMode="decimal"
              className="form-input"
              placeholder="e.g. 1500"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label">Date *</label>
            <input
              type="date"
              className="form-input"
              value={formData.expense_date}
              onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description / Notes (Optional)</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Surat weaver bill, shop electrical maintenance"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          {formError && <div className="form-error" style={{ marginBottom: '12px' }}>{formError}</div>}

          <div className="modal-footer" style={{ padding: '16px 0 0 0' }}>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setIsAddModalOpen(false);
                setEditingExpense(null);
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
              loadingText="Saving..."
            >
              {editingExpense ? 'Update Expense' : 'Save Expense'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: Delete Confirmation */}
      <Modal
        isOpen={Boolean(deletingExpense)}
        title="Confirm Expense Deletion"
        onClose={() => setDeletingExpense(null)}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div className="card-icon icon-red" style={{ width: '42px', height: '42px' }}>
              <AlertTriangle size={20} />
            </div>
            <div>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                Are you sure you want to delete this expense?
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                {deletingExpense && (
                  <>
                    <strong>{formatCurrency(deletingExpense.amount)}</strong> for{' '}
                    <strong>{deletingExpense.expense_type}</strong> ({formatDate(deletingExpense.expense_date)})
                  </>
                )}
              </div>
            </div>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            This will permanently remove the record and update today's and monthly totals.
          </p>

          <div className="modal-footer" style={{ padding: '16px 0 0 0', marginTop: '16px' }}>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setDeletingExpense(null)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              onClick={handleConfirmDelete}
              isLoading={isSubmitting}
              loadingText="Deleting..."
            >
              Delete Expense
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
