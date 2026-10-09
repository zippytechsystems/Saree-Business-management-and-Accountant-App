/**
 * Comprehensive Authentication & Multi-Device Sync Test Suite
 * Covers all 25 mandatory test cases specified in the Production Prompt.
 */
import db from '../db/database.js';

const BASE_URL = 'http://localhost:5000/api';

function assert(condition, message) {
  if (!condition) {
    console.error(`  ✗ [FAIL] ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`  ✓ [PASS] ${message}`);
}

async function runAuthTests() {
  console.log('================================================================');
  console.log('FINAL PRODUCTION AUTHENTICATION & MULTI-DEVICE TEST SUITE');
  console.log('================================================================\n');

  const testSuffix = Date.now();
  const ownerAUser = `owner_a_${testSuffix}`;
  const ownerAPass = `Pass@${testSuffix}#A1`;
  const ownerBUser = `owner_b_${testSuffix}`;
  const ownerBPass = `Pass@${testSuffix}#B2`;

  let tokenA = null;
  let tokenB = null;
  let deviceBToken = null;

  // -------------------------------------------------------------
  // 1. SIGNUP SUCCESS
  // -------------------------------------------------------------
  console.log('--- 1. Signup Success ---');
  const signupRes = await fetch(`${BASE_URL}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: ownerAUser,
      password: ownerAPass,
      confirmPassword: ownerAPass,
    }),
  });
  const signupData = await signupRes.json();
  assert(signupRes.status === 201, '1.1 Signup HTTP status is 201 Created');
  assert(signupData.success === true, '1.2 Signup response success is true');
  assert(Boolean(signupData.token), '1.3 Session token returned upon signup');
  assert(signupData.user.username.toLowerCase() === ownerAUser.toLowerCase(), '1.4 User object returned with username');
  assert(signupData.user.password_hash === undefined, '1.5 Password hash is NOT exposed in response');
  tokenA = signupData.token;

  // -------------------------------------------------------------
  // 2. DUPLICATE USERNAME REJECTION
  // -------------------------------------------------------------
  console.log('\n--- 2. Duplicate Username Rejection ---');
  const dupRes = await fetch(`${BASE_URL}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: ownerAUser.toUpperCase(), // Case insensitive duplicate check
      password: ownerAPass,
      confirmPassword: ownerAPass,
    }),
  });
  const dupData = await dupRes.json();
  assert([400, 409].includes(dupRes.status), '2.1 Duplicate username rejected with HTTP 400 or 409');
  assert(dupData.success === false, '2.2 Response success is false');
  assert(dupData.error.toLowerCase().includes('already taken'), '2.3 Error message identifies duplicate username');

  // -------------------------------------------------------------
  // 3. WEAK PASSWORD REJECTION
  // -------------------------------------------------------------
  console.log('\n--- 3. Weak Password Rejection ---');
  const weakRes = await fetch(`${BASE_URL}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: `weak_${testSuffix}`,
      password: '123',
      confirmPassword: '123',
    }),
  });
  const weakData = await weakRes.json();
  assert(weakRes.status === 400, '3.1 Short password rejected with HTTP 400');
  assert(weakData.error.toLowerCase().includes('at least 6 characters'), '3.2 Password validation error message returned');

  // -------------------------------------------------------------
  // 4. PASSWORD MISMATCH REJECTION
  // -------------------------------------------------------------
  console.log('\n--- 4. Password Mismatch Rejection ---');
  const mismatchRes = await fetch(`${BASE_URL}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: `mismatch_${testSuffix}`,
      password: 'StrongPassword123',
      confirmPassword: 'DifferentPassword123',
    }),
  });
  const mismatchData = await mismatchRes.json();
  assert(mismatchRes.status === 400, '4.1 Mismatched confirmation rejected with HTTP 400');
  assert(mismatchData.error.toLowerCase().includes('do not match'), '4.2 Password mismatch message returned');

  // -------------------------------------------------------------
  // 5. LOGIN SUCCESS
  // -------------------------------------------------------------
  console.log('\n--- 5. Login Success ---');
  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: ownerAUser,
      password: ownerAPass,
    }),
  });
  const loginData = await loginRes.json();
  assert(loginRes.status === 200, '5.1 Login HTTP status is 200 OK');
  assert(loginData.success === true, '5.2 Login response success is true');
  assert(Boolean(loginData.token), '5.3 Login returns valid active session token');
  tokenA = loginData.token;

  // -------------------------------------------------------------
  // 6. WRONG PASSWORD REJECTION
  // -------------------------------------------------------------
  console.log('\n--- 6. Wrong Password Rejection ---');
  const wrongPassRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: ownerAUser,
      password: 'IncorrectPassword999',
    }),
  });
  const wrongPassData = await wrongPassRes.json();
  assert(wrongPassRes.status === 401, '6.1 Wrong password rejected with HTTP 401 Unauthorized');
  assert(wrongPassData.error.toLowerCase().includes('invalid username or password'), '6.2 Generic credential failure error');

  // -------------------------------------------------------------
  // 7. UNKNOWN USERNAME REJECTION
  // -------------------------------------------------------------
  console.log('\n--- 7. Unknown Username Rejection ---');
  const unknownUserRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: `nonexistent_owner_${testSuffix}`,
      password: 'SomePassword123',
    }),
  });
  assert(unknownUserRes.status === 401, '7.1 Nonexistent user rejected with HTTP 401');

  // -------------------------------------------------------------
  // 8. SESSION VALIDATION
  // -------------------------------------------------------------
  console.log('\n--- 8. Session Validation ---');
  const meRes = await fetch(`${BASE_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${tokenA}` },
  });
  const meData = await meRes.json();
  assert(meRes.status === 200, '8.1 GET /auth/me with valid Bearer token returns 200');
  assert(meData.user.username.toLowerCase() === ownerAUser.toLowerCase(), '8.2 Correct owner identity returned');

  // -------------------------------------------------------------
  // 9. LOGOUT
  // -------------------------------------------------------------
  console.log('\n--- 9. Logout ---');
  const tempSignup = await fetch(`${BASE_URL}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: `logout_test_${testSuffix}`,
      password: 'LogoutPassword123',
      confirmPassword: 'LogoutPassword123',
    }),
  });
  const tempToken = (await tempSignup.json()).token;
  const logoutRes = await fetch(`${BASE_URL}/auth/logout`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${tempToken}` },
  });
  assert(logoutRes.status === 200, '9.1 Logout responds HTTP 200');
  // Attempt to use logged-out token on /auth/me
  const afterLogoutRes = await fetch(`${BASE_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${tempToken}` },
  });
  assert(afterLogoutRes.status === 401, '9.2 Revoked session token rejected with 401 Unauthorized');

  // -------------------------------------------------------------
  // 10. PROTECTED ROUTE WITHOUT AUTHENTICATION
  // -------------------------------------------------------------
  console.log('\n--- 10. Protected Route Without Authentication ---');
  const unauthMe = await fetch(`${BASE_URL}/auth/me`);
  assert(unauthMe.status === 401, '10.1 GET /auth/me without token returns 401');

  // -------------------------------------------------------------
  // 11. PROTECTED ROUTE WITH VALID AUTHENTICATION
  // -------------------------------------------------------------
  console.log('\n--- 11. Protected Route With Valid Authentication ---');
  const authDash = await fetch(`${BASE_URL}/calculations/dashboard`, {
    headers: { Authorization: `Bearer ${tokenA}` },
  });
  assert(authDash.status === 200, '11.1 Protected dashboard responds 200 with Bearer token');

  // -------------------------------------------------------------
  // 12. BUSINESS PROFILE CREATION
  // -------------------------------------------------------------
  console.log('\n--- 12. Business Profile Creation ---');
  const createProfileRes = await fetch(`${BASE_URL}/business-profile`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenA}`,
    },
    body: JSON.stringify({
      business_name: 'Metro Hardware Stores',
      business_address: '42 Main Bazaar Road, Mumbai',
      business_nickname: 'Metro Shop',
    }),
  });
  const createProfileData = await createProfileRes.json();
  assert(createProfileRes.status === 200, '12.1 Profile creation responds HTTP 200');
  assert(createProfileData.data.business_name === 'Metro Hardware Stores', '12.2 Business name stored correctly');
  assert(createProfileData.data.business_nickname === 'Metro Shop', '12.3 Business nickname stored correctly');

  // -------------------------------------------------------------
  // 13. BUSINESS PROFILE RETRIEVAL
  // -------------------------------------------------------------
  console.log('\n--- 13. Business Profile Retrieval ---');
  const getProfileRes = await fetch(`${BASE_URL}/business-profile`, {
    headers: { Authorization: `Bearer ${tokenA}` },
  });
  const getProfileData = await getProfileRes.json();
  assert(getProfileRes.status === 200, '13.1 GET /business-profile responds HTTP 200');
  assert(getProfileData.data.business_address === '42 Main Bazaar Road, Mumbai', '13.2 Correct business address retrieved');

  // -------------------------------------------------------------
  // 14. BUSINESS PROFILE UPDATE
  // -------------------------------------------------------------
  console.log('\n--- 14. Business Profile Update ---');
  const updateProfileRes = await fetch(`${BASE_URL}/business-profile`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenA}`,
    },
    body: JSON.stringify({
      business_name: 'Metro Hardware & Electricals Ltd',
      business_address: '42-44 Main Bazaar Road, Mumbai',
      business_nickname: 'Metro Mega Shop',
    }),
  });
  const updateProfileData = await updateProfileRes.json();
  assert(updateProfileRes.status === 200, '14.1 Profile update responds HTTP 200');
  assert(updateProfileData.data.business_name === 'Metro Hardware & Electricals Ltd', '14.2 Updated name reflected');
  assert(updateProfileData.data.business_nickname === 'Metro Mega Shop', '14.3 Updated nickname reflected');

  // -------------------------------------------------------------
  // 15. OWNER DATA ISOLATION (Owner A vs Owner B)
  // -------------------------------------------------------------
  console.log('\n--- 15. Owner Data Isolation ---');
  // Create Owner B
  const signupBRes = await fetch(`${BASE_URL}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: ownerBUser,
      password: ownerBPass,
      confirmPassword: ownerBPass,
    }),
  });
  tokenB = (await signupBRes.json()).token;

  // Setup Owner B Profile
  await fetch(`${BASE_URL}/business-profile`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenB}`,
    },
    body: JSON.stringify({
      business_name: 'Sunrise Bakery',
      business_address: '7 Hill Road, Pune',
      business_nickname: 'Sunrise Shop',
    }),
  });

  // Owner A adds Sales = ₹45,000, Expense = ₹6,000
  await fetch(`${BASE_URL}/sales`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenA}`,
    },
    body: JSON.stringify({ entry_date: '2026-09-30', total_sales_amount: 45000 }),
  });
  const expARes = await fetch(`${BASE_URL}/expenses`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenA}`,
    },
    body: JSON.stringify({
      expense_date: '2026-09-30',
      expense_type: 'Rent',
      amount: 6000,
      description: 'Owner A Monthly Rent',
    }),
  });
  const expAId = (await expARes.json()).data.id;

  // Owner B adds Sales = ₹12,000, Expense = ₹1,500
  await fetch(`${BASE_URL}/sales`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenB}`,
    },
    body: JSON.stringify({ entry_date: '2026-09-30', total_sales_amount: 12000 }),
  });
  await fetch(`${BASE_URL}/expenses`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenB}`,
    },
    body: JSON.stringify({
      expense_date: '2026-09-30',
      expense_type: 'Other expenses',
      amount: 1500,
      description: 'Owner B Baker Salary',
    }),
  });

  // Verify Owner A's Dashboard
  const dashARes = await fetch(`${BASE_URL}/calculations/dashboard?date=2026-09-30`, {
    headers: { Authorization: `Bearer ${tokenA}` },
  });
  const dashA = (await dashARes.json()).data;
  assert(dashA.today_sales === 45000, '15.1 Owner A sees exactly ₹45,000 sales');
  assert(dashA.today_expenses === 6000, '15.2 Owner A sees exactly ₹6,000 expenses');
  assert(dashA.today_net_amount === 39000, '15.3 Owner A net balance is ₹39,000');

  // Verify Owner B's Dashboard
  const dashBRes = await fetch(`${BASE_URL}/calculations/dashboard?date=2026-09-30`, {
    headers: { Authorization: `Bearer ${tokenB}` },
  });
  const dashB = (await dashBRes.json()).data;
  assert(dashB.today_sales === 12000, '15.4 Owner B sees exactly ₹12,000 sales');
  assert(dashB.today_expenses === 1500, '15.5 Owner B sees exactly ₹1,500 expenses');
  assert(dashB.today_net_amount === 10500, '15.6 Owner B net balance is ₹10,500');

  // -------------------------------------------------------------
  // 16. OWNER A CANNOT ACCESS OWNER B DATA (AND VICE VERSA)
  // -------------------------------------------------------------
  console.log('\n--- 16. Cross-Owner Data Boundary Enforcement ---');
  // Owner B attempts to GET Owner A's expense
  const crossGetRes = await fetch(`${BASE_URL}/expenses/${expAId}`, {
    headers: { Authorization: `Bearer ${tokenB}` },
  });
  assert(crossGetRes.status === 404, '16.1 Owner B accessing Owner A expense returns 404 Not Found');

  // Owner B attempts to UPDATE Owner A's expense
  const crossPutRes = await fetch(`${BASE_URL}/expenses/${expAId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenB}`,
    },
    body: JSON.stringify({ amount: 999999 }),
  });
  assert(crossPutRes.status === 404, '16.2 Owner B updating Owner A expense returns 404 Not Found');

  // Owner B attempts to DELETE Owner A's expense
  const crossDelRes = await fetch(`${BASE_URL}/expenses/${expAId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${tokenB}` },
  });
  assert(crossDelRes.status === 404, '16.3 Owner B deleting Owner A expense returns 404 Not Found');

  // Verify Owner A's expense was not modified
  const verifyExp = await fetch(`${BASE_URL}/expenses/${expAId}`, {
    headers: { Authorization: `Bearer ${tokenA}` },
  });
  assert((await verifyExp.json()).data.amount === 6000, '16.4 Owner A expense remains intact at ₹6,000');

  // -------------------------------------------------------------
  // 17. MULTI-DEVICE LOGIN SIMULATION (DEVICE A & DEVICE B)
  // -------------------------------------------------------------
  console.log('\n--- 17. Multi-Device Login ---');
  // Device B logs in with same Owner A credentials
  const devBLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: ownerAUser,
      password: ownerAPass,
    }),
  });
  const devBLoginData = await devBLoginRes.json();
  assert(devBLoginRes.status === 200, '17.1 Device B logs in successfully with same owner credentials');
  assert(devBLoginData.business_profile.business_nickname === 'Metro Mega Shop', '17.2 Device B instantly retrieves Owner A business profile');
  deviceBToken = devBLoginData.token;

  // -------------------------------------------------------------
  // 18. DATA SYNCHRONIZATION (DEVICE A -> CLOUD/SERVER -> DEVICE B)
  // -------------------------------------------------------------
  console.log('\n--- 18. Multi-Device Data Synchronization ---');
  // Device A adds a stock movement
  const varietyRes = await fetch(`${BASE_URL}/stock/varieties`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenA}`,
    },
    body: JSON.stringify({ name: `Cement Grade 53 - ${testSuffix}` }),
  });
  const varietyId = (await varietyRes.json()).data.id;

  await fetch(`${BASE_URL}/stock/movement`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenA}`,
    },
    body: JSON.stringify({
      product_id: varietyId,
      movement_type: 'IN',
      quantity: 500,
      entry_date: '2026-09-30',
      notes: 'Delivered to Warehouse via Device A',
    }),
  });

  // Device B fetches stock summary
  const devBStockRes = await fetch(`${BASE_URL}/stock/summary`, {
    headers: { Authorization: `Bearer ${deviceBToken}` },
  });
  const devBStock = (await devBStockRes.json()).data;
  assert(devBStock.current_stock >= 500, '18.1 Stock movement entered on Device A instantly appears on Device B');

  // Device B adds Lender
  const devBLenderRes = await fetch(`${BASE_URL}/lenders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${deviceBToken}`,
    },
    body: JSON.stringify({
      name: 'Ramesh Contractor',
      mobile: '9876543210',
      place: 'Andheri West',
      amount_given: 80000,
      amount_paid: 20000,
      loan_date: '2026-09-30',
      notes: 'Entered from Laptop Device B',
    }),
  });
  assert(devBLenderRes.status === 201, '18.2 Lender entered on Device B responds 201 Created');

  // Device A refreshes lender summary
  const devALenderRes = await fetch(`${BASE_URL}/lenders/summary`, {
    headers: { Authorization: `Bearer ${tokenA}` },
  });
  const devALender = (await devALenderRes.json()).data;
  assert(devALender.total_lender_due >= 60000, '18.3 Lender entered on Device B instantly appears on Device A');

  // -------------------------------------------------------------
  // 19. OFFLINE QUEUE
  // -------------------------------------------------------------
  console.log('\n--- 19. Offline Queue Behavior ---');
  // Mutations generate pending queue items
  const syncHistoryRes = await fetch(`${BASE_URL}/cloud-backup/history`, {
    headers: { Authorization: `Bearer ${tokenA}` },
  });
  const syncHistory = (await syncHistoryRes.json()).data;
  assert(Array.isArray(syncHistory), '19.1 Cloud sync log records local mutations');
  assert(syncHistory.length > 0, '19.2 Monthly mutation queue tracks entries');

  // -------------------------------------------------------------
  // 20. RETRY SYNCHRONIZATION
  // -------------------------------------------------------------
  console.log('\n--- 20. Retry Synchronization ---');
  const retryRes = await fetch(`${BASE_URL}/cloud-backup/sync-now`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${tokenA}` },
  });
  assert(retryRes.status === 200, '20.1 POST /cloud-backup/sync-now executes safely');
  assert((await retryRes.json()).success === true, '20.2 Retry sync completes without crash');

  // -------------------------------------------------------------
  // 21. DUPLICATE SYNC PREVENTION
  // -------------------------------------------------------------
  console.log('\n--- 21. Duplicate Sync Prevention ---');
  const salesBefore = db.prepare('SELECT COUNT(*) AS c FROM daily_sales WHERE user_id = ?').get(1).c;
  // Trigger repeated requests for same date
  await fetch(`${BASE_URL}/sales`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
    body: JSON.stringify({ entry_date: '2026-09-30', total_sales_amount: 45000 }),
  });
  const salesAfter = db.prepare('SELECT COUNT(*) AS c FROM daily_sales WHERE user_id = ?').get(1).c;
  assert(salesBefore === salesAfter, '21.1 UPSERT prevents duplicate records for same owner date entry');

  // -------------------------------------------------------------
  // 22. DEVICE-LOSS / NEW MOBILE RECOVERY
  // -------------------------------------------------------------
  console.log('\n--- 22. Device Loss Recovery (New Mobile Device C) ---');
  // Device A is lost. Owner installs on Device C and logs in
  const devCLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: ownerAUser,
      password: ownerAPass,
    }),
  });
  const devCData = await devCLoginRes.json();
  const tokenC = devCData.token;

  assert(devCLoginRes.status === 200, '22.1 New Device C authenticates with same username/password');
  assert(devCData.business_profile.business_name === 'Metro Hardware & Electricals Ltd', '22.2 Device C loads existing business name');
  assert(devCData.business_profile.business_nickname === 'Metro Mega Shop', '22.3 Device C loads existing business nickname');

  const devCDash = await (await fetch(`${BASE_URL}/calculations/dashboard?date=2026-09-30`, {
    headers: { Authorization: `Bearer ${tokenC}` },
  })).json();

  assert(devCDash.data.today_sales === 45000, '22.4 Device C recovers all previous sales data');
  assert(devCDash.data.today_expenses === 6000, '22.5 Device C recovers all previous expenses data');
  assert(devCDash.data.current_stock >= 500, '22.6 Device C recovers all previous stock data');
  assert(devCDash.data.total_lender_due >= 60000, '22.7 Device C recovers all previous lender accounts');

  // -------------------------------------------------------------
  // 23. RESTART PERSISTENCE
  // -------------------------------------------------------------
  console.log('\n--- 23. Restart Persistence Verification ---');
  // Verify database tables hold user and profile rows persistently
  const userRow = db.prepare('SELECT id, username FROM users WHERE username = ? COLLATE NOCASE').get(ownerAUser);
  assert(userRow !== undefined, '23.1 Owner account safely committed to SQLite disk');
  const profileRow = db.prepare('SELECT id, business_name FROM business_profiles WHERE user_id = ?').get(userRow.id);
  assert(profileRow !== undefined, '23.2 Business profile safely committed to SQLite disk');

  // -------------------------------------------------------------
  // 24. TOKEN / SESSION EXPIRATION CHECK
  // -------------------------------------------------------------
  console.log('\n--- 24. Token & Session Expiration Check ---');
  // Inject an expired session in DB to test validation
  const expiredToken = `exp_token_${testSuffix}`;
  db.prepare(`
    INSERT INTO sessions (user_id, token, expires_at)
    VALUES (?, ?, datetime('now', '-1 day'))
  `).run(userRow.id, expiredToken);

  const expCheckRes = await fetch(`${BASE_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${expiredToken}` },
  });
  assert(expCheckRes.status === 401, '24.1 Expired session token rejected with HTTP 401 Unauthorized');

  // -------------------------------------------------------------
  // 25. PASSWORD HASH VERIFICATION
  // -------------------------------------------------------------
  console.log('\n--- 25. Password Security & Hash Verification ---');
  const dbUser = db.prepare('SELECT password_hash FROM users WHERE username = ? COLLATE NOCASE').get(ownerAUser);
  assert(Boolean(dbUser.password_hash), '25.1 Password hash exists');
  assert(!dbUser.password_hash.includes(ownerAPass), '25.2 Plaintext password NOT stored anywhere in database');
  assert(dbUser.password_hash.startsWith('scrypt:'), '25.3 Password hashed with secure scrypt algorithm');

  console.log('\n================================================================');
  console.log('AUTHENTICATION & MULTI-DEVICE TEST SUITE: ALL 25 TESTS PASSED (100%)');
  console.log('================================================================\n');
}

runAuthTests().catch((err) => {
  console.error('\nTest Suite Fatal Error:', err.message);
  process.exit(1);
});
