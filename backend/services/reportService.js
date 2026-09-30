import { getSalesHistory, getMonthlyTotalSales } from './salesService.js';
import { getExpenses, getMonthlyTotalExpenses } from './expenseService.js';
import { getAllVarieties, getStockHistory, getTotalStockSummary } from './stockService.js';
import { getAllLenders, getTotalLenderSummary } from './lenderService.js';
import { calculateMonthlyMetrics } from './calculationService.js';

/**
 * Generate complete business data report for a specific calendar month (YYYY-MM)
 */
export function generateMonthlyReportData(yearMonth, userId = 1) {
  if (!yearMonth || !/^\d{4}-\d{2}$/.test(yearMonth)) {
    throw new Error('Valid month in YYYY-MM format is required.');
  }

  const uid = Number(userId || 1);

  // 1. Sales
  const salesHistory = getSalesHistory({ month: yearMonth, userId: uid });
  const salesSummary = getMonthlyTotalSales(yearMonth, uid);

  // 2. Expenses
  const expensesHistory = getExpenses({ month: yearMonth, userId: uid });
  const expensesSummary = getMonthlyTotalExpenses(yearMonth, uid);

  // 3. Stock
  const [yearStr, monthStr] = yearMonth.split('-');
  const lastDay = new Date(Number(yearStr), Number(monthStr), 0).getDate();
  const stockVarieties = getAllVarieties(uid);
  const stockMovements = getStockHistory({
    startDate: `${yearMonth}-01`,
    endDate: `${yearMonth}-${String(lastDay).padStart(2, '0')}`,
    userId: uid,
  });
  const stockSummary = getTotalStockSummary(uid);

  // 4. Supplier Payments (Filtered expenses where expense_type = 'Supplier payments')
  const supplierPayments = expensesHistory.filter(
    (e) => e.expense_type === 'Supplier payments'
  );
  const totalSupplierPayments = supplierPayments.reduce(
    (acc, curr) => acc + Number(curr.amount || 0),
    0
  );

  // 5. Lenders
  const lendersList = getAllLenders(uid);
  const lendersSummary = getTotalLenderSummary(uid);

  // 6. Calculations
  const monthlyCalc = calculateMonthlyMetrics(yearMonth, uid);

  return {
    report_title: `Monthly Business & Accounting Report — ${yearMonth}`,
    month: yearMonth,
    generated_at: new Date().toISOString(),

    // Section 1: Sales
    sales: {
      monthly_total_sales: salesSummary.monthly_sales,
      entries_count: salesHistory.length,
      records: salesHistory.map((s) => ({
        date: s.entry_date,
        daily_total_sales: s.total_sales_amount,
      })),
    },

    // Section 2: Expenses
    expenses: {
      monthly_total_expenses: expensesSummary.monthly_expenses,
      breakdown: expensesSummary.breakdown,
      entries_count: expensesHistory.length,
      records: expensesHistory.map((e) => ({
        id: e.id,
        date: e.expense_date,
        category: e.expense_type,
        amount: e.amount,
        description: e.description || '',
      })),
    },

    // Section 3: Stock
    stock: {
      total_in: stockSummary.total_in,
      total_out: stockSummary.total_out,
      current_stock: stockSummary.current_stock,
      varieties: stockVarieties.map((v) => ({
        id: v.id,
        product_variety: v.name,
        total_in: v.total_in,
        total_out: v.total_out,
        current_stock: v.current_stock,
      })),
      monthly_movements: stockMovements.map((m) => ({
        date: m.entry_date,
        product_variety: m.product_name,
        movement_type: m.movement_type,
        quantity: m.quantity,
        notes: m.notes || '',
      })),
    },

    // Section 4: Supplier Payments
    supplier_payments: {
      monthly_supplier_payment_total: totalSupplierPayments,
      count: supplierPayments.length,
      records: supplierPayments.map((p) => ({
        date: p.expense_date,
        supplier_description: p.description || 'Supplier payment',
        amount: p.amount,
      })),
    },

    // Section 5: Lenders
    lenders: {
      total_amount_given: lendersSummary.total_amount_given,
      total_amount_paid: lendersSummary.total_amount_paid,
      total_lender_due: lendersSummary.total_lender_due,
      summary: lendersSummary,
      active_lenders_count: lendersList.filter((l) => Number(l.balance || 0) > 0).length,
      records: lendersList.map((l) => ({
        id: l.id,
        name: l.name,
        mobile: l.mobile,
        place: l.place,
        amount_given: l.amount_given,
        amount_paid: l.amount_paid,
        remaining_due: l.balance,
        balance: l.balance,
      })),
    },

    // Section 6: Calculations
    calculations: {
      monthly_sales: monthlyCalc.monthly_sales,
      monthly_total_sales: monthlyCalc.monthly_sales,
      monthly_expenses: monthlyCalc.monthly_expenses,
      monthly_total_expenses: monthlyCalc.monthly_expenses,
      monthly_turnover: monthlyCalc.monthly_turnover,
      monthly_net_balance: monthlyCalc.monthly_net_balance,
      total_lender_due: lendersSummary.total_lender_due,
      current_stock: stockSummary.current_stock,
      is_surplus: monthlyCalc.is_surplus,
    },
  };
}

/**
 * Format the monthly report data as clean CSV text
 */
export function formatReportAsCsv(reportData) {
  const lines = [];

  lines.push(`MONTHLY BUSINESS REPORT - ${reportData.month}`);
  lines.push(`Generated: ${reportData.generated_at}`);
  lines.push('');

  // 1. CALCULATIONS SUMMARY
  lines.push('=== EXECUTIVE SUMMARY & CALCULATIONS ===');
  lines.push('Metric,Amount (INR)');
  lines.push(`Monthly Total Sales,${reportData.calculations.monthly_sales}`);
  lines.push(`Monthly Total Expenses,${reportData.calculations.monthly_expenses}`);
  lines.push(`Monthly Turnover,${reportData.calculations.monthly_turnover}`);
  lines.push(`Monthly Net Balance,${reportData.calculations.monthly_net_balance}`);
  lines.push(`Total Lender Due,${reportData.calculations.total_lender_due}`);
  lines.push(`Current Stock (units),${reportData.calculations.current_stock}`);
  lines.push('');

  // 2. DAILY SALES
  lines.push('=== SALES LEDGER ===');
  lines.push('Date,Daily Total Sales (INR)');
  reportData.sales.records.forEach((s) => {
    lines.push(`${s.date},${s.daily_total_sales}`);
  });
  lines.push(`Total Sales,${reportData.sales.monthly_total_sales}`);
  lines.push('');

  // 3. EXPENSES
  lines.push('=== EXPENSES LEDGER ===');
  lines.push('Date,Expense Category,Amount (INR),Description');
  reportData.expenses.records.forEach((e) => {
    const cleanDesc = `"${(e.description || '').replace(/"/g, '""')}"`;
    lines.push(`${e.date},${e.category},${e.amount},${cleanDesc}`);
  });
  lines.push(`Total Expenses,,${reportData.expenses.monthly_total_expenses},`);
  lines.push('');

  // 4. SUPPLIER PAYMENTS
  lines.push('=== SUPPLIER PAYMENTS ===');
  lines.push('Date,Description,Amount (INR)');
  reportData.supplier_payments.records.forEach((p) => {
    const cleanDesc = `"${(p.supplier_description || '').replace(/"/g, '""')}"`;
    lines.push(`${p.date},${cleanDesc},${p.amount}`);
  });
  lines.push(`Total Supplier Payments,,${reportData.supplier_payments.monthly_supplier_payment_total}`);
  lines.push('');

  // 5. STOCK VARIETIES & MOVEMENTS
  lines.push('=== STOCK CATALOG & CURRENT INVENTORY ===');
  lines.push('Product Variety,Total IN,Total OUT,Current Stock');
  reportData.stock.varieties.forEach((v) => {
    lines.push(`"${v.product_variety}",${v.total_in},${v.total_out},${v.current_stock}`);
  });
  lines.push(`Overall Stock,, ,${reportData.stock.current_stock}`);
  lines.push('');

  lines.push('=== STOCK MOVEMENTS (THIS MONTH) ===');
  lines.push('Date,Product Variety,Type,Quantity,Notes');
  reportData.stock.monthly_movements.forEach((m) => {
    const cleanNotes = `"${(m.notes || '').replace(/"/g, '""')}"`;
    lines.push(`${m.date},"${m.product_variety}",${m.movement_type},${m.quantity},${cleanNotes}`);
  });
  lines.push('');

  // 6. LENDERS
  lines.push('=== LENDER ACCOUNTS & CREDIT DUES ===');
  lines.push('Lender Name,Mobile,Place,Amount Given (INR),Amount Paid (INR),Balance Due (INR)');
  reportData.lenders.records.forEach((l) => {
    lines.push(`"${l.name}",${l.mobile},"${l.place}",${l.amount_given},${l.amount_paid},${l.balance}`);
  });
  lines.push(`Total Dues,,,${reportData.lenders.total_amount_given},${reportData.lenders.total_amount_paid},${reportData.lenders.total_lender_due}`);

  return lines.join('\n');
}
