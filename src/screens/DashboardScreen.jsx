import React, { useState, useEffect } from 'react';
import Card from '../components/common/Card';
import {
  TrendingUp,
  Receipt,
  Scale,
  Boxes,
  CalendarCheck,
  CreditCard,
  DollarSign,
  Wallet,
  HandCoins,
  RotateCw,
  PlusCircle,
  MinusCircle,
  AlertTriangle,
} from 'lucide-react';
import { formatCurrency, formatMonth } from '../utils/formatters';

export default function DashboardScreen({ onNavigate }) {
  const [liveData, setLiveData] = useState({
    todaySales: 0,
    todayExpenses: 0,
    todayNet: 0,
    currentStock: 0,
    totalLenderDue: 0,
    monthlySales: 0,
    monthlyExpenses: 0,
    monthlyTurnover: 0,
    monthlyNetBalance: 0,
    month: '',
    loading: true,
    error: null,
  });

  const loadDashboardData = async () => {
    try {
      setLiveData((prev) => ({ ...prev, loading: true, error: null }));
      const res = await fetch('/api/calculations/dashboard');
      const json = await res.json();

      if (json.success && json.data) {
        const d = json.data;
        setLiveData({
          todaySales: d.today_sales,
          todayExpenses: d.today_expenses,
          todayNet: d.today_net_amount,
          currentStock: d.current_stock,
          totalLenderDue: d.total_lender_due,
          monthlySales: d.monthly_sales,
          monthlyExpenses: d.monthly_expenses,
          monthlyTurnover: d.monthly_turnover,
          monthlyNetBalance: d.monthly_net_balance,
          month: d.month,
          loading: false,
          error: null,
        });
      } else {
        throw new Error(json.error || 'Failed to fetch calculations');
      }
    } catch (err) {
      console.error('Failed to load dashboard live data:', err);
      setLiveData((prev) => ({
        ...prev,
        loading: false,
        error: 'Unable to reach calculation services. Please retry.',
      }));
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  return (
    <div>
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1 className="page-title">Executive Dashboard</h1>
            <p className="page-subtitle">
              Real-time business performance snapshot & pure automated calculations
            </p>
          </div>
          <button
            className="btn btn-secondary btn-sm"
            onClick={loadDashboardData}
            disabled={liveData.loading}
            title="Refresh Dashboard"
          >
            <RotateCw size={15} className={liveData.loading ? 'spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {liveData.error && (
        <div className="alert-toast alert-error">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={18} />
            <span>{liveData.error}</span>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={loadDashboardData}>
            Retry
          </button>
        </div>
      )}

      {/* TODAY'S SNAPSHOT (LIVE CONNECTED) */}
      <div className="section-heading">
        <CalendarCheck size={18} style={{ color: 'var(--accent-blue)' }} />
        <span>Today's Performance (Live)</span>
        <span className="formula-tag" style={{ marginLeft: 'auto' }}>
          Formula: Net = Sales - Expenses
        </span>
      </div>

      <div className="kpi-grid kpi-grid-3">
        <Card
          title="Today's Sales"
          icon={<TrendingUp size={18} />}
          value={liveData.loading ? '...' : formatCurrency(liveData.todaySales)}
          subtext="Total gross sales recorded for today"
          accent="green"
        />
        <Card
          title="Today's Expenses"
          icon={<Receipt size={18} />}
          value={liveData.loading ? '...' : formatCurrency(liveData.todayExpenses)}
          subtext="Total operating expenses for today"
          accent="red"
        />
        <Card
          title="Today's Net Amount"
          icon={<Scale size={18} />}
          value={liveData.loading ? '...' : formatCurrency(liveData.todayNet)}
          subtext="Today's Cash Flow (Sales - Expenses)"
          accent={liveData.todayNet >= 0 ? 'green' : 'red'}
        />
      </div>

      {/* INVENTORY SNAPSHOT & LENDER DUE */}
      <div className="section-heading">
        <Boxes size={18} style={{ color: 'var(--accent-cyan)' }} />
        <span>Stock Status & Credit Balances (Live)</span>
      </div>

      <div className="kpi-grid kpi-grid-2">
        <Card
          title="Current Stock on Hand"
          icon={<Boxes size={18} />}
          value={liveData.loading ? '...' : `${liveData.currentStock} units`}
          subtext="Live net stock across all product varieties (Total IN - Total OUT)"
          accent="cyan"
        />
        <Card
          title="Total Lender Due"
          icon={<HandCoins size={18} />}
          value={liveData.loading ? '...' : formatCurrency(liveData.totalLenderDue)}
          subtext="Total outstanding credit owed across all lenders (Given - Paid)"
          accent="amber"
        />
      </div>

      {/* MONTHLY PERFORMANCE */}
      <div className="section-heading">
        <DollarSign size={18} style={{ color: 'var(--accent-purple)' }} />
        <span>Monthly Performance ({liveData.month ? formatMonth(liveData.month) : 'Current Month'})</span>
      </div>

      <div className="kpi-grid kpi-grid-4">
        <Card
          title="Monthly Sales"
          icon={<TrendingUp size={18} />}
          value={liveData.loading ? '...' : formatCurrency(liveData.monthlySales)}
          subtext={`Cumulative sales for ${liveData.month || 'this month'}`}
          accent="green"
        />
        <Card
          title="Monthly Expenses"
          icon={<CreditCard size={18} />}
          value={liveData.loading ? '...' : formatCurrency(liveData.monthlyExpenses)}
          subtext="All 5 approved expense categories"
          accent="red"
        />
        <Card
          title="Monthly Turnover"
          icon={<DollarSign size={18} />}
          value={liveData.loading ? '...' : formatCurrency(liveData.monthlyTurnover)}
          subtext="Formula: Turnover = Total Sales"
          accent="cyan"
        />
        <Card
          title="Monthly Net Balance"
          icon={<Wallet size={18} />}
          value={liveData.loading ? '...' : formatCurrency(liveData.monthlyNetBalance)}
          subtext="Formula: Monthly Sales - Monthly Expenses"
          accent={liveData.monthlyNetBalance >= 0 ? 'green' : 'red'}
        />
      </div>

      {/* QUICK OPERATIONAL SHORTCUTS */}
      <div className="section-heading">
        <span>Quick Operational Shortcuts</span>
      </div>

      <div className="action-grid">
        <button className="action-btn" onClick={() => onNavigate('today-sales')}>
          <PlusCircle size={18} style={{ color: 'var(--accent-green)' }} />
          <span>Enter Sales</span>
        </button>
        <button className="action-btn" onClick={() => onNavigate('expenses')}>
          <MinusCircle size={18} style={{ color: 'var(--accent-red)' }} />
          <span>Record Expense</span>
        </button>
        <button className="action-btn" onClick={() => onNavigate('stock')}>
          <Boxes size={18} style={{ color: 'var(--accent-cyan)' }} />
          <span>Stock Update</span>
        </button>
        <button className="action-btn" onClick={() => onNavigate('lenders')}>
          <HandCoins size={18} style={{ color: 'var(--accent-amber)' }} />
          <span>Lender Dues</span>
        </button>
        <button className="action-btn" onClick={() => onNavigate('calculations')}>
          <Scale size={18} style={{ color: 'var(--accent-purple)' }} />
          <span>All Calculations</span>
        </button>
      </div>
    </div>
  );
}
