import { getTodaySales, getMonthlyTotalSales, getTodayDateString } from './salesService.js';
import { getTodayExpensesTotal, getMonthlyTotalExpenses } from './expenseService.js';
import { getTotalStockSummary, getAllVarieties } from './stockService.js';
import { getTotalLenderSummary } from './lenderService.js';

// Helper to get local YYYY-MM
export function getCurrentMonthString() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Calculate Today's financial metrics
 * Formula: Today's Net Amount = Today's Sales - Today's Expenses
 */
export function calculateTodayMetrics(customDate = null, userId = 1) {
  const targetDate = customDate || getTodayDateString();
  const uid = Number(userId || 1);

  const salesInfo = getTodaySales(targetDate, uid);
  const expensesInfo = getTodayExpensesTotal(targetDate, uid);

  const todaySales = salesInfo.total_sales_amount;
  const todayExpenses = expensesInfo.today_expenses;
  const todayNetAmount = todaySales - todayExpenses;

  return {
    date: targetDate,
    today_sales: todaySales,
    today_expenses: todayExpenses,
    today_net_amount: todayNetAmount,
    is_surplus: todayNetAmount >= 0,
  };
}

/**
 * Calculate Monthly financial metrics
 * Formula:
 * - Monthly Turnover = Monthly Total Sales
 * - Monthly Net Balance = Monthly Total Sales - Monthly Total Expenses
 */
export function calculateMonthlyMetrics(customMonth = null, userId = 1) {
  const targetMonth = customMonth || getCurrentMonthString();
  const uid = Number(userId || 1);

  const salesData = getMonthlyTotalSales(targetMonth, uid);
  const expensesData = getMonthlyTotalExpenses(targetMonth, uid);

  const monthlySales = salesData.monthly_sales;
  const monthlyExpenses = expensesData.monthly_expenses;

  // Monthly Turnover equals total gross sales in Version 1
  const monthlyTurnover = monthlySales;
  const monthlyNetBalance = monthlySales - monthlyExpenses;

  return {
    month: targetMonth,
    monthly_sales: monthlySales,
    monthly_expenses: monthlyExpenses,
    monthly_turnover: monthlyTurnover,
    monthly_net_balance: monthlyNetBalance,
    is_surplus: monthlyNetBalance >= 0,
    expense_breakdown: expensesData.breakdown,
  };
}

/**
 * Calculate complete Master Dashboard summary
 * Incorporates all 9 core dashboard KPIs:
 * 1. Today's Sales
 * 2. Today's Expenses
 * 3. Today's Net Amount
 * 4. Current Stock
 * 5. Monthly Sales
 * 6. Monthly Expenses
 * 7. Monthly Turnover
 * 8. Monthly Net Balance
 * 9. Total Lender Due
 */
export function getDashboardSummary({ date = null, month = null, userId = 1 } = {}) {
  const targetDate = date || getTodayDateString();
  const targetMonth = month || targetDate.substring(0, 7);
  const uid = Number(userId || 1);

  const todayMetrics = calculateTodayMetrics(targetDate, uid);
  const monthlyMetrics = calculateMonthlyMetrics(targetMonth, uid);
  const stockSummary = getTotalStockSummary(uid);
  const lenderSummary = getTotalLenderSummary(uid);

  return {
    date: targetDate,
    month: targetMonth,

    // Today Block
    today_sales: todayMetrics.today_sales,
    today_expenses: todayMetrics.today_expenses,
    today_net_amount: todayMetrics.today_net_amount,

    // Monthly Block
    monthly_sales: monthlyMetrics.monthly_sales,
    monthly_expenses: monthlyMetrics.monthly_expenses,
    monthly_turnover: monthlyMetrics.monthly_turnover,
    monthly_net_balance: monthlyMetrics.monthly_net_balance,

    // Stock Block
    current_stock: stockSummary.current_stock,
    stock_total_in: stockSummary.total_in,
    stock_total_out: stockSummary.total_out,
    total_varieties: stockSummary.total_varieties,

    // Lender Block
    total_lender_due: lenderSummary.total_lender_due,
    total_lender_given: lenderSummary.total_amount_given,
    total_lender_paid: lenderSummary.total_amount_paid,
    total_lenders: lenderSummary.total_lenders,

    // Timestamp
    calculated_at: new Date().toISOString(),
  };
}
