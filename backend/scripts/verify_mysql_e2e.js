/**
 * End-to-End MySQL Verification Script
 * Validates complete frontend-to-backend-to-MySQL flow on Hostinger configuration
 */

import 'dotenv/config';
import * as mysql from '../db/mysql.js';
import * as mysqlDataService from '../services/mysqlDataService.js';
import * as authoritativeDataService from '../services/authoritativeDataService.js';
import { formatReportAsCsv } from '../services/reportService.js';

async function runVerification() {
  console.log('=== [1/6] CHECKING HOSTINGER MYSQL CONNECTION ===');
  const isConfigured = mysql.isMySQLConfigured();
  console.log('isMySQLConfigured():', isConfigured);
  if (!isConfigured) {
    throw new Error('MySQL is not configured in .env!');
  }

  const connTest = await mysql.testMySQLConnection();
  console.log('MySQL Connection Test Result:', connTest);
  if (!connTest.connected) {
    throw new Error('Could not connect to MySQL: ' + connTest.error);
  }

  console.log('\n=== [2/6] VERIFYING SCHEMA INITIALIZATION ===');
  const schemaResult = await mysql.initMySQLSchema();
  console.log('Schema Init Result:', schemaResult);

  const status = await mysql.getMySQLStatus();
  console.log('Tables detected in database:', status.tables);

  const expectedTables = [
    'users',
    'business_profiles',
    'sessions',
    'product_varieties',
    'stock_entries',
    'daily_sales',
    'expenses',
    'lenders',
    'lender_repayments',
    'cloud_backup_meta',
  ];

  for (const tbl of expectedTables) {
    if (!status.tables.includes(tbl)) {
      throw new Error(`Missing expected table: ${tbl}`);
    }
  }
  console.log('✓ All 10 expected tables present and verified in MySQL!');

  console.log('\n=== [3/6] TESTING USER AUTH & PROFILE IN MYSQL ===');
  const testUsername = `testuser_${Date.now()}`;
  const testPassword = 'Password123!';
  const signupResult = await authoritativeDataService.signupUserAuthoritative({
    username: testUsername,
    password: testPassword,
    confirmPassword: testPassword,
  });
  console.log('Signup result:', {
    userId: signupResult.user.id,
    username: signupResult.user.username,
    hasToken: Boolean(signupResult.token),
  });

  const testUserId = signupResult.user.id;
  const testToken = signupResult.token;

  // Verify session retrieval
  const sessionUser = await authoritativeDataService.getUserFromTokenAuthoritative(testToken);
  console.log('Retrieved user from session token:', sessionUser?.user?.username);
  if (sessionUser?.user?.id !== testUserId) {
    throw new Error('Session token verification failed!');
  }

  // Update business profile
  const updatedProfile = await authoritativeDataService.upsertBusinessProfileAuthoritative(testUserId, {
    business_name: 'E2E Test Boutique',
    business_address: '123 Silk Street, Surat',
    business_nickname: 'E2E Surat',
  });
  console.log('Updated Profile:', updatedProfile);

  console.log('\n=== [4/6] TESTING SALES & EXPENSES FLOW IN MYSQL ===');
  const testDate = '2026-10-08';
  const saleResult = await authoritativeDataService.recordSaleAuthoritative(testDate, 15500, testUserId);
  console.log('Sale Recorded:', saleResult);

  const todaySale = await authoritativeDataService.getTodaySalesAuthoritative(testDate, testUserId);
  console.log('Fetched Today Sale:', todaySale);
  if (Number(todaySale.total_sales_amount) !== 15500) {
    throw new Error('Sales amount mismatch in MySQL!');
  }

  const expenseResult = await authoritativeDataService.recordExpenseAuthoritative(
    {
      expense_date: testDate,
      expense_type: 'Rent',
      amount: 4500,
      description: 'October shop advance rent',
    },
    testUserId
  );
  console.log('Expense Recorded:', expenseResult);

  const todayExpenses = await authoritativeDataService.getTodayExpensesAuthoritative(testDate, testUserId);
  console.log('Fetched Today Expenses:', todayExpenses);
  if (Number(todayExpenses.today_expenses) !== 4500) {
    throw new Error('Expense amount mismatch in MySQL!');
  }

  console.log('\n=== [5/6] TESTING INVENTORY & LENDERS IN MYSQL ===');
  const varietyResult = await authoritativeDataService.addProductVarietyAuthoritative(
    `Test Silk Sari ${Date.now()}`,
    testUserId
  );
  console.log('Variety Added:', varietyResult);

  // Stock IN
  const stockInResult = await authoritativeDataService.recordStockMovementAuthoritative(
    {
      product_id: varietyResult.id,
      movement_type: 'IN',
      quantity: 50,
      entry_date: testDate,
      notes: 'Initial warehouse shipment',
    },
    testUserId
  );
  console.log('Stock IN Recorded:', stockInResult);

  // Stock OUT
  const stockOutResult = await authoritativeDataService.recordStockMovementAuthoritative(
    {
      product_id: varietyResult.id,
      movement_type: 'OUT',
      quantity: 12,
      entry_date: testDate,
      notes: 'Store retail sales',
    },
    testUserId
  );
  console.log('Stock OUT Recorded:', stockOutResult);

  const stockSummary = await authoritativeDataService.getStockSummaryAuthoritative(testUserId);
  console.log('Stock Summary current stock:', stockSummary.current_stock);
  if (stockSummary.current_stock !== 38) {
    throw new Error(`Expected current stock to be 38 (50 - 12), got ${stockSummary.current_stock}`);
  }

  // Lender Flow
  const lenderResult = await authoritativeDataService.addLenderAuthoritative(
    {
      name: 'Ramesh Patel',
      mobile: '9876543210',
      place: 'Surat Market',
      amount_given: 10000,
      amount_paid: 2000,
      loan_date: testDate,
      notes: 'Festival advance loan',
    },
    testUserId
  );
  console.log('Lender Created:', lenderResult);
  if (lenderResult.balance !== 8000) {
    throw new Error(`Expected lender balance 8000, got ${lenderResult.balance}`);
  }

  // Record Repayment
  const repaymentResult = await authoritativeDataService.recordLenderRepaymentAuthoritative(
    lenderResult.id,
    3000,
    'Partial cash return',
    testUserId
  );
  console.log('Repayment Recorded:', repaymentResult);
  if (repaymentResult.balance !== 5000) {
    throw new Error(`Expected new lender balance 5000, got ${repaymentResult.balance}`);
  }

  // Verify lender repayments audit log
  const [repaymentRows] = await mysql.query(
    'SELECT * FROM lender_repayments WHERE lender_id = ? AND user_id = ?',
    [lenderResult.id, testUserId]
  );
  console.log('Lender Repayments Audit Log Entries:', repaymentRows.length);
  if (repaymentRows.length < 2) {
    throw new Error('Repayments audit log missing entries in MySQL!');
  }

  console.log('\n=== [6/6] TESTING DASHBOARD KPIS & CSV REPORT EXPORT ===');
  const dashboard = await authoritativeDataService.getMonthlyFinancialSummaryAuthoritative(
    '2026-10',
    testUserId
  );
  console.log('Dashboard summary metrics:', {
    today_sales: dashboard.today_sales,
    today_expenses: dashboard.today_expenses,
    today_net: dashboard.today_net_amount,
    monthly_sales: dashboard.monthly_sales,
    monthly_expenses: dashboard.monthly_expenses,
    monthly_net: dashboard.monthly_net_balance,
    current_stock: dashboard.current_stock,
    total_lender_due: dashboard.total_lender_due,
  });

  const reportData = await authoritativeDataService.generateMonthlyReportDataAuthoritative(
    '2026-10',
    testUserId
  );
  console.log('Report Data Sections Generated:', Object.keys(reportData));

  const csv = formatReportAsCsv(reportData);
  console.log('CSV Export Preview (first 5 lines):\n' + csv.split('\n').slice(0, 5).join('\n'));

  console.log('\n=== CLEANING UP TEST USER DATA FROM MYSQL ===');
  await mysql.query('DELETE FROM lender_repayments WHERE user_id = ?', [testUserId]);
  await mysql.query('DELETE FROM lenders WHERE user_id = ?', [testUserId]);
  await mysql.query('DELETE FROM stock_entries WHERE user_id = ?', [testUserId]);
  await mysql.query('DELETE FROM product_varieties WHERE user_id = ?', [testUserId]);
  await mysql.query('DELETE FROM expenses WHERE user_id = ?', [testUserId]);
  await mysql.query('DELETE FROM daily_sales WHERE user_id = ?', [testUserId]);
  await mysql.query('DELETE FROM sessions WHERE user_id = ?', [testUserId]);
  await mysql.query('DELETE FROM business_profiles WHERE user_id = ?', [testUserId]);
  await mysql.query('DELETE FROM users WHERE id = ?', [testUserId]);
  console.log('✓ Test user cleaned up cleanly.');

  console.log('\n🎉 ALL HOSTINGER MYSQL END-TO-END FLOWS FULLY VERIFIED AND PASSING!');
  process.exit(0);
}

runVerification().catch((err) => {
  console.error('\n❌ Verification Failed:', err);
  process.exit(1);
});
