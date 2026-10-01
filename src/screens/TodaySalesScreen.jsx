import React, { useState, useEffect } from 'react';
import { TrendingUp, Save, History, RotateCw, CheckCircle2, Calendar } from 'lucide-react';
import Card from '../components/common/Card';
import Toast from '../components/common/Toast';
import { formatCurrency, formatDate, getTodayDateString } from '../utils/formatters';

export default function TodaySalesScreen() {
  const [todaySales, setTodaySales] = useState({ date: getTodayDateString(), total_sales_amount: 0, has_entry: false });
  const [salesHistory, setSalesHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // Form
  const [selectedDate, setSelectedDate] = useState(getTodayDateString());
  const [amountInput, setAmountInput] = useState('');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadSalesData = async () => {
    setLoading(true);
    try {
      const [todayRes, historyRes] = await Promise.all([
        fetch('/api/sales/today').then((r) => r.json()),
        fetch('/api/sales?limit=60').then((r) => r.json()),
      ]);

      if (todayRes.success) {
        setTodaySales(todayRes.data);
      }
      if (historyRes.success) {
        setSalesHistory(historyRes.data);
      }
    } catch (err) {
      setToast({ type: 'error', message: 'Failed to load sales data: ' + err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSalesData();
  }, []);

  // When selectedDate changes, pre-populate amount if record already exists
  useEffect(() => {
    const existing = salesHistory.find((s) => s.entry_date === selectedDate);
    if (existing) {
      setAmountInput(String(existing.total_sales_amount));
    } else if (selectedDate === todaySales.date && todaySales.has_entry) {
      setAmountInput(String(todaySales.total_sales_amount));
    } else {
      setAmountInput('');
    }
  }, [selectedDate, salesHistory, todaySales]);

  const handleSubmitSales = async (e) => {
    e.preventDefault();
    if (!selectedDate) {
      setFormError('Please select a valid date.');
      return;
    }
    const num = Number(amountInput);
    if (isNaN(num) || num < 0 || amountInput.trim() === '') {
      setFormError('Please enter a valid non-negative sales amount (₹).');
      return;
    }

    setFormError('');
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entry_date: selectedDate,
          total_sales_amount: num,
        }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to save sales record.');
      }

      setToast({
        type: 'success',
        message: data.data.is_updated
          ? `Updated sales for ${formatDate(selectedDate)} to ${formatCurrency(num)}`
          : `Saved sales of ${formatCurrency(num)} for ${formatDate(selectedDate)}`,
      });

      loadSalesData();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isToday = selectedDate === getTodayDateString();
  const existingForDate = salesHistory.find((s) => s.entry_date === selectedDate);

  return (
    <div>
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1 className="page-title">
              <TrendingUp size={24} style={{ color: 'var(--accent-green)' }} />
              <span>Today Sales</span>
            </h1>
            <p className="page-subtitle">
              Fast daily lump-sum sales recording (no product selection required)
            </p>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={loadSalesData} title="Refresh sales data">
            <RotateCw size={15} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

      {/* Hero Display: Today's Sales */}
      <div
        className="ui-card"
        style={{
          background: 'linear-gradient(135deg, #f0fdf4 0%, #ffffff 60%, #eff6ff 100%)',
          borderColor: 'rgba(16, 185, 129, 0.3)',
          boxShadow: '0 4px 20px -2px rgba(16, 185, 129, 0.12)',
          marginBottom: '24px',
          textAlign: 'center',
          padding: '28px 20px',
        }}
      >
        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Today's Recorded Sales ({formatDate(todaySales.date)})
        </div>
        <div
          style={{
            fontSize: '2.5rem',
            fontWeight: 800,
            color: '#059669',
            margin: '8px 0',
            fontFamily: 'inherit',
          }}
        >
          {loading ? '...' : formatCurrency(todaySales.total_sales_amount)}
        </div>
        <div style={{ fontSize: '0.8rem', color: todaySales.has_entry ? '#34d399' : 'var(--text-muted)' }}>
          {todaySales.has_entry ? '✓ Entry active for today' : 'No sales recorded yet for today'}
        </div>
      </div>

      {/* Fast Daily Sales Entry Form */}
      <div className="ui-card" style={{ marginBottom: '32px' }}>
        <div className="card-header" style={{ marginBottom: '16px' }}>
          <span className="card-label">
            {existingForDate ? `Update Sales (${formatDate(selectedDate)})` : `Record Sales (${formatDate(selectedDate)})`}
          </span>
          <span className="badge badge-in">Quick Entry</span>
        </div>

        <form onSubmit={handleSubmitSales}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Sales Date</label>
              <input
                type="date"
                className="form-input"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Total Sales Amount (₹) *</label>
              <input
                type="number"
                min="0"
                step="any"
                inputMode="decimal"
                className="form-input form-input-lg"
                placeholder="₹ 0.00"
                value={amountInput}
                onChange={(e) => setAmountInput(e.target.value)}
                autoFocus={isToday}
              />
            </div>
          </div>

          {formError && <div className="form-error" style={{ marginBottom: '14px' }}>{formError}</div>}

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
            <button
              type="submit"
              className="btn btn-success"
              style={{ width: '100%', maxWidth: '280px' }}
              disabled={isSubmitting}
            >
              <Save size={18} />
              <span>{isSubmitting ? 'Saving...' : existingForDate ? 'Update Daily Sales' : 'Save Today Sales'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Date-Wise Sales History */}
      <div className="section-heading">
        <History size={18} style={{ color: 'var(--accent-blue)' }} />
        <span>Date-Wise Sales History</span>
      </div>

      <div className="data-table-container">
        {loading ? (
          <div className="empty-state">
            <div className="empty-state-text">Loading sales logs...</div>
          </div>
        ) : salesHistory.length === 0 ? (
          <div className="empty-state">
            <History size={36} className="empty-state-icon" />
            <div className="empty-state-text">No daily sales recorded yet.</div>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th style={{ textAlign: 'right' }}>Total Sales Amount</th>
                <th style={{ textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {salesHistory.map((item) => (
                <tr key={item.id}>
                  <td style={{ fontWeight: 600 }}>
                    {formatDate(item.entry_date)}
                    {item.entry_date === getTodayDateString() && (
                      <span className="badge badge-in" style={{ marginLeft: '8px' }}>
                        TODAY
                      </span>
                    )}
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 700, color: '#34d399', fontSize: '1rem' }}>
                    {formatCurrency(item.total_sales_amount)}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => {
                        setSelectedDate(item.entry_date);
                        setAmountInput(String(item.total_sales_amount));
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                    >
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
  );
}
