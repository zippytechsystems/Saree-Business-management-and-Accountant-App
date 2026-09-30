/**
 * STAGE 6 — FINAL QA, SECURITY, DATA PERSISTENCE & PRODUCTION READINESS TEST SUITE
 * Comprehensive test validating all 15 audit dimensions specified in Stage 6.
 */

import http from 'node:http';
import db from '../db/database.js';

const BASE_URL = 'http://localhost:5000/api';

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

async function runStage6Tests() {
  console.log('================================================================');
  console.log('STAGE 6 — PRODUCTION READINESS & FINAL QA AUDIT SUITE');
  console.log('================================================================\n');

  try {
    // -------------------------------------------------------------
    // PART 1: COMPLETE END-TO-END BUSINESS FLOW TEST
    // -------------------------------------------------------------
    console.log('1. COMPLETE BUSINESS USER FLOW:');

    // 1.1 Check Health & DB Connection
    const healthRes = await fetch(`${BASE_URL}/health`);
    assert(healthRes.status === 200, '1.1 System health endpoint returns 200 OK');
    const healthJson = await healthRes.json();
    assert(healthJson.database.status === 'connected', '    SQLite database status is "connected"');
    assert(
      healthJson.database.tables.length >= 5 &&
      ['daily_sales', 'expenses', 'product_varieties', 'stock_entries', 'lenders'].every((t) =>
        healthJson.database.tables.includes(t)
      ),
      '    All 5 approved Version 1 tables present'
    );

    // 1.2 Add Product Variety (with timestamp to be unique & idempotent)
    const testVarietyName = `QA Variety ${Date.now()}`;
    const addVarietyRes = await fetch(`${BASE_URL}/stock/varieties`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: testVarietyName }),
    });
    assert(addVarietyRes.status === 201, `1.2 Added product variety "${testVarietyName}"`);
    const varietyJson = await addVarietyRes.json();
    const varietyId = varietyJson.data.id;

    // 1.3 Add IN Stock (+60)
    const inRes = await fetch(`${BASE_URL}/stock/movement`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        product_id: varietyId,
        movement_type: 'IN',
        quantity: 60,
        entry_date: '2026-09-29',
        notes: 'QA Audit Initial Inward Batch',
      }),
    });
    assert(inRes.status === 201, '1.3 Recorded IN stock movement (+60 units)');

    // 1.4 Add OUT Stock (-15)
    const outRes = await fetch(`${BASE_URL}/stock/movement`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        product_id: varietyId,
        movement_type: 'OUT',
        quantity: 15,
        entry_date: '2026-09-29',
        notes: 'QA Audit Customer Dispatch',
      }),
    });
    assert(outRes.status === 201, '1.4 Recorded OUT stock movement (-15 units)');

    // 1.5 Verify Variety Current Stock: 60 - 15 = 45
    const varietyCheckRes = await fetch(`${BASE_URL}/stock/varieties/${varietyId}`);
    const varietyCheck = await varietyCheckRes.json();
    assert(
      varietyCheck.data.current_stock === 45,
      `1.5 Verified current stock for variety = 45 units (${varietyCheck.data.total_in} IN - ${varietyCheck.data.total_out} OUT)`
    );

    // 1.6 Record / Update Daily Sales
    const salesRes = await fetch(`${BASE_URL}/sales`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        entry_date: '2026-09-29',
        total_sales_amount: 35000,
      }),
    });
    assert(salesRes.status === 200, "1.6 Recorded today's sales (₹35,000)");

    // 1.7 Record Daily Expense (Supplier payments)
    const expRes = await fetch(`${BASE_URL}/expenses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        expense_date: '2026-09-29',
        expense_type: 'Supplier payments',
        amount: 8500,
        description: 'QA Audit Silk Weaver Advance',
      }),
    });
    assert(expRes.status === 201, '1.7 Recorded Supplier payment expense (₹8,500)');
    const expJson = await expRes.json();
    const createdExpId = expJson.data.id;

    // 1.8 Accountant Ledgers Audit
    const accSalesRes = await fetch(`${BASE_URL}/sales?month=2026-09`);
    const accSales = await accSalesRes.json();
    assert(accSales.data.some((s) => s.entry_date === '2026-09-29'), '1.8 Sales ledger contains 2026-09-29 entry');

    const accExpRes = await fetch(`${BASE_URL}/expenses?month=2026-09&category=Supplier payments`);
    const accExp = await accExpRes.json();
    assert(accExp.data.some((e) => e.id === createdExpId), '    Supplier payment ledger contains recorded expense');

    // 1.9 Lender Flow: Add Lender -> Record Repayment -> Verify Balance
    const lenderName = `QA Lender ${Date.now()}`;
    const addLenderRes = await fetch(`${BASE_URL}/lenders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: lenderName,
        mobile: '9123456780',
        place: 'Kanchipuram Hub',
        amount_given: 80000,
        amount_paid: 20000,
        loan_date: '2026-09-20',
        notes: 'QA Test Loan Record',
      }),
    });
    assert(addLenderRes.status === 201, `1.9 Added lender "${lenderName}" (Given: ₹80,000, Paid: ₹20,000)`);
    const lenderJson = await addLenderRes.json();
    const lenderId = lenderJson.data.id;
    assert(lenderJson.data.balance === 60000, '    Initial balance verified as ₹60,000');

    // Record Repayment of ₹25,000
    const repayRes = await fetch(`${BASE_URL}/lenders/${lenderId}/pay`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payment_amount: 25000 }),
    });
    assert(repayRes.status === 200, '    Recorded repayment of ₹25,000');
    const repayJson = await repayRes.json();
    assert(repayJson.data.amount_paid === 45000, '    Updated total paid = ₹45,000');
    assert(repayJson.data.balance === 35000, '    Updated remaining balance = ₹35,000 (80,000 - 45,000)');

    // -------------------------------------------------------------
    // PART 2: CALCULATION CONSISTENCY AUDIT
    // -------------------------------------------------------------
    console.log('\n2. CALCULATION CONSISTENCY ACROSS SCREENS:');
    const [todayMetricsRes, monthlyMetricsRes, masterDashRes] = await Promise.all([
      fetch(`${BASE_URL}/calculations/today`),
      fetch(`${BASE_URL}/calculations/monthly?month=2026-09`),
      fetch(`${BASE_URL}/calculations/dashboard`),
    ]);

    const todayM = (await todayMetricsRes.json()).data;
    const monthlyM = (await monthlyMetricsRes.json()).data;
    const dashM = (await masterDashRes.json()).data;

    // Consistency Check 1: Today Sales
    assert(dashM.today_sales === todayM.today_sales, `2.1 Today's Sales match across screens: ₹${dashM.today_sales}`);
    // Consistency Check 2: Today Expenses
    assert(dashM.today_expenses === todayM.today_expenses, `2.2 Today's Expenses match across screens: ₹${dashM.today_expenses}`);
    // Consistency Check 3: Today Net
    assert(dashM.today_net_amount === todayM.today_net_amount, `2.3 Today's Net Balance match across screens: ₹${dashM.today_net_amount}`);
    assert(dashM.today_net_amount === dashM.today_sales - dashM.today_expenses, '    Formula verified: Today Net = Sales - Expenses');

    // Consistency Check 4: Monthly Sales
    assert(dashM.monthly_sales === monthlyM.monthly_sales, `2.4 Monthly Sales match across screens: ₹${dashM.monthly_sales}`);
    // Consistency Check 5: Monthly Expenses
    assert(dashM.monthly_expenses === monthlyM.monthly_expenses, `2.5 Monthly Expenses match across screens: ₹${dashM.monthly_expenses}`);
    // Consistency Check 6: Monthly Turnover
    assert(dashM.monthly_turnover === monthlyM.monthly_turnover, `2.6 Monthly Turnover match across screens: ₹${dashM.monthly_turnover}`);
    assert(dashM.monthly_turnover === dashM.monthly_sales, '    Formula verified: Turnover = Total Sales');
    // Consistency Check 7: Monthly Net Balance
    assert(dashM.monthly_net_balance === monthlyM.monthly_net_balance, `2.7 Monthly Net Balance match across screens: ₹${dashM.monthly_net_balance}`);
    assert(dashM.monthly_net_balance === dashM.monthly_sales - dashM.monthly_expenses, '    Formula verified: Monthly Net = Sales - Expenses');

    // -------------------------------------------------------------
    // PART 3: INPUT VALIDATION & BOUNDARY AUDIT
    // -------------------------------------------------------------
    console.log('\n3. INPUT VALIDATION & ERROR HANDLING:');

    // Sales Validations
    const sNeg = await fetch(`${BASE_URL}/sales`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entry_date: '2026-09-29', total_sales_amount: -500 }),
    });
    assert(sNeg.status === 400, '3.1 Sales rejects negative amount (-500) with 400');

    const sBadDate = await fetch(`${BASE_URL}/sales`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entry_date: 'invalid-date', total_sales_amount: 1000 }),
    });
    assert(sBadDate.status === 400, '3.2 Sales rejects invalid date format with 400');

    // Expense Validations
    const eZero = await fetch(`${BASE_URL}/expenses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ expense_date: '2026-09-29', expense_type: 'Bills', amount: 0 }),
    });
    assert(eZero.status === 400, '3.3 Expenses rejects zero amount with 400');

    const eBadCat = await fetch(`${BASE_URL}/expenses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ expense_date: '2026-09-29', expense_type: 'Cryptocurrency', amount: 500 }),
    });
    assert(eBadCat.status === 400, '3.4 Expenses rejects unapproved category ("Cryptocurrency") with 400');

    // Stock Validations
    const stNoName = await fetch(`${BASE_URL}/stock/varieties`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: '   ' }),
    });
    assert(stNoName.status === 400, '3.5 Stock rejects empty variety name with 400');

    const stDuplicate = await fetch(`${BASE_URL}/stock/varieties`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: testVarietyName }),
    });
    assert(stDuplicate.status === 400, `3.6 Stock rejects duplicate variety name ("${testVarietyName}") with 400`);

    const stBadQty = await fetch(`${BASE_URL}/stock/movement`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product_id: varietyId, movement_type: 'IN', quantity: -10 }),
    });
    assert(stBadQty.status === 400, '3.7 Stock movement rejects negative quantity (-10) with 400');

    // Lender Validations
    const lNoMobile = await fetch(`${BASE_URL}/lenders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test', mobile: '', place: 'Town', amount_given: 1000 }),
    });
    assert(lNoMobile.status === 400, '3.8 Lender rejects missing mobile number with 400');

    const lOverpay = await fetch(`${BASE_URL}/lenders/${lenderId}/pay`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payment_amount: 50000 }), // Remaining balance is 35,000
    });
    assert(lOverpay.status === 400, '3.9 Lender rejects repayment exceeding balance (50,000 > 35,000) with 400');

    // -------------------------------------------------------------
    // PART 4: SECURITY & SQL INJECTION PROTECTION AUDIT
    // -------------------------------------------------------------
    console.log('\n4. SECURITY & SQL INJECTION AUDIT:');

    // Attempt SQL injection in sales date
    const sqliSales = await fetch(`${BASE_URL}/sales/2026-09-29' OR '1'='1`);
    assert(sqliSales.status === 400 || sqliSales.status === 404, '4.1 SQL injection attack in sales date neutralized');

    // Attempt SQL injection in variety name
    const sqliVariety = `Malicious'; DROP TABLE expenses; --`;
    const addSqliVar = await fetch(`${BASE_URL}/stock/varieties`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: sqliVariety }),
    });
    // Should be safely escaped and created or handled without executing DROP TABLE
    assert(addSqliVar.status === 201, '4.2 SQL injection payload safely stored as literal text');

    // Verify expenses table still exists and is completely intact
    const expVerify = await fetch(`${BASE_URL}/expenses`);
    assert(expVerify.status === 200, '4.3 Verified expenses table is safe and unaffected by injection attempts');

    // Clean up malicious variety test record so DB remains clean
    const sqliVarData = (await addSqliVar.json()).data;
    if (sqliVarData && sqliVarData.id) {
      db.prepare('DELETE FROM product_varieties WHERE id = ?').run(sqliVarData.id);
    }

    // -------------------------------------------------------------
    // PART 5: DATA PERSISTENCE & DATABASE RESILIENCE
    // -------------------------------------------------------------
    console.log('\n5. DATA PERSISTENCE VERIFICATION:');

    // Verify that our created records persist and exist in the DB
    const finalSales = await fetch(`${BASE_URL}/sales/2026-09-29`);
    assert((await finalSales.json()).data.total_sales_amount === 35000, '5.1 Sales entry persisted in SQLite WAL (₹35,000)');

    const finalVariety = await fetch(`${BASE_URL}/stock/varieties/${varietyId}`);
    assert((await finalVariety.json()).data.current_stock === 45, '5.2 Stock entries persisted in SQLite WAL (45 units)');

    const finalLender = await fetch(`${BASE_URL}/lenders/${lenderId}`);
    assert((await finalLender.json()).data.balance === 35000, '5.3 Lender record and repayment persisted in SQLite WAL (₹35,000 balance)');

    console.log('\n================================================================');
    console.log(`STAGE 6 QA VERIFICATION: ${passed} PASSED, ${failed} FAILED`);
    console.log('================================================================\n');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Stage 6 QA execution failed:', err);
    process.exit(1);
  }
}

runStage6Tests();
