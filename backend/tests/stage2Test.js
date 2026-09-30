import db from '../db/database.js';

// Stage 2 Automated Comprehensive Test Suite
const BASE_URL = 'http://localhost:5000/api';

let passed = 0;
let failed = 0;

function assert(condition, testName) {
  if (condition) {
    console.log(`  [PASS] ${testName}`);
    passed++;
  } else {
    console.error(`  [FAIL] ${testName}`);
    failed++;
  }
}

async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const response = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  const data = await response.json();
  return { status: response.status, data };
}

async function runTests() {
  console.log('========================================================');
  console.log('STAGE 2 — AUTOMATED VERIFICATION SUITE');
  console.log('========================================================\n');

  // Test 0: Health Check
  console.log('0. Health Check & Schema Verification:');
  const health = await request('/health');
  assert(health.status === 200, 'Health endpoint responds 200');
  assert(
    health.data.database.tables.length >= 5 &&
    ['daily_sales', 'expenses', 'product_varieties', 'stock_entries', 'lenders'].every((t) =>
      health.data.database.tables.includes(t)
    ),
    'All 5 approved tables present in SQLite'
  );

  // Use isolated test date so tests are 100% deterministic & idempotent
  const runId = Date.now();
  const TEST_DATE = '2025-05-15';
  const YESTERDAY = '2025-05-14';
  const TEST_MONTH = '2025-05';

  // Clean previous test runs for this specific test date
  db.prepare('DELETE FROM expenses WHERE expense_date = ?').run(TEST_DATE);
  db.prepare('DELETE FROM daily_sales WHERE entry_date IN (?, ?)').run(TEST_DATE, YESTERDAY);

  // Test 1: Daily Sales
  console.log('\n1. Daily Sales Tests:');
  // 1a. Add sales
  const addSales1 = await request('/sales', {
    method: 'POST',
    body: JSON.stringify({ entry_date: TEST_DATE, total_sales_amount: 25000 }),
  });
  assert(addSales1.status === 200, `Add daily sales ${TEST_DATE} (₹25,000) returns 200`);
  assert(addSales1.data.data.total_sales_amount === 25000, 'Recorded sales amount is ₹25,000');

  // 1b. Update sales for same date (prevent duplicate; update instead)
  const updateSales = await request('/sales', {
    method: 'POST',
    body: JSON.stringify({ entry_date: TEST_DATE, total_sales_amount: 30000 }),
  });
  assert(updateSales.status === 200, 'Update daily sales on same date returns 200');
  assert(updateSales.data.data.total_sales_amount === 30000, 'Updated sales amount is now ₹30,000');
  assert(updateSales.data.data.is_updated === true, 'Flagged as update (prevented duplicate)');

  // 1c. Add sales for yesterday
  const addSalesYesterday = await request('/sales', {
    method: 'POST',
    body: JSON.stringify({ entry_date: YESTERDAY, total_sales_amount: 15000 }),
  });
  assert(addSalesYesterday.status === 200, `Add sales for ${YESTERDAY} (₹15,000)`);

  // 1d. Retrieve today's sales
  const todaySales = await request(`/sales/today?date=${TEST_DATE}`);
  assert(todaySales.data.data.total_sales_amount === 30000, `Retrieve sales for ${TEST_DATE} returns ₹30,000`);

  // 1e. Retrieve sales history
  const salesHistory = await request(`/sales?month=${TEST_MONTH}`);
  assert(salesHistory.data.count >= 2, `Sales history returns records for ${TEST_MONTH}`);

  // 1f. Monthly total sales
  const monthlySales = await request(`/sales/monthly?month=${TEST_MONTH}`);
  assert(monthlySales.data.data.monthly_sales >= 45000, 'Monthly total sales calculates correctly (>= ₹45,000)');

  // 1g. Sales validation: negative amount
  const negSales = await request('/sales', {
    method: 'POST',
    body: JSON.stringify({ entry_date: TEST_DATE, total_sales_amount: -500 }),
  });
  assert(negSales.status === 400, 'Rejects negative sales amount with 400');

  // 1h. Sales validation: invalid date
  const invDateSales = await request('/sales', {
    method: 'POST',
    body: JSON.stringify({ entry_date: 'invalid-date', total_sales_amount: 1000 }),
  });
  assert(invDateSales.status === 400, 'Rejects invalid date with 400');

  // Test 2: Daily Expenses
  console.log('\n2. Daily Expenses Tests:');
  // 2a. Add Bills expense
  const exp1 = await request('/expenses', {
    method: 'POST',
    body: JSON.stringify({
      expense_date: TEST_DATE,
      expense_type: 'Bills',
      amount: 1200,
      description: 'Electricity bill',
    }),
  });
  assert(exp1.status === 201, 'Add Bills expense (₹1,200) returns 201');
  const exp1Id = exp1.data.data.id;

  // 2b. Add Rent expense
  const exp2 = await request('/expenses', {
    method: 'POST',
    body: JSON.stringify({
      expense_date: TEST_DATE,
      expense_type: 'Rent',
      amount: 8000,
      description: 'Shop rent advance',
    }),
  });
  assert(exp2.status === 201, 'Add Rent expense (₹8,000)');

  // 2c. Add Supplier payment (included in expenses)
  const exp3 = await request('/expenses', {
    method: 'POST',
    body: JSON.stringify({
      expense_date: TEST_DATE,
      expense_type: 'Supplier payments',
      amount: 5000,
      description: 'Payment to Surat Textile Mills',
    }),
  });
  assert(exp3.status === 201, 'Add Supplier payment expense (₹5,000)');

  // 2d. Read expenses & filter by category
  const supplierExpenses = await request('/expenses?category=Supplier%20payments');
  assert(supplierExpenses.data.data.some((e) => e.description.includes('Surat Textile Mills')), 'Filter expenses by Supplier payments');

  // 2e. Update expense
  const updatedExp = await request(`/expenses/${exp1Id}`, {
    method: 'PUT',
    body: JSON.stringify({
      expense_date: TEST_DATE,
      expense_type: 'Bills',
      amount: 1500,
      description: 'Electricity & Water bill',
    }),
  });
  assert(updatedExp.status === 200, 'Update expense returns 200');
  assert(updatedExp.data.data.amount === 1500, 'Expense amount successfully updated to ₹1,500');

  // 2f. Today's total expenses
  const todayExp = await request(`/expenses/today?date=${TEST_DATE}`);
  assert(todayExp.data.data.today_expenses === 14500, 'Today total expenses equals ₹14,500 (1500 + 8000 + 5000)');

  // 2g. Monthly total expenses & breakdown
  const monthlyExp = await request(`/expenses/monthly?month=${TEST_MONTH}`);
  assert(monthlyExp.data.data.monthly_expenses === 14500, 'Monthly total expenses calculates correctly');
  assert(monthlyExp.data.data.breakdown['Supplier payments'] === 5000, 'Breakdown includes Supplier payments');

  // 2h. Validation: Invalid category
  const invCatExp = await request('/expenses', {
    method: 'POST',
    body: JSON.stringify({
      expense_date: TEST_DATE,
      expense_type: 'Personal Luxury',
      amount: 500,
    }),
  });
  assert(invCatExp.status === 400, 'Rejects unapproved expense category with 400');

  // 2i. Validation: Zero or negative amount
  const zeroExp = await request('/expenses', {
    method: 'POST',
    body: JSON.stringify({
      expense_date: TEST_DATE,
      expense_type: 'Bills',
      amount: 0,
    }),
  });
  assert(zeroExp.status === 400, 'Rejects zero amount with 400');

  // Test 3: Stock Management
  console.log('\n3. Stock Management Tests:');
  const v1Name = `Banarasi Silk Saree ${runId}`;
  // 3a. Add product variety
  const variety1 = await request('/stock/varieties', {
    method: 'POST',
    body: JSON.stringify({ name: v1Name }),
  });
  assert(variety1.status === 201, `Add product variety "${v1Name}"`);
  const v1Id = variety1.data.data.id;

  // 3b. Duplicate variety check
  const dupVariety = await request('/stock/varieties', {
    method: 'POST',
    body: JSON.stringify({ name: v1Name.toLowerCase() }),
  });
  assert(dupVariety.status === 400, 'Prevents duplicate variety (case-insensitive)');

  // 3c. Add second variety
  const v2Name = `Kanchipuram Pattu Saree ${runId}`;
  const variety2 = await request('/stock/varieties', {
    method: 'POST',
    body: JSON.stringify({ name: v2Name }),
  });
  assert(variety2.status === 201, `Add second product variety "${v2Name}"`);
  const v2Id = variety2.data.data.id;

  // 3d. Add IN stock (50 units)
  const stockIn = await request('/stock/movement', {
    method: 'POST',
    body: JSON.stringify({
      product_id: v1Id,
      movement_type: 'IN',
      quantity: 50,
      entry_date: TEST_DATE,
      notes: 'New festival stock arrival',
    }),
  });
  assert(stockIn.status === 201, 'Record IN stock (+50 units)');
  assert(stockIn.data.data.variety_current_stock === 50, 'Current stock of variety is 50');

  // 3e. Add OUT stock (12 units)
  const stockOut = await request('/stock/movement', {
    method: 'POST',
    body: JSON.stringify({
      product_id: v1Id,
      movement_type: 'OUT',
      quantity: 12,
      entry_date: TEST_DATE,
      notes: 'Counter sales dispatch',
    }),
  });
  assert(stockOut.status === 201, 'Record OUT stock (-12 units)');
  assert(stockOut.data.data.variety_current_stock === 38, 'Updated current stock: 50 - 12 = 38');

  // 3f. Retrieve variety by ID
  const singleVariety = await request(`/stock/varieties/${v1Id}`);
  assert(singleVariety.data.data.current_stock === 38, 'Retrieve variety by ID returns correct current stock');

  // 3g. Stock History
  const history = await request(`/stock/history?product_id=${v1Id}`);
  assert(history.data.count === 2, 'Stock history returns 2 movements for variety');

  // 3h. Validation: Invalid movement type
  const invMove = await request('/stock/movement', {
    method: 'POST',
    body: JSON.stringify({
      product_id: v1Id,
      movement_type: 'DAMAGED',
      quantity: 5,
    }),
  });
  assert(invMove.status === 400, 'Rejects invalid movement type with 400');

  // Test 4: Lender Management
  console.log('\n4. Lender Management Tests:');
  const lenderName = `Ramesh Kumar ${runId}`;
  // 4a. Add Lender
  const lender1 = await request('/lenders', {
    method: 'POST',
    body: JSON.stringify({
      name: lenderName,
      mobile: '9876543210',
      place: 'Surat Market',
      amount_given: 50000,
      amount_paid: 10000,
      loan_date: TEST_DATE,
      notes: 'Cloth trade credit',
    }),
  });
  assert(lender1.status === 201, `Add lender ${lenderName} (Given: ₹50,000, Paid: ₹10,000)`);
  assert(lender1.data.data.balance === 40000, 'Automatic balance calculation: 50000 - 10000 = ₹40,000');
  const l1Id = lender1.data.data.id;

  // 4b. Record Partial Payment (₹15,000)
  const repayment = await request(`/lenders/${l1Id}/pay`, {
    method: 'PATCH',
    body: JSON.stringify({ payment_amount: 15000 }),
  });
  assert(repayment.status === 200, 'Record repayment of ₹15,000');
  assert(repayment.data.data.amount_paid === 25000, 'Total amount paid updated to ₹25,000');
  assert(repayment.data.data.balance === 25000, 'New balance = 50000 - 25000 = ₹25,000');

  // 4c. Overpayment validation
  const overpay = await request(`/lenders/${l1Id}/pay`, {
    method: 'PATCH',
    body: JSON.stringify({ payment_amount: 30000 }),
  });
  assert(overpay.status === 400, 'Rejects overpayment (₹30,000 > ₹25,000 remaining balance)');

  // 4d. Total Lender Summary
  const lenderSummary = await request('/lenders/summary');
  assert(lenderSummary.data.data.total_amount_given >= 50000, 'Total given calculated across lenders');
  assert(lenderSummary.data.data.total_lender_due >= 25000, 'Total lender due calculated');

  // Test 5: Automatic Calculations & Dashboard
  console.log('\n5. Automatic Calculations & Dashboard Engine:');
  // 5a. Today Metrics: Today's Sales - Today's Expenses
  const todayCalc = await request(`/calculations/today?date=${TEST_DATE}`);
  assert(todayCalc.status === 200, 'Today calculations endpoint responds 200');
  assert(todayCalc.data.data.today_sales === 30000, 'Today sales = ₹30,000');
  assert(todayCalc.data.data.today_expenses === 14500, 'Today expenses = ₹14,500');
  assert(todayCalc.data.data.today_net_amount === 15500, 'Today Net Amount = 30000 - 14500 = ₹15,500');

  // 5b. Monthly Metrics: Turnover & Net Balance
  const monthlyCalc = await request(`/calculations/monthly?month=${TEST_MONTH}`);
  assert(monthlyCalc.status === 200, 'Monthly calculations endpoint responds 200');
  assert(monthlyCalc.data.data.monthly_turnover === monthlyCalc.data.data.monthly_sales, 'Monthly Turnover strictly equals Monthly Total Sales');
  assert(
    monthlyCalc.data.data.monthly_net_balance ===
      monthlyCalc.data.data.monthly_sales - monthlyCalc.data.data.monthly_expenses,
    'Monthly Net Balance = Monthly Sales - Monthly Expenses'
  );

  // 5c. Master Dashboard Unified KPI payload (All 9 metrics)
  const dashboard = await request(`/calculations/dashboard?date=${TEST_DATE}&month=${TEST_MONTH}`);
  assert(dashboard.status === 200, 'Dashboard calculations endpoint responds 200');
  const d = dashboard.data.data;
  assert(d.today_sales === 30000, 'Dashboard: Today Sales = 30,000');
  assert(d.today_expenses === 14500, 'Dashboard: Today Expenses = 14,500');
  assert(d.today_net_amount === 15500, 'Dashboard: Today Net = 15,500');
  assert(d.current_stock >= 38, 'Dashboard: Current Stock >= 38');
  assert(d.monthly_sales >= 45000, 'Dashboard: Monthly Sales >= 45,000');
  assert(d.monthly_expenses === 14500, 'Dashboard: Monthly Expenses = 14,500');
  assert(d.monthly_turnover === d.monthly_sales, 'Dashboard: Monthly Turnover verified');
  assert(d.monthly_net_balance === d.monthly_sales - d.monthly_expenses, 'Dashboard: Monthly Net Balance verified');
  assert(d.total_lender_due >= 25000, 'Dashboard: Total Lender Due verified');

  console.log('\n========================================================');
  console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('========================================================');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests().catch((err) => {
  console.error('Test execution failed with unhandled error:', err);
  process.exit(1);
});
