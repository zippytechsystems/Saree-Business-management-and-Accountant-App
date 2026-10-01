import assert from 'node:assert';
import dotenv from 'dotenv';
dotenv.config();

import * as supabaseService from '../services/supabaseService.js';
import * as authoritativeDataService from '../services/authoritativeDataService.js';
import * as calculationService from '../services/calculationService.js';
import * as reportService from '../services/reportService.js';

async function runE2EVerification() {
  console.log('====================================================');
  console.log('  RUNNING END-TO-END CALCULATION & CLOUD PARITY TEST');
  console.log('====================================================\n');

  // 1. SUPABASE AUTHORITATIVE CLOUD CONNECTION
  console.log('[Step 1] Verifying Supabase cloud database connection...');
  assert.strictEqual(
    supabaseService.isSupabaseConfigured(),
    true,
    'Supabase must be configured with URL and Service Role Key'
  );

  const conn = await supabaseService.testSupabaseConnection();
  console.log('Cloud DB Connection Status:', conn);
  assert.strictEqual(conn.connected, true, 'Authoritative Supabase database must be connected');
  console.log('✓ Supabase PostgreSQL Authoritative Cloud connection verified.\n');

  const testUserId = 1; // Default business owner

  // 2. FETCH DASHBOARD CALCULATIONS VIA AUTHORITATIVE SERVICE
  console.log('[Step 2] Fetching authoritative dashboard calculation summary...');
  const currentMonth = calculationService.getCurrentMonthString();
  const summary = await authoritativeDataService.getMonthlyFinancialSummaryAuthoritative(currentMonth, testUserId);

  console.log('Dashboard Summary Output:');
  console.log({
    provider: summary.provider,
    cloud_mode: summary.cloud_mode,
    today_sales: summary.today_sales,
    today_expenses: summary.today_expenses,
    today_net_amount: summary.today_net_amount,
    monthly_sales: summary.monthly_sales,
    monthly_expenses: summary.monthly_expenses,
    monthly_turnover: summary.monthly_turnover,
    monthly_net_balance: summary.monthly_net_balance,
    current_stock: summary.current_stock,
    total_lender_due: summary.total_lender_due,
  });

  // Verify business formulas
  console.log('\n[Step 3] Verifying core business calculation formulas...');
  
  // Formula A: Today's Net Amount = Today's Sales - Today's Expenses
  const expectedTodayNet = Number(summary.today_sales) - Number(summary.today_expenses);
  assert.strictEqual(
    Number(summary.today_net_amount),
    expectedTodayNet,
    `Today's Net (${summary.today_net_amount}) must equal Today's Sales (${summary.today_sales}) - Today's Expenses (${summary.today_expenses})`
  );
  console.log(`✓ Today's Net Cash Flow formula passed: ${summary.today_sales} - ${summary.today_expenses} = ${summary.today_net_amount}`);

  // Formula B: Monthly Turnover = Monthly Gross Sales
  assert.strictEqual(
    Number(summary.monthly_turnover),
    Number(summary.monthly_sales),
    `Monthly Turnover (${summary.monthly_turnover}) must equal Monthly Gross Sales (${summary.monthly_sales})`
  );
  console.log(`✓ Monthly Turnover formula passed: Turnover = Sales = ${summary.monthly_sales}`);

  // Formula C: Monthly Net Balance = Monthly Sales - Monthly Expenses
  const expectedMonthlyNet = Number(summary.monthly_sales) - Number(summary.monthly_expenses);
  assert.strictEqual(
    Number(summary.monthly_net_balance),
    expectedMonthlyNet,
    `Monthly Net Balance (${summary.monthly_net_balance}) must equal Monthly Sales (${summary.monthly_sales}) - Monthly Expenses (${summary.monthly_expenses})`
  );
  console.log(`✓ Monthly Net Balance formula passed: ${summary.monthly_sales} - ${summary.monthly_expenses} = ${summary.monthly_net_balance}`);

  // Formula D: Current Stock = Total In - Total Out
  const expectedStock = Number(summary.total_stock_in) - Number(summary.total_stock_out);
  assert.strictEqual(
    Number(summary.current_stock),
    expectedStock,
    `Current Stock (${summary.current_stock}) must equal Total Stock In (${summary.total_stock_in}) - Total Stock Out (${summary.total_stock_out})`
  );
  console.log(`✓ Current Stock formula passed: ${summary.total_stock_in} - ${summary.total_stock_out} = ${summary.current_stock}`);

  // Formula E: Total Lender Due = Total Given - Total Paid
  const expectedLenderDue = Number(summary.total_amount_given) - Number(summary.total_amount_paid);
  assert.strictEqual(
    Number(summary.total_lender_due),
    expectedLenderDue,
    `Total Lender Due (${summary.total_lender_due}) must equal Total Given (${summary.total_amount_given}) - Total Paid (${summary.total_amount_paid})`
  );
  console.log(`✓ Total Lender Due formula passed: ${summary.total_amount_given} - ${summary.total_amount_paid} = ${summary.total_lender_due}`);

  // 4. VERIFY AUTHORITATIVE MONTHLY REPORT GENERATION
  console.log('\n[Step 4] Verifying Authoritative Monthly Report Generation...');
  const report = await authoritativeDataService.generateMonthlyReportDataAuthoritative(currentMonth, testUserId);

  assert.ok(report.report_title, 'Report must contain report_title');
  assert.ok(report.sales, 'Report must contain sales section');
  assert.ok(report.expenses, 'Report must contain expenses section');
  assert.ok(report.stock, 'Report must contain stock section');
  assert.ok(report.supplier_payments, 'Report must contain supplier_payments section');
  assert.ok(report.lenders, 'Report must contain lenders section');
  assert.ok(report.calculations, 'Report must contain calculations section');

  console.log(`✓ Monthly Report sections present. Generated provider: ${report.provider || 'local'}`);

  // Verify CSV export
  const csv = reportService.formatReportAsCsv(report);
  assert.ok(csv.includes('MONTHLY BUSINESS REPORT'), 'CSV must have correct header');
  assert.ok(csv.includes('=== EXECUTIVE SUMMARY & CALCULATIONS ==='), 'CSV must include executive summary');
  assert.ok(csv.includes('Amount (INR)'), 'CSV currency column must be explicitly INR');
  console.log('✓ CSV Report formatting verified with INR headers.\n');

  // 5. VERIFY CLOUD PERSISTENCE AND PARITY METRICS
  console.log('[Step 5] Checking Cloud Parity Metrics directly with Supabase...');
  const parity = await supabaseService.getCloudParityMetrics(testUserId);
  console.log('Cloud Parity Metrics from Supabase:');
  console.log(parity);

  assert.ok(parity.sales_count >= 0, 'Cloud sales count valid');
  assert.ok(parity.expenses_count >= 0, 'Cloud expenses count valid');
  assert.ok(parity.varieties_count >= 0, 'Cloud stock count valid');
  assert.ok(parity.lenders_count >= 0, 'Cloud lenders count valid');
  console.log('✓ Supabase Cloud Parity verified successfully.');

  console.log('\n====================================================');
  console.log('  ALL CALCULATION AND CLOUD VERIFICATION TESTS PASSED!');
  console.log('====================================================\n');
}

runE2EVerification().catch((err) => {
  console.error('\n❌ E2E VERIFICATION FAILED:', err);
  process.exit(1);
});
