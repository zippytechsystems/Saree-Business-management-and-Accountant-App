import React, { useState, useEffect } from 'react';
import {
  Calculator,
  TrendingUp,
  Receipt,
  Scale,
  Wallet,
  Boxes,
  HandCoins,
  Calendar,
  RotateCw,
  AlertTriangle,
  CheckCircle2,
  PieChart,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import Card from '../components/common/Card';
import { formatCurrency, formatMonth, getCurrentMonthString } from '../utils/formatters';

const APPROVED_EXPENSE_CATEGORIES = [
  'Bills',
  'Rent',
  'Stock/Purchase expenses',
  'Supplier payments',
  'Other expenses',
];

export default function CalculationsScreen() {
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthString());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Today metrics
  const [todayData, setTodayData] = useState({
    today_sales: 0,
    today_expenses: 0,
    today_net_amount: 0,
    is_surplus: true,
  });

  // Monthly metrics
  const [monthlyData, setMonthlyData] = useState({
    month: getCurrentMonthString(),
    monthly_sales: 0,
    monthly_expenses: 0,
    monthly_turnover: 0,
    monthly_net_balance: 0,
    is_surplus: true,
    expense_breakdown: {},
  });

  // Lender metrics
  const [lenderSummary, setLenderSummary] = useState({
    total_amount_given: 0,
    total_amount_paid: 0,
    total_lender_due: 0,
    total_lenders: 0,
  });
  const [lendersList, setLendersList] = useState([]);

  // Stock metrics
  const [stockSummary, setStockSummary] = useState({
    total_varieties: 0,
    total_in: 0,
    total_out: 0,
    current_stock: 0,
  });
  const [stockVarieties, setStockVarieties] = useState([]);

  const loadCalculationData = async (targetMonth) => {
    setLoading(true);
    setError(null);

    try {
      const [todayRes, monthlyRes, lenderSumRes, lendersRes, stockSumRes, varietiesRes] =
        await Promise.all([
          fetch('/api/calculations/today').then((r) => r.json()),
          fetch(`/api/calculations/monthly?month=${targetMonth}`).then((r) => r.json()),
          fetch('/api/lenders/summary').then((r) => r.json()),
          fetch('/api/lenders').then((r) => r.json()),
          fetch('/api/stock/summary').then((r) => r.json()),
          fetch('/api/stock/varieties').then((r) => r.json()),
        ]);

      if (todayRes.success) {
        setTodayData(todayRes.data);
      }
      if (monthlyRes.success) {
        setMonthlyData(monthlyRes.data);
      }
      if (lenderSumRes.success) {
        setLenderSummary(lenderSumRes.data);
      }
      if (lendersRes.success) {
        setLendersList(lendersRes.data);
      }
      if (stockSumRes.success) {
        setStockSummary(stockSumRes.data);
      }
      if (varietiesRes.success) {
        setStockVarieties(varietiesRes.data);
      }
    } catch (err) {
      console.error('Error fetching calculation metrics:', err);
      setError('Failed to load calculation metrics from server. Please retry.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCalculationData(selectedMonth);
  }, [selectedMonth]);

  const handleMonthChange = (e) => {
    const val = e.target.value;
    if (val && /^\d{4}-\d{2}$/.test(val)) {
      setSelectedMonth(val);
    }
  };

  return (
    <div>
      {/* PAGE HEADER */}
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1 className="page-title">
              <Calculator size={26} style={{ color: 'var(--accent-purple)' }} />
              <span>Automatic Calculation Dashboard</span>
            </h1>
            <p className="page-subtitle">
              Pure automated aggregation of sales, expenses, inventory, and credit balances
            </p>
          </div>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => loadCalculationData(selectedMonth)}
            disabled={loading}
            title="Refresh Calculations"
          >
            <RotateCw size={15} className={loading ? 'spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* ERROR ALERT */}
      {error && (
        <div className="alert-toast alert-error">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={18} />
            <span>{error}</span>
          </div>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => loadCalculationData(selectedMonth)}
          >
            Retry
          </button>
        </div>
      )}

      {/* MONTH SELECTOR BAR */}
      <div className="month-selector-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Calendar size={20} style={{ color: 'var(--accent-blue)' }} />
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              PERIOD SELECTION
            </div>
            <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {formatMonth(selectedMonth)}
            </div>
          </div>
        </div>

        <div className="month-selector-controls">
          <label
            htmlFor="month-picker"
            style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}
          >
            Select Month:
          </label>
          <input
            id="month-picker"
            type="month"
            value={selectedMonth}
            onChange={handleMonthChange}
            className="form-input"
            style={{ width: 'auto', minHeight: '40px', padding: '6px 12px', fontSize: '0.9rem' }}
          />
        </div>
      </div>

      {/* 6. MONTHLY SUMMARY HERO CARD */}
      <div className="summary-hero-card">
        <div className="summary-hero-header">
          <div>
            <div className="summary-hero-title">
              <Sparkles size={20} style={{ color: 'var(--accent-purple)' }} />
              <span>Monthly Summary — {formatMonth(selectedMonth)}</span>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Standard financial overview calculated directly from business entries
            </p>
          </div>
          <div>
            {monthlyData.is_surplus ? (
              <span className="badge badge-settled" style={{ fontSize: '0.85rem', padding: '6px 14px' }}>
                <CheckCircle2 size={15} />
                <span>Net Surplus</span>
              </span>
            ) : (
              <span className="badge badge-due" style={{ fontSize: '0.85rem', padding: '6px 14px' }}>
                <AlertTriangle size={15} />
                <span>Net Deficit</span>
              </span>
            )}
          </div>
        </div>

        <div className="summary-metrics-grid">
          <div className="summary-metric-box">
            <div className="summary-metric-label">Total Sales</div>
            <div className="summary-metric-val" style={{ color: '#34d399' }}>
              {loading ? '...' : formatCurrency(monthlyData.monthly_sales)}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              All sales for {formatMonth(selectedMonth)}
            </div>
          </div>

          <div className="summary-metric-box">
            <div className="summary-metric-label">Total Expenses</div>
            <div className="summary-metric-val" style={{ color: '#fb7185' }}>
              {loading ? '...' : formatCurrency(monthlyData.monthly_expenses)}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              All 5 expense categories
            </div>
          </div>

          <div className="summary-metric-box">
            <div className="summary-metric-label">Monthly Turnover</div>
            <div className="summary-metric-val" style={{ color: '#22d3ee' }}>
              {loading ? '...' : formatCurrency(monthlyData.monthly_turnover)}
            </div>
            <div style={{ marginTop: '4px' }}>
              <span className="formula-tag">Turnover = Total Sales</span>
            </div>
          </div>

          <div className="summary-metric-box">
            <div className="summary-metric-label">Net Balance</div>
            <div
              className="summary-metric-val"
              style={{ color: monthlyData.is_surplus ? '#34d399' : '#fb7185' }}
            >
              {loading ? '...' : formatCurrency(monthlyData.monthly_net_balance)}
            </div>
            <div style={{ marginTop: '4px' }}>
              <span className="formula-tag">Sales - Expenses</span>
            </div>
          </div>
        </div>
      </div>

      {/* 1. TODAY'S CALCULATION */}
      <div className="section-heading">
        <Scale size={18} style={{ color: 'var(--accent-blue)' }} />
        <span>1. Today's Financial Calculation</span>
        <span className="formula-tag" style={{ marginLeft: 'auto' }}>
          Formula: Net Balance = Sales - Expenses
        </span>
      </div>

      <div className="kpi-grid kpi-grid-3">
        <Card
          title="Today's Sales"
          icon={<TrendingUp size={18} />}
          value={loading ? '...' : formatCurrency(todayData.today_sales)}
          subtext="Total daily gross sales"
          accent="green"
        />
        <Card
          title="Today's Expenses"
          icon={<Receipt size={18} />}
          value={loading ? '...' : formatCurrency(todayData.today_expenses)}
          subtext="Total operating expenses recorded today"
          accent="red"
        />
        <Card
          title="Today's Net Balance"
          icon={<Scale size={18} />}
          value={loading ? '...' : formatCurrency(todayData.today_net_amount)}
          subtext="Today's Cash Flow (Sales - Expenses)"
          accent={todayData.today_net_amount >= 0 ? 'green' : 'red'}
        />
      </div>

      {/* 2. MONTHLY CALCULATION */}
      <div className="section-heading">
        <DollarSign size={18} style={{ color: 'var(--accent-purple)' }} />
        <span>2. Monthly Financial Performance ({formatMonth(selectedMonth)})</span>
      </div>

      <div className="kpi-grid kpi-grid-4">
        <Card
          title="Monthly Total Sales"
          icon={<TrendingUp size={18} />}
          value={loading ? '...' : formatCurrency(monthlyData.monthly_sales)}
          subtext={`Gross sales for ${selectedMonth}`}
          accent="green"
        />
        <Card
          title="Monthly Total Expenses"
          icon={<Receipt size={18} />}
          value={loading ? '...' : formatCurrency(monthlyData.monthly_expenses)}
          subtext="Combined operating expenses"
          accent="red"
        />
        <Card
          title="Monthly Turnover"
          icon={<DollarSign size={18} />}
          value={loading ? '...' : formatCurrency(monthlyData.monthly_turnover)}
          subtext="Formula: Turnover = Total Sales"
          accent="cyan"
        />
        <Card
          title="Monthly Net Balance"
          icon={<Wallet size={18} />}
          value={loading ? '...' : formatCurrency(monthlyData.monthly_net_balance)}
          subtext="Formula: Total Sales - Total Expenses"
          accent={monthlyData.monthly_net_balance >= 0 ? 'green' : 'red'}
        />
      </div>

      {/* 3. MONTHLY EXPENSE BREAKDOWN */}
      <div className="section-heading">
        <PieChart size={18} style={{ color: 'var(--accent-red)' }} />
        <span>3. Monthly Expense Breakdown ({formatMonth(selectedMonth)})</span>
      </div>

      <div className="data-table-container" style={{ marginBottom: '32px' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Approved Category</th>
              <th style={{ textAlign: 'right' }}>Amount</th>
              <th style={{ textAlign: 'right' }}>% of Total</th>
              <th style={{ width: '35%' }}>Relative Share</th>
            </tr>
          </thead>
          <tbody>
            {APPROVED_EXPENSE_CATEGORIES.map((category) => {
              const amount = monthlyData.expense_breakdown?.[category] || 0;
              const totalExp = monthlyData.monthly_expenses || 0;
              const percentage = totalExp > 0 ? (amount / totalExp) * 100 : 0;

              return (
                <tr key={category}>
                  <td>
                    <span className="badge badge-category" style={{ fontSize: '0.8rem' }}>
                      {category}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>
                    {formatCurrency(amount)}
                  </td>
                  <td style={{ textAlign: 'right', color: 'var(--text-secondary)' }}>
                    {percentage.toFixed(1)}%
                  </td>
                  <td>
                    <div className="progress-bar-bg">
                      <div
                        className="progress-bar-fill"
                        style={{
                          width: `${Math.min(percentage, 100)}%`,
                          background:
                            category === 'Supplier payments'
                              ? 'var(--accent-blue)'
                              : category === 'Stock/Purchase expenses'
                              ? 'var(--accent-purple)'
                              : category === 'Rent'
                              ? 'var(--accent-amber)'
                              : 'var(--accent-red)',
                        }}
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr style={{ background: 'rgba(15, 23, 42, 0.85)', fontWeight: 700 }}>
              <td style={{ color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Total Monthly Expenses
              </td>
              <td style={{ textAlign: 'right', color: '#fb7185', fontSize: '1rem' }}>
                {formatCurrency(monthlyData.monthly_expenses)}
              </td>
              <td style={{ textAlign: 'right', color: 'var(--text-primary)' }}>100.0%</td>
              <td>
                <span className="formula-tag">Sum of 5 Approved Categories</span>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* 4. LENDER CALCULATIONS */}
      <div className="section-heading">
        <HandCoins size={18} style={{ color: 'var(--accent-amber)' }} />
        <span>4. Lender Calculations & Outstanding Due</span>
        <span className="formula-tag" style={{ marginLeft: 'auto' }}>
          Formula: Total Lender Due = Total Given - Total Paid
        </span>
      </div>

      <div className="kpi-grid kpi-grid-3">
        <Card
          title="Total Amount Given"
          icon={<HandCoins size={18} />}
          value={loading ? '...' : formatCurrency(lenderSummary.total_amount_given)}
          subtext="Total credit extended across all lenders"
          accent="blue"
        />
        <Card
          title="Total Amount Paid"
          icon={<CheckCircle2 size={18} />}
          value={loading ? '...' : formatCurrency(lenderSummary.total_amount_paid)}
          subtext="Total repayments received across all lenders"
          accent="green"
        />
        <Card
          title="Total Lender Due"
          icon={<AlertTriangle size={18} />}
          value={loading ? '...' : formatCurrency(lenderSummary.total_lender_due)}
          subtext="Formula: Total Amount Given - Total Amount Paid"
          accent="amber"
        />
      </div>

      {/* Individual Lender Balances Table */}
      <div className="data-table-container" style={{ marginBottom: '32px' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Lender Name</th>
              <th>Place</th>
              <th>Mobile</th>
              <th style={{ textAlign: 'right' }}>Amount Given</th>
              <th style={{ textAlign: 'right' }}>Amount Paid</th>
              <th style={{ textAlign: 'right' }}>Balance Due</th>
              <th style={{ textAlign: 'center' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {lendersList.length === 0 ? (
              <tr>
                <td colSpan={7}>
                  <div className="empty-state">
                    <p className="empty-state-text">No lender records found</p>
                  </div>
                </td>
              </tr>
            ) : (
              lendersList.map((lender) => {
                const balance = lender.amount_given - lender.amount_paid;
                const isSettled = balance <= 0;

                return (
                  <tr key={lender.id}>
                    <td style={{ fontWeight: 600 }}>{lender.name}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{lender.place}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{lender.mobile}</td>
                    <td style={{ textAlign: 'right' }}>{formatCurrency(lender.amount_given)}</td>
                    <td style={{ textAlign: 'right', color: '#34d399' }}>
                      {formatCurrency(lender.amount_paid)}
                    </td>
                    <td
                      style={{
                        textAlign: 'right',
                        fontWeight: 700,
                        color: isSettled ? '#34d399' : '#fbbf24',
                      }}
                    >
                      {formatCurrency(balance)}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {isSettled ? (
                        <span className="badge badge-settled">Settled</span>
                      ) : (
                        <span className="badge badge-due">Active Due</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* 5. STOCK CALCULATIONS */}
      <div className="section-heading">
        <Boxes size={18} style={{ color: 'var(--accent-cyan)' }} />
        <span>5. Stock Inventory Calculations</span>
        <span className="formula-tag" style={{ marginLeft: 'auto' }}>
          Formula: Current Stock = Total IN - Total OUT
        </span>
      </div>

      <div className="kpi-grid kpi-grid-3">
        <Card
          title="Total Stock IN"
          icon={<Boxes size={18} />}
          value={loading ? '...' : `${stockSummary.total_in} units`}
          subtext="Cumulative inventory received"
          accent="green"
        />
        <Card
          title="Total Stock OUT"
          icon={<Boxes size={18} />}
          value={loading ? '...' : `${stockSummary.total_out} units`}
          subtext="Cumulative inventory dispatched"
          accent="amber"
        />
        <Card
          title="Total Current Stock"
          icon={<Boxes size={18} />}
          value={loading ? '...' : `${stockSummary.current_stock} units`}
          subtext="Formula: Total IN - Total OUT"
          accent="cyan"
        />
      </div>

      {/* Product Variety Stock Table */}
      <div className="data-table-container" style={{ marginBottom: '32px' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Product Variety</th>
              <th style={{ textAlign: 'right' }}>Total IN</th>
              <th style={{ textAlign: 'right' }}>Total OUT</th>
              <th style={{ textAlign: 'right' }}>Current Stock</th>
              <th style={{ textAlign: 'center' }}>Stock Status</th>
            </tr>
          </thead>
          <tbody>
            {stockVarieties.length === 0 ? (
              <tr>
                <td colSpan={5}>
                  <div className="empty-state">
                    <p className="empty-state-text">No product varieties created yet</p>
                  </div>
                </td>
              </tr>
            ) : (
              stockVarieties.map((item) => {
                const stock = item.current_stock;
                return (
                  <tr key={item.id}>
                    <td style={{ fontWeight: 600 }}>{item.name}</td>
                    <td style={{ textAlign: 'right', color: '#34d399' }}>
                      +{item.total_in}
                    </td>
                    <td style={{ textAlign: 'right', color: '#fbbf24' }}>
                      -{item.total_out}
                    </td>
                    <td
                      style={{
                        textAlign: 'right',
                        fontWeight: 700,
                        fontSize: '0.95rem',
                        color: stock > 0 ? '#22d3ee' : stock === 0 ? 'var(--text-muted)' : '#fb7185',
                      }}
                    >
                      {stock} units
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {stock > 0 ? (
                        <span className="badge badge-settled">In Stock</span>
                      ) : stock === 0 ? (
                        <span className="badge" style={{ background: 'rgba(100, 116, 139, 0.2)', color: 'var(--text-secondary)' }}>
                          Zero Stock
                        </span>
                      ) : (
                        <span className="badge badge-due">Negative</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
          <tfoot>
            <tr style={{ background: 'rgba(15, 23, 42, 0.85)', fontWeight: 700 }}>
              <td style={{ color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                All Varieties Combined ({stockSummary.total_varieties} varieties)
              </td>
              <td style={{ textAlign: 'right', color: '#34d399' }}>+{stockSummary.total_in}</td>
              <td style={{ textAlign: 'right', color: '#fbbf24' }}>-{stockSummary.total_out}</td>
              <td style={{ textAlign: 'right', color: '#22d3ee', fontSize: '1rem' }}>
                {stockSummary.current_stock} units
              </td>
              <td style={{ textAlign: 'center' }}>
                <span className="formula-tag">Total IN - OUT</span>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
