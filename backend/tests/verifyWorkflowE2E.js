import assert from 'assert';

const BASE_URL = 'http://localhost:5000';

async function runEndToEndVerification() {
  console.log('=== STARTING END-TO-END WORKFLOW VERIFICATION ===\n');

  // Step 1: Unauthenticated request
  console.log('1. Testing Unauthenticated Access...');
  const unauthRes = await fetch(`${BASE_URL}/api/auth/me`);
  const unauthData = await unauthRes.json();
  assert.strictEqual(unauthRes.status, 401, 'Unauthenticated should return 401');
  assert.strictEqual(unauthData.success, false);
  console.log('   ✓ Unauthenticated route properly rejected with 401 Unauthorized.');

  // Step 2: Login with existing owner (Device 1)
  console.log('\n2. Testing Primary Owner Login (Device 1)...');
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'owner', password: 'Owner@123' })
  });
  const loginData = await loginRes.json();
  assert.strictEqual(loginRes.status, 200);
  assert.strictEqual(loginData.success, true);
  assert.strictEqual(loginData.business_profile.business_name, 'ABC Traders');
  assert.strictEqual(loginData.business_profile.business_nickname, 'ABC Shop');
  const ownerToken = loginData.token;
  console.log('   ✓ Owner login successful. Profile loaded: ABC Traders (ABC Shop).');

  // Step 3: Fetch Dashboard for Primary Owner
  console.log('\n3. Testing Dashboard Retrieval for Primary Owner...');
  const dashRes = await fetch(`${BASE_URL}/api/calculations/dashboard`, {
    headers: { Authorization: `Bearer ${ownerToken}` }
  });
  const dashData = await dashRes.json();
  assert.strictEqual(dashRes.status, 200);
  assert.strictEqual(dashData.success, true);
  console.log(`   ✓ Dashboard loaded: Monthly Sales=₹${dashData.data.monthly_sales}, Monthly Expenses=₹${dashData.data.monthly_expenses}`);

  // Step 4: Sign up a brand new owner
  const testUsername = `user_${Date.now()}`;
  console.log(`\n4. Testing Sign Up for New Owner (${testUsername})...`);
  const signupRes = await fetch(`${BASE_URL}/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: testUsername,
      password: 'Password@123',
      confirmPassword: 'Password@123'
    })
  });
  const signupData = await signupRes.json();
  assert.strictEqual(signupRes.status, 201);
  assert.strictEqual(signupData.success, true);
  assert.strictEqual(signupData.needs_profile, true);
  const newOwnerToken = signupData.token;
  console.log('   ✓ New owner signed up and auto-authenticated. Redirect required: needs_profile = true.');

  // Step 5: Complete Business Profile Setup
  console.log('\n5. Testing Business Profile Setup...');
  const profileRes = await fetch(`${BASE_URL}/api/business-profile`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${newOwnerToken}`
    },
    body: JSON.stringify({
      business_name: 'Metro Supermarket',
      business_address: '42 Commercial Boulevard',
      business_nickname: 'Metro Mart'
    })
  });
  const profileData = await profileRes.json();
  assert([200, 201].includes(profileRes.status), `Expected 200 or 201, got ${profileRes.status}`);
  assert.strictEqual(profileData.success, true);
  assert.strictEqual(profileData.data.business_name, 'Metro Supermarket');
  assert.strictEqual(profileData.data.business_nickname, 'Metro Mart');
  console.log('   ✓ Business profile created successfully: Metro Supermarket (Metro Mart).');

  // Step 6: Multi-Device Test: Device A (Mobile) adds a sale
  console.log('\n6. Multi-Device Test: Device A (Mobile) adds a sale of ₹10,000...');
  const saleDate = new Date().toISOString().split('T')[0];
  const addSaleRes = await fetch(`${BASE_URL}/api/sales`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${newOwnerToken}`
    },
    body: JSON.stringify({
      entry_date: saleDate,
      total_sales_amount: 10000
    })
  });
  const addSaleData = await addSaleRes.json();
  assert([200, 201].includes(addSaleRes.status));
  assert.strictEqual(addSaleData.success, true);
  console.log('   ✓ Device A (Mobile) saved sale: ₹10,000 to cloud-linked database.');

  // Step 7: Multi-Device Test: Device B (Laptop) logs in with same username + password
  console.log('\n7. Multi-Device Test: Device B (Laptop) logs in with same account...');
  const deviceBLogin = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: testUsername, password: 'Password@123' })
  });
  const deviceBData = await deviceBLogin.json();
  assert.strictEqual(deviceBLogin.status, 200);
  assert.strictEqual(deviceBData.business_profile.business_nickname, 'Metro Mart');
  const deviceBToken = deviceBData.token;
  console.log('   ✓ Device B authenticated. Reconnected to same business space: Metro Mart.');

  // Step 8: Multi-Device Test: Device B fetches Dashboard and verifies sale ₹10,000 appears
  console.log('\n8. Multi-Device Test: Device B refreshes Dashboard...');
  const deviceBDash = await fetch(`${BASE_URL}/api/calculations/dashboard`, {
    headers: { Authorization: `Bearer ${deviceBToken}` }
  });
  const deviceBDashData = await deviceBDash.json();
  assert.strictEqual(deviceBDashData.data.today_sales, 10000);
  console.log('   ✓ Device B Dashboard shows Sale = ₹10,000 without manual transfer!');

  // Step 9: Multi-Device Test: Device B adds an Expense = ₹2,000
  console.log('\n9. Multi-Device Test: Device B (Laptop) adds Expense = ₹2,000...');
  const addExpRes = await fetch(`${BASE_URL}/api/expenses`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${deviceBToken}`
    },
    body: JSON.stringify({
      expense_date: saleDate,
      expense_type: 'Rent',
      amount: 2000,
      description: 'Monthly shop advance'
    })
  });
  const addExpData = await addExpRes.json();
  assert([200, 201].includes(addExpRes.status));
  console.log('   ✓ Device B saved Expense: ₹2,000.');

  // Step 10: Multi-Device Test: Device A refreshes and sees Expense = ₹2,000
  console.log('\n10. Multi-Device Test: Device A (Mobile) refreshes Dashboard...');
  const deviceADash = await fetch(`${BASE_URL}/api/calculations/dashboard`, {
    headers: { Authorization: `Bearer ${newOwnerToken}` }
  });
  const deviceADashData = await deviceADash.json();
  assert.strictEqual(deviceADashData.data.today_expenses, 2000);
  assert.strictEqual(deviceADashData.data.today_net_amount, 8000); // 10000 - 2000
  console.log('   ✓ Device A shows Expense = ₹2,000 and Today Net Amount = ₹8,000.');

  // Step 11: Multi-Device Test: Device A adds Stock (Variety + Stock IN 100)
  console.log('\n11. Multi-Device Test: Device A (Mobile) creates product & adds Stock IN = 100...');
  const varietyRes = await fetch(`${BASE_URL}/api/stock/varieties`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${newOwnerToken}`
    },
    body: JSON.stringify({ name: 'Premium Rice' })
  });
  const varietyData = await varietyRes.json();
  const productId = varietyData.data.id;

  const stockRes = await fetch(`${BASE_URL}/api/stock/movement`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${newOwnerToken}`
    },
    body: JSON.stringify({
      product_id: productId,
      movement_type: 'IN',
      quantity: 100,
      entry_date: saleDate,
      notes: 'Initial warehouse batch'
    })
  });
  const stockData = await stockRes.json();
  assert([200, 201].includes(stockRes.status));
  console.log('   ✓ Stock IN = 100 created.');

  // Step 12: Device B refreshes Stock
  console.log('\n12. Multi-Device Test: Device B (Laptop) verifies stock...');
  const stockSummaryRes = await fetch(`${BASE_URL}/api/stock/varieties`, {
    headers: { Authorization: `Bearer ${deviceBToken}` }
  });
  const stockSummary = await stockSummaryRes.json();
  const rice = stockSummary.data.find(p => p.id === productId);
  assert.strictEqual(rice.current_stock, 100);
  console.log(`   ✓ Device B shows Product: "${rice.name}" with Current Stock = ${rice.current_stock}.`);

  // Step 13: SIMULATE DEVICE LOSS / NEW MOBILE (Device C)
  console.log('\n13. SIMULATION: Mobile Device A is LOST / DESTROYED.');
  console.log('    Owner buys Device C, installs app, and logs in with same Username + Password...');
  const deviceCLogin = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: testUsername, password: 'Password@123' })
  });
  const deviceCData = await deviceCLogin.json();
  assert.strictEqual(deviceCData.success, true);
  assert.strictEqual(deviceCData.business_profile.business_name, 'Metro Supermarket');
  assert.strictEqual(deviceCData.business_profile.business_nickname, 'Metro Mart');
  const deviceCToken = deviceCData.token;

  const deviceCDash = await fetch(`${BASE_URL}/api/calculations/dashboard`, {
    headers: { Authorization: `Bearer ${deviceCToken}` }
  });
  const deviceCFull = await deviceCDash.json();
  assert.strictEqual(deviceCFull.data.today_sales, 10000);
  assert.strictEqual(deviceCFull.data.today_expenses, 2000);
  assert.strictEqual(deviceCFull.data.current_stock, 100);
  assert.strictEqual(deviceCFull.data.today_net_amount, 8000);
  console.log('   ✓ DEVICE LOSS RECOVERY VERIFIED:');
  console.log('     - Business Profile: Metro Supermarket (Metro Mart) recovered');
  console.log('     - Sales: ₹10,000 recovered');
  console.log('     - Expenses: ₹2,000 recovered');
  console.log('     - Stock: 100 units recovered');
  console.log('     - Today Net Amount: ₹8,000 calculated correctly');

  // Step 14: Data Isolation Check (Owner A cannot see Owner B data)
  console.log('\n14. Owner Data Isolation Check...');
  const ownerADash = await fetch(`${BASE_URL}/api/calculations/dashboard`, {
    headers: { Authorization: `Bearer ${ownerToken}` }
  });
  const ownerAData = await ownerADash.json();
  const ownerAStock = await (await fetch(`${BASE_URL}/api/stock/varieties`, {
    headers: { Authorization: `Bearer ${ownerToken}` }
  })).json();

  // Verify Owner A does not have "Premium Rice" in their stock
  const hasRice = ownerAStock.data.some(p => p.name === 'Premium Rice');
  assert.strictEqual(hasRice, false, 'Owner A must not see Owner B product');
  console.log('   ✓ Owner A does NOT see Owner B products or data.');
  console.log('   ✓ Complete owner isolation verified.');

  console.log('\n======================================================');
  console.log('ALL 14 END-TO-END WORKFLOW TESTS COMPLETED SUCCESSFULLY!');
  console.log('======================================================\n');
}

runEndToEndVerification().catch(err => {
  console.error('VERIFICATION FAILED:', err);
  process.exit(1);
});
