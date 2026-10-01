import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Download,
  Calendar,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Receipt,
  Boxes,
  HandCoins,
  Calculator,
  Truck,
  RefreshCw,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import Card from '../components/common/Card';

export default function ReportsScreen() {
  const getInitialMonth = () => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  };

  const [selectedMonth, setSelectedMonth] = useState(getInitialMonth);
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloading, setDownloading] = useState(false);

  // Month navigation helpers
  const handlePrevMonth = () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    let prevYear = year;
    let prevMonth = month - 1;
    if (prevMonth < 1) {
      prevMonth = 12;
      prevYear -= 1;
    }
    setSelectedMonth(`${prevYear}-${String(prevMonth).padStart(2, '0')}`);
  };

  const handleNextMonth = () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    let nextYear = year;
    let nextMonth = month + 1;
    if (nextMonth > 12) {
      nextMonth = 1;
      nextYear += 1;
    }
    setSelectedMonth(`${nextYear}-${String(nextMonth).padStart(2, '0')}`);
  };

  const fetchMonthlyReport = async (month) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/reports/monthly?month=${month}`);
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to fetch monthly report data.');
      }
      setReportData(json.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMonthlyReport(selectedMonth);
  }, [selectedMonth]);

  const handleDownload = async (format = 'csv') => {
    setDownloading(true);
    setError(null);
    try {
      const res = await fetch(`/api/reports/monthly/download?month=${selectedMonth}&format=${format}`);
      if (!res.ok) {
        let errMsg = `Failed to download report (HTTP ${res.status})`;
        try {
          const errJson = await res.json();
          if (errJson && errJson.error) errMsg = errJson.error;
        } catch (_) {}
        throw new Error(errMsg);
      }

      const blob = await res.blob();
      const objectUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.setAttribute('download', `monthly_business_report_${selectedMonth}.${format}`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(objectUrl);
    } catch (err) {
      console.error('Download error:', err);
      setError(err.message || 'Failed to download report.');
    } finally {
      setDownloading(false);
    }
  };

  const formatCurrency = (val) => {
    const num = Number(val || 0);
    return `₹${num.toLocaleString('en-IN')}`;
  };

  return (
    <div className="reports-screen">
      {/* Header */}
      <div className="page-header" style={{ marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <FileSpreadsheet size={26} style={{ color: 'var(--accent-blue)' }} />
              <span>Monthly Data & Reports</span>
            </h1>
            <p className="page-subtitle">
              Comprehensive date-wise ledgers, stock tracking, lender dues, and financial summaries
            </p>
          </div>

          {/* Month Selector Bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-card)', padding: '0.35rem 0.6rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <button
              className="btn-icon"
              onClick={handlePrevMonth}
              title="Previous Month"
              style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', padding: '4px' }}
            >
              <ChevronLeft size={20} />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, fontSize: '0.95rem' }}>
              <Calendar size={16} style={{ color: 'var(--accent-blue)' }} />
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => e.target.value && setSelectedMonth(e.target.value)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-primary)',
                  fontFamily: 'inherit',
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  outline: 'none',
                }}
              />
            </div>
            <button
              className="btn-icon"
              onClick={handleNextMonth}
              title="Next Month"
              style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', padding: '4px' }}
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Action Download Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.12) 0%, rgba(139, 92, 246, 0.1) 100%)',
        border: '1px solid rgba(59, 130, 246, 0.3)',
        borderRadius: 'var(--radius-lg)',
        padding: '1.25rem',
        marginBottom: '1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
      }}>
        <div>
          <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Download size={20} style={{ color: 'var(--accent-blue)' }} />
            <span>Export Complete Monthly Data File</span>
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Includes 6 sections: Executive Calculations, Sales Ledger, Expenses, Stock Movements, Supplier Payments, and Lender Dues for <strong>{selectedMonth}</strong>.
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            className="btn btn-primary"
            onClick={() => handleDownload('csv')}
            disabled={downloading || loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '0.65rem 1.2rem',
              fontWeight: 600,
              backgroundColor: 'var(--accent-blue)',
              color: '#ffffff',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <Download size={18} />
            <span>Download CSV (Excel)</span>
          </button>

          <button
            className="btn btn-secondary"
            onClick={() => handleDownload('json')}
            disabled={downloading || loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '0.65rem 1.1rem',
              fontWeight: 600,
              backgroundColor: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              cursor: 'pointer',
            }}
          >
            <FileSpreadsheet size={18} />
            <span>Download JSON</span>
          </button>
        </div>
      </div>

      {/* Loading & Error States */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-secondary)' }}>
          <RefreshCw size={28} className="animate-spin" style={{ margin: '0 auto 0.75rem auto', color: 'var(--accent-blue)' }} />
          <div>Compiling date-wise monthly report for {selectedMonth}...</div>
        </div>
      )}

      {error && !loading && (
        <div style={{
          background: 'rgba(244, 63, 94, 0.1)',
          border: '1px solid var(--accent-red)',
          borderRadius: 'var(--radius-md)',
          padding: '1rem',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          color: '#fb7185',
        }}>
          <AlertCircle size={20} />
          <div>{error}</div>
          <button
            onClick={() => fetchMonthlyReport(selectedMonth)}
            style={{ marginLeft: 'auto', background: 'transparent', border: '1px solid #fb7185', color: '#fb7185', padding: '4px 10px', borderRadius: '4px', cursor: 'pointer' }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Report Content Preview */}
      {!loading && !error && reportData && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* SECTION 1: EXECUTIVE FINANCIAL CALCULATIONS */}
          <section>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calculator size={18} style={{ color: 'var(--accent-purple)' }} />
              <span>1. Monthly Executive Summary ({selectedMonth})</span>
            </h2>
            <div className="kpi-grid kpi-grid-4">
              <Card
                title="Monthly Total Sales"
                icon={<TrendingUp size={18} />}
                accent="green"
                value={formatCurrency(reportData.calculations?.monthly_total_sales)}
                subtext={`${reportData.sales?.entries_count || 0} daily entries`}
              />
              <Card
                title="Monthly Total Expenses"
                icon={<Receipt size={18} />}
                accent="red"
                value={formatCurrency(reportData.calculations?.monthly_total_expenses)}
                subtext={`${reportData.expenses?.entries_count || 0} expense records`}
              />
              <Card
                title="Monthly Net Balance"
                icon={<Calculator size={18} />}
                accent={reportData.calculations?.is_surplus ? 'green' : 'red'}
                value={formatCurrency(reportData.calculations?.monthly_net_balance)}
                subtext={reportData.calculations?.is_surplus ? '✓ Monthly Surplus' : '⚠ Monthly Deficit'}
              />
              <Card
                title="Total Outstanding Lender Due"
                icon={<HandCoins size={18} />}
                accent="amber"
                value={formatCurrency(reportData.lenders?.summary?.total_lender_due)}
                subtext={`${reportData.lenders?.active_lenders_count || 0} active lenders`}
              />
            </div>
          </section>

          {/* SECTION 2: SALES LEDGER */}
          <section>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <TrendingUp size={18} style={{ color: 'var(--accent-green)' }} />
                <span>2. Date-wise Sales Ledger</span>
              </h2>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Total: <strong>{formatCurrency(reportData.sales?.monthly_total_sales)}</strong>
              </span>
            </div>

            <div className="table-container" style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.02)' }}>
                    <th style={{ padding: '10px 14px' }}>Date</th>
                    <th style={{ padding: '10px 14px', textAlign: 'right' }}>Daily Total Sales Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.sales?.records?.length === 0 ? (
                    <tr>
                      <td colSpan="2" style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        No sales recorded for {selectedMonth}.
                      </td>
                    </tr>
                  ) : (
                    reportData.sales.records.map((s, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '10px 14px', fontWeight: 500 }}>{s.date}</td>
                        <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 600, color: 'var(--accent-green)' }}>
                          {formatCurrency(s.daily_total_sales)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* SECTION 3: EXPENSES BREAKDOWN & RECORDS */}
          <section>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Receipt size={18} style={{ color: 'var(--accent-red)' }} />
                <span>3. Monthly Expenses Breakdown & Records</span>
              </h2>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Total: <strong>{formatCurrency(reportData.expenses?.monthly_total_expenses)}</strong>
              </span>
            </div>

            {/* Category breakdown pill chips */}
            {reportData.expenses?.breakdown && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
                {Object.entries(reportData.expenses.breakdown).map(([cat, amt]) => (
                  <div key={cat} style={{ background: 'var(--bg-card)', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{cat}</div>
                    <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>{formatCurrency(amt)}</div>
                  </div>
                ))}
              </div>
            )}

            <div className="table-container" style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.02)' }}>
                    <th style={{ padding: '10px 14px' }}>Date</th>
                    <th style={{ padding: '10px 14px' }}>Category</th>
                    <th style={{ padding: '10px 14px' }}>Description</th>
                    <th style={{ padding: '10px 14px', textAlign: 'right' }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.expenses?.records?.length === 0 ? (
                    <tr>
                      <td colSpan="4" style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        No expenses recorded for {selectedMonth}.
                      </td>
                    </tr>
                  ) : (
                    reportData.expenses.records.map((e) => (
                      <tr key={e.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '10px 14px' }}>{e.date}</td>
                        <td style={{ padding: '10px 14px' }}>
                          <span style={{
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '0.8rem',
                            background: 'rgba(255,255,255,0.06)',
                            color: 'var(--text-primary)',
                          }}>
                            {e.category}
                          </span>
                        </td>
                        <td style={{ padding: '10px 14px', color: 'var(--text-secondary)' }}>{e.description || '—'}</td>
                        <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 600, color: 'var(--accent-red)' }}>
                          {formatCurrency(e.amount)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* SECTION 4: STOCK VARIETIES & MOVEMENTS */}
          <section>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Boxes size={18} style={{ color: 'var(--accent-blue)' }} />
                <span>4. Stock Summary & Product Varieties</span>
              </h2>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Current Stock: <strong>{reportData.stock?.current_stock} units</strong>
              </span>
            </div>

            <div className="table-container" style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.02)' }}>
                    <th style={{ padding: '10px 14px' }}>Product Variety</th>
                    <th style={{ padding: '10px 14px', textAlign: 'right' }}>Total IN</th>
                    <th style={{ padding: '10px 14px', textAlign: 'right' }}>Total OUT</th>
                    <th style={{ padding: '10px 14px', textAlign: 'right' }}>Current Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.stock?.varieties?.map((v) => (
                    <tr key={v.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '10px 14px', fontWeight: 600 }}>{v.product_variety}</td>
                      <td style={{ padding: '10px 14px', textAlign: 'right', color: 'var(--accent-green)' }}>+{v.total_in}</td>
                      <td style={{ padding: '10px 14px', textAlign: 'right', color: 'var(--accent-red)' }}>-{v.total_out}</td>
                      <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, color: 'var(--accent-blue)' }}>
                        {v.current_stock}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* SECTION 5: SUPPLIER PAYMENTS */}
          <section>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Truck size={18} style={{ color: 'var(--accent-cyan)' }} />
                <span>5. Supplier Payments ({selectedMonth})</span>
              </h2>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Total: <strong>{formatCurrency(reportData.supplier_payments?.monthly_supplier_payment_total)}</strong>
              </span>
            </div>

            <div className="table-container" style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.02)' }}>
                    <th style={{ padding: '10px 14px' }}>Date</th>
                    <th style={{ padding: '10px 14px' }}>Description / Vendor</th>
                    <th style={{ padding: '10px 14px', textAlign: 'right' }}>Amount Paid</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.supplier_payments?.records?.length === 0 ? (
                    <tr>
                      <td colSpan="3" style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        No supplier payments recorded in {selectedMonth}.
                      </td>
                    </tr>
                  ) : (
                    reportData.supplier_payments.records.map((sp) => (
                      <tr key={sp.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '10px 14px' }}>{sp.date}</td>
                        <td style={{ padding: '10px 14px' }}>{sp.description || 'Supplier Payment'}</td>
                        <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 600, color: 'var(--accent-cyan)' }}>
                          {formatCurrency(sp.amount)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* SECTION 6: LENDERS OVERVIEW */}
          <section>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <HandCoins size={18} style={{ color: 'var(--accent-amber)' }} />
                <span>6. Lender Dues & Repayments Status</span>
              </h2>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Total Remaining Due: <strong>{formatCurrency(reportData.lenders?.summary?.total_lender_due)}</strong>
              </span>
            </div>

            <div className="table-container" style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.02)' }}>
                    <th style={{ padding: '10px 14px' }}>Lender Name</th>
                    <th style={{ padding: '10px 14px' }}>Place</th>
                    <th style={{ padding: '10px 14px', textAlign: 'right' }}>Amount Given</th>
                    <th style={{ padding: '10px 14px', textAlign: 'right' }}>Amount Paid</th>
                    <th style={{ padding: '10px 14px', textAlign: 'right' }}>Remaining Due</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.lenders?.records?.map((l) => (
                    <tr key={l.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '10px 14px', fontWeight: 600 }}>{l.name}</td>
                      <td style={{ padding: '10px 14px', color: 'var(--text-secondary)' }}>{l.place || '—'}</td>
                      <td style={{ padding: '10px 14px', textAlign: 'right' }}>{formatCurrency(l.amount_given)}</td>
                      <td style={{ padding: '10px 14px', textAlign: 'right', color: 'var(--accent-green)' }}>
                        {formatCurrency(l.amount_paid)}
                      </td>
                      <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, color: Number(l.remaining_due) > 0 ? 'var(--accent-amber)' : 'var(--text-secondary)' }}>
                        {formatCurrency(l.remaining_due)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
