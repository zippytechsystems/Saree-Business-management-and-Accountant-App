const BASE_URL = process.env.BASE_URL || 'http://localhost:5000/api';

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

async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const response = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  const data = await response.json();
  return { status: response.status, data };
}

async function runStage4Verification() {
  console.log('========================================================');
  console.log('STAGE 4 — ACCOUNTANT & LENDER MANAGEMENT VERIFICATION');
  console.log('========================================================\n');

  // -------------------------------------------------------------
  // ACCOUNTANT TESTS (1 - 8)
  // -------------------------------------------------------------
  console.log('ACCOUNTANT MANAGEMENT FLOWS:');

  // 1. View sales history
  const salesHistory = await request('/sales');
  assert(salesHistory.status === 200, '1. View sales history returns 200');
  assert(salesHistory.data.count >= 1, '   Sales records present in ledger');

  // 2. Filter sales by month
  const salesMonthFilter = await request('/sales?month=2026-09');
  assert(salesMonthFilter.status === 200, '2. Filter sales by month (2026-09)');
  assert(salesMonthFilter.data.data.every((r) => r.entry_date.startsWith('2026-09')), '   All sales records belong to 2026-09');

  // 3. View expense history
  const expHistory = await request('/expenses');
  assert(expHistory.status === 200, '3. View expense history returns 200');
  assert(expHistory.data.count >= 1, '   Expense records present in ledger');

  // 4. Filter expenses by category (e.g. Rent)
  const expCategoryFilter = await request('/expenses?category=Rent');
  assert(expCategoryFilter.status === 200, '4. Filter expenses by category (Rent)');
  assert(expCategoryFilter.data.data.every((r) => r.expense_type === 'Rent'), '   All filtered expenses are Rent');

  // 5. Filter expenses by month
  const expMonthFilter = await request('/expenses?month=2026-09');
  assert(expMonthFilter.status === 200, '5. Filter expenses by month (2026-09)');
  assert(expMonthFilter.data.data.every((r) => r.expense_date.startsWith('2026-09')), '   All filtered expenses belong to 2026-09');

  // 6. View stock movement history
  const stockHistory = await request('/stock/history');
  assert(stockHistory.status === 200, '6. View stock movement history returns 200');
  assert(stockHistory.data.data.some((r) => r.movement_type === 'IN'), '   Stock IN movements recorded');
  assert(stockHistory.data.data.some((r) => r.movement_type === 'OUT'), '   Stock OUT movements recorded');

  // 7. View supplier payment records
  const supplierRecords = await request('/expenses?category=Supplier%20payments');
  assert(supplierRecords.status === 200, '7. View supplier payment records returns 200');
  assert(supplierRecords.data.data.every((r) => r.expense_type === 'Supplier payments'), '   All records are Supplier payments');

  // 8. Verify totals
  const monthlyExpTotal = await request('/expenses/monthly?month=2026-09');
  assert(monthlyExpTotal.data.data.monthly_expenses > 0, '8. Period total expenses calculated');
  assert(typeof monthlyExpTotal.data.data.breakdown['Supplier payments'] === 'number', '   Supplier payments breakdown verified');

  // -------------------------------------------------------------
  // LENDER TESTS (9 - 19)
  // -------------------------------------------------------------
  console.log('\nLENDER MANAGEMENT FLOWS:');

  // 9. Add a lender
  const newLender = await request('/lenders', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Mohan Silk Traders',
      mobile: '9845012345',
      place: 'Dharmavaram',
      amount_given: 60000,
      amount_paid: 10000,
      loan_date: '2026-09-20',
      notes: 'Raw silk supply credit',
    }),
  });
  assert(newLender.status === 201, '9. Add lender "Mohan Silk Traders" returns 201');
  const lenderId = newLender.data.data.id;

  // 10. Verify lender appears in list
  const lendersList = await request('/lenders');
  assert(lendersList.status === 200, '10. Fetch all lenders returns 200');
  const foundLender = lendersList.data.data.find((l) => l.id === lenderId);
  assert(Boolean(foundLender), '    Created lender appears in directory list');

  // 11. Verify Amount Given & Initial Balance
  assert(foundLender.amount_given === 60000, '11. Amount Given verified as ₹60,000');
  assert(foundLender.amount_paid === 10000, '    Initial Amount Paid verified as ₹10,000');
  assert(foundLender.balance === 50000, '    Initial Balance = 60000 - 10000 = ₹50,000');

  // 12. Record partial repayment (₹20,000)
  const partialRepayment = await request(`/lenders/${lenderId}/pay`, {
    method: 'PATCH',
    body: JSON.stringify({ payment_amount: 20000 }),
  });
  assert(partialRepayment.status === 200, '12. Record partial repayment of ₹20,000');

  // 13. Verify Amount Paid updates
  assert(partialRepayment.data.data.amount_paid === 30000, '13. Amount Paid updated to ₹30,000 (10,000 + 20,000)');

  // 14. Verify Balance updates
  assert(partialRepayment.data.data.balance === 30000, '14. Balance updated to ₹30,000 (60,000 - 30,000)');

  // 15. Verify total lender summary
  const summary = await request('/lenders/summary');
  assert(summary.status === 200, '15. Fetch total lender summary returns 200');
  assert(summary.data.data.total_amount_given >= 60000, '    Total amount given calculated across all lenders');
  assert(summary.data.data.total_lender_due >= 30000, '    Total lender due calculated');

  // 16. Edit lender
  const editLender = await request(`/lenders/${lenderId}`, {
    method: 'PUT',
    body: JSON.stringify({
      name: 'Mohan Silk Mills & Co',
      mobile: '9845012345',
      place: 'Dharmavaram Center',
      amount_given: 60000,
      amount_paid: 30000,
      loan_date: '2026-09-20',
      notes: 'Updated silk credit terms',
    }),
  });
  assert(editLender.status === 200, '16. Edit lender name to "Mohan Silk Mills & Co"');
  assert(editLender.data.data.name === 'Mohan Silk Mills & Co', '    Updated name confirmed');

  // 17. Reject repayment greater than balance
  const overpay = await request(`/lenders/${lenderId}/pay`, {
    method: 'PATCH',
    body: JSON.stringify({ payment_amount: 40000 }), // Remaining balance is 30000
  });
  assert(overpay.status === 400, '17. Rejected overpayment (₹40,000 > ₹30,000 remaining balance)');

  // 18. Delete lender with confirmation
  const deleteLender = await request(`/lenders/${lenderId}`, {
    method: 'DELETE',
  });
  assert(deleteLender.status === 200, '18. Delete lender returns 200');

  // 19. Verify deleted lender is removed
  const verifyDeleted = await request(`/lenders/${lenderId}`);
  assert(verifyDeleted.status === 404, '19. Deleted lender returns 404 not found');

  // -------------------------------------------------------------
  // UI & DASHBOARD INTEGRATION (20 - 25)
  // -------------------------------------------------------------
  console.log('\nUI & DASHBOARD INTEGRATION:');

  const dashRes = await request('/calculations/dashboard');
  assert(dashRes.status === 200, '20. Dashboard calculations endpoint verified');
  assert(typeof dashRes.data.data.total_lender_due === 'number', '21. Dashboard total_lender_due connected');
  assert(typeof dashRes.data.data.today_sales === 'number', '22. Dashboard today_sales connected');
  assert(typeof dashRes.data.data.today_expenses === 'number', '23. Dashboard today_expenses connected');
  assert(typeof dashRes.data.data.current_stock === 'number', '24. Dashboard current_stock connected');

  console.log('\n========================================================');
  console.log(`STAGE 4 VERIFICATION: ${passed} PASSED, ${failed} FAILED`);
  console.log('========================================================');

  if (failed > 0) process.exit(1);
  else process.exit(0);
}

runStage4Verification().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
