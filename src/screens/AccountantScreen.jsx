import React, { useState, useEffect, useMemo } from 'react';
import {
  BookOpenCheck,
  TrendingUp,
  Receipt,
  Boxes,
  Truck,
  RotateCw,
  Calendar,
  Filter,
  ArrowDownLeft,
  ArrowUpRight,
  Edit2,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import Card from '../components/common/Card';
import Modal from '../components/common/Modal';
import Toast from '../components/common/Toast';
import { formatCurrency, formatDate, getTodayDateString, getCurrentMonthString } from '../utils/formatters';

const APPROVED_EXPENSE_CATEGORIES = [
  'Bills',
  'Rent',
  'Stock/Purchase expenses',
  'Supplier payments',
  'Other expenses',
];

export default function AccountantScreen() {
  const [activeLedger, setActiveLedger] = useState('sales'); // 'sales', 'expenses', 'stock', 'suppliers'
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthString); // Dynamic current month
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // Data States
  const [salesRecords, setSalesRecords] = useState([]);
  const [expenseRecords, setExpenseRecords] = useState([]);
  const [stockRecords, setStockRecords] = useState([]);
  const [stockSummary, setStockSummary] = useState(null);

  // Expense Category Filter
  const [expenseCategoryFilter, setExpenseCategoryFilter] = useState('');

  // Modals
  const [editingExpense, setEditingExpense] = useState(null);
  const [deletingExpense, setDeletingExpense] = useState(null);
  const [editingSales, setEditingSales] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');

  // Form states for edits
  const [expenseForm, setExpenseForm] = useState({
    expense_date: '',
    expense_type: '',
    amount: '',
    description: '',
  });

  const [salesForm, setSalesForm] = useState({
    entry_date: '',
    total_sales_amount: '',
  });

  const loadStockData = async () => {
    try {
      const [stockRes, stockSumRes] = await Promise.all([
        fetch('/api/stock/history?limit=100').then((r) => r.json()),
        fetch('/api/stock/summary').then((r) => r.json()),
      ]);
      if (stockRes.success) setStockRecords(stockRes.data);
      if (stockSumRes.success) setStockSummary(stockSumRes.data);
    } catch (err) {
      console.warn('Failed to load stock ledger:', err);
    }
  };

  const loadLedgerData = async () => {
    setLoading(true);
    try {
      const monthQuery = selectedMonth ? `month=${selectedMonth}&` : '';
      const [salesRes, expRes] = await Promise.all([
        fetch(`/api/sales?${monthQuery}limit=100`).then((r) => r.json()),
        fetch(`/api/expenses?${monthQuery}limit=100`).then((r) => r.json()),
      ]);

      if (salesRes.success) setSalesRecords(salesRes.data);
      if (expRes.success) setExpenseRecords(expRes.data);
    } catch (err) {
      setToast({ type: 'error', message: 'Failed to load ledger data: ' + err.message });
    } finally {
      setLoading(false);
    }
  };

  // Load stock history once on mount
  useEffect(() => {
    loadStockData();
  }, []);

  // Reload month-dependent ledgers when selectedMonth changes
  useEffect(() => {
    loadLedgerData();
  }, [selectedMonth]);

  // Handle Edit Expense
  const handleOpenEditExpense = (item) => {
    setEditingExpense(item);
    setExpenseForm({
      expense_date: item.expense_date,
      expense_type: item.expense_type,
      amount: String(item.amount),
      description: item.description || '',
    });
    setModalError('');
  };

  const handleSaveExpenseEdit = async (e) => {
    e.preventDefault();
    const num = Number(expenseForm.amount);
    if (isNaN(num) || num <= 0) {
      setModalError('Amount must be greater than 0.');
      return;
    }
    if (!expenseForm.expense_date) {
      setModalError('Date is required.');
      return;
    }
    setModalError('');
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/expenses/${editingExpense.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expense_date: expenseForm.expense_date,
          expense_type: expenseForm.expense_type,
          amount: num,
          description: expenseForm.description,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to update expense');

      setToast({ type: 'success', message: 'Expense record updated successfully.' });
      setEditingExpense(null);
      loadLedgerData();
    } catch (err) {
      setModalError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Delete Expense
  const handleConfirmDeleteExpense = async () => {
    if (!deletingExpense) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/expenses/${deletingExpense.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to delete expense');

      setToast({ type: 'success', message: 'Expense record deleted.' });
      setDeletingExpense(null);
      loadLedgerData();
    } catch (err) {
      setToast({ type: 'error', message: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Edit Sales Record
  const handleOpenEditSales = (item) => {
    setEditingSales(item);
    setSalesForm({
      entry_date: item.entry_date,
      total_sales_amount: String(item.total_sales_amount),
    });
    setModalError('');
  };

  const handleSaveSalesEdit = async (e) => {
    e.preventDefault();
    const num = Number(salesForm.total_sales_amount);
    if (isNaN(num) || num < 0) {
      setModalError('Sales amount cannot be negative.');
      return;
    }
    setModalError('');
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entry_date: salesForm.entry_date,
          total_sales_amount: num,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to update sales');

      setToast({ type: 'success', message: `Updated sales record for ${formatDate(salesForm.entry_date)}` });
      setEditingSales(null);
      loadLedgerData();
    } catch (err) {
      setModalError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Computed Totals for Active Period (Memoized to prevent render latency during form typing)
  const totalPeriodSales = useMemo(
    () => salesRecords.reduce((sum, r) => sum + Number(r.total_sales_amount || 0), 0),
    [salesRecords]
  );

  const filteredExpenses = useMemo(
    () => expenseRecords.filter((r) => !expenseCategoryFilter || r.expense_type === expenseCategoryFilter),
    [expenseRecords, expenseCategoryFilter]
  );

  const totalPeriodExpenses = useMemo(
    () => filteredExpenses.reduce((sum, r) => sum + Number(r.amount || 0), 0),
    [filteredExpenses]
  );

  const supplierPaymentsRecords = useMemo(
    () => expenseRecords.filter((r) => r.expense_type === 'Supplier payments'),
    [expenseRecords]
  );

  const totalSupplierPayments = useMemo(
    () => supplierPaymentsRecords.reduce((sum, r) => sum + Number(r.amount || 0), 0),
    [supplierPaymentsRecords]
  );

  return (
    <div>
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1 className="page-title">
              <BookOpenCheck size={24} style={{ color: 'var(--accent-purple)' }} />
              <span>Accountant Management</span>
            </h1>
            <p className="page-subtitle">
              Verified financial audit ledgers and operational records
            </p>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={loadLedgerData} title="Refresh ledgers">
            <RotateCw size={15} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

      {/* Sub Navigation Tabs */}
      <div className="sub-nav-tabs">
        <button
          className={`sub-nav-tab ${activeLedger === 'sales' ? 'active' : ''}`}
          onClick={() => setActiveLedger('sales')}
        >
          <TrendingUp size={16} />
          <span>A. Daily Sales Ledger</span>
        </button>
        <button
          className={`sub-nav-tab ${activeLedger === 'expenses' ? 'active' : ''}`}
          onClick={() => setActiveLedger('expenses')}
        >
          <Receipt size={16} />
          <span>B. Expense Ledger</span>
        </button>
        <button
          className={`sub-nav-tab ${activeLedger === 'stock' ? 'active' : ''}`}
          onClick={() => setActiveLedger('stock')}
        >
          <Boxes size={16} />
          <span>C. Stock Ledger</span>
        </button>
        <button
          className={`sub-nav-tab ${activeLedger === 'suppliers' ? 'active' : ''}`}
          onClick={() => setActiveLedger('suppliers')}
        >
          <Truck size={16} />
          <span>D. Supplier Payments</span>
        </button>
      </div>

      {/* Period Filter Bar */}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Calendar size={16} style={{ color: 'var(--accent-blue)' }} />
          <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Period Month:</span>
          <input
            type="month"
            className="form-input"
            style={{ minHeight: '38px', padding: '6px 12px', width: 'auto', fontSize: '0.85rem' }}
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
          />
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setSelectedMonth('')}
            title="View all recorded history"
          >
            All Time
          </button>
        </div>

        {activeLedger === 'expenses' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Filter size={15} style={{ color: 'var(--text-secondary)' }} />
            <select
              className="form-select"
              style={{ minHeight: '38px', padding: '6px 12px', fontSize: '0.85rem' }}
              value={expenseCategoryFilter}
              onChange={(e) => setExpenseCategoryFilter(e.target.value)}
            >
              <option value="">All Categories</option>
              {APPROVED_EXPENSE_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* ==================================================== */}
      {/* A. DAILY SALES LEDGER */}
      {/* ==================================================== */}
      {activeLedger === 'sales' && (
        <div>
          <div className="kpi-grid kpi-grid-2">
            <Card
              title="Total Period Sales"
              icon={<TrendingUp size={18} />}
              value={loading ? '...' : formatCurrency(totalPeriodSales)}
              subtext={`Cumulative sales for ${selectedMonth || 'All Time'}`}
              accent="green"
            />
            <Card
              title="Recorded Sales Entries"
              icon={<BookOpenCheck size={18} />}
              value={loading ? '...' : `${salesRecords.length} Days`}
              subtext="Total unique daily sales records logged"
              accent="blue"
            />
          </div>

          <div className="section-heading">
            <TrendingUp size={18} style={{ color: 'var(--accent-green)' }} />
            <span>Daily Sales Audit Log</span>
          </div>

          <div className="data-table-container">
            {loading ? (
              <div className="empty-state">
                <div className="empty-state-text">Loading sales records...</div>
              </div>
            ) : salesRecords.length === 0 ? (
              <div className="empty-state">
                <TrendingUp size={36} className="empty-state-icon" />
                <div className="empty-state-text">No daily sales records found for this period.</div>
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th style={{ textAlign: 'right' }}>Total Sales Amount</th>
                    <th style={{ textAlign: 'center' }}>Audit Action</th>
                  </tr>
                </thead>
                <tbody>
                  {salesRecords.map((item) => (
                    <tr key={item.id}>
                      <td style={{ fontWeight: 600 }}>{formatDate(item.entry_date)}</td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: '#34d399', fontSize: '1rem' }}>
                        {formatCurrency(item.total_sales_amount)}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => handleOpenEditSales(item)}>
                          <Edit2 size={13} />
                          <span>Edit</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* B. EXPENSE LEDGER */}
      {/* ==================================================== */}
      {activeLedger === 'expenses' && (
        <div>
          <div className="kpi-grid kpi-grid-2">
            <Card
              title="Total Period Expenses"
              icon={<Receipt size={18} />}
              value={loading ? '...' : formatCurrency(totalPeriodExpenses)}
              subtext={`Filtered expenses for ${selectedMonth || 'All Time'}`}
              accent="red"
            />
            <Card
              title="Expense Entries"
              icon={<BookOpenCheck size={18} />}
              value={loading ? '...' : `${filteredExpenses.length} Entries`}
              subtext="Total transactions recorded"
              accent="amber"
            />
          </div>

          <div className="section-heading">
            <Receipt size={18} style={{ color: 'var(--accent-red)' }} />
            <span>Expense Records Audit Log</span>
          </div>

          <div className="data-table-container">
            {loading ? (
              <div className="empty-state">
                <div className="empty-state-text">Loading expense records...</div>
              </div>
            ) : filteredExpenses.length === 0 ? (
              <div className="empty-state">
                <Receipt size={36} className="empty-state-icon" />
                <div className="empty-state-text">No expense records found for this period.</div>
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Expense Type</th>
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
                      <td>{item.description || '--'}</td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: '#fb7185' }}>
                        {formatCurrency(item.amount)}
                      </td>
                      <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                        <button
                          className="btn-ghost"
                          onClick={() => handleOpenEditExpense(item)}
                          title="Edit expense"
                          style={{ padding: '6px', marginRight: '4px' }}
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          className="btn-ghost"
                          onClick={() => setDeletingExpense(item)}
                          title="Delete expense"
                          style={{ padding: '6px', color: '#fb7185' }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* C. STOCK LEDGER */}
      {/* ==================================================== */}
      {activeLedger === 'stock' && (
        <div>
          <div className="kpi-grid kpi-grid-3">
            <Card
              title="Total IN (Arrivals)"
              icon={<ArrowDownLeft size={18} />}
              value={loading ? '...' : `${stockSummary?.total_in ?? 0} units`}
              subtext="Total items added to inventory"
              accent="green"
            />
            <Card
              title="Total OUT (Dispatches)"
              icon={<ArrowUpRight size={18} />}
              value={loading ? '...' : `${stockSummary?.total_out ?? 0} units`}
              subtext="Total items dispatched / sold"
              accent="amber"
            />
            <Card
              title="Current Net Stock"
              icon={<Boxes size={18} />}
              value={loading ? '...' : `${stockSummary?.current_stock ?? 0} units`}
              subtext="Total on-hand (Total IN - OUT)"
              accent="cyan"
            />
          </div>

          <div className="section-heading">
            <Boxes size={18} style={{ color: 'var(--accent-cyan)' }} />
            <span>Stock Movement Audit Log</span>
          </div>

          <div className="data-table-container">
            {loading ? (
              <div className="empty-state">
                <div className="empty-state-text">Loading stock movement logs...</div>
              </div>
            ) : stockRecords.length === 0 ? (
              <div className="empty-state">
                <Boxes size={36} className="empty-state-icon" />
                <div className="empty-state-text">No stock movements recorded yet.</div>
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Product Variety</th>
                    <th>Movement Type</th>
                    <th style={{ textAlign: 'right' }}>Quantity</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {stockRecords.map((item) => (
                    <tr key={item.id}>
                      <td style={{ whiteSpace: 'nowrap', color: 'var(--text-secondary)' }}>
                        {formatDate(item.entry_date)}
                      </td>
                      <td style={{ fontWeight: 600 }}>{item.product_name}</td>
                      <td>
                        {item.movement_type === 'IN' ? (
                          <span className="badge badge-in">
                            <ArrowDownLeft size={13} />
                            <span>IN STOCK</span>
                          </span>
                        ) : (
                          <span className="badge badge-out">
                            <ArrowUpRight size={13} />
                            <span>OUT STOCK</span>
                          </span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700 }}>
                        {item.movement_type === 'IN' ? `+${item.quantity}` : `-${item.quantity}`}
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{item.notes || '--'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* D. SUPPLIER PAYMENTS */}
      {/* ==================================================== */}
      {activeLedger === 'suppliers' && (
        <div>
          <div className="kpi-grid kpi-grid-2">
            <Card
              title="Total Supplier Payouts"
              icon={<Truck size={18} />}
              value={loading ? '...' : formatCurrency(totalSupplierPayments)}
              subtext={`Payments made to suppliers in ${selectedMonth || 'All Time'}`}
              accent="amber"
            />
            <Card
              title="Payout Transactions"
              icon={<Receipt size={18} />}
              value={loading ? '...' : `${supplierPaymentsRecords.length} Payments`}
              subtext="Included automatically under business expenses"
              accent="purple"
            />
          </div>

          <div className="section-heading">
            <Truck size={18} style={{ color: 'var(--accent-amber)' }} />
            <span>Supplier Payments Log</span>
          </div>

          <div className="data-table-container">
            {loading ? (
              <div className="empty-state">
                <div className="empty-state-text">Loading supplier payment records...</div>
              </div>
            ) : supplierPaymentsRecords.length === 0 ? (
              <div className="empty-state">
                <Truck size={36} className="empty-state-icon" />
                <div className="empty-state-text">No supplier payments recorded for this period.</div>
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Supplier / Description</th>
                    <th style={{ textAlign: 'right' }}>Payment Amount</th>
                    <th style={{ textAlign: 'center' }}>Audit Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {supplierPaymentsRecords.map((item) => (
                    <tr key={item.id}>
                      <td style={{ whiteSpace: 'nowrap', color: 'var(--text-secondary)' }}>
                        {formatDate(item.expense_date)}
                      </td>
                      <td style={{ fontWeight: 600 }}>{item.description || 'Supplier Payment'}</td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: '#fbbf24', fontSize: '1rem' }}>
                        {formatCurrency(item.amount)}
                      </td>
                      <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                        <button
                          className="btn-ghost"
                          onClick={() => handleOpenEditExpense(item)}
                          title="Edit supplier payout"
                          style={{ padding: '6px', marginRight: '4px' }}
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          className="btn-ghost"
                          onClick={() => setDeletingExpense(item)}
                          title="Delete supplier payout"
                          style={{ padding: '6px', color: '#fb7185' }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* MODAL: Edit Expense / Supplier Payment */}
      <Modal
        isOpen={Boolean(editingExpense)}
        title="Edit Accountant Record"
        onClose={() => setEditingExpense(null)}
      >
        <form onSubmit={handleSaveExpenseEdit}>
          <div className="form-group">
            <label className="form-label">Expense Category *</label>
            <select
              className="form-select"
              value={expenseForm.expense_type}
              onChange={(e) => setExpenseForm({ ...expenseForm, expense_type: e.target.value })}
            >
              {APPROVED_EXPENSE_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Amount (₹) *</label>
            <input
              type="number"
              min="0.01"
              step="any"
              className="form-input"
              value={expenseForm.amount}
              onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Date *</label>
            <input
              type="date"
              className="form-input"
              value={expenseForm.expense_date}
              onChange={(e) => setExpenseForm({ ...expenseForm, expense_date: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <input
              type="text"
              className="form-input"
              value={expenseForm.description}
              onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
            />
          </div>

          {modalError && <div className="form-error" style={{ marginBottom: '12px' }}>{modalError}</div>}

          <div className="modal-footer" style={{ padding: '16px 0 0 0' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setEditingExpense(null)}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Updating...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: Edit Sales Record */}
      <Modal
        isOpen={Boolean(editingSales)}
        title="Edit Daily Sales Record"
        onClose={() => setEditingSales(null)}
      >
        <form onSubmit={handleSaveSalesEdit}>
          <div className="form-group">
            <label className="form-label">Sales Date</label>
            <input type="date" className="form-input" value={salesForm.entry_date} disabled />
          </div>

          <div className="form-group">
            <label className="form-label">Total Daily Sales Amount (₹) *</label>
            <input
              type="number"
              min="0"
              step="any"
              className="form-input form-input-lg"
              value={salesForm.total_sales_amount}
              onChange={(e) => setSalesForm({ ...salesForm, total_sales_amount: e.target.value })}
            />
          </div>

          {modalError && <div className="form-error" style={{ marginBottom: '12px' }}>{modalError}</div>}

          <div className="modal-footer" style={{ padding: '16px 0 0 0' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setEditingSales(null)}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-success" disabled={isSubmitting}>
              {isSubmitting ? 'Updating...' : 'Update Sales Record'}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: Confirm Delete Expense */}
      <Modal
        isOpen={Boolean(deletingExpense)}
        title="Confirm Deletion"
        onClose={() => setDeletingExpense(null)}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div className="card-icon icon-red" style={{ width: '42px', height: '42px' }}>
              <AlertTriangle size={20} />
            </div>
            <div>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                Delete this record permanently?
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                {deletingExpense && (
                  <>
                    <strong>{formatCurrency(deletingExpense.amount)}</strong> for{' '}
                    <strong>{deletingExpense.expense_type}</strong>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="modal-footer" style={{ padding: '16px 0 0 0', marginTop: '16px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setDeletingExpense(null)}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-danger"
              onClick={handleConfirmDeleteExpense}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
