/**
 * Targeted Signup Flow Verification Script
 * Validates the Create Owner Account flow from HTTP request to MySQL transaction,
 * ensuring JSON-only responses, HTTP status codes, scrypt hashing, and ACID atomicity.
 */

import 'dotenv/config';
import http from 'http';
import app from '../server.js';
import * as mysql from '../db/mysql.js';

let server;
const PORT = 5566;

function makeRequest(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const reqHeaders = {
      Accept: 'application/json',
      ...headers,
    };
    if (payload) {
      reqHeaders['Content-Type'] = 'application/json';
      reqHeaders['Content-Length'] = Buffer.byteLength(payload);
    }

    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: PORT,
        path,
        method,
        headers: reqHeaders,
      },
      (res) => {
        let raw = '';
        res.on('data', (chunk) => (raw += chunk));
        res.on('end', () => {
          const contentType = res.headers['content-type'] || '';
          let json = null;
          let isJson = false;
          if (contentType.includes('application/json')) {
            try {
              json = JSON.parse(raw);
              isJson = true;
            } catch (e) {
              isJson = false;
            }
          }
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            contentType,
            raw,
            json,
            isJson,
          });
        });
      }
    );

    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function runTests() {
  console.log('=== STARTING SIGNUP FLOW COMPREHENSIVE VERIFICATION ===\n');

  // Start temporary HTTP server on port 5566
  server = app.listen(PORT);
  await new Promise((r) => setTimeout(r, 800));

  let passed = 0;
  let total = 0;

  function assert(desc, condition, details = '') {
    total++;
    if (condition) {
      console.log(`✓ [PASS] ${desc}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${desc} - ${details}`);
      throw new Error(`Assertion failed: ${desc}`);
    }
  }

  const timestamp = Date.now();
  const testOwner = `owner_${timestamp}`;
  const testPass = 'OwnerSecret2026!';

  // TEST 1: Unhandled /api route returns JSON 404, NEVER HTML
  console.log('\n--- Test 1: Verifying API 404 handler returns pure JSON ---');
  const res404 = await makeRequest('POST', '/api/unhandled/route', { dummy: 1 });
  assert('API 404 returns HTTP 404', res404.statusCode === 404, `got ${res404.statusCode}`);
  assert('API 404 Content-Type is application/json', res404.contentType.includes('application/json'), `got ${res404.contentType}`);
  assert('API 404 body does not contain HTML <!DOCTYPE', !res404.raw.includes('<!DOCTYPE'), 'contained HTML');
  assert('API 404 JSON has success=false and useful error', res404.json?.success === false && Boolean(res404.json?.error));

  // TEST 2: Signup with missing/short username returns HTTP 400 JSON
  console.log('\n--- Test 2: Validating username constraints ---');
  const resShortUser = await makeRequest('POST', '/api/auth/signup', {
    username: 'ab',
    password: testPass,
    confirmPassword: testPass,
  });
  assert('Short username returns HTTP 400', resShortUser.statusCode === 400, `got ${resShortUser.statusCode}`);
  assert('Short username returns JSON', resShortUser.isJson, resShortUser.raw);
  assert('Error message mentions username length', resShortUser.json?.error.includes('between 3 and 50 characters'));

  // TEST 3: Signup with short password returns HTTP 400 JSON
  console.log('\n--- Test 3: Validating password length constraints ---');
  const resShortPass = await makeRequest('POST', '/api/auth/signup', {
    username: testOwner,
    password: '123',
    confirmPassword: '123',
  });
  assert('Short password returns HTTP 400', resShortPass.statusCode === 400, `got ${resShortPass.statusCode}`);
  assert('Short password returns JSON', resShortPass.isJson, resShortPass.raw);
  assert('Error message mentions password length', resShortPass.json?.error.includes('at least 6 characters'));

  // TEST 4: Signup with mismatched passwords returns HTTP 400 JSON
  console.log('\n--- Test 4: Validating password confirmation match ---');
  const resMismatch = await makeRequest('POST', '/api/auth/signup', {
    username: testOwner,
    password: testPass,
    confirmPassword: 'DifferentPassword!',
  });
  assert('Mismatched password returns HTTP 400', resMismatch.statusCode === 400, `got ${resMismatch.statusCode}`);
  assert('Mismatched password returns JSON', resMismatch.isJson, resMismatch.raw);
  assert('Error message mentions password match', resMismatch.json?.error.includes('do not match'));

  // TEST 5: Successful signup creates account, returns HTTP 201 with pure JSON
  console.log('\n--- Test 5: Successful Owner Account Creation Flow ---');
  const resSignup = await makeRequest('POST', '/api/auth/signup', {
    username: testOwner,
    password: testPass,
    confirmPassword: testPass,
  });
  assert('Signup returns HTTP 201 Created', resSignup.statusCode === 201, `got ${resSignup.statusCode}`);
  assert('Signup returns application/json Content-Type', resSignup.contentType.includes('application/json'), `got ${resSignup.contentType}`);
  assert('Signup returns JSON body with success=true', resSignup.json?.success === true);
  assert('Signup returns valid JWT-style token', Boolean(resSignup.json?.token && resSignup.json.token.includes('.')));
  assert('Signup returns user object with id and username', resSignup.json?.user?.username === testOwner);
  assert('Signup returns business_profile', Boolean(resSignup.json?.business_profile));

  const userId = resSignup.json.user.id;

  // TEST 6: Verify MySQL atomic transaction state
  console.log('\n--- Test 6: Verifying MySQL records in Hostinger Database ---');
  const [userRows] = await mysql.query('SELECT id, username, password_hash FROM users WHERE id = ?', [userId]);
  assert('User record exists in MySQL users table', userRows.length === 1);
  assert('Password is NOT stored in plaintext', userRows[0].password_hash !== testPass);
  assert('Password hash uses scrypt format (scrypt:salt:hash)', userRows[0].password_hash.startsWith('scrypt:'));

  const [sessionRows] = await mysql.query('SELECT id, token, user_id FROM sessions WHERE user_id = ?', [userId]);
  assert('Session record exists in MySQL sessions table', sessionRows.length >= 1);
  assert('Session token matches returned token', sessionRows[0].token === resSignup.json.token);

  const [profileRows] = await mysql.query('SELECT id, business_name FROM business_profiles WHERE user_id = ?', [userId]);
  assert('Business profile record exists in MySQL business_profiles table', profileRows.length === 1);
  assert('Business profile name matches owner', profileRows[0].business_name.includes(testOwner));

  // TEST 7: Duplicate username signup returns HTTP 409 Conflict with pure JSON
  console.log('\n--- Test 7: Duplicate username conflict handling ---');
  const resDuplicate = await makeRequest('POST', '/api/auth/signup', {
    username: testOwner,
    password: 'AnotherPassword123!',
    confirmPassword: 'AnotherPassword123!',
  });
  assert('Duplicate username returns HTTP 409 Conflict', resDuplicate.statusCode === 409, `got ${resDuplicate.statusCode}`);
  assert('Duplicate username returns JSON', resDuplicate.isJson, resDuplicate.raw);
  assert('Error message informs username is already taken', resDuplicate.json?.error.includes('already taken'));

  // TEST 8: Login with created owner credentials works and returns HTTP 200 JSON
  console.log('\n--- Test 8: Login with newly created owner account ---');
  const resLogin = await makeRequest('POST', '/api/auth/login', {
    username: testOwner,
    password: testPass,
  });
  assert('Login returns HTTP 200 OK', resLogin.statusCode === 200, `got ${resLogin.statusCode}`);
  assert('Login returns JSON with success=true and token', resLogin.json?.success === true && Boolean(resLogin.json?.token));

  // TEST 9: Authenticated session check with Bearer token
  console.log('\n--- Test 9: Verify /api/auth/me using Bearer token ---');
  const resMe = await makeRequest('GET', '/api/auth/me', null, {
    Authorization: `Bearer ${resLogin.json.token}`,
  });
  assert('/api/auth/me returns HTTP 200 OK', resMe.statusCode === 200, `got ${resMe.statusCode}`);
  assert('/api/auth/me returns owner user and profile', resMe.json?.user?.username === testOwner);

  // Clean up test owner
  console.log('\n--- Clean up test data from MySQL ---');
  await mysql.query('DELETE FROM sessions WHERE user_id = ?', [userId]);
  await mysql.query('DELETE FROM business_profiles WHERE user_id = ?', [userId]);
  await mysql.query('DELETE FROM users WHERE id = ?', [userId]);
  console.log('✓ Cleaned test data.');

  console.log(`\n=======================================================`);
  console.log(`🎉 ALL ${passed}/${total} SIGNUP FLOW CHECKS PASSED SUCCESSFULLY!`);
  console.log(`=======================================================`);
}

runTests()
  .then(() => {
    if (server) server.close();
    process.exit(0);
  })
  .catch((err) => {
    console.error('Test suite failed:', err);
    if (server) server.close();
    process.exit(1);
  });
