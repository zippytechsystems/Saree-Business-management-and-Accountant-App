import React, { useState, useEffect, useMemo } from 'react';
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
  Zap,
  Building2,
  Package,
  Truck,
  ShoppingBag,
  Sparkles,
  Check,
  Send,
} from 'lucide-react';
import Card from '../components/common/Card';
import Modal from '../components/common/Modal';
import Toast from '../components/common/Toast';
import Button from '../components/common/Button';
import { formatCurrency, formatDate, getTodayDateString } from '../utils/formatters';

export const APPROVED_CATEGORIES = [
  'Bills',
  'Rent',
  'Stock/Purchase expenses',
  'Supplier payments',
  'Other expenses',
];

export const CATEGORY_CONFIG = [
  {
    key: 'Bills',
    name: 'Bills',
    telugu: 'కరెంట్ & షాప్ బిల్లులు',
    icon: Zap,
    color: '#3b82f6',
    border: 'rgba(59, 130, 246, 0.3)',
    bg: 'rgba(59, 130, 246, 0.08)',
    descPlaceholder: 'కరెంట్ బిల్లు, వాటర్, నెట్ లేదా జనరేటర్ బిల్లు',
  },
  {
    key: 'Rent',
    name: 'Rent',
    telugu: 'షాప్ & గోడౌన్ రెంట్',
    icon: Building2,
    color: '#8b5cf6',
    border: 'rgba(139, 92, 246, 0.3)',
    bg: 'rgba(139, 92, 246, 0.08)',
    descPlaceholder: 'ఈ నెల షాప్ అద్దె (Shop Rent) లేదా గోడౌన్ అద్దె',
  },
  {
    key: 'Stock/Purchase expenses',
    name: 'Stock/Purchase',
    telugu: 'సరుకు & ట్రాన్స్‌పోర్ట్',
    icon: Package,
    color: '#10b981',
    border: 'rgba(16, 185, 129, 0.3)',
    bg: 'rgba(16, 185, 129, 0.08)',
    descPlaceholder: 'Surat పార్శిల్ ట్రాన్స్‌పోర్ట్, హమాలీ, ప్యాకింగ్ మెటీరియల్',
  },
  {
    key: 'Supplier payments',
    name: 'Supplier payments',
    telugu: 'నేతన్నలు & సప్లయర్స్',
    icon: Truck,
    color: '#f59e0b',
    border: 'rgba(245, 158, 11, 0.3)',
    bg: 'rgba(245, 158, 11, 0.08)',
    descPlaceholder: 'చీరల నేతన్న లేదా సప్లయర్ అకౌంట్ పేమెంట్',
  },
  {
    key: 'Other expenses',
    name: 'Other expenses',
    telugu: 'చిల్లర & ఇతర ఖర్చులు',
    icon: ShoppingBag,
    color: '#ec4899',
    border: 'rgba(236, 72, 153, 0.3)',
    bg: 'rgba(236, 72, 153, 0.08)',
    descPlaceholder: 'టీ, టిఫిన్, పూజ ఖర్చులు, షాప్ క్లీనింగ్, పెట్రోల్',
  },
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

  // Form State (Modal) - 3 CORE OPTIONS: Category, Description, Amount
  const [formData, setFormData] = useState({
    expense_date: getTodayDateString(),
    expense_type: 'Bills',
    description: '',
    amount: '',
  });
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Inline Quick Add State (Direct on page) - 3 Options
  const [inlineCategory, setInlineCategory] = useState('Bills');
  const [inlineDescription, setInlineDescription] = useState('');
  const [inlineAmount, setInlineAmount] = useState('');
  const [inlineSubmitting, setInlineSubmitting] = useState(false);
  const [inlineError, setInlineError] = useState('');

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

  const todayStr = getTodayDateString();

  // Category breakdown for today's entries
  const todayCategoryTotals = useMemo(() => {
    const totals = {
      'Bills': 0,
      'Rent': 0,
      'Stock/Purchase expenses': 0,
      'Supplier payments': 0,
      'Other expenses': 0,
    };
    expenses.forEach((item) => {
      if (item.expense_date === todayStr && totals[item.expense_type] !== undefined) {
        totals[item.expense_type] += Number(item.amount || 0);
      }
    });
    return totals;
  }, [expenses, todayStr]);

  // Open Add Modal with category option
  const openAddModal = (category = 'Bills') => {
    setFormData({
      expense_date: getTodayDateString(),
      expense_type: category,
      description: '',
      amount: '',
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
      description: expense.description || '',
      amount: String(expense.amount),
    });
    setFormError('');
  };

  // Submit Add or Edit Expense (Modal)
  const handleSaveExpense = async (e) => {
    e.preventDefault();
    const num = Number(formData.amount);
    if (isNaN(num) || num <= 0) {
      setFormError('దయచేసి ఖర్చు మొత్తం (Amount) సరిగ్గా నమోదు చేయండి.');
      return;
    }
    if (!formData.description || !formData.description.trim()) {
      setFormError('దయచేసి ఖర్చు వివరాలు (Description) నమోదు చేయండి.');
      return;
    }
    if (!formData.expense_date) {
      setFormError('Date is required.');
      return;
    }
    if (!APPROVED_CATEGORIES.includes(formData.expense_type)) {
      setFormError('దయచేసి సరైన కేటగిరీ ఎంచుకోండి.');
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
          description: formData.description.trim(),
          amount: num,
        }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to save expense.');
      }

      setToast({
        type: 'success',
        message: isEditing
          ? `Updated expense of ${formatCurrency(num)} (${formData.expense_type})`
          : `Saved: ${formData.description.trim()} — ${formatCurrency(num)} (${formData.expense_type})`,
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

  // Direct Inline Quick Add (1-Click Entry with 3 Options: Category, Description, Amount)
  const handleInlineAdd = async (e) => {
    e.preventDefault();
    const num = Number(inlineAmount);
    if (isNaN(num) || num <= 0) {
      setInlineError('దయచేసి మొత్తం (Amount ₹) ఎంటర్ చేయండి.');
      return;
    }
    if (!inlineDescription || !inlineDescription.trim()) {
      setInlineError('దయచేసి ఖర్చు వివరాలు (Description) ఎంటర్ చేయండి.');
      return;
    }

    setInlineError('');
    setInlineSubmitting(true);

    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expense_date: getTodayDateString(),
          expense_type: inlineCategory,
          description: inlineDescription.trim(),
          amount: num,
        }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to record expense.');
      }

      setToast({
        type: 'success',
        message: `Saved ${inlineCategory} expense: ${inlineDescription.trim()} — ${formatCurrency(num)}`,
      });

      setInlineDescription('');
      setInlineAmount('');
      loadExpensesData();
    } catch (err) {
      setInlineError(err.message);
    } finally {
      setInlineSubmitting(false);
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

  const activeCategoryMeta = CATEGORY_CONFIG.find((c) => c.key === formData.expense_type) || CATEGORY_CONFIG[0];
  const activeInlineMeta = CATEGORY_CONFIG.find((c) => c.key === inlineCategory) || CATEGORY_CONFIG[0];

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1 className="page-title">
              <Receipt size={24} style={{ color: 'var(--accent-red)' }} />
              <span>Daily Expenses & Categories</span>
            </h1>
            <p className="page-subtitle">
              ఖర్చులు నమోదు చేయండి: కేటగిరీ (Category), వివరణ (Description), మరియు మొత్తం (Amount)
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
              onClick={() => openAddModal('Bills')}
              icon={Plus}
            >
              + Add Expense
            </Button>
          </div>
        </div>
      </div>

      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

      {/* KPI Cards: Today & Month */}
      <div className="kpi-grid kpi-grid-2" style={{ marginBottom: '20px' }}>
        <Card
          title="Today's Total Expenses (ఈరోజు మొత్తం ఖర్చులు)"
          icon={<Receipt size={18} />}
          value={loading ? '...' : formatCurrency(todayTotal)}
          subtext="Total expenditures recorded for today"
          accent="red"
        />
        <Card
          title="Monthly Total Expenses (ఈ నెల ఖర్చులు)"
          icon={<CreditCard size={18} />}
          value={loading ? '...' : formatCurrency(monthlyTotal)}
          subtext="Accumulated expenses for this calendar month"
          accent="amber"
        />
      </div>

      {/* ============================================================== */}
      {/* 1. ALL CATEGORIES INTERACTIVE ACTION GRID (అన్ని కేటగిరీలు) */}
      {/* ============================================================== */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Tag size={16} style={{ color: 'var(--accent-blue)' }} />
            <span>All 5 Categories — Direct Quick Add (అన్ని కేటగిరీలలో ఖర్చు జోడించండి)</span>
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>క్లిక్ చేసి వెంటనే ఖర్చు వేయండి</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
          {CATEGORY_CONFIG.map((cat) => {
            const Icon = cat.icon;
            const spentToday = todayCategoryTotals[cat.key] || 0;
            return (
              <div
                key={cat.key}
                style={{
                  background: 'var(--bg-secondary)',
                  border: `1px solid ${cat.border}`,
                  borderRadius: '12px',
                  padding: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: 'var(--shadow-sm)',
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <div
                      style={{
                        width: '34px',
                        height: '34px',
                        borderRadius: '8px',
                        background: cat.bg,
                        color: cat.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Icon size={18} />
                    </div>
                    <span
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '10px',
                        background: spentToday > 0 ? cat.bg : 'var(--bg-card)',
                        color: spentToday > 0 ? cat.color : 'var(--text-muted)',
                      }}
                    >
                      Today: {formatCurrency(spentToday)}
                    </span>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                    {cat.name}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {cat.telugu}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => openAddModal(cat.key)}
                  style={{
                    marginTop: '12px',
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: `1px solid ${cat.color}`,
                    background: cat.bg,
                    color: cat.color,
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = cat.color;
                    e.currentTarget.style.color = '#fff';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = cat.bg;
                    e.currentTarget.style.color = cat.color;
                  }}
                >
                  <Plus size={14} />
                  <span>+ Add {cat.name}</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. DIRECT 3-FIELD QUICK ENTRY BAR (Category, Description, Amount) */}
      {/* ============================================================== */}
      <div
        className="ui-card"
        style={{
          padding: '16px 20px',
          marginBottom: '24px',
          borderRadius: '14px',
          border: '1px solid var(--border-color)',
          background: 'var(--bg-secondary)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <Sparkles size={18} style={{ color: 'var(--accent-blue)' }} />
          <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
            Quick Entry Bar — కేటగిరీ, వివరణ & మొత్తం (3 ఆప్షన్స్)
          </div>
        </div>

        <form onSubmit={handleInlineAdd}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr)) 140px', gap: '12px', alignItems: 'flex-end' }}>
            {/* Option 1: Category */}
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                1. Category (ఏ వర్గం ఖర్చు) *
              </label>
              <select
                className="form-select"
                style={{ width: '100%', height: '42px', padding: '8px 12px', fontWeight: 600 }}
                value={inlineCategory}
                onChange={(e) => setInlineCategory(e.target.value)}
              >
                {CATEGORY_CONFIG.map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.name} — {c.telugu}
                  </option>
                ))}
              </select>
            </div>

            {/* Option 2: Description */}
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                2. Description (వివరణ / దేని కోసం) *
              </label>
              <input
                type="text"
                className="form-input"
                style={{ width: '100%', height: '42px' }}
                placeholder={activeInlineMeta.descPlaceholder}
                value={inlineDescription}
                onChange={(e) => setInlineDescription(e.target.value)}
              />
            </div>

            {/* Option 3: Amount */}
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                3. Amount (మొత్తం ₹) *
              </label>
              <input
                type="number"
                min="0.01"
                step="any"
                inputMode="decimal"
                className="form-input"
                style={{ width: '100%', height: '42px', fontWeight: 700, color: 'var(--accent-red)' }}
                placeholder="₹ మొత్తం"
                value={inlineAmount}
                onChange={(e) => setInlineAmount(e.target.value)}
              />
            </div>

            {/* Submit Button */}
            <div>
              <Button
                type="submit"
                variant="primary"
                style={{ width: '100%', height: '42px', fontWeight: 700 }}
                isLoading={inlineSubmitting}
                icon={Send}
              >
                + Add
              </Button>
            </div>
          </div>

          {inlineError && (
            <div style={{ marginTop: '8px', fontSize: '0.8rem', color: 'var(--accent-red)', fontWeight: 600 }}>
              {inlineError}
            </div>
          )}
        </form>
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
            Today's Entries ({todayStr})
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
            <Button variant="secondary" size="sm" onClick={() => openAddModal('Bills')} icon={Plus} style={{ marginTop: '12px' }}>
              Record Expense
            </Button>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Category (వర్గం)</th>
                <th>Description (వివరణ)</th>
                <th style={{ textAlign: 'right' }}>Amount (మొత్తం)</th>
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
                  <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                    {item.description || '--'}
                  </td>
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

      {/* ============================================================== */}
      {/* 3. MODAL: Add / Edit Expense with 3 CORE OPTIONS EXPLICITLY */}
      {/* ============================================================== */}
      <Modal
        isOpen={isAddModalOpen || Boolean(editingExpense)}
        title={editingExpense ? 'Edit Expense Record' : 'Record New Expense (ఖర్చు నమోదు)'}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingExpense(null);
        }}
      >
        <form onSubmit={handleSaveExpense}>
          {/* OPTION 1: CATEGORY */}
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>1. Category (వర్గం ఎంచుకోండి) *</span>
              <span style={{ fontSize: '0.78rem', color: activeCategoryMeta.color, fontWeight: 700 }}>
                {activeCategoryMeta.telugu}
              </span>
            </label>
            <div className="category-pill-group" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {CATEGORY_CONFIG.map((cat) => {
                const Icon = cat.icon;
                const isSelected = formData.expense_type === cat.key;
                return (
                  <button
                    type="button"
                    key={cat.key}
                    className={`category-pill ${isSelected ? 'active' : ''}`}
                    onClick={() => setFormData({ ...formData, expense_type: cat.key })}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 14px',
                      borderRadius: '10px',
                      border: isSelected ? `2px solid ${cat.color}` : '1px solid var(--border-color)',
                      background: isSelected ? cat.bg : 'var(--bg-secondary)',
                      color: isSelected ? cat.color : 'var(--text-secondary)',
                      fontWeight: isSelected ? 700 : 500,
                      cursor: 'pointer',
                    }}
                  >
                    <Icon size={15} />
                    <span>{cat.name}</span>
                    {isSelected && <Check size={14} />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* OPTION 2: DESCRIPTION */}
          <div className="form-group">
            <label className="form-label">
              2. Description / వివరణ (దేని కోసం ఖర్చు చేశారు?) *
            </label>
            <input
              type="text"
              className="form-input"
              placeholder={activeCategoryMeta.descPlaceholder}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              autoFocus
            />
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              ఉదా: {activeCategoryMeta.descPlaceholder}
            </div>
          </div>

          {/* OPTION 3: AMOUNT */}
          <div className="form-group">
            <label className="form-label">
              3. Amount / ఖర్చు మొత్తం (₹) *
            </label>
            <input
              type="number"
              min="0.01"
              step="any"
              inputMode="decimal"
              className="form-input"
              placeholder="ఉదా: 1500"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              style={{ fontSize: '1.1rem', fontWeight: 700 }}
            />

            {/* Quick Amount Shortcuts */}
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '8px' }}>
              {[100, 200, 500, 1000, 2000, 5000].map((amt) => (
                <button
                  type="button"
                  key={amt}
                  onClick={() => {
                    const current = Number(formData.amount || 0);
                    setFormData({ ...formData, amount: String(current + amt) });
                  }}
                  style={{
                    padding: '4px 8px',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-card)',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                  }}
                >
                  +{amt}
                </button>
              ))}
              {formData.amount && (
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, amount: '' })}
                  style={{
                    padding: '4px 8px',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-card)',
                    color: 'var(--accent-red)',
                    cursor: 'pointer',
                  }}
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Date Option */}
          <div className="form-group">
            <label className="form-label">Date (తేదీ)</label>
            <input
              type="date"
              className="form-input"
              value={formData.expense_date}
              onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
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
              icon={Plus}
            >
              {editingExpense ? 'Update Expense' : '+ Add Expense'}
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
