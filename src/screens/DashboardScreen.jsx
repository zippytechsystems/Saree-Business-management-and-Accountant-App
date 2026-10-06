import React, { useState, useEffect, useMemo, lazy, Suspense, memo } from 'react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import AnimatedNumber from '../components/common/AnimatedNumber';
import Skeleton from '../components/common/Skeleton';
import {
  TrendingUp,
  Receipt,
  Scale,
  Boxes,
  CalendarCheck,
  CreditCard,
  IndianRupee,
  Wallet,
  HandCoins,
  RotateCw,
  PlusCircle,
  MinusCircle,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
} from 'lucide-react';
import { formatCurrency, formatMonth, formatDate } from '../utils/formatters';

// Lazy-loaded SVG Charts Chunk
const DashboardCharts = lazy(() => import('../components/dashboard/DashboardCharts'));

export default memo(function DashboardScreen({ onNavigate }) {
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

  const [salesList, setSalesList] = useState([]);
  const [expensesList, setExpensesList] = useState([]);

  const loadDashboardData = async () => {
    try {
      setLiveData((prev) => ({ ...prev, loading: true, error: null }));

      const dashRes = await fetch('/api/calculations/dashboard').catch(() => null);
      if (dashRes && dashRes.status === 401) {
        sessionStorage.removeItem('auth_token');
        localStorage.removeItem('auth_token');
      }

      let dashJson = null;
      if (dashRes) {
        try {
          dashJson = await dashRes.json();
        } catch (e) {}
      }

      if (dashJson && dashJson.success && dashJson.data) {
        const d = dashJson.data;
        setLiveData({
          todaySales: Number(d.today_sales ?? d.today?.today_sales ?? 0),
          todayExpenses: Number(d.today_expenses ?? d.today?.today_expenses ?? 0),
          todayNet: Number(d.today_net_amount ?? d.today?.today_net_amount ?? 0),
          currentStock: Number(d.current_stock ?? d.stock?.current_stock ?? 0),
          totalLenderDue: Number(d.total_lender_due ?? d.lender?.total_balance_due ?? 0),
          monthlySales: Number(d.monthly_sales ?? d.monthly?.monthly_sales ?? 0),
          monthlyExpenses: Number(d.monthly_expenses ?? d.monthly?.monthly_expenses ?? 0),
          monthlyTurnover: Number(d.monthly_turnover ?? d.monthly?.monthly_turnover ?? 0),
          monthlyNetBalance: Number(d.monthly_net_balance ?? d.monthly?.monthly_net_balance ?? 0),
          month: d.month || d.monthly?.month || '',
          loading: false,
          error: null,
        });
      } else {
        throw new Error(dashJson?.error || 'Failed to fetch calculations');
      }

      // Concurrently fetch recent sales & expenses lists for charts & feeds
      try {
        const [salesRes, expRes] = await Promise.all([
          fetch('/api/sales?limit=500').catch(() => null),
          fetch('/api/expenses?limit=500').catch(() => null),
        ]);
        if (salesRes && salesRes.ok) {
          const sJson = await salesRes.json().catch(() => null);
          if (sJson && sJson.success && Array.isArray(sJson.data)) {
            setSalesList(sJson.data);
          }
        }
        if (expRes && expRes.ok) {
          const eJson = await expRes.json().catch(() => null);
          if (eJson && eJson.success && Array.isArray(eJson.data)) {
            setExpensesList(eJson.data);
          }
        }
      } catch (listErr) {
        console.warn('Non-fatal: could not load transaction lists for dashboard:', listErr);
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

  // Compute Recent Unified Transactions Activity List
  const recentActivities = useMemo(() => {
    const list = [];

    salesList.forEach((s) => {
      list.push({
        id: `sale-${s.id}`,
        type: 'sale',
        date: s.entry_date || (s.created_at ? s.created_at.slice(0, 10) : ''),
        time: s.created_at ? new Date(s.created_at).getTime() : 0,
        title: 'Daily Sales Ledger Entry',
        subtext: 'Sales revenue record',
        amount: Number(s.total_sales_amount || s.amount || 0),
      });
    });

    expensesList.forEach((e) => {
      list.push({
        id: `exp-${e.id}`,
        type: 'expense',
        date: e.expense_date || (e.created_at ? e.created_at.slice(0, 10) : ''),
        time: e.created_at ? new Date(e.created_at).getTime() : 0,
        title: e.expense_type || 'Operating Expense',
        subtext: e.description || 'Recorded business expense',
        amount: Number(e.amount || 0),
      });
    });

    // Sort by date/time descending
    return list
      .sort((a, b) => (b.date === a.date ? b.time - a.time : b.date.localeCompare(a.date)))
      .slice(0, 6);
  }, [salesList, expensesList]);

  return (
    <div className="page-container" style={{ padding: 0 }}>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1 className="page-title">Executive Dashboard</h1>
            <p className="page-subtitle">
              Real-time business performance snapshot & pure automated calculations
            </p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={loadDashboardData}
            isLoading={liveData.loading}
            title="Refresh Dashboard"
            icon={RotateCw}
          >
            Refresh
          </Button>
        </div>
      </div>

      {liveData.error && (
        <div className="alert-toast alert-error">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={18} />
            <span>{liveData.error}</span>
          </div>
          <Button variant="secondary" size="sm" onClick={loadDashboardData}>
            Retry
          </Button>
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
          variant="gradient"
          staggerIndex={0}
          value={
            liveData.loading ? (
              '...'
            ) : (
              <AnimatedNumber value={liveData.todaySales} prefix="₹" />
            )
          }
          subtext="Total gross sales recorded for today"
          accent="green"
        />
        <Card
          title="Today's Expenses"
          icon={<Receipt size={18} />}
          variant="gradient"
          staggerIndex={1}
          value={
            liveData.loading ? (
              '...'
            ) : (
              <AnimatedNumber value={liveData.todayExpenses} prefix="₹" />
            )
          }
          subtext="Total operating expenses for today"
          accent="red"
        />
        <Card
          title="Today's Net Amount"
          icon={<Scale size={18} />}
          variant="glass"
          staggerIndex={2}
          value={
            liveData.loading ? (
              '...'
            ) : (
              <AnimatedNumber value={liveData.todayNet} prefix="₹" />
            )
          }
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
          variant="glass"
          staggerIndex={3}
          value={
            liveData.loading ? (
              '...'
            ) : (
              <AnimatedNumber
                value={liveData.currentStock}
                prefix=""
                formatter={(val) => `${new Intl.NumberFormat('en-IN').format(Math.round(val))} units`}
              />
            )
          }
          subtext="Live net stock across all product varieties (Total IN - Total OUT)"
          accent="cyan"
        />
        <Card
          title="Total Lender Due"
          icon={<HandCoins size={18} />}
          variant="glass"
          staggerIndex={4}
          value={
            liveData.loading ? (
              '...'
            ) : (
              <AnimatedNumber value={liveData.totalLenderDue} prefix="₹" />
            )
          }
          subtext="Total outstanding credit owed across all lenders (Given - Paid)"
          accent="amber"
        />
      </div>

      {/* MONTHLY PERFORMANCE */}
      <div className="section-heading">
        <IndianRupee size={18} style={{ color: 'var(--accent-purple)' }} />
        <span>
          Monthly Performance ({liveData.month ? formatMonth(liveData.month) : 'Current Month'})
        </span>
      </div>

      <div className="kpi-grid kpi-grid-4">
        <Card
          title="Monthly Sales"
          icon={<TrendingUp size={18} />}
          variant="default"
          staggerIndex={5}
          value={
            liveData.loading ? (
              '...'
            ) : (
              <AnimatedNumber value={liveData.monthlySales} prefix="₹" />
            )
          }
          subtext={`Cumulative sales for ${liveData.month || 'this month'}`}
          accent="green"
        />
        <Card
          title="Monthly Expenses"
          icon={<CreditCard size={18} />}
          variant="default"
          staggerIndex={6}
          value={
            liveData.loading ? (
              '...'
            ) : (
              <AnimatedNumber value={liveData.monthlyExpenses} prefix="₹" />
            )
          }
          subtext="All 5 approved expense categories"
          accent="red"
        />
        <Card
          title="Monthly Turnover"
          icon={<IndianRupee size={18} />}
          variant="default"
          staggerIndex={7}
          value={
            liveData.loading ? (
              '...'
            ) : (
              <AnimatedNumber value={liveData.monthlyTurnover} prefix="₹" />
            )
          }
          subtext="Formula: Turnover = Total Sales"
          accent="cyan"
        />
        <Card
          title="Monthly Net Balance"
          icon={<Wallet size={18} />}
          variant="gradient"
          staggerIndex={8}
          value={
            liveData.loading ? (
              '...'
            ) : (
              <AnimatedNumber value={liveData.monthlyNetBalance} prefix="₹" />
            )
          }
          subtext="Formula: Monthly Sales - Monthly Expenses"
          accent={liveData.monthlyNetBalance >= 0 ? 'green' : 'red'}
        />
      </div>

      {/* CHARTS SECTION (LAZY-LOADED) */}
      <div className="section-heading">
        <TrendingUp size={18} style={{ color: 'var(--accent-blue)' }} />
        <span>Financial Analytics & Category Visualizations</span>
      </div>

      <Suspense
        fallback={
          <div className="dashboard-charts-grid">
            <Skeleton.Card style={{ minHeight: '300px' }} className="chart-grid-col-wide" />
            <Skeleton.Card style={{ minHeight: '300px' }} className="chart-grid-col-half" />
            <Skeleton.Card style={{ minHeight: '300px' }} className="chart-grid-col-half" />
          </div>
        }
      >
        <DashboardCharts sales={salesList} expenses={expensesList} />
      </Suspense>

      {/* RECENT ACTIVITY LIST */}
      <div className="ui-card recent-activity-card">
        <div className="card-header" style={{ marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Clock size={18} style={{ color: 'var(--accent-blue)' }} />
            <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Recent Transactions Activity
            </span>
          </div>
          <span className="card-subtext">Latest sales & operating expenses</span>
        </div>

        {recentActivities.length === 0 ? (
          <div className="placeholder-box">No recent transactions recorded</div>
        ) : (
          <div className="recent-activity-list">
            {recentActivities.map((act, idx) => (
              <div
                key={act.id}
                className="recent-activity-item"
                style={{
                  animation: 'fadeIn var(--dur-base) var(--ease-out) both',
                  animationDelay: `${idx * 40}ms`,
                }}
              >
                <div className="activity-left">
                  <div
                    className={`activity-icon-box ${
                      act.type === 'sale' ? 'activity-icon-sale' : 'activity-icon-expense'
                    }`}
                  >
                    {act.type === 'sale' ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}
                  </div>
                  <div className="activity-meta">
                    <span className="activity-title">{act.title}</span>
                    <span className="activity-subtext">
                      {formatDate(act.date)} • {act.subtext}
                    </span>
                  </div>
                </div>

                <div
                  className={`activity-amount tabular-nums ${
                    act.type === 'sale' ? 'sale' : 'expense'
                  }`}
                >
                  {act.type === 'sale' ? '+' : '-'}
                  {formatCurrency(act.amount)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* QUICK OPERATIONAL SHORTCUTS */}
      <div className="section-heading">
        <span>Quick Operational Shortcuts</span>
      </div>

      <div className="action-grid">
        <Button
          variant="secondary"
          onClick={() => onNavigate('today-sales')}
          className="action-btn"
        >
          <PlusCircle size={18} style={{ color: 'var(--accent-green)' }} />
          <span>Enter Sales</span>
        </Button>
        <Button
          variant="secondary"
          onClick={() => onNavigate('expenses')}
          className="action-btn"
        >
          <MinusCircle size={18} style={{ color: 'var(--accent-red)' }} />
          <span>Record Expense</span>
        </Button>
        <Button
          variant="secondary"
          onClick={() => onNavigate('stock')}
          className="action-btn"
        >
          <Boxes size={18} style={{ color: 'var(--accent-cyan)' }} />
          <span>Stock Update</span>
        </Button>
        <Button
          variant="secondary"
          onClick={() => onNavigate('lenders')}
          className="action-btn"
        >
          <HandCoins size={18} style={{ color: 'var(--accent-amber)' }} />
          <span>Lender Dues</span>
        </Button>
        <Button
          variant="secondary"
          onClick={() => onNavigate('calculations')}
          className="action-btn"
        >
          <Scale size={18} style={{ color: 'var(--accent-purple)' }} />
          <span>All Calculations</span>
        </Button>
      </div>
    </div>
  );
});
