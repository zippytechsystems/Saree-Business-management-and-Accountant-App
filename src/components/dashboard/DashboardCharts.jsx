import React, { useState, useMemo, memo } from 'react';
import { TrendingUp, Receipt, Scale, BarChart3, PieChart, Activity } from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/formatters';

/**
 * Clean SVG Path generator for smooth area & line curves
 */
function createAreaAndLinePath(points, height, paddingBottom) {
  if (!points || points.length === 0) return { linePath: '', areaPath: '' };
  if (points.length === 1) {
    const p = points[0];
    return {
      linePath: `M ${p.x - 20} ${p.y} L ${p.x + 20} ${p.y}`,
      areaPath: `M ${p.x - 20} ${p.y} L ${p.x + 20} ${p.y} L ${p.x + 20} ${height - paddingBottom} L ${p.x - 20} ${height - paddingBottom} Z`,
    };
  }

  // Smooth cubic bezier through points
  let linePath = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const current = points[i];
    const next = points[i + 1];
    const controlX = (current.x + next.x) / 2;
    linePath += ` C ${controlX} ${current.y}, ${controlX} ${next.y}, ${next.x} ${next.y}`;
  }

  const lastPoint = points[points.length - 1];
  const firstPoint = points[0];
  const areaPath = `${linePath} L ${lastPoint.x} ${height - paddingBottom} L ${firstPoint.x} ${height - paddingBottom} Z`;

  return { linePath, areaPath };
}

/**
 * 1. Sales Trend Area Chart (with 7 / 30 Day Range Toggle)
 */
export const SalesTrendChart = memo(function SalesTrendChart({ sales = [] }) {
  const [rangeDays, setRangeDays] = useState(7);
  const [hoveredIndex, setHoveredIndex] = useState(null);

  // Group and sort sales data for selected range
  const chartData = useMemo(() => {
    if (!sales || sales.length === 0) return [];

    // Aggregate by entry_date
    const dailyMap = new Map();
    sales.forEach((s) => {
      const date = s.entry_date || (s.created_at ? s.created_at.slice(0, 10) : '');
      if (!date) return;
      const amt = Number(s.total_sales_amount || s.amount || 0);
      dailyMap.set(date, (dailyMap.get(date) || 0) + amt);
    });

    // Build timeline dates ending at latest date or today
    const sortedDates = Array.from(dailyMap.keys()).sort();
    const endDate = sortedDates.length > 0 ? new Date(sortedDates[sortedDates.length - 1]) : new Date();

    const data = [];
    for (let i = rangeDays - 1; i >= 0; i--) {
      const d = new Date(endDate);
      d.setDate(d.getDate() - i);
      const iso = d.toISOString().slice(0, 10);
      data.push({
        date: iso,
        label: d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
        amount: dailyMap.get(iso) || 0,
      });
    }

    return data;
  }, [sales, rangeDays]);

  const maxVal = useMemo(() => {
    const max = Math.max(...chartData.map((d) => d.amount), 0);
    return max > 0 ? max * 1.15 : 10000;
  }, [chartData]);

  const svgWidth = 640;
  const svgHeight = 240;
  const padLeft = 60;
  const padRight = 24;
  const padTop = 24;
  const padBottom = 38;
  const plotW = svgWidth - padLeft - padRight;
  const plotH = svgHeight - padTop - padBottom;

  const points = useMemo(() => {
    if (chartData.length === 0) return [];
    return chartData.map((d, i) => {
      const x = padLeft + (i / Math.max(chartData.length - 1, 1)) * plotW;
      const y = padTop + plotH - (d.amount / maxVal) * plotH;
      return { x, y, data: d, index: i };
    });
  }, [chartData, maxVal, plotW, plotH, padLeft, padTop]);

  const { linePath, areaPath } = useMemo(
    () => createAreaAndLinePath(points, svgHeight, padBottom),
    [points, svgHeight, padBottom]
  );

  const hasData = chartData.some((d) => d.amount > 0);

  return (
    <div className="ui-card chart-card">
      <div className="chart-header">
        <div>
          <div className="chart-title">
            <TrendingUp size={18} className="chart-icon-sales" />
            <span>Sales Revenue Trend</span>
          </div>
          <div className="chart-subtitle">Daily sales revenue timeline</div>
        </div>

        <div className="chart-toggle-group" role="group" aria-label="Timeline range">
          <button
            type="button"
            className={`chart-toggle-btn ${rangeDays === 7 ? 'active' : ''}`}
            onClick={() => setRangeDays(7)}
          >
            7 Days
          </button>
          <button
            type="button"
            className={`chart-toggle-btn ${rangeDays === 30 ? 'active' : ''}`}
            onClick={() => setRangeDays(30)}
          >
            30 Days
          </button>
        </div>
      </div>

      {!hasData ? (
        <div className="chart-empty-state">
          <BarChart3 size={32} className="chart-empty-icon" />
          <span>No sales recorded in the last {rangeDays} days</span>
        </div>
      ) : (
        <div className="chart-svg-container">
          <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="chart-svg">
            <defs>
              <linearGradient id="salesAreaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--accent-blue)" stopOpacity="0.32" />
                <stop offset="85%" stopColor="var(--accent-blue)" stopOpacity="0.02" />
                <stop offset="100%" stopColor="var(--accent-blue)" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Horizontal Grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
              const y = padTop + plotH * (1 - pct);
              const labelVal = Math.round(maxVal * pct);
              return (
                <g key={i}>
                  <line
                    x1={padLeft}
                    y1={y}
                    x2={svgWidth - padRight}
                    y2={y}
                    stroke="var(--border-color)"
                    strokeDasharray={i === 0 ? 'none' : '3 3'}
                    strokeWidth="1"
                    opacity="0.75"
                  />
                  <text
                    x={padLeft - 8}
                    y={y + 4}
                    textAnchor="end"
                    className="chart-axis-label tabular-nums"
                  >
                    ₹{labelVal >= 1000 ? `${Math.round(labelVal / 1000)}k` : labelVal}
                  </text>
                </g>
              );
            })}

            {/* Area and Line */}
            <path d={areaPath} fill="url(#salesAreaGradient)" className="chart-area-path" />
            <path
              d={linePath}
              fill="none"
              stroke="var(--accent-blue)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="chart-line-path"
            />

            {/* Data Points & Interactive hover targets */}
            {points.map((pt, i) => {
              const isHovered = hoveredIndex === i;
              const step = rangeDays === 30 ? 5 : 1;
              const showDateLabel = i % step === 0 || i === points.length - 1;

              return (
                <g key={i}>
                  {showDateLabel && (
                    <text
                      x={pt.x}
                      y={svgHeight - 12}
                      textAnchor="middle"
                      className="chart-axis-label"
                    >
                      {pt.data.label}
                    </text>
                  )}

                  {/* Interactive touch/hover zone */}
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={isHovered ? 6 : 4}
                    fill="var(--bg-card)"
                    stroke="var(--accent-blue)"
                    strokeWidth={isHovered ? 3 : 2}
                    className="chart-point"
                  />
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={18}
                    fill="transparent"
                    style={{ cursor: 'pointer' }}
                    onMouseEnter={() => setHoveredIndex(i)}
                    onMouseLeave={() => setHoveredIndex(null)}
                    onTouchStart={() => setHoveredIndex(i)}
                  />
                </g>
              );
            })}
          </svg>

          {/* Floating Tooltip */}
          {hoveredIndex !== null && points[hoveredIndex] && (
            <div
              className="chart-tooltip"
              style={{
                left: `${(points[hoveredIndex].x / svgWidth) * 100}%`,
                top: `${(points[hoveredIndex].y / svgHeight) * 100}%`,
              }}
            >
              <div className="chart-tooltip-date">
                {formatDate(points[hoveredIndex].data.date)}
              </div>
              <div className="chart-tooltip-value tabular-nums">
                {formatCurrency(points[hoveredIndex].data.amount)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
});

/**
 * 2. Expense Categories Donut Chart with Center Total
 */
const CATEGORY_COLORS = {
  'Stock/Purchase expenses': { color: '#3b82f6', label: 'Stock / Purchases' },
  'Supplier payments': { color: '#10b981', label: 'Supplier Payments' },
  Rent: { color: '#8b5cf6', label: 'Store Rent' },
  Bills: { color: '#f59e0b', label: 'Utility Bills' },
  'Other expenses': { color: '#f43f5e', label: 'Other Expenses' },
};

export const ExpenseCategoryDonutChart = memo(function ExpenseCategoryDonutChart({ expenses = [] }) {
  const [hoveredCat, setHoveredCat] = useState(null);

  const { breakdown, total } = useMemo(() => {
    if (!expenses || expenses.length === 0) return { breakdown: [], total: 0 };

    const totals = {
      'Stock/Purchase expenses': 0,
      'Supplier payments': 0,
      Rent: 0,
      Bills: 0,
      'Other expenses': 0,
    };

    let grandTotal = 0;
    expenses.forEach((e) => {
      const type = e.expense_type;
      const amt = Number(e.amount || 0);
      if (totals[type] !== undefined) {
        totals[type] += amt;
      } else {
        totals['Other expenses'] += amt;
      }
      grandTotal += amt;
    });

    const items = Object.entries(totals)
      .map(([cat, amt]) => {
        const conf = CATEGORY_COLORS[cat] || { color: '#64748b', label: cat };
        return {
          category: cat,
          label: conf.label,
          color: conf.color,
          amount: amt,
          percentage: grandTotal > 0 ? (amt / grandTotal) * 100 : 0,
        };
      })
      .filter((item) => item.amount > 0)
      .sort((a, b) => b.amount - a.amount);

    return { breakdown: items, total: grandTotal };
  }, [expenses]);

  const radius = 68;
  const strokeWidth = 24;
  const circumference = 2 * Math.PI * radius;

  // Compute strokeDasharray and offsets
  const slices = useMemo(() => {
    let accumulatedOffset = 0;
    return breakdown.map((item) => {
      const sliceLength = (item.percentage / 100) * circumference;
      const offset = accumulatedOffset;
      accumulatedOffset += sliceLength;
      return {
        ...item,
        strokeDasharray: `${Math.max(sliceLength - 2, 0)} ${circumference}`,
        strokeDashoffset: -offset,
      };
    });
  }, [breakdown, circumference]);

  return (
    <div className="ui-card chart-card">
      <div className="chart-header">
        <div>
          <div className="chart-title">
            <PieChart size={18} className="chart-icon-expense" />
            <span>Expense Distribution</span>
          </div>
          <div className="chart-subtitle">Breakdown across 5 approved categories</div>
        </div>
      </div>

      {total === 0 ? (
        <div className="chart-empty-state">
          <Receipt size={32} className="chart-empty-icon" />
          <span>No recorded expenses to visualize</span>
        </div>
      ) : (
        <div className="donut-chart-container">
          <div className="donut-svg-wrapper">
            <svg viewBox="0 0 200 200" className="donut-svg">
              <g transform="rotate(-90 100 100)">
                {slices.map((slice) => {
                  const isHovered = hoveredCat === slice.category;
                  return (
                    <circle
                      key={slice.category}
                      cx="100"
                      cy="100"
                      r={radius}
                      fill="transparent"
                      stroke={slice.color}
                      strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                      strokeDasharray={slice.strokeDasharray}
                      strokeDashoffset={slice.strokeDashoffset}
                      className="donut-slice"
                      onMouseEnter={() => setHoveredCat(slice.category)}
                      onMouseLeave={() => setHoveredCat(null)}
                    />
                  );
                })}
              </g>
            </svg>

            {/* Donut Center Display */}
            <div className="donut-center-info">
              <div className="donut-center-label">
                {hoveredCat ? hoveredCat.split(' ')[0] : 'TOTAL'}
              </div>
              <div className="donut-center-value tabular-nums">
                {formatCurrency(
                  hoveredCat
                    ? breakdown.find((b) => b.category === hoveredCat)?.amount || total
                    : total
                )}
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="donut-legend-grid">
            {breakdown.map((item) => {
              const isHovered = hoveredCat === item.category;
              return (
                <div
                  key={item.category}
                  className={`donut-legend-item ${isHovered ? 'hovered' : ''}`}
                  onMouseEnter={() => setHoveredCat(item.category)}
                  onMouseLeave={() => setHoveredCat(null)}
                >
                  <span className="donut-legend-color" style={{ backgroundColor: item.color }} />
                  <div className="donut-legend-info">
                    <div className="donut-legend-title">{item.label}</div>
                    <div className="donut-legend-numbers tabular-nums">
                      <span>{formatCurrency(item.amount)}</span>
                      <span className="donut-legend-pct">({item.percentage.toFixed(1)}%)</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
});

/**
 * 3. Daily Profit Bar Chart (Positive Green / Negative Red)
 */
export const DailyProfitBarChart = memo(function DailyProfitBarChart({
  sales = [],
  expenses = [],
}) {
  const [hoveredDay, setHoveredDay] = useState(null);

  // Compute daily net profit = daily sales - daily expenses for last 10 active days
  const dailyMetrics = useMemo(() => {
    const datesMap = new Map();

    sales.forEach((s) => {
      const d = s.entry_date || (s.created_at ? s.created_at.slice(0, 10) : '');
      if (!d) return;
      if (!datesMap.has(d)) datesMap.set(d, { sales: 0, expenses: 0 });
      datesMap.get(d).sales += Number(s.total_sales_amount || s.amount || 0);
    });

    expenses.forEach((e) => {
      const d = e.expense_date || (e.created_at ? e.created_at.slice(0, 10) : '');
      if (!d) return;
      if (!datesMap.has(d)) datesMap.set(d, { sales: 0, expenses: 0 });
      datesMap.get(d).expenses += Number(e.amount || 0);
    });

    const sortedDates = Array.from(datesMap.keys()).sort().slice(-10);

    return sortedDates.map((date) => {
      const entry = datesMap.get(date);
      const profit = entry.sales - entry.expenses;
      const d = new Date(date);
      return {
        date,
        label: d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
        sales: entry.sales,
        expenses: entry.expenses,
        profit,
        isPositive: profit >= 0,
      };
    });
  }, [sales, expenses]);

  const maxMagnitude = useMemo(() => {
    if (dailyMetrics.length === 0) return 10000;
    const max = Math.max(...dailyMetrics.map((d) => Math.abs(d.profit)), 0);
    return max > 0 ? max * 1.2 : 10000;
  }, [dailyMetrics]);

  const svgWidth = 600;
  const svgHeight = 220;
  const padLeft = 40;
  const padRight = 20;
  const padTop = 20;
  const padBottom = 32;
  const plotW = svgWidth - padLeft - padRight;
  const plotH = svgHeight - padTop - padBottom;
  const zeroY = padTop + plotH / 2;

  return (
    <div className="ui-card chart-card">
      <div className="chart-header">
        <div>
          <div className="chart-title">
            <Scale size={18} className="chart-icon-profit" />
            <span>Daily Net Profit Flow</span>
          </div>
          <div className="chart-subtitle">Profit = Daily Sales − Daily Expenses</div>
        </div>
      </div>

      {dailyMetrics.length === 0 ? (
        <div className="chart-empty-state">
          <Activity size={32} className="chart-empty-icon" />
          <span>No daily sales or expense entries to calculate profit</span>
        </div>
      ) : (
        <div className="chart-svg-container">
          <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="chart-svg">
            {/* Zero Baseline */}
            <line
              x1={padLeft}
              y1={zeroY}
              x2={svgWidth - padRight}
              y2={zeroY}
              stroke="var(--border-color)"
              strokeWidth="1.5"
            />
            <text
              x={padLeft - 6}
              y={zeroY + 4}
              textAnchor="end"
              className="chart-axis-label tabular-nums"
            >
              ₹0
            </text>

            {/* Profit & Loss Bars */}
            {dailyMetrics.map((item, idx) => {
              const colW = plotW / dailyMetrics.length;
              const barW = Math.min(Math.max(colW * 0.5, 14), 36);
              const barX = padLeft + idx * colW + (colW - barW) / 2;

              const barHeight = (Math.abs(item.profit) / maxMagnitude) * (plotH / 2);
              const barY = item.isPositive ? zeroY - barHeight : zeroY;
              const isHovered = hoveredDay === idx;

              return (
                <g key={item.date}>
                  {/* Date Label */}
                  <text
                    x={barX + barW / 2}
                    y={svgHeight - 10}
                    textAnchor="middle"
                    className="chart-axis-label"
                  >
                    {item.label}
                  </text>

                  {/* Profit Bar */}
                  <rect
                    x={barX}
                    y={barY}
                    width={barW}
                    height={Math.max(barHeight, 2)}
                    rx={3}
                    fill={item.isPositive ? 'var(--accent-green)' : 'var(--accent-red)'}
                    opacity={isHovered ? 1 : 0.85}
                    className="chart-bar"
                    onMouseEnter={() => setHoveredDay(idx)}
                    onMouseLeave={() => setHoveredDay(null)}
                    onTouchStart={() => setHoveredDay(idx)}
                  />
                </g>
              );
            })}
          </svg>

          {/* Floating Tooltip */}
          {hoveredDay !== null && dailyMetrics[hoveredDay] && (
            <div
              className="chart-tooltip"
              style={{
                left: `${
                  ((padLeft +
                    hoveredDay * (plotW / dailyMetrics.length) +
                    (plotW / dailyMetrics.length) / 2) /
                    svgWidth) *
                  100
                }%`,
                top: `${(zeroY / svgHeight) * 100}%`,
              }}
            >
              <div className="chart-tooltip-date">
                {formatDate(dailyMetrics[hoveredDay].date)}
              </div>
              <div
                className={`chart-tooltip-value tabular-nums ${
                  dailyMetrics[hoveredDay].isPositive ? 'text-green' : 'text-red'
                }`}
              >
                Net: {formatCurrency(dailyMetrics[hoveredDay].profit)}
              </div>
              <div className="chart-tooltip-meta">
                <span>Sales: {formatCurrency(dailyMetrics[hoveredDay].sales)}</span>
                <span>Exp: {formatCurrency(dailyMetrics[hoveredDay].expenses)}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
});

/**
 * Main Combined Lazy-Loaded Charts Component
 */
export default function DashboardCharts({ sales = [], expenses = [] }) {
  return (
    <div className="dashboard-charts-grid">
      <div className="chart-grid-col-wide">
        <SalesTrendChart sales={sales} />
      </div>
      <div className="chart-grid-col-half">
        <ExpenseCategoryDonutChart expenses={expenses} />
      </div>
      <div className="chart-grid-col-half">
        <DailyProfitBarChart sales={sales} expenses={expenses} />
      </div>
    </div>
  );
}
