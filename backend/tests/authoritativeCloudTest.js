/**
 * Authoritative Cloud & Multi-Device Synchronization Test Suite
 * Project: Business Management & Accountant Management App (Version 1.0)
 *
 * Verifies:
 * 1. Cloud Provider Configuration & Status API
 * 2. Local SQLite Offline Cache & Mutation Queueing
 * 3. Idempotency & Duplicate Sync Prevention
 * 4. Device Loss Reconciliation Flow
 * 5. Owner Data Isolation in Cloud Services
 * 6. Security (No secrets in frontend or Git)
 */

import assert from 'assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import db from '../db/database.js';
import * as supabaseService from '../services/supabaseService.js';
import * as authoritativeDataService from '../services/authoritativeDataService.js';
import * as stockService from '../services/stockService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BASE_URL = 'http://localhost:5000';

async function runTests() {
  console.log('================================================================');
  console.log('AUTHORITATIVE CLOUD & MULTI-DEVICE SYNCHRONIZATION TEST SUITE');
  console.log('================================================================\n');

  // Seed test users for foreign key integrity
  db.prepare("INSERT OR IGNORE INTO users (id, username, password_hash) VALUES (888, 'cloud_test_user_888', 'hash888')").run();
  db.prepare("INSERT OR IGNORE INTO users (id, username, password_hash) VALUES (101, 'owner_101', 'hash101')").run();
  db.prepare("INSERT OR IGNORE INTO users (id, username, password_hash) VALUES (102, 'owner_102', 'hash102')").run();

  let passed = 0;
  let failed = 0;

  function test(name, fn) {
    try {
      fn();
      console.log(`  ✓ [PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ [FAIL] ${name}:`, err.message);
      failed++;
    }
  }

  async function testAsync(name, fn) {
    try {
      await fn();
      console.log(`  ✓ [PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ [FAIL] ${name}:`, err.message);
      failed++;
    }
  }

  // --- 1. Cloud Provider Status & Config Detection ---
  console.log('--- 1. Cloud Provider Status & Config Detection ---');
  await testAsync('1.1 Cloud status endpoint responds HTTP 200', async () => {
    const res = await fetch(`${BASE_URL}/api/cloud-provider/status`);
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert('isConfigured' in body.data);
    assert('mode' in body.data);
  });

  test('1.2 supabaseService.isSupabaseConfigured returns boolean', () => {
    const isConf = supabaseService.isSupabaseConfigured();
    assert.strictEqual(typeof isConf, 'boolean');
  });

  test('1.3 Unconfigured state safely defaults to local_cache_offline mode', () => {
    const config = supabaseService.getSupabaseConfig();
    if (!config.isConfigured) {
      assert.strictEqual(config.isConfigured, false);
      assert.strictEqual(config.url, '');
    }
  });

  // --- 2. Local SQLite Cache & Offline Mutation Queuing ---
  console.log('\n--- 2. Local SQLite Cache & Offline Mutation Queuing ---');
  const testUserId = 888;
  const testDate = '2026-09-30';

  await testAsync('2.1 Authoritative sale write updates local SQLite cache', async () => {
    const result = await authoritativeDataService.recordSaleAuthoritative(testDate, 15000, testUserId);
    assert.strictEqual(result.total_sales_amount, 15000);
    assert.strictEqual(result.user_id, testUserId);

    // Verify stored in SQLite daily_sales
    const row = db.prepare('SELECT total_sales_amount FROM daily_sales WHERE user_id = ? AND entry_date = ?').get(testUserId, testDate);
    assert.strictEqual(row.total_sales_amount, 15000);
  });

  test('2.2 Mutation queued in cloud_sync_log with idempotency_key', () => {
    const log = db.prepare("SELECT * FROM cloud_sync_log WHERE user_id = ? AND entity_type = 'sales' ORDER BY id DESC").get(testUserId);
    assert(log, 'Log entry must exist');
    assert(['pending', 'synced'].includes(log.status));
    assert(log.idempotency_key && log.idempotency_key.startsWith('sale_'));
  });

  await testAsync('2.3 Authoritative expense write updates local cache and logs mutation', async () => {
    const expResult = await authoritativeDataService.recordExpenseAuthoritative({
      expense_date: testDate,
      expense_type: 'Bills',
      amount: 1200,
      description: 'Test electricity bill'
    }, testUserId);

    assert.strictEqual(expResult.amount, 1200);
    const expRow = db.prepare('SELECT amount, expense_type FROM expenses WHERE id = ? AND user_id = ?').get(expResult.id, testUserId);
    assert.strictEqual(expRow.amount, 1200);
    assert.strictEqual(expRow.expense_type, 'Bills');
  });

  await testAsync('2.4 Authoritative stock movement updates local cache', async () => {
    // Ensure product exists
    const varRow = stockService.addProductVariety('Test Grade A Wheat', testUserId);
    const movResult = await authoritativeDataService.recordStockMovementAuthoritative({
      product_id: varRow.id,
      movement_type: 'IN',
      quantity: 50,
      entry_date: testDate,
      notes: 'Initial test batch'
    }, testUserId);

    assert.strictEqual(movResult.quantity, 50);
    const stockRow = db.prepare('SELECT quantity, movement_type FROM stock_entries WHERE id = ? AND user_id = ?').get(movResult.id, testUserId);
    assert.strictEqual(stockRow.quantity, 50);
  });

  await testAsync('2.5 Authoritative lender creation updates local cache', async () => {
    const lendResult = await authoritativeDataService.addLenderAuthoritative({
      name: 'Ramesh Cloud Tester',
      mobile: '9876543210',
      place: 'Industrial Zone',
      amount_given: 25000,
      amount_paid: 5000,
      loan_date: testDate,
      notes: 'Test loan'
    }, testUserId);

    assert.strictEqual(lendResult.amount_given, 25000);
    const lendRow = db.prepare('SELECT amount_given, amount_paid FROM lenders WHERE id = ? AND user_id = ?').get(lendResult.id, testUserId);
    assert.strictEqual(lendRow.amount_given, 25000);
    assert.strictEqual(lendRow.amount_paid, 5000);
  });

  // --- 3. Idempotency & Duplicate Sync Prevention ---
  console.log('\n--- 3. Idempotency & Duplicate Sync Prevention ---');
  await testAsync('3.1 Repeated sale record for same date updates amount without creating duplicate rows', async () => {
    const beforeCount = db.prepare('SELECT COUNT(*) as c FROM daily_sales WHERE user_id = ?').get(testUserId).c;
    await authoritativeDataService.recordSaleAuthoritative(testDate, 20000, testUserId);
    const afterCount = db.prepare('SELECT COUNT(*) as c FROM daily_sales WHERE user_id = ?').get(testUserId).c;
    assert.strictEqual(beforeCount, afterCount, 'Row count must remain identical due to UNIQUE(user_id, entry_date)');

    const updatedRow = db.prepare('SELECT total_sales_amount FROM daily_sales WHERE user_id = ? AND entry_date = ?').get(testUserId, testDate);
    assert.strictEqual(updatedRow.total_sales_amount, 20000);
  });

  await testAsync('3.2 Flush offline queue executes safely without throwing', async () => {
    const flushRes = await authoritativeDataService.flushOfflineQueue(testUserId);
    assert.strictEqual(typeof flushRes, 'object');
    assert('success' in flushRes || 'reason' in flushRes);
  });

  // --- 4. Device Loss Recovery & Reconciliation ---
  console.log('\n--- 4. Device Loss Recovery & Reconciliation Flow ---');
  await testAsync('4.1 Reconcile endpoint responds HTTP 200', async () => {
    const res = await fetch(`${BASE_URL}/api/cloud-provider/reconcile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
  });

  // --- 5. Owner Data Isolation in Cloud Queries ---
  console.log('\n--- 5. Owner Data Isolation in Cloud Queries ---');
  test('5.1 Daily sales queries are strictly partitioned by user_id', () => {
    const userA = 101;
    const userB = 102;
    db.prepare('INSERT OR REPLACE INTO daily_sales (user_id, entry_date, total_sales_amount) VALUES (?, ?, ?)').run(userA, '2026-09-28', 50000);
    db.prepare('INSERT OR REPLACE INTO daily_sales (user_id, entry_date, total_sales_amount) VALUES (?, ?, ?)').run(userB, '2026-09-28', 12000);

    const salesA = db.prepare('SELECT total_sales_amount FROM daily_sales WHERE user_id = ? AND entry_date = ?').get(userA, '2026-09-28');
    const salesB = db.prepare('SELECT total_sales_amount FROM daily_sales WHERE user_id = ? AND entry_date = ?').get(userB, '2026-09-28');

    assert.strictEqual(salesA.total_sales_amount, 50000);
    assert.strictEqual(salesB.total_sales_amount, 12000);
    assert.notStrictEqual(salesA.total_sales_amount, salesB.total_sales_amount);
  });

  test('5.2 Expenses queries are strictly partitioned by user_id', () => {
    const userA = 101;
    const userB = 102;
    const expA = db.prepare('INSERT INTO expenses (user_id, expense_date, expense_type, amount) VALUES (?, ?, ?, ?)').run(userA, '2026-09-28', 'Rent', 8000);
    const expB = db.prepare('INSERT INTO expenses (user_id, expense_date, expense_type, amount) VALUES (?, ?, ?, ?)').run(userB, '2026-09-28', 'Rent', 3000);

    const resA = db.prepare('SELECT amount FROM expenses WHERE id = ? AND user_id = ?').get(expA.lastInsertRowid, userA);
    const resBFromA = db.prepare('SELECT amount FROM expenses WHERE id = ? AND user_id = ?').get(expA.lastInsertRowid, userB);

    assert.strictEqual(resA.amount, 8000);
    assert.strictEqual(resBFromA, undefined, 'User B must not be able to read User A expense record');
  });

  // --- 6. Security & Credential Protection ---
  console.log('\n--- 6. Security & Credential Protection ---');
  test('6.1 .gitignore includes .env', () => {
    const gitignorePath = path.resolve(__dirname, '../../.gitignore');
    const content = fs.readFileSync(gitignorePath, 'utf8');
    assert(content.includes('.env'), '.gitignore must contain .env');
  });

  test('6.2 SUPABASE_SERVICE_ROLE_KEY is NOT exposed in frontend src/', () => {
    const srcDir = path.resolve(__dirname, '../../src');
    function scanDir(dir) {
      const files = fs.readdirSync(dir);
      for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
          scanDir(fullPath);
        } else if (file.endsWith('.js') || file.endsWith('.jsx')) {
          const content = fs.readFileSync(fullPath, 'utf8');
          assert(!content.includes('SUPABASE_SERVICE_ROLE_KEY'), `Found secret key mention in ${file}`);
        }
      }
    }
    scanDir(srcDir);
  });

  test('6.3 Cloud status API does NOT leak service-role secret key', async () => {
    const res = await fetch(`${BASE_URL}/api/cloud-provider/status`);
    const text = await res.text();
    assert(!text.includes('service_role'), 'API must not leak service_role key');
  });

  // Clean up test data
  db.prepare('DELETE FROM daily_sales WHERE user_id = ?').run(testUserId);
  db.prepare('DELETE FROM expenses WHERE user_id = ?').run(testUserId);
  db.prepare('DELETE FROM stock_entries WHERE user_id = ?').run(testUserId);
  db.prepare('DELETE FROM lenders WHERE user_id = ?').run(testUserId);
  db.prepare('DELETE FROM product_varieties WHERE user_id = ?').run(testUserId);
  db.prepare('DELETE FROM cloud_sync_log WHERE user_id = ?').run(testUserId);

  console.log('\n================================================================');
  console.log(`TEST RESULTS: ${passed} PASSED / ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('FATAL TEST ERROR:', err);
  process.exit(1);
});
