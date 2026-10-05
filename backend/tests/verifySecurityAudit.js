import http from 'http';

function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });

    req.on('error', (err) => reject(err));

    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

async function runSecurityAudit() {
  console.log('=== STARTING DEEP SECURITY & BACKEND AUDIT ===\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition, message) {
    totalTests++;
    if (condition) {
      console.log(`  ✓ PASS: ${message}`);
      passedTests++;
    } else {
      console.error(`  ✗ FAIL: ${message}`);
      process.exitCode = 1;
    }
  }

  // 1. Audit HTTP Security Headers on /api/health
  console.log('1. Auditing Security Headers on Endpoints...');
  const healthRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/health',
    method: 'GET'
  });

  assert(healthRes.headers['x-content-type-options'] === 'nosniff', 'X-Content-Type-Options: nosniff header present');
  assert(healthRes.headers['x-frame-options'] === 'SAMEORIGIN', 'X-Frame-Options: SAMEORIGIN header present (Clickjacking protection)');
  assert(healthRes.headers['x-xss-protection'] === '1; mode=block', 'X-XSS-Protection header active');
  assert(healthRes.headers['referrer-policy'] === 'strict-origin-when-cross-origin', 'Referrer-Policy configured');
  assert(healthRes.headers['content-security-policy']?.includes("default-src 'self'"), 'Content Security Policy (CSP) header enforced');

  // 2. Sensitive File Interception Audit
  console.log('\n2. Auditing Sensitive File Access Protection...');
  const sensitiveFiles = [
    '/.env',
    '/.env.production',
    '/.git/config',
    '/data/app.db',
    '/backend/server.js',
    '/package.json'
  ];

  for (const file of sensitiveFiles) {
    const res = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: file,
      method: 'GET'
    });
    assert(res.statusCode === 403, `Access to ${file} forbidden (HTTP 403)`);
  }

  // 3. Unauthenticated Protected Route Audit
  console.log('\n3. Auditing Route Authentication Protection...');
  const protectedPaths = [
    { path: '/api/auth/me', method: 'GET' },
    { path: '/api/cloud-backup/sync-now', method: 'POST' },
    { path: '/api/cloud-backup/export', method: 'GET' },
    { path: '/api/cloud-backup/download', method: 'GET' },
    { path: '/api/cloud-provider/status', method: 'GET' }
  ];

  for (const { path, method } of protectedPaths) {
    const res = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path,
      method
    });
    assert(res.statusCode === 401, `Unauthorized request to ${path} returns HTTP 401`);
  }

  // 4. Authenticate as Owner and Test Token Generation
  console.log('\n4. Auditing Authentication Flow & Session Protection...');
  const loginRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  }, JSON.stringify({
    username: 'owner',
    password: 'Owner@123'
  }));

  assert(loginRes.statusCode === 200, 'Valid credentials authenticate successfully');
  const loginData = JSON.parse(loginRes.body);
  const token = loginData.token;
  assert(typeof token === 'string' && token.length > 30, 'Secure session token issued');

  // Test invalid login
  const badLoginRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  }, JSON.stringify({
    username: 'owner',
    password: 'WrongPassword'
  }));
  assert(badLoginRes.statusCode === 401, 'Invalid password rejected with HTTP 401');

  // 5. Test Clean JSON Cloud Backup Export
  console.log('\n5. Auditing Clean JSON Cloud Backup Export (/api/cloud-backup/export)...');
  const exportRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/cloud-backup/export',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  assert(exportRes.statusCode === 200, 'Cloud backup export returns HTTP 200');
  assert(exportRes.headers['content-type']?.includes('application/json'), 'Export has Content-Type: application/json');
  assert(exportRes.headers['content-disposition']?.includes('attachment; filename="business_backup_'), 'Content-Disposition attachment set for easy download');
  
  let exportData;
  try {
    exportData = JSON.parse(exportRes.body);
  } catch (e) {
    exportData = null;
  }
  assert(exportData && exportData.backup_type === 'clean_business_records', 'Export JSON contains clean_business_records format');
  assert(exportData && Array.isArray(exportData.sales), 'Export JSON contains structured sales data');
  assert(exportData && Array.isArray(exportData.expenses), 'Export JSON contains structured expenses data');
  assert(exportData && Array.isArray(exportData.inventory_varieties), 'Export JSON contains structured inventory varieties');

  // 6. Test Input Sanitization (XSS Defense)
  console.log('\n6. Auditing Recursive Input Sanitization & XSS Defense...');
  const xssExpenseRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/expenses',
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }, JSON.stringify({
    expense_date: new Date().toISOString().split('T')[0],
    expense_type: 'Other expenses',
    amount: 150,
    description: 'Electricity Bill <script>alert("hack")</script> <b onmouseover="alert(1)">Paid</b>'
  }));

  assert(xssExpenseRes.statusCode === 201, 'Expense created successfully with sanitization');
  const createdExpense = JSON.parse(xssExpenseRes.body).data;
  assert(!createdExpense.description.includes('<script>'), 'Script tag stripped from description');
  assert(!createdExpense.description.includes('onmouseover'), 'Dangerous DOM event stripped from description');

  // 7. Verify Rate Limiting
  console.log('\n7. Auditing Rate Limiting...');
  assert(healthRes.headers['x-ratelimit-limit'] === '180', 'X-RateLimit-Limit is configured at 180 req/min');
  assert(parseInt(healthRes.headers['x-ratelimit-remaining']) >= 0, 'X-RateLimit-Remaining tracked correctly');

  // 8. Static Frontend Serving Audit
  console.log('\n8. Auditing Frontend Assets & SPA Routing...');
  const rootRes = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/',
    method: 'GET'
  });
  assert(rootRes.statusCode === 200, 'Frontend index.html served at root path (HTTP 200)');
  assert(rootRes.body.includes('<!doctype html>') || rootRes.body.includes('<!DOCTYPE html>'), 'Valid HTML served at root');
  assert(rootRes.body.includes('/assets/index-'), 'Vite bundled assets linked properly in HTML');

  console.log(`\n======================================================`);
  console.log(`SECURITY AUDIT RESULT: ${passedTests} / ${totalTests} TESTS PASSED`);
  console.log(`======================================================\n`);
}

runSecurityAudit().catch(err => {
  console.error('Audit failed with error:', err);
  process.exit(1);
});
