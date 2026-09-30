// Stage 3 User Interface & Integration Verification Script
const BASE_URL = 'http://localhost:3000/api';

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

async function runStage3Verification() {
  console.log('========================================================');
  console.log('STAGE 3 — BUSINESS MANAGEMENT UI FLOW VERIFICATION');
  console.log('========================================================\n');

  // Flow 1: Add a product variety
  console.log('1. Product Variety Flow:');
  const varName = `Chanderi Cotton Saree ${Date.now()}`;
  const addVariety = await request('/stock/varieties', {
    method: 'POST',
    body: JSON.stringify({ name: varName }),
  });
  assert(addVariety.status === 201, `Add product variety "${varName}" returns 201`);
  const varietyId = addVariety.data.data.id;

  // Flow 2: Add IN Stock
  console.log('\n2. Add IN Stock Flow:');
  const addIn = await request('/stock/movement', {
    method: 'POST',
    body: JSON.stringify({
      product_id: varietyId,
      movement_type: 'IN',
      quantity: 100,
      entry_date: '2026-09-29',
      notes: 'Stage 3 UI Test Initial Stock',
    }),
  });
  assert(addIn.status === 201, 'Add 100 units IN stock');
  assert(addIn.data.data.variety_current_stock === 100, 'Current stock is 100 units');

  // Flow 3: Add OUT Stock
  console.log('\n3. Add OUT Stock Flow:');
  const addOut = await request('/stock/movement', {
    method: 'POST',
    body: JSON.stringify({
      product_id: varietyId,
      movement_type: 'OUT',
      quantity: 25,
      entry_date: '2026-09-29',
      notes: 'Counter sales dispatch test',
    }),
  });
  assert(addOut.status === 201, 'Add 25 units OUT stock');

  // Flow 4: Verify Current Stock Updates
  console.log('\n4. Verify Current Stock Updates:');
  const varietyCheck = await request(`/stock/varieties/${varietyId}`);
  assert(varietyCheck.data.data.current_stock === 75, 'Verified 100 IN - 25 OUT = 75 Current Stock');

  // Flow 5: Enter Today's Sales
  console.log('\n5. Enter Today\'s Sales Flow:');
  const sales1 = await request('/sales', {
    method: 'POST',
    body: JSON.stringify({
      entry_date: '2026-09-29',
      total_sales_amount: 35000,
    }),
  });
  assert(sales1.status === 200, 'Record today sales of ₹35,000');

  // Flow 6: Update Today's Sales
  console.log('\n6. Update Today\'s Sales Flow:');
  const salesUpdate = await request('/sales', {
    method: 'POST',
    body: JSON.stringify({
      entry_date: '2026-09-29',
      total_sales_amount: 42000,
    }),
  });
  assert(salesUpdate.status === 200, 'Update today sales to ₹42,000');
  assert(salesUpdate.data.data.is_updated === true, 'Duplicate check passed: record updated');
  const todaySalesVerify = await request('/sales/today?date=2026-09-29');
  assert(todaySalesVerify.data.data.total_sales_amount === 42000, 'Today sales verified as ₹42,000');

  // Flow 7: Add Each Expense Category
  console.log('\n7. Add Each Expense Category Flow:');
  const categories = [
    { cat: 'Bills', amt: 1200, desc: 'Internet connection' },
    { cat: 'Rent', amt: 10000, desc: 'September shop rent' },
    { cat: 'Stock/Purchase expenses', amt: 15000, desc: 'Weaver raw material' },
    { cat: 'Supplier payments', amt: 7500, desc: 'Dyeing unit payment' },
    { cat: 'Other expenses', amt: 800, desc: 'Store tea and cleaning' },
  ];

  const createdExpIds = [];
  for (const item of categories) {
    const res = await request('/expenses', {
      method: 'POST',
      body: JSON.stringify({
        expense_date: '2026-09-29',
        expense_type: item.cat,
        amount: item.amt,
        description: item.desc,
      }),
    });
    assert(res.status === 201, `Added ${item.cat} expense of ₹${item.amt}`);
    createdExpIds.push(res.data.data.id);
  }

  // Flow 8: Verify Today's Expense Total
  console.log('\n8. Verify Today\'s Expense Total:');
  const todayExp = await request('/expenses/today?date=2026-09-29');
  assert(todayExp.status === 200, 'Fetched today total expenses');
  assert(todayExp.data.data.today_expenses > 0, `Today's total expenses calculated: ₹${todayExp.data.data.today_expenses}`);

  // Flow 9: Edit an Expense
  console.log('\n9. Edit an Expense Flow:');
  const editTargetId = createdExpIds[0]; // Bills
  const editRes = await request(`/expenses/${editTargetId}`, {
    method: 'PUT',
    body: JSON.stringify({
      expense_date: '2026-09-29',
      expense_type: 'Bills',
      amount: 1800,
      description: 'Fiber internet and electricity bill',
    }),
  });
  assert(editRes.status === 200, 'Edit expense amount from ₹1,200 to ₹1,800');
  assert(editRes.data.data.amount === 1800, 'Updated expense amount verified');

  // Flow 10: Delete an Expense
  console.log('\n10. Delete an Expense Flow:');
  const deleteTargetId = createdExpIds[createdExpIds.length - 1]; // Other expenses
  const delRes = await request(`/expenses/${deleteTargetId}`, {
    method: 'DELETE',
  });
  assert(delRes.status === 200, 'Delete expense returns 200');
  const checkDeleted = await request(`/expenses/${deleteTargetId}`);
  assert(checkDeleted.status === 404, 'Deleted expense returns 404 not found');

  // Flow 11: Verify Dashboard Values Refresh
  console.log('\n11. Dashboard Live Integration:');
  const dashRes = await request('/calculations/dashboard?date=2026-09-29');
  assert(dashRes.status === 200, 'Dashboard calculations returns 200');
  const d = dashRes.data.data;
  assert(d.today_sales === 42000, 'Dashboard live today_sales = ₹42,000');
  assert(d.today_expenses > 0, `Dashboard live today_expenses = ₹${d.today_expenses}`);
  assert(d.today_net_amount === d.today_sales - d.today_expenses, 'Dashboard live today_net_amount verified');
  assert(d.current_stock > 0, `Dashboard live current_stock = ${d.current_stock} units`);

  // Flow 12: Validation Tests
  console.log('\n12. Input Validation Tests:');
  const badSales = await request('/sales', {
    method: 'POST',
    body: JSON.stringify({ entry_date: '2026-09-29', total_sales_amount: -100 }),
  });
  assert(badSales.status === 400, 'Rejects negative sales input');

  const badExpAmount = await request('/expenses', {
    method: 'POST',
    body: JSON.stringify({ expense_date: '2026-09-29', expense_type: 'Bills', amount: 0 }),
  });
  assert(badExpAmount.status === 400, 'Rejects zero expense amount');

  const badStockQty = await request('/stock/movement', {
    method: 'POST',
    body: JSON.stringify({ product_id: varietyId, movement_type: 'IN', quantity: -5 }),
  });
  assert(badStockQty.status === 400, 'Rejects negative stock quantity');

  console.log('\n========================================================');
  console.log(`STAGE 3 VERIFICATION: ${passed} PASSED, ${failed} FAILED`);
  console.log('========================================================');

  if (failed > 0) process.exit(1);
  else process.exit(0);
}

runStage3Verification().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
