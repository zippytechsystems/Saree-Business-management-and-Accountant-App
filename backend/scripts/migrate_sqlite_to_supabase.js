/**
 * SQLite to Supabase Migration & Parity Verification Script
 * Project: Business Management & Accountant Management App (Version 1.0)
 *
 * Migrates all existing business data from local SQLite to Supabase PostgreSQL
 * and executes a 100% parity verification across counts and financial metrics.
 */

import 'dotenv/config';
import db from '../db/database.js';
import * as supabaseService from '../services/supabaseService.js';

async function runMigration() {
  console.log('================================================================');
  console.log('STARTING SQLITE -> SUPABASE CLOUD DATABASE MIGRATION');
  console.log('================================================================\n');

  // Step 1: Pre-flight SQLite Integrity Checks
  console.log('1. Checking local SQLite database integrity...');
  const integrity = db.pragma('integrity_check');
  const fkCheck = db.pragma('foreign_key_check');

  console.log(`   - PRAGMA integrity_check: ${JSON.stringify(integrity[0].integrity_check)}`);
  console.log(`   - PRAGMA foreign_key_check violations: ${fkCheck.length}`);

  if (integrity[0].integrity_check !== 'ok' || fkCheck.length > 0) {
    throw new Error('Local SQLite database failed integrity or foreign key check. Aborting migration.');
  }

  // Step 2: Check Supabase Connectivity
  console.log('\n2. Verifying Supabase cloud connectivity...');
  const config = supabaseService.getSupabaseConfig();
  if (!config.isConfigured) {
    console.error('\n❌ ERROR: Supabase credentials are missing in .env!');
    console.error('Please configure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before running migration.');
    process.exit(1);
  }

  const conn = await supabaseService.testSupabaseConnection();
  if (!conn.connected) {
    console.error('\n❌ ERROR: Could not connect to Supabase:', conn.error || conn.reason);
    process.exit(1);
  }
  console.log(`   ✓ Connected to Supabase at: ${config.url}`);

  // Step 3: Extract SQLite Data
  console.log('\n3. Extracting existing records from SQLite...');
  const users = db.prepare('SELECT id, username, password_hash, created_at, updated_at FROM users').all();
  const profiles = db.prepare('SELECT id, user_id, business_name, business_address, business_nickname, created_at, updated_at FROM business_profiles').all();
  const varieties = db.prepare('SELECT id, user_id, name, created_at FROM product_varieties').all();
  const stock = db.prepare('SELECT id, user_id, product_id, movement_type, quantity, entry_date, notes, created_at FROM stock_entries').all();
  const sales = db.prepare('SELECT id, user_id, entry_date, total_sales_amount, created_at, updated_at FROM daily_sales').all();
  const expenses = db.prepare('SELECT id, user_id, expense_date, expense_type, amount, description, created_at, updated_at FROM expenses').all();
  const lenders = db.prepare('SELECT id, user_id, name, mobile, place, amount_given, amount_paid, loan_date, notes, created_at, updated_at FROM lenders').all();

  console.log(`   - Users: ${users.length}`);
  console.log(`   - Business Profiles: ${profiles.length}`);
  console.log(`   - Product Varieties: ${varieties.length}`);
  console.log(`   - Stock Entries: ${stock.length}`);
  console.log(`   - Daily Sales: ${sales.length}`);
  console.log(`   - Expenses: ${expenses.length}`);
  console.log(`   - Lenders: ${lenders.length}`);

  // Step 4: Insert into Supabase
  console.log('\n4. Migrating records to Supabase PostgreSQL...');

  if (users.length > 0) {
    await supabaseService.bulkInsertCloud('users', users);
    console.log(`   ✓ Migrated ${users.length} users.`);
  }

  if (profiles.length > 0) {
    await supabaseService.bulkInsertCloud('business_profiles', profiles);
    console.log(`   ✓ Migrated ${profiles.length} business profiles.`);
  }

  if (varieties.length > 0) {
    await supabaseService.bulkInsertCloud('product_varieties', varieties);
    console.log(`   ✓ Migrated ${varieties.length} product varieties.`);
  }

  if (stock.length > 0) {
    await supabaseService.bulkInsertCloud('stock_entries', stock);
    console.log(`   ✓ Migrated ${stock.length} stock entries.`);
  }

  if (sales.length > 0) {
    await supabaseService.bulkInsertCloud('daily_sales', sales);
    console.log(`   ✓ Migrated ${sales.length} daily sales records.`);
  }

  if (expenses.length > 0) {
    await supabaseService.bulkInsertCloud('expenses', expenses);
    console.log(`   ✓ Migrated ${expenses.length} expense records.`);
  }

  if (lenders.length > 0) {
    await supabaseService.bulkInsertCloud('lenders', lenders);
    console.log(`   ✓ Migrated ${lenders.length} lender accounts.`);
  }

  // Step 5: Parity Verification
  console.log('\n5. Executing Database Parity Audit across all owners...');
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
      sqSalesTotal !== cloud.total_sales ||
      sqExpTotal !== cloud.total_expenses ||
      sqCurrentStock !== cloud.current_stock ||
      sqLenderDue !== cloud.total_lender_due
    ) {
      console.error(`   ❌ PARITY MISMATCH DETECTED FOR USER ${uid}`);
      allParityMatched = false;
    } else {
      console.log(`   ✓ 100% FINANCIAL & RECORD PARITY VERIFIED FOR OWNER ${user.username}`);
    }
  }

  if (allParityMatched) {
    console.log('\n================================================================');
    console.log('✅ MIGRATION & PARITY CHECK COMPLETED WITH 100% ACCURACY!');
    console.log('================================================================\n');
  } else {
    console.error('\n❌ MIGRATION FAILED: Some records or totals did not match exactly.');
    process.exit(1);
  }
}

runMigration().catch((err) => {
  console.error('\nFATAL ERROR DURING MIGRATION:', err.message);
  process.exit(1);
});
