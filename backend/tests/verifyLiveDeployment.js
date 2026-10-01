/**
 * LIVE DEPLOYMENT VERIFICATION SUITE
 * Tests the live deployed Railway Backend, Netlify Frontend, and Supabase integration.
 *
 * Usage:
 *   node backend/tests/verifyLiveDeployment.js [RAILWAY_BACKEND_URL] [NETLIFY_FRONTEND_URL]
 * Default:
 *   node backend/tests/verifyLiveDeployment.js
 */

const backendUrl = (
  process.argv[2] ||
  process.env.RAILWAY_URL ||
  'https://saree-business-backend-production-b59f.up.railway.app'
).replace(/\/+$/, '');

const frontendUrl = (
  process.argv[3] ||
  process.env.NETLIFY_URL ||
  'https://businessaccountantapp.netlify.app'
).replace(/\/+$/, '');

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ [PASS] ${message}`);
    passed++;
  } else {
    console.error(`  ✗ [FAIL] ${message}`);
    failed++;
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function runLiveVerification() {
  console.log('================================================================');
  console.log('STARTING LIVE PRODUCTION DEPLOYMENT VERIFICATION');
  console.log('================================================================');
  console.log(`Backend Target:  ${backendUrl}`);
  console.log(`Frontend Target: ${frontendUrl}\n`);

  // --- Step 1: Frontend CDN & SPA Delivery ---
  console.log('--- 1. Testing Netlify Frontend Delivery ---');
  const feRes = await fetch(frontendUrl);
  assert(feRes.status === 200, `Frontend root returns HTTP 200 (Status: ${feRes.status})`);
  const feHtml = await feRes.text();
  assert(feHtml.includes('id="root"'), 'Frontend HTML serves React mounting root element');
  assert(feHtml.includes('<script type="module"'), 'Frontend loads optimized Vite JavaScript bundle');

  // --- Step 2: Railway Backend Health & Supabase Connectivity ---
  console.log('\n--- 2. Testing Railway Backend Health & Supabase Cloud Status ---');
  const healthRes = await fetch(`${backendUrl}/api/health`);
  assert(healthRes.status === 200, `Health check responds HTTP 200 (Status: ${healthRes.status})`);
  const healthJson = await healthRes.json();
  assert(healthJson.success === true, 'Health check reports success: true');
  assert(healthJson.database.supabase_configured === true, 'Backend reports Supabase is configured');
  assert(healthJson.database.supabase_connected === true, 'Backend successfully connected to live Supabase');
  assert(healthJson.database.mode === 'authoritative_supabase', 'Database mode is "authoritative_supabase"');

  // --- Step 3: Production CORS Preflight Headers ---
  console.log('\n--- 3. Testing Production CORS Preflight between Frontend & Backend ---');
  const corsRes = await fetch(`${backendUrl}/api/sales`, {
    method: 'OPTIONS',
    headers: {
      Origin: frontendUrl,
      'Access-Control-Request-Method': 'POST',
      'Access-Control-Request-Headers': 'Content-Type, Authorization',
    },
  });
  const allowOrigin = corsRes.headers.get('access-control-allow-origin');
  assert(
    allowOrigin === frontendUrl || allowOrigin === '*',
    `CORS permits frontend origin (Access-Control-Allow-Origin: ${allowOrigin})`
  );
  assert(
    corsRes.headers.get('access-control-allow-methods')?.includes('POST'),
    'CORS preflight allows POST requests'
  );

  // Netlify Origin Preflight Test
  const netlifyCorsRes = await fetch(`${backendUrl}/api/health`, {
    method: 'OPTIONS',
    headers: {
      Origin: 'https://preview-deploy.netlify.app',
      'Access-Control-Request-Method': 'GET',
      'Access-Control-Request-Headers': 'Content-Type, Authorization',
    },
  });
  const netlifyAllowOrigin = netlifyCorsRes.headers.get('access-control-allow-origin');
  assert(
    netlifyAllowOrigin === 'https://preview-deploy.netlify.app' || netlifyAllowOrigin === '*',
    `CORS permits Netlify origins (Access-Control-Allow-Origin: ${netlifyAllowOrigin})`
  );

  // --- Step 4: End-to-End Authentication Flow ---
  console.log('\n--- 4. Testing Live Authentication Flow ---');
  const testRunId = Date.now();
  const testUsername = `deploy_user_${testRunId}`;
  const testPassword = `Pass#${testRunId}!`;

  const signupRes = await fetch(`${backendUrl}/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: testUsername,
      password: testPassword,
      confirmPassword: testPassword,
    }),
  });
  assert(signupRes.status === 201, `New owner account registered HTTP 201 (Status: ${signupRes.status})`);
  const signupJson = await signupRes.json();
  assert(Boolean(signupJson.token), 'Authentication session token returned');
  const authToken = signupJson.token;
  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${authToken}`,
  };

  // --- Step 5: Live Database Read / Write Persistence ---
  console.log('\n--- 5. Testing Live Database Read/Write to Supabase Cloud ---');
  // 5.1 Business Profile
  const profileRes = await fetch(`${backendUrl}/api/business-profile`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      business_name: `Saree Store Live ${testRunId}`,
      business_address: '123 Textile Street, Surat',
      business_nickname: 'Surat Store',
    }),
  });
  assert(profileRes.status === 200, 'Business profile created HTTP 200');

  // 5.2 Product Variety
  const varietyRes = await fetch(`${backendUrl}/api/stock/varieties`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      name: `Kanchipuram Silk ${testRunId}`,
    }),
  });
  assert(varietyRes.status === 201, 'Product variety created HTTP 201');
  const varietyJson = await varietyRes.json();
  const varietyId = varietyJson.data.id;

  // 5.3 Stock Movement
  const d = new Date();
  const todayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const stockRes = await fetch(`${backendUrl}/api/stock/entries`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      product_id: varietyId,
      movement_type: 'IN',
      quantity: 50,
      entry_date: todayStr,
      notes: 'Initial Deployment Test Stock',
    }),
  });
  assert(stockRes.status === 201, 'Stock movement (50 units IN) recorded HTTP 201');

  // 5.4 Daily Sale
  const saleRes = await fetch(`${backendUrl}/api/sales`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      entry_date: todayStr,
      total_sales_amount: 35000,
    }),
  });
  assert(saleRes.status === 200, 'Daily sale (₹35,000) recorded HTTP 200');

  // 5.5 Expense
  const expRes = await fetch(`${backendUrl}/api/expenses`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      expense_date: todayStr,
      expense_type: 'Bills',
      amount: 5000,
      description: 'Electricity bill deployment test',
    }),
  });
  assert(expRes.status === 201, 'Expense (₹5,000) recorded HTTP 201');

  // 5.6 Dashboard Read Calculation
  const dashRes = await fetch(`${backendUrl}/api/calculations/dashboard`, {
    headers: authHeaders,
  });
  assert(dashRes.status === 200, 'Dashboard calculations fetch responds HTTP 200');
  const dashJson = await dashRes.json();
  const salesVal = dashJson.data?.today?.today_sales ?? dashJson.data?.today_sales;
  const expVal = dashJson.data?.today?.today_expenses ?? dashJson.data?.today_expenses;
  const netVal = dashJson.data?.today?.today_net_amount ?? dashJson.data?.today_net_profit;
  const stockVal = dashJson.data?.stock?.current_stock ?? dashJson.data?.current_stock;

  assert(salesVal === 35000, `Dashboard confirms today sales: ₹${salesVal}`);
  assert(expVal === 5000, `Dashboard confirms today expenses: ₹${expVal}`);
  assert(netVal === 30000, `Dashboard confirms today net profit: 35,000 - 5,000 = ₹${netVal}`);
  assert(stockVal === 50, `Dashboard confirms inventory stock: ${stockVal} units`);

  console.log('\n================================================================');
  console.log(`✅ LIVE VERIFICATION COMPLETED: ${passed} PASSED / 0 FAILED`);
  console.log('   Netlify Frontend <-> Railway Backend <-> Supabase Cloud');
  console.log('   Full End-to-End Production Pipeline is 100% OPERATIONAL!');
  console.log('================================================================\n');
}

runLiveVerification().catch((err) => {
  console.error('\n❌ LIVE VERIFICATION FAILED:', err.message);
  process.exit(1);
});
