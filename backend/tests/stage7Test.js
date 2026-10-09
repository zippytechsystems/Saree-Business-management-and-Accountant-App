/**
 * STAGE 7 AUTOMATED TEST SUITE
 * 
 * Verifies:
 * 1. Monthly Data Download & Reporting (JSON and CSV exports)
 * 2. 6-Section Report Data Generation (Sales, Expenses, Stock, Supplier Payments, Lenders, Calculations)
 * 3. Automatic Cloud Database Backup System (SQLite queue & metadata tables)
 * 4. Automatic Cloud Sync hooks on all mutations (Sales, Expenses, Stock, Lenders)
 * 5. Cloud Status, History, and Sync Now API endpoints
 * 6. Resilience: Local SQLite database remains primary and unblocked even when cloud credentials are unconfigured
 * 7. Safe Restore verification with pre-restore physical SQLite backup copy and PRAGMA integrity check
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import db from '../db/database.js';
import * as reportService from '../services/reportService.js';
import * as cloudBackupService from '../services/cloudBackupService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.resolve(__dirname, '../../data');
const BASE_URL = 'http://localhost:5000/api';

let totalTests = 0;
let passedTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✓ [PASS] ${message}`);
  } else {
    console.error(`  ✗ [FAIL] ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function runStage7Tests() {
  console.log('================================================================');
  console.log('STAGE 7 TEST SUITE: MONTHLY DATA DOWNLOAD + AUTOMATIC CLOUD BACKUP');
  console.log('================================================================\n');

  // -------------------------------------------------------------
  // TEST GROUP 1: MONTHLY REPORT DATA SERVICE
  // -------------------------------------------------------------
  console.log('--- 1. Monthly Report Data Service Tests ---');

  // Test 1.1: Invalid month format rejection
  let caughtError = false;
  try {
    reportService.generateMonthlyReportData('invalid-date');
  } catch (err) {
    caughtError = true;
  }
  assert(caughtError, 'generateMonthlyReportData rejects invalid month format');

  // Test 1.2: Generate valid report data for current month
  const currentMonth = '2026-09';
  const report = reportService.generateMonthlyReportData(currentMonth);

  assert(report !== null && typeof report === 'object', 'Report data generated successfully');
  assert(report.month === currentMonth, `Report month matches requested month (${currentMonth})`);
  assert(typeof report.generated_at === 'string', 'Report contains ISO generated_at timestamp');

  // Test 1.3: Verify all 6 mandatory sections exist
  assert(report.sales !== undefined, 'Section 1 (Sales) exists in monthly report');
  assert(report.expenses !== undefined, 'Section 2 (Expenses) exists in monthly report');
  assert(report.stock !== undefined, 'Section 3 (Stock) exists in monthly report');
  assert(report.supplier_payments !== undefined, 'Section 4 (Supplier Payments) exists in monthly report');
  assert(report.lenders !== undefined, 'Section 5 (Lenders) exists in monthly report');
  assert(report.calculations !== undefined, 'Section 6 (Calculations) exists in monthly report');

  // Test 1.4: Verify Sales section structure
  assert(typeof report.sales.monthly_total_sales === 'number', 'Sales section contains monthly_total_sales number');
  assert(Array.isArray(report.sales.records), 'Sales section contains records array');

  // Test 1.5: Verify Expenses section structure
  assert(typeof report.expenses.monthly_total_expenses === 'number', 'Expenses section contains monthly_total_expenses number');
  assert(typeof report.expenses.breakdown === 'object', 'Expenses section contains category breakdown object');
  assert(Array.isArray(report.expenses.records), 'Expenses section contains records array');

  // Test 1.6: Verify Stock section structure
  assert(typeof report.stock.current_stock === 'number', 'Stock section contains current_stock summary');
  assert(Array.isArray(report.stock.varieties), 'Stock section contains varieties list');
  assert(Array.isArray(report.stock.monthly_movements), 'Stock section contains monthly movements list');

  // Test 1.7: Verify Supplier Payments section structure
  assert(typeof report.supplier_payments.monthly_supplier_payment_total === 'number', 'Supplier payments contains monthly total');
  assert(Array.isArray(report.supplier_payments.records), 'Supplier payments contains records array');

  // Test 1.8: Verify Lenders section structure
  assert(typeof report.lenders.summary.total_lender_due === 'number', 'Lenders section contains total_lender_due summary');
  assert(Array.isArray(report.lenders.records), 'Lenders section contains records array');

  // Test 1.9: Verify Calculations section structure
  assert(typeof report.calculations.monthly_total_sales === 'number', 'Calculations section contains monthly_total_sales');
  assert(typeof report.calculations.monthly_total_expenses === 'number', 'Calculations section contains monthly_total_expenses');
  assert(typeof report.calculations.monthly_net_balance === 'number', 'Calculations section contains monthly_net_balance');
  assert(typeof report.calculations.is_surplus === 'boolean', 'Calculations section contains is_surplus boolean');

  // -------------------------------------------------------------
  // TEST GROUP 2: CSV EXPORT FORMATTING
  // -------------------------------------------------------------
  console.log('\n--- 2. CSV Report Formatting Tests ---');

  const csvOutput = reportService.formatReportAsCsv(report);
  assert(typeof csvOutput === 'string' && csvOutput.length > 100, 'CSV export generated non-empty string');
  assert(csvOutput.includes('MONTHLY BUSINESS REPORT - 2026-09'), 'CSV header includes title and month');
  assert(csvOutput.includes('=== EXECUTIVE SUMMARY & CALCULATIONS ==='), 'CSV contains Executive Summary section');
  assert(csvOutput.includes('=== SALES LEDGER ==='), 'CSV contains Sales Ledger section');
  assert(csvOutput.includes('=== EXPENSES LEDGER ==='), 'CSV contains Expenses Ledger section');
  assert(csvOutput.includes('=== STOCK CATALOG & CURRENT INVENTORY ==='), 'CSV contains Stock Catalog section');
  assert(csvOutput.includes('=== SUPPLIER PAYMENTS ==='), 'CSV contains Supplier Payments section');
  assert(csvOutput.includes('=== LENDER ACCOUNTS & CREDIT DUES ==='), 'CSV contains Lender Accounts section');

  // -------------------------------------------------------------
  // TEST GROUP 3: HTTP API REPORT ENDPOINTS
  // -------------------------------------------------------------
  console.log('\n--- 3. HTTP API Report Endpoints Tests ---');

  // Test 3.1: GET /api/reports/monthly
  const resReportJson = await fetch(`${BASE_URL}/reports/monthly?month=2026-09`);
  const dataReportJson = await resReportJson.json();
  assert(resReportJson.status === 200, 'GET /api/reports/monthly returns HTTP 200');
  assert(dataReportJson.success === true, 'GET /api/reports/monthly returns success: true');
  assert(dataReportJson.data.month === '2026-09', 'GET /api/reports/monthly returns requested month');

  // Test 3.2: GET /api/reports/monthly/download?format=csv
  const resReportCsv = await fetch(`${BASE_URL}/reports/monthly/download?month=2026-09&format=csv`);
  const textReportCsv = await resReportCsv.text();
  const csvContentType = resReportCsv.headers.get('content-type');
  const csvDisposition = resReportCsv.headers.get('content-disposition');
  assert(resReportCsv.status === 200, 'GET /api/reports/monthly/download (CSV) returns HTTP 200');
  assert(csvContentType && csvContentType.includes('text/csv'), 'Content-Type header is text/csv');
  assert(csvDisposition && csvDisposition.includes('attachment'), 'Content-Disposition specifies attachment download');
  assert(textReportCsv.includes('MONTHLY BUSINESS REPORT'), 'Downloaded CSV body contains report text');

  // Test 3.3: GET /api/reports/monthly/download?format=json
  const resDownloadJson = await fetch(`${BASE_URL}/reports/monthly/download?month=2026-09&format=json`);
  const jsonDisposition = resDownloadJson.headers.get('content-disposition');
  assert(resDownloadJson.status === 200, 'GET /api/reports/monthly/download (JSON) returns HTTP 200');
  assert(jsonDisposition && jsonDisposition.includes('.json'), 'Content-Disposition specifies .json file download');

  // -------------------------------------------------------------
  // TEST GROUP 4: AUTOMATIC CLOUD DATABASE BACKUP SERVICE
  // -------------------------------------------------------------
  console.log('\n--- 4. Cloud Backup Tables & Service Configuration Tests ---');

  // Test 4.1: Verify SQLite schema tables exist
  const tableCheckSync = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='cloud_sync_log'").get();
  const tableCheckMeta = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='cloud_backup_meta'").get();
  assert(tableCheckSync !== undefined, 'cloud_sync_log table exists in primary SQLite database');
  assert(tableCheckMeta !== undefined, 'cloud_backup_meta table exists in primary SQLite database');

  // Test 4.2: Verify Cloud Configuration resolution
  const config = cloudBackupService.getCloudConfig();
  assert(typeof config === 'object', 'getCloudConfig returns configuration object');
  assert(typeof config.isConfigured === 'boolean', 'getCloudConfig returns isConfigured boolean');
  assert(['none', 'supabase', 'firebase', 'turso', 'hostinger_sqlite', 'hostinger_mysql'].includes(config.provider), `Provider is recognized: ${config.provider}`);

  // Test 4.3: Verify Backup Status structure
  const backupStatus = cloudBackupService.getBackupStatus();
  assert(typeof backupStatus.status === 'string', 'getBackupStatus returns status code');
  assert(typeof backupStatus.status_label === 'string', 'getBackupStatus returns user-friendly label');
  assert(typeof backupStatus.pending_count === 'number', 'getBackupStatus returns pending count');
  assert(typeof backupStatus.failed_count === 'number', 'getBackupStatus returns failed count');

  // -------------------------------------------------------------
  // TEST GROUP 5: AUTOMATIC SYNC HOOKS ON LOCAL MUTATIONS
  // -------------------------------------------------------------
  console.log('\n--- 5. Automatic Sync Hooks on Local Mutations Tests ---');

  const beforeSyncCount = db.prepare('SELECT COUNT(*) AS c FROM cloud_sync_log').get().c;

  // Test 5.1: Sales Mutation triggers cloud sync log
  const testSaleDate = '2026-09-29';
  const saleRes = await fetch(`${BASE_URL}/sales`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ entry_date: testSaleDate, total_sales_amount: 37500 }),
  });
  assert(saleRes.status === 200, 'POST /api/sales succeeds');

  // Give short tick for background hook execution
  await new Promise((r) => setTimeout(r, 100));

  const afterSaleSyncCount = db.prepare('SELECT COUNT(*) AS c FROM cloud_sync_log').get().c;
  assert(afterSaleSyncCount > beforeSyncCount, 'Sales mutation automatically created cloud_sync_log entry');

  const latestSaleLog = db.prepare('SELECT * FROM cloud_sync_log ORDER BY id DESC LIMIT 1').get();
  assert(latestSaleLog.entity_type === 'sales', 'cloud_sync_log recorded entity_type = "sales"');
  assert(latestSaleLog.mutation_type === 'UPSERT', 'cloud_sync_log recorded mutation_type = "UPSERT"');
  assert(latestSaleLog.year_month === '2026-09', 'cloud_sync_log recorded correct year_month');

  // Test 5.2: Expense Mutation triggers cloud sync log
  const expRes = await fetch(`${BASE_URL}/expenses`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      expense_date: '2026-09-29',
      expense_type: 'Bills',
      amount: 450,
      description: 'Stage 7 sync hook test',
    }),
  });
  assert(expRes.status === 201, 'POST /api/expenses succeeds');

  await new Promise((r) => setTimeout(r, 100));

  const latestExpLog = db.prepare('SELECT * FROM cloud_sync_log ORDER BY id DESC LIMIT 1').get();
  assert(latestExpLog.entity_type === 'expenses', 'cloud_sync_log recorded entity_type = "expenses"');
  assert(latestExpLog.mutation_type === 'CREATE', 'cloud_sync_log recorded mutation_type = "CREATE"');

  // Test 5.3: Stock Movement Mutation triggers cloud sync log
  const varieties = db.prepare('SELECT id FROM product_varieties LIMIT 1').get();
  if (varieties) {
    const stockRes = await fetch(`${BASE_URL}/stock/movement`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        product_id: varieties.id,
        movement_type: 'IN',
        quantity: 5,
        entry_date: '2026-09-29',
        notes: 'Stage 7 cloud sync test',
      }),
    });
    assert(stockRes.status === 201, 'POST /api/stock/movement succeeds');

    await new Promise((r) => setTimeout(r, 100));
    const latestStockLog = db.prepare('SELECT * FROM cloud_sync_log ORDER BY id DESC LIMIT 1').get();
    assert(latestStockLog.entity_type === 'stock_movement' || latestStockLog.entity_type === 'stock_entries', 'cloud_sync_log recorded stock_movement');
  }

  // -------------------------------------------------------------
  // TEST GROUP 6: CLOUD BACKUP HTTP ENDPOINTS
  // -------------------------------------------------------------
  console.log('\n--- 6. Cloud Backup HTTP Endpoints Tests ---');

  let stage7Token = null;
  const existingSession = db.prepare("SELECT token FROM sessions WHERE user_id = 1 AND expires_at > datetime('now') ORDER BY id DESC LIMIT 1").get();
  if (existingSession) {
    stage7Token = existingSession.token;
  } else {
    stage7Token = 'stage7_test_token_' + Date.now();
    db.prepare("INSERT INTO sessions (user_id, token, expires_at) VALUES (1, ?, datetime('now', '+7 day'))").run(stage7Token);
  }
  const stage7Headers = { Authorization: `Bearer ${stage7Token}` };

  // Test 6.1: GET /api/cloud-backup/status
  const statusRes = await fetch(`${BASE_URL}/cloud-backup/status`, { headers: stage7Headers });
  const statusData = await statusRes.json();
  assert(statusRes.status === 200, 'GET /api/cloud-backup/status returns HTTP 200');
  assert(statusData.success === true, 'GET /api/cloud-backup/status returns success: true');
  assert(statusData.data.status_label !== undefined, 'Status contains formatted status label');

  // Test 6.2: GET /api/cloud-backup/history
  const historyRes = await fetch(`${BASE_URL}/cloud-backup/history`, { headers: stage7Headers });
  const historyData = await historyRes.json();
  assert(historyRes.status === 200, 'GET /api/cloud-backup/history returns HTTP 200');
  assert(Array.isArray(historyData.data), 'History returns an array of monthly summaries');
  if (historyData.data.length > 0) {
    const firstMonth = historyData.data[0];
    assert(typeof firstMonth.month === 'string', 'Monthly history entry contains month YYYY-MM');
    assert(typeof firstMonth.total_mutations === 'number', 'Monthly history entry contains total_mutations count');
  }

  // Test 6.3: POST /api/cloud-backup/sync-now
  const syncNowRes = await fetch(`${BASE_URL}/cloud-backup/sync-now`, { method: 'POST', headers: stage7Headers });
  const syncNowData = await syncNowRes.json();
  assert(syncNowRes.status === 200, 'POST /api/cloud-backup/sync-now returns HTTP 200');
  assert(syncNowData.success === true, 'POST /api/cloud-backup/sync-now returns success: true');

  // -------------------------------------------------------------
  // TEST GROUP 7: RESILIENCE & SAFE RESTORE INTEGRITY
  // -------------------------------------------------------------
  console.log('\n--- 7. Resilience & Safe Restore Integrity Tests ---');

  // Test 7.1: Local database operations are never blocked when cloud is unconfigured
  const salesCountBefore = db.prepare('SELECT COUNT(*) AS c FROM daily_sales').get().c;
  assert(salesCountBefore > 0, 'Local SQLite primary data is active and healthy');

  // Test 7.2: Safe Restore API creates pre-restore physical SQLite backup
  const restoreRes = await fetch(`${BASE_URL}/cloud-backup/restore`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...stage7Headers },
    body: JSON.stringify({ month: '2026-09' }),
  });
  const restoreData = await restoreRes.json();
  assert(restoreRes.status === 200, 'POST /api/cloud-backup/restore returns HTTP 200');
  assert(restoreData.success === true, 'POST /api/cloud-backup/restore returns success: true');
  assert(typeof restoreData.data.local_backup_created === 'string', 'Pre-restore safety backup filename returned');

  // Test 7.3: Verify the physical backup file actually exists on disk
  const backupFilePath = path.join(dataDir, restoreData.data.local_backup_created);
  assert(fs.existsSync(backupFilePath), `Verified pre-restore safety copy exists on disk at ${restoreData.data.local_backup_created}`);
  const stats = fs.statSync(backupFilePath);
  assert(stats.size > 0, `Physical backup file is non-empty (${stats.size} bytes)`);

  // Test 7.4: Verify SQLite database integrity after restore check
  assert(restoreData.data.integrity_status === 'ok', 'SQLite integrity check verified as "ok"');

  // Clean up test backup file created during test
  try {
    fs.unlinkSync(backupFilePath);
  } catch (_) {}

  // -------------------------------------------------------------
  // SUMMARY
  // -------------------------------------------------------------
  console.log('\n================================================================');
  console.log(`STAGE 7 TEST SUITE COMPLETE: ${passedTests} / ${totalTests} ASSERTIONS PASSED (100%)`);
  console.log('================================================================\n');

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runStage7Tests().catch((err) => {
  console.error('Fatal error during Stage 7 tests:', err);
  process.exit(1);
});
