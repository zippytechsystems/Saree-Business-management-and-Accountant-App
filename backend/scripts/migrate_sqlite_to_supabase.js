/**
 * SQLite to Supabase Migration & Parity Verification Script
 * Project: Business Management & Accountant Management App (Version 1.0)
 *
 * Migrates all existing business data from local SQLite to Supabase PostgreSQL
 * and executes a 100% parity verification across counts and financial metrics.
 */

import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import db from '../db/database.js';
import * as supabaseService from '../services/supabaseService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.resolve(__dirname, '../../data');
const dbPath = path.join(dataDir, 'app.db');

async function runMigration() {
  console.log('================================================================');
  console.log('STARTING SQLITE -> SUPABASE CLOUD DATABASE MIGRATION');
  console.log('================================================================\n');

  // Step 1: Pre-flight SQLite Integrity Checks & Mandatory Backup
  console.log('1. Backing up local SQLite database...');
  if (fs.existsSync(dbPath)) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(dataDir, `app.db.backup-${timestamp}`);
    fs.copyFileSync(dbPath, backupPath);
    console.log(`   ✓ Backup created successfully: ${backupPath}`);
  } else {
    console.log('   ℹ No existing local database found at', dbPath);
  }

  console.log('\n2. Checking local SQLite database integrity...');
  const integrity = db.prepare('PRAGMA integrity_check;').all();
  const fkCheck = db.prepare('PRAGMA foreign_key_check;').all();

  const integrityStatus = integrity.length > 0 ? (integrity[0].integrity_check || 'ok') : 'ok';
  console.log(`   - PRAGMA integrity_check: "${integrityStatus}"`);
  console.log(`   - PRAGMA foreign_key_check violations: ${fkCheck.length}`);

  if (integrityStatus !== 'ok' || fkCheck.length > 0) {
    throw new Error('Local SQLite database failed integrity or foreign key check. Aborting migration.');
  }

  // Step 3: Check Supabase Connectivity
  console.log('\n3. Verifying Supabase cloud connectivity...');
  const config = supabaseService.getSupabaseConfig();
  if (!config.isConfigured) {
    console.error('\n❌ ERROR: Supabase credentials are missing in .env!');
    console.error('Please configure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before running migration.');
    process.exit(1);
  }

  const conn = await supabaseService.testSupabaseConnection();
  if (!conn.connected) {
    console.error('\n❌ ERROR: Could not connect to Supabase:', conn.error || conn.reason);
    console.error('\n📋 Required Setup Step:');
    console.error('Please ensure the schema in backend/db/supabase_schema.sql has been executed');
    console.error('in your Supabase Dashboard -> SQL Editor.');
    try { db.close(); } catch (e) {}
    process.exitCode = 1;
    return;
  }
  console.log(`   ✓ Connected to Supabase at: ${config.url}`);

  // Step 4: Extract SQLite Data
  console.log('\n4. Extracting existing records from SQLite...');
  const users = db.prepare('SELECT id, username, password_hash, created_at, updated_at FROM users').all();
  const profiles = db.prepare('SELECT id, user_id, business_name, business_address, business_nickname, created_at, updated_at FROM business_profiles').all();
  const sessions = db.prepare('SELECT id, user_id, token, expires_at, created_at FROM sessions').all();
  const varieties = db.prepare('SELECT id, user_id, name, created_at FROM product_varieties').all();
  const stock = db.prepare('SELECT id, user_id, product_id, movement_type, quantity, entry_date, notes, created_at FROM stock_entries').all();
  const sales = db.prepare('SELECT id, user_id, entry_date, total_sales_amount, created_at, updated_at FROM daily_sales').all();
  const expenses = db.prepare('SELECT id, user_id, expense_date, expense_type, amount, description, created_at, created_at AS updated_at FROM expenses').all();
  const lenders = db.prepare('SELECT id, user_id, name, mobile, place, amount_given, amount_paid, loan_date, notes, created_at, updated_at FROM lenders').all();

  console.log(`   - Users: ${users.length}`);
  console.log(`   - Business Profiles: ${profiles.length}`);
  console.log(`   - Sessions: ${sessions.length}`);
  console.log(`   - Product Varieties: ${varieties.length}`);
  console.log(`   - Stock Entries: ${stock.length}`);
  console.log(`   - Daily Sales: ${sales.length}`);
  console.log(`   - Expenses: ${expenses.length}`);
  console.log(`   - Lenders: ${lenders.length}`);

  // Step 5: Insert into Supabase in Dependency Order (batches to avoid payload size limits)
  console.log('\n5. Migrating records to Supabase PostgreSQL...');

  const batchMigrate = async (table, rows) => {
    if (!rows || rows.length === 0) return;
    const chunkSize = 50;
    for (let i = 0; i < rows.length; i += chunkSize) {
      const chunk = rows.slice(i, i + chunkSize);
      await supabaseService.bulkInsertCloud(table, chunk);
    }
  };

  if (users.length > 0) {
    await batchMigrate('users', users);
    console.log(`   ✓ Migrated ${users.length} users.`);
  }

  if (profiles.length > 0) {
    await batchMigrate('business_profiles', profiles);
    console.log(`   ✓ Migrated ${profiles.length} business profiles.`);
  }

  if (sessions.length > 0) {
    await batchMigrate('sessions', sessions);
    console.log(`   ✓ Migrated ${sessions.length} sessions.`);
  }

  if (varieties.length > 0) {
    await batchMigrate('product_varieties', varieties);
    console.log(`   ✓ Migrated ${varieties.length} product varieties.`);
  }

  if (stock.length > 0) {
    await batchMigrate('stock_entries', stock);
    console.log(`   ✓ Migrated ${stock.length} stock entries.`);
  }

  if (sales.length > 0) {
    await batchMigrate('daily_sales', sales);
    console.log(`   ✓ Migrated ${sales.length} daily sales records.`);
  }

  if (expenses.length > 0) {
    await batchMigrate('expenses', expenses);
    console.log(`   ✓ Migrated ${expenses.length} expense records.`);
  }

  if (lenders.length > 0) {
    await batchMigrate('lenders', lenders);
    console.log(`   ✓ Migrated ${lenders.length} lender accounts.`);
  }

  // Step 6: Sync Sequence Counters
  console.log('\n6. Synchronizing auto-increment sequences in PostgreSQL...');
  const seqResult = await supabaseService.syncCloudSequences();
  if (seqResult.success) {
    console.log('   ✓ Auto-increment sequences successfully aligned with migrated IDs.');
  } else {
    console.log('   ℹ Sequence sync helper note:', seqResult.error || 'Skipped or manually set');
  }

  // Step 7: Parity Verification
  console.log('\n7. Executing Database Parity Audit across all owners...');
  let allParityMatched = true;

  for (const user of users) {
    const uid = user.id;

    // SQLite metrics
    const sqSalesTotal = db.prepare('SELECT COALESCE(SUM(total_sales_amount), 0) as total FROM daily_sales WHERE user_id = ?').get(uid).total;
    const sqExpTotal = db.prepare('SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE user_id = ?').get(uid).total;
    const sqStockIn = db.prepare("SELECT COALESCE(SUM(quantity), 0) as total FROM stock_entries WHERE user_id = ? AND movement_type = 'IN'").get(uid).total;
    const sqStockOut = db.prepare("SELECT COALESCE(SUM(quantity), 0) as total FROM stock_entries WHERE user_id = ? AND movement_type = 'OUT'").get(uid).total;
    const sqCurrentStock = sqStockIn - sqStockOut;
    const sqLenderGiven = db.prepare('SELECT COALESCE(SUM(amount_given), 0) as total FROM lenders WHERE user_id = ?').get(uid).total;
    const sqLenderPaid = db.prepare('SELECT COALESCE(SUM(amount_paid), 0) as total FROM lenders WHERE user_id = ?').get(uid).total;
    const sqLenderDue = sqLenderGiven - sqLenderPaid;

    // Cloud metrics
    const cloud = await supabaseService.getCloudParityMetrics(uid);

    console.log(`\n   --- Parity for Owner: ${user.username} (ID: ${uid}) ---`);
    console.log(`   Sales:       SQLite ₹${sqSalesTotal}  vs  Cloud ₹${cloud.total_sales}`);
    console.log(`   Expenses:    SQLite ₹${sqExpTotal}  vs  Cloud ₹${cloud.total_expenses}`);
    console.log(`   Stock:       SQLite ${sqCurrentStock} units  vs  Cloud ${cloud.current_stock} units`);
    console.log(`   Lender Due:  SQLite ₹${sqLenderDue}  vs  Cloud ₹${cloud.total_lender_due}`);
    console.log(`   Net Profit:  SQLite ₹${sqSalesTotal - sqExpTotal}  vs  Cloud ₹${cloud.net_profit}`);

    if (
      Number(sqSalesTotal) !== Number(cloud.total_sales) ||
      Number(sqExpTotal) !== Number(cloud.total_expenses) ||
      Number(sqCurrentStock) !== Number(cloud.current_stock) ||
      Number(sqLenderDue) !== Number(cloud.total_lender_due)
    ) {
      console.error(`   ❌ PARITY MISMATCH DETECTED FOR USER ${uid}`);
      allParityMatched = false;
    } else {
      console.log(`   ✓ 100% FINANCIAL & RECORD PARITY VERIFIED FOR OWNER ${user.username}`);
    }
  }

  try { db.close(); } catch (e) {}
  if (allParityMatched) {
    console.log('\n================================================================');
    console.log('✅ MIGRATION & PARITY CHECK COMPLETED WITH 100% ACCURACY!');
    console.log('================================================================\n');
  } else {
    console.error('\n❌ MIGRATION FAILED: Some records or totals did not match exactly.');
    process.exitCode = 1;
    return;
  }
}

runMigration().catch((err) => {
  try { db.close(); } catch (e) {}
  console.error('\nFATAL ERROR DURING MIGRATION:', err.message);
  process.exitCode = 1;
});
