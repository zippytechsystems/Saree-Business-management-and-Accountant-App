import assert from 'node:assert';
import app from '../backend/server.js';
import http from 'node:http';

const server = http.createServer(app);

server.listen(0, async () => {
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}`;

  console.log(`[Test Runner] Started on ${baseUrl}`);

  try {
    // 1. Create a test owner account
    const username = `owner_${Date.now()}`;
    const password = 'TestPassword123!';

    const signupRes = await fetch(`${baseUrl}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, confirmPassword: password }),
    });
    const signupData = await signupRes.json();
    assert.strictEqual(signupRes.status, 201, 'Signup must return 201');
    const token = signupData.token;

    // 2. Set initial profile with shop_code = "4321"
    const profileRes = await fetch(`${baseUrl}/api/business-profile`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        business_name: 'Test Saree Store',
        business_address: 'Main Market, Hyderabad',
        business_nickname: 'Test Store',
        shop_code: '4321',
      }),
    });
    const profileData = await profileRes.json();
    assert.strictEqual(profileRes.status, 200, 'Profile creation must return 200');
    assert.strictEqual(profileData.data.shop_code, '4321', 'Shop code should be 4321');

    console.log('✓ Test 1 Passed: User and Business Profile created with shop_code = 4321');

    // 3. Test wrong shop code verification: MUST FAIL!
    const wrongCodeRes = await fetch(`${baseUrl}/api/auth/verify-shop-code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ shop_code: '9999' }),
    });
    const wrongCodeData = await wrongCodeRes.json();
    assert.strictEqual(wrongCodeRes.status, 400, 'Wrong shop code must return 400 Bad Request');
    assert.strictEqual(wrongCodeData.success, false, 'Wrong shop code success must be false');
    assert.strictEqual(wrongCodeData.verified, false, 'Wrong shop code verified must be false');
    console.log('✓ Test 2 Passed: Wrong shop code (9999) rejected with 400 and does NOT unlock');

    // 4. Test correct shop code verification: MUST SUCCEED!
    const correctCodeRes = await fetch(`${baseUrl}/api/auth/verify-shop-code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ shop_code: '4321' }),
    });
    const correctCodeData = await correctCodeRes.json();
    assert.strictEqual(correctCodeRes.status, 200, 'Correct shop code must return 200 OK');
    assert.strictEqual(correctCodeData.success, true, 'Correct shop code success must be true');
    assert.strictEqual(correctCodeData.verified, true, 'Correct shop code verified must be true');
    console.log('✓ Test 3 Passed: Correct shop code (4321) accepted with 200 and unlocks');

    // 5. Test Forgot Shop Code flow - Step 1: Wrong credentials
    const badLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password: 'WrongPassword' }),
    });
    assert.strictEqual(badLoginRes.status, 401, 'Bad credentials in forgot flow must return 401');
    console.log('✓ Test 4 Passed: Forgot Shop Code Step 1 rejects wrong password');

    // 6. Test Forgot Shop Code flow - Step 1: Correct credentials
    const goodLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const goodLoginData = await goodLoginRes.json();
    assert.strictEqual(goodLoginRes.status, 200, 'Valid credentials in forgot flow must return 200');
    assert.ok(goodLoginData.token, 'Must return new auth token');
    console.log('✓ Test 5 Passed: Forgot Shop Code Step 1 succeeds with username & password');

    // 7. Test Forgot Shop Code flow - Step 2: Set New Shop Code (e.g. 7890)
    const resetRes = await fetch(`${baseUrl}/api/auth/reset-shop-code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${goodLoginData.token}`,
      },
      body: JSON.stringify({ shop_code: '7890' }),
    });
    const resetData = await resetRes.json();
    assert.strictEqual(resetRes.status, 200, 'Reset shop code must return 200');
    assert.strictEqual(resetData.shop_code, '7890', 'Updated shop code must be 7890');
    console.log('✓ Test 6 Passed: Forgot Shop Code Step 2 successfully sets new code 7890');

    // 8. Verify OLD code now FAILS and NEW code SUCCEEDS
    const oldCodeRes = await fetch(`${baseUrl}/api/auth/verify-shop-code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${goodLoginData.token}`,
      },
      body: JSON.stringify({ shop_code: '4321' }),
    });
    assert.strictEqual(oldCodeRes.status, 400, 'Old shop code 4321 must now be rejected');

    const newCodeVerifyRes = await fetch(`${baseUrl}/api/auth/verify-shop-code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${goodLoginData.token}`,
      },
      body: JSON.stringify({ shop_code: '7890' }),
    });
    assert.strictEqual(newCodeVerifyRes.status, 200, 'New shop code 7890 must now unlock');
    console.log('✓ Test 7 Passed: Old code 4321 rejected, new code 7890 verified');

    // 9. Verify Settings Screen fetching & saving profile
    const getProfileRes = await fetch(`${baseUrl}/api/business-profile`, {
      headers: { Authorization: `Bearer ${goodLoginData.token}` },
    });
    const currentProfile = await getProfileRes.json();
    assert.strictEqual(currentProfile.data.shop_code, '7890', 'Settings profile must reflect updated shop code 7890');

    // Edit profile in settings
    const editProfileRes = await fetch(`${baseUrl}/api/business-profile`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${goodLoginData.token}`,
      },
      body: JSON.stringify({
        business_name: 'Super Saree Emporium',
        business_address: 'MG Road, Secunderabad',
        business_nickname: 'Super Saree',
        shop_code: '5555',
      }),
    });
    const editData = await editProfileRes.json();
    assert.strictEqual(editProfileRes.status, 200, 'Edit profile must succeed');
    assert.strictEqual(editData.data.business_name, 'Super Saree Emporium', 'Business name must update');
    assert.strictEqual(editData.data.shop_code, '5555', 'Shop code in settings must update to 5555');
    console.log('✓ Test 8 Passed: Settings profile edit immediately updates business name and shop code');

    console.log('\n=========================================');
    console.log('ALL 8 INTEGRATION TESTS PASSED 100%!');
    console.log('=========================================');
    server.close();
    process.exit(0);
  } catch (err) {
    console.error('❌ Test failed:', err);
    server.close();
    process.exit(1);
  }
});
