/**
 * STAGE 5 — AUTOMATIC CALCULATION DASHBOARD VERIFICATION TEST SUITE
 * Tests all 20 required points for pure calculations, dashboard consistency,
 * mathematical formulas, and API responses.
 */

const BASE_URL = 'http://localhost:5000/api';

const APPROVED_EXPENSE_CATEGORIES = [
  'Bills',
  'Rent',
  'Stock/Purchase expenses',
  'Supplier payments',
  'Other expenses',
];

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  [PASS] ${message}`);
    passed++;
  } else {
    console.error(`  [FAIL] ${message}`);
    failed++;
  }
}

async function runStage5Tests() {
  console.log('========================================================');
  console.log('STAGE 5 — AUTOMATIC CALCULATION DASHBOARD VERIFICATION');
  console.log('========================================================\n');

  try {
    // -----------------------------------------------------------
    // 1. TODAY'S FINANCIAL CALCULATIONS
    // -----------------------------------------------------------
    console.log("1. TODAY'S FINANCIAL CALCULATIONS:");
    const todayRes = await fetch(`${BASE_URL}/calculations/today`);
    assert(todayRes.status === 200, "1. Today's calculation endpoint returns 200 OK");
    const todayJson = await todayRes.json();
    const today = todayJson.data;

    assert(typeof today.today_sales === 'number', `   Today's Sales is numeric: ₹${today.today_sales}`);
    assert(typeof today.today_expenses === 'number', `   Today's Expenses is numeric: ₹${today.today_expenses}`);
    assert(typeof today.today_net_amount === 'number', `   Today's Net Balance is numeric: ₹${today.today_net_amount}`);

    // Formula Check: Today's Net Balance = Today's Sales - Today's Expenses
    const expectedTodayNet = today.today_sales - today.today_expenses;
    assert(
      today.today_net_amount === expectedTodayNet,
      `   Formula verified: Today's Net Balance (${today.today_net_amount}) = Sales (${today.today_sales}) - Expenses (${today.today_expenses})`
    );
    assert(
      today.is_surplus === (today.today_net_amount >= 0),
      `   Surplus flag accurate: is_surplus is ${today.is_surplus}`
    );

    // -----------------------------------------------------------
    // 2. MONTHLY FINANCIAL CALCULATIONS & FORMULAS
    // -----------------------------------------------------------
    console.log('\n2. MONTHLY FINANCIAL CALCULATIONS:');
    const currentMonth = today.date.substring(0, 7);
    const monthlyRes = await fetch(`${BASE_URL}/calculations/monthly?month=${currentMonth}`);
    assert(monthlyRes.status === 200, `   Monthly calculation endpoint returns 200 OK for ${currentMonth}`);
    const monthlyJson = await monthlyRes.json();
    const monthly = monthlyJson.data;

    assert(typeof monthly.monthly_sales === 'number', `   Monthly Total Sales is numeric: ₹${monthly.monthly_sales}`);
    assert(typeof monthly.monthly_expenses === 'number', `   Monthly Total Expenses is numeric: ₹${monthly.monthly_expenses}`);
    assert(typeof monthly.monthly_turnover === 'number', `   Monthly Turnover is numeric: ₹${monthly.monthly_turnover}`);
    assert(typeof monthly.monthly_net_balance === 'number', `   Monthly Net Balance is numeric: ₹${monthly.monthly_net_balance}`);

    // Formula Check: Monthly Turnover = Monthly Total Sales
    assert(
      monthly.monthly_turnover === monthly.monthly_sales,
      `   Formula verified: Monthly Turnover (${monthly.monthly_turnover}) = Monthly Total Sales (${monthly.monthly_sales})`
    );

    // Formula Check: Monthly Net Balance = Monthly Total Sales - Monthly Total Expenses
    const expectedMonthlyNet = monthly.monthly_sales - monthly.monthly_expenses;
    assert(
      monthly.monthly_net_balance === expectedMonthlyNet,
      `   Formula verified: Monthly Net Balance (${monthly.monthly_net_balance}) = Sales (${monthly.monthly_sales}) - Expenses (${monthly.monthly_expenses})`
    );

    // -----------------------------------------------------------
    // 3. MONTHLY EXPENSE BREAKDOWN (5 APPROVED CATEGORIES)
    // -----------------------------------------------------------
    console.log('\n3. MONTHLY EXPENSE BREAKDOWN:');
    const breakdown = monthly.expense_breakdown;
    assert(breakdown !== undefined && breakdown !== null, '   Expense breakdown exists in monthly response');

    let sumBreakdown = 0;
    APPROVED_EXPENSE_CATEGORIES.forEach((cat) => {
      assert(typeof breakdown[cat] === 'number', `   Approved category "${cat}" present: ₹${breakdown[cat] || 0}`);
      sumBreakdown += breakdown[cat] || 0;
    });

    assert(
      sumBreakdown === monthly.monthly_expenses,
      `   Breakdown sum (${sumBreakdown}) equals Total Monthly Expenses (${monthly.monthly_expenses})`
    );

    // -----------------------------------------------------------
    // 4. LENDER CALCULATIONS & FORMULAS
    // -----------------------------------------------------------
    console.log('\n4. LENDER CALCULATIONS:');
    const lenderSumRes = await fetch(`${BASE_URL}/lenders/summary`);
    assert(lenderSumRes.status === 200, '   Lender summary endpoint returns 200 OK');
    const lenderSumJson = await lenderSumRes.json();
    const lenderSummary = lenderSumJson.data;

    assert(typeof lenderSummary.total_amount_given === 'number', `   Total Lender Given: ₹${lenderSummary.total_amount_given}`);
    assert(typeof lenderSummary.total_amount_paid === 'number', `   Total Lender Paid: ₹${lenderSummary.total_amount_paid}`);
    assert(typeof lenderSummary.total_lender_due === 'number', `   Total Lender Due: ₹${lenderSummary.total_lender_due}`);

    // Formula Check: Total Lender Due = Total Amount Given - Total Amount Paid
    const expectedLenderDue = lenderSummary.total_amount_given - lenderSummary.total_amount_paid;
    assert(
      lenderSummary.total_lender_due === expectedLenderDue,
      `   Formula verified: Total Lender Due (${lenderSummary.total_lender_due}) = Given (${lenderSummary.total_amount_given}) - Paid (${lenderSummary.total_amount_paid})`
    );

    // Individual lender balances
    const lendersRes = await fetch(`${BASE_URL}/lenders`);
    assert(lendersRes.status === 200, '   Fetch all lenders returns 200 OK');
    const lendersJson = await lendersRes.json();
    const lenders = lendersJson.data;

    if (lenders.length > 0) {
      const first = lenders[0];
      const indBalance = first.amount_given - first.amount_paid;
      assert(
        first.balance === indBalance,
        `   Individual lender balance verified: ${first.name} Balance (${first.balance}) = Given (${first.amount_given}) - Paid (${first.amount_paid})`
      );
    } else {
      console.log('   (No active lenders found, empty list handled gracefully)');
    }

    // -----------------------------------------------------------
    // 5. STOCK CALCULATIONS & FORMULAS
    // -----------------------------------------------------------
    console.log('\n5. STOCK CALCULATIONS:');
    const stockSumRes = await fetch(`${BASE_URL}/stock/summary`);
    assert(stockSumRes.status === 200, '   Stock summary endpoint returns 200 OK');
    const stockSumJson = await stockSumRes.json();
    const stockSummary = stockSumJson.data;

    assert(typeof stockSummary.total_in === 'number', `   Total Stock IN: ${stockSummary.total_in} units`);
    assert(typeof stockSummary.total_out === 'number', `   Total Stock OUT: ${stockSummary.total_out} units`);
    assert(typeof stockSummary.current_stock === 'number', `   Total Current Stock: ${stockSummary.current_stock} units`);

    // Formula Check: Current Stock = Total IN - Total OUT
    const expectedStock = stockSummary.total_in - stockSummary.total_out;
    assert(
      stockSummary.current_stock === expectedStock,
      `   Formula verified: Current Stock (${stockSummary.current_stock}) = Total IN (${stockSummary.total_in}) - Total OUT (${stockSummary.total_out})`
    );

    // Product variety stock calculation check
    const varietiesRes = await fetch(`${BASE_URL}/stock/varieties`);
    assert(varietiesRes.status === 200, '   Stock varieties endpoint returns 200 OK');
    const varietiesJson = await varietiesRes.json();
    const varieties = varietiesJson.data;

    let varInSum = 0;
    let varOutSum = 0;
    varieties.forEach((v) => {
      const vCurrent = v.total_in - v.total_out;
      assert(
        v.current_stock === vCurrent,
        `   Variety "${v.name}": Current Stock (${v.current_stock}) = IN (${v.total_in}) - OUT (${v.total_out})`
      );
      varInSum += v.total_in;
      varOutSum += v.total_out;
    });

    assert(varInSum === stockSummary.total_in, `   Sum of variety IN (${varInSum}) equals aggregate total_in (${stockSummary.total_in})`);
    assert(varOutSum === stockSummary.total_out, `   Sum of variety OUT (${varOutSum}) equals aggregate total_out (${stockSummary.total_out})`);

    // -----------------------------------------------------------
    // 6. MONTH SELECTOR / ARBITRARY MONTH
    // -----------------------------------------------------------
    console.log('\n6. MONTH SELECTOR ARBITRARY QUERY:');
    const pastMonthRes = await fetch(`${BASE_URL}/calculations/monthly?month=2025-12`);
    assert(pastMonthRes.status === 200, '   Month selector query for past month (2025-12) returns 200 OK');
    const pastMonthJson = await pastMonthRes.json();
    assert(pastMonthJson.data.month === '2025-12', '   Response strictly scoped to queried month');

    // -----------------------------------------------------------
    // 7. MAIN DASHBOARD CONSISTENCY (ALL 9 METRICS MATCH)
    // -----------------------------------------------------------
    console.log('\n7. MAIN DASHBOARD INTEGRATION CONSISTENCY:');
    const dashRes = await fetch(`${BASE_URL}/calculations/dashboard`);
    assert(dashRes.status === 200, '   Unified Master Dashboard endpoint returns 200 OK');
    const dashJson = await dashRes.json();
    const dash = dashJson.data;

    // 1. Today Sales
    assert(dash.today_sales === today.today_sales, `   1. Today Sales match: Dashboard (${dash.today_sales}) == Calculations (${today.today_sales})`);
    // 2. Today Expenses
    assert(dash.today_expenses === today.today_expenses, `   2. Today Expenses match: Dashboard (${dash.today_expenses}) == Calculations (${today.today_expenses})`);
    // 3. Today Net
    assert(dash.today_net_amount === today.today_net_amount, `   3. Today Net match: Dashboard (${dash.today_net_amount}) == Calculations (${today.today_net_amount})`);
    // 4. Current Stock
    assert(dash.current_stock === stockSummary.current_stock, `   4. Current Stock match: Dashboard (${dash.current_stock}) == Calculations (${stockSummary.current_stock})`);
    // 5. Monthly Sales
    assert(dash.monthly_sales === monthly.monthly_sales, `   5. Monthly Sales match: Dashboard (${dash.monthly_sales}) == Calculations (${monthly.monthly_sales})`);
    // 6. Monthly Expenses
    assert(dash.monthly_expenses === monthly.monthly_expenses, `   6. Monthly Expenses match: Dashboard (${dash.monthly_expenses}) == Calculations (${monthly.monthly_expenses})`);
    // 7. Monthly Turnover
    assert(dash.monthly_turnover === monthly.monthly_turnover, `   7. Monthly Turnover match: Dashboard (${dash.monthly_turnover}) == Calculations (${monthly.monthly_turnover})`);
    // 8. Monthly Net Balance
    assert(dash.monthly_net_balance === monthly.monthly_net_balance, `   8. Monthly Net Balance match: Dashboard (${dash.monthly_net_balance}) == Calculations (${monthly.monthly_net_balance})`);
    // 9. Total Lender Due
    assert(dash.total_lender_due === lenderSummary.total_lender_due, `   9. Total Lender Due match: Dashboard (${dash.total_lender_due}) == Calculations (${lenderSummary.total_lender_due})`);

    // -----------------------------------------------------------
    // 8. EMPTY DATA & ERROR STATES
    // -----------------------------------------------------------
    console.log('\n8. EMPTY DATA & ERROR HANDLING:');
    const emptyMonthRes = await fetch(`${BASE_URL}/calculations/monthly?month=1999-01`);
    assert(emptyMonthRes.status === 200, '   Empty month query returns 200 OK');
    const emptyJson = await emptyMonthRes.json();
    assert(emptyJson.data.monthly_sales === 0, '   Empty month returns 0 monthly sales');
    assert(emptyJson.data.monthly_expenses === 0, '   Empty month returns 0 monthly expenses');
    assert(emptyJson.data.monthly_net_balance === 0, '   Empty month returns 0 net balance');

    const invalidMonthRes = await fetch(`${BASE_URL}/calculations/monthly?month=invalid-date`);
    assert(invalidMonthRes.status === 400, '   Invalid month format returns 400 Bad Request');
    const invalidJson = await invalidMonthRes.json();
    assert(invalidJson.success === false, '   Error response has success: false');

    console.log('\n========================================================');
    console.log(`STAGE 5 VERIFICATION: ${passed} PASSED, ${failed} FAILED`);
    console.log('========================================================\n');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('Fatal test error:', error);
    process.exit(1);
  }
}

runStage5Tests();
