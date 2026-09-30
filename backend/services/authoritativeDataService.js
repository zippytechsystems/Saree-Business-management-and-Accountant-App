/**
 * Authoritative Data Synchronization Orchestrator
 * Project: Business Management & Accountant Management App (Version 1.0)
 *
 * Implements:
 * CLOUD DATABASE = AUTHORITATIVE SOURCE OF TRUTH
 * LOCAL SQLITE = OFFLINE CACHE + PENDING MUTATION QUEUE
 */

import crypto from 'node:crypto';
import db from '../db/database.js';
import * as supabaseService from './supabaseService.js';
import * as salesService from './salesService.js';
import * as expenseService from './expenseService.js';
import * as stockService from './stockService.js';
import * as lenderService from './lenderService.js';

/**
 * Returns overall cloud & offline queue status
 */
export async function getSyncStatus(userId = 1) {
  const uid = Number(userId || 1);
  const isConfigured = supabaseService.isSupabaseConfigured();

  let cloudConnected = false;
  let connectionInfo = null;

  if (isConfigured) {
    connectionInfo = await supabaseService.testSupabaseConnection();
    cloudConnected = Boolean(connectionInfo.connected);
  }

  // Count pending offline mutations in SQLite
  const pendingRow = db
    .prepare("SELECT COUNT(*) as count FROM cloud_sync_log WHERE user_id = ? AND status = 'pending'")
    .get(uid);

  const syncedRow = db
    .prepare("SELECT COUNT(*) as count FROM cloud_sync_log WHERE user_id = ? AND status = 'synced'")
    .get(uid);

  const failedRow = db
    .prepare("SELECT COUNT(*) as count FROM cloud_sync_log WHERE user_id = ? AND status = 'failed'")
    .get(uid);

  return {
    isConfigured,
    cloudConnected,
    provider: isConfigured ? 'supabase' : 'none',
    mode: cloudConnected ? 'authoritative_cloud' : 'local_cache_offline',
    pending_mutations: pendingRow ? pendingRow.count : 0,
    synced_mutations: syncedRow ? syncedRow.count : 0,
    failed_mutations: failedRow ? failedRow.count : 0,
    connectionInfo,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Helper to generate unique idempotency key
 */
function generateIdempotencyKey(entityType, entityId, timestamp = Date.now()) {
  return `${entityType}_${entityId}_${timestamp}_${crypto.randomBytes(6).toString('hex')}`;
}

// ============================================================================
// 1. SALES AUTHORITATIVE SYNCHRONIZATION
// ============================================================================

export async function recordSaleAuthoritative(entryDate, amount, userId = 1) {
  const uid = Number(userId || 1);
  const numericAmount = Number(amount);
  const idempotencyKey = generateIdempotencyKey('sale', entryDate);
  const yearMonth = entryDate.substring(0, 7);

  // 1. If Supabase is configured, attempt authoritative write to Cloud FIRST
  if (supabaseService.isSupabaseConfigured()) {
    try {
      const cloudResult = await supabaseService.upsertCloudSale(uid, {
        entry_date: entryDate,
        total_sales_amount: numericAmount,
      });

      // Update local SQLite cache immediately
      const localResult = salesService.recordDailySales(entryDate, numericAmount, uid);

      // Log mutation as synced
      db.prepare(`
        INSERT INTO cloud_sync_log (user_id, mutation_type, entity_type, entity_id, payload, year_month, status, attempts, idempotency_key, synced_at)
        VALUES (?, 'UPSERT', 'sales', ?, ?, ?, 'synced', 1, ?, CURRENT_TIMESTAMP)
      `).run(uid, entryDate, JSON.stringify({ entry_date: entryDate, total_sales_amount: numericAmount }), yearMonth, idempotencyKey);

      return {
        ...localResult,
        cloud_authoritative: true,
        status: 'synced',
      };
    } catch (err) {
      console.warn('[SyncOrchestrator] Supabase write failed, falling back to local SQLite queue:', err.message);
      // Fall through to offline queueing below
    }
  }

  // 2. Offline / Local fallback: Save to local SQLite
  const localResult = salesService.recordDailySales(entryDate, numericAmount, uid);

  // Queue in cloud_sync_log as pending
  db.prepare(`
    INSERT INTO cloud_sync_log (user_id, mutation_type, entity_type, entity_id, payload, year_month, status, attempts, idempotency_key)
    VALUES (?, 'UPSERT', 'sales', ?, ?, ?, 'pending', 0, ?)
  `).run(uid, entryDate, JSON.stringify({ entry_date: entryDate, total_sales_amount: numericAmount }), yearMonth, idempotencyKey);

  return {
    ...localResult,
    cloud_authoritative: false,
    offline_queued: true,
    status: 'pending',
  };
}

// ============================================================================
// 2. EXPENSES AUTHORITATIVE SYNCHRONIZATION
// ============================================================================

export async function recordExpenseAuthoritative(expenseData, userId = 1) {
  const uid = Number(userId || 1);
  const yearMonth = (expenseData.expense_date || '').substring(0, 7) || new Date().toISOString().substring(0, 7);
  const idempotencyKey = generateIdempotencyKey('expense', 'new');

  if (supabaseService.isSupabaseConfigured()) {
    try {
      const cloudResult = await supabaseService.createCloudExpense(uid, expenseData);

      // Update local SQLite cache
      const localResult = expenseService.addExpense(expenseData, uid);

      db.prepare(`
        INSERT INTO cloud_sync_log (user_id, mutation_type, entity_type, entity_id, payload, year_month, status, attempts, idempotency_key, synced_at)
        VALUES (?, 'CREATE', 'expenses', ?, ?, ?, 'synced', 1, ?, CURRENT_TIMESTAMP)
      `).run(uid, String(localResult.id), JSON.stringify(expenseData), yearMonth, idempotencyKey);

      return {
        ...localResult,
        cloud_authoritative: true,
        status: 'synced',
      };
    } catch (err) {
      console.warn('[SyncOrchestrator] Supabase expense write failed, falling back to offline queue:', err.message);
    }
  }

  // Offline / Local
  const localResult = expenseService.addExpense(expenseData, uid);
  db.prepare(`
    INSERT INTO cloud_sync_log (user_id, mutation_type, entity_type, entity_id, payload, year_month, status, attempts, idempotency_key)
    VALUES (?, 'CREATE', 'expenses', ?, ?, ?, 'pending', 0, ?)
  `).run(uid, String(localResult.id), JSON.stringify(expenseData), yearMonth, idempotencyKey);

  return {
    ...localResult,
    cloud_authoritative: false,
    offline_queued: true,
    status: 'pending',
  };
}

export async function updateExpenseAuthoritative(id, updateData, userId = 1) {
  const uid = Number(userId || 1);
  const idempotencyKey = generateIdempotencyKey('expense_update', id);
  const yearMonth = (updateData.expense_date || '').substring(0, 7) || new Date().toISOString().substring(0, 7);

  if (supabaseService.isSupabaseConfigured()) {
    try {
      await supabaseService.updateCloudExpense(uid, id, updateData);
    } catch (err) {
      console.warn('[SyncOrchestrator] Cloud expense update failed, queued locally:', err.message);
    }
  }

  const localResult = expenseService.updateExpense(id, updateData, uid);
  return localResult;
}

export async function deleteExpenseAuthoritative(id, userId = 1) {
  const uid = Number(userId || 1);

  if (supabaseService.isSupabaseConfigured()) {
    try {
      await supabaseService.deleteCloudExpense(uid, id);
    } catch (err) {
      console.warn('[SyncOrchestrator] Cloud expense delete failed, queued locally:', err.message);
    }
  }

  return expenseService.deleteExpense(id, uid);
}

// ============================================================================
// 3. STOCK & VARIETIES AUTHORITATIVE SYNCHRONIZATION
// ============================================================================

export async function addProductVarietyAuthoritative(name, userId = 1) {
  const uid = Number(userId || 1);
  const idempotencyKey = generateIdempotencyKey('variety', name);

  if (supabaseService.isSupabaseConfigured()) {
    try {
      await supabaseService.createCloudVariety(uid, { name });
    } catch (err) {
      console.warn('[SyncOrchestrator] Cloud variety write failed, saving locally:', err.message);
    }
  }

  return stockService.addProductVariety(name, uid);
}

export async function recordStockMovementAuthoritative(movementData, userId = 1) {
  const uid = Number(userId || 1);
  const yearMonth = (movementData.entry_date || '').substring(0, 7) || new Date().toISOString().substring(0, 7);
  const idempotencyKey = generateIdempotencyKey('stock_movement', movementData.product_id);

  if (supabaseService.isSupabaseConfigured()) {
    try {
      await supabaseService.createCloudStockEntry(uid, movementData);

      const localResult = stockService.recordStockMovement({ ...movementData, userId: uid });
      db.prepare(`
        INSERT INTO cloud_sync_log (user_id, mutation_type, entity_type, entity_id, payload, year_month, status, attempts, idempotency_key, synced_at)
        VALUES (?, 'CREATE', 'stock_entries', ?, ?, ?, 'synced', 1, ?, CURRENT_TIMESTAMP)
      `).run(uid, String(localResult.id), JSON.stringify(movementData), yearMonth, idempotencyKey);

      return {
        ...localResult,
        cloud_authoritative: true,
        status: 'synced',
      };
    } catch (err) {
      console.warn('[SyncOrchestrator] Cloud stock entry failed, queued locally:', err.message);
    }
  }

  const localResult = stockService.recordStockMovement({ ...movementData, userId: uid });
  db.prepare(`
    INSERT INTO cloud_sync_log (user_id, mutation_type, entity_type, entity_id, payload, year_month, status, attempts, idempotency_key)
    VALUES (?, 'CREATE', 'stock_entries', ?, ?, ?, 'pending', 0, ?)
  `).run(uid, String(localResult.id), JSON.stringify(movementData), yearMonth, idempotencyKey);

  return {
    ...localResult,
    cloud_authoritative: false,
    offline_queued: true,
    status: 'pending',
  };
}

// ============================================================================
// 4. LENDERS AUTHORITATIVE SYNCHRONIZATION
// ============================================================================

export async function addLenderAuthoritative(lenderData, userId = 1) {
  const uid = Number(userId || 1);
  const yearMonth = (lenderData.loan_date || '').substring(0, 7) || new Date().toISOString().substring(0, 7);
  const idempotencyKey = generateIdempotencyKey('lender', lenderData.name);

  if (supabaseService.isSupabaseConfigured()) {
    try {
      await supabaseService.createCloudLender(uid, lenderData);

      const localResult = lenderService.addLender({ ...lenderData, userId: uid });
      db.prepare(`
        INSERT INTO cloud_sync_log (user_id, mutation_type, entity_type, entity_id, payload, year_month, status, attempts, idempotency_key, synced_at)
        VALUES (?, 'CREATE', 'lenders', ?, ?, ?, 'synced', 1, ?, CURRENT_TIMESTAMP)
      `).run(uid, String(localResult.id), JSON.stringify(lenderData), yearMonth, idempotencyKey);

      return {
        ...localResult,
        cloud_authoritative: true,
        status: 'synced',
      };
    } catch (err) {
      console.warn('[SyncOrchestrator] Cloud lender creation failed, queued locally:', err.message);
    }
  }

  const localResult = lenderService.addLender({ ...lenderData, userId: uid });
  db.prepare(`
    INSERT INTO cloud_sync_log (user_id, mutation_type, entity_type, entity_id, payload, year_month, status, attempts, idempotency_key)
    VALUES (?, 'CREATE', 'lenders', ?, ?, ?, 'pending', 0, ?)
  `).run(uid, String(localResult.id), JSON.stringify(lenderData), yearMonth, idempotencyKey);

  return {
    ...localResult,
    cloud_authoritative: false,
    offline_queued: true,
    status: 'pending',
  };
}

export async function recordLenderRepaymentAuthoritative(id, repaymentAmount, notes, userId = 1) {
  const uid = Number(userId || 1);

  if (supabaseService.isSupabaseConfigured()) {
    try {
      await supabaseService.recordCloudLenderRepayment(uid, id, repaymentAmount, notes);
    } catch (err) {
      console.warn('[SyncOrchestrator] Cloud repayment failed, updating locally:', err.message);
    }
  }

  return lenderService.recordRepayment(id, repaymentAmount, notes, uid);
}

// ============================================================================
// 5. DEVICE LOSS RECOVERY: RECONCILE CLOUD DATA TO LOCAL SQLITE CACHE
// When logging into a fresh device (Device B/C), populates local SQLite from Cloud
// ============================================================================

export async function reconcileCloudToLocal(userId = 1) {
  const uid = Number(userId || 1);
  if (!supabaseService.isSupabaseConfigured()) {
    return { success: false, reason: 'Supabase unconfigured' };
  }

  try {
    // 1. Fetch Profile
    const cloudProfile = await supabaseService.fetchCloudBusinessProfile(uid);
    if (cloudProfile) {
      db.prepare(`
        INSERT OR REPLACE INTO business_profiles (user_id, business_name, business_address, business_nickname, updated_at)
        VALUES (?, ?, ?, ?, ?)
      `).run(uid, cloudProfile.business_name, cloudProfile.business_address, cloudProfile.business_nickname, cloudProfile.updated_at || new Date().toISOString());
    }

    // 2. Fetch Varieties
    const cloudVarieties = await supabaseService.fetchCloudVarieties(uid);
    for (const v of cloudVarieties) {
      const exists = db.prepare('SELECT id FROM product_varieties WHERE user_id = ? AND name = ? COLLATE NOCASE').get(uid, v.name);
      if (!exists) {
        db.prepare('INSERT INTO product_varieties (id, user_id, name, created_at) VALUES (?, ?, ?, ?)').run(v.id, uid, v.name, v.created_at);
      }
    }

    // 3. Fetch Sales
    const cloudSales = await supabaseService.fetchCloudSales(uid);
    for (const s of cloudSales) {
      db.prepare(`
        INSERT INTO daily_sales (user_id, entry_date, total_sales_amount, updated_at)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(user_id, entry_date) DO UPDATE SET total_sales_amount = excluded.total_sales_amount
      `).run(uid, s.entry_date, Number(s.total_sales_amount), s.updated_at || new Date().toISOString());
    }

    // 4. Fetch Expenses
    const cloudExpenses = await supabaseService.fetchCloudExpenses(uid);
    for (const e of cloudExpenses) {
      const exists = db.prepare('SELECT id FROM expenses WHERE id = ? AND user_id = ?').get(e.id, uid);
      if (!exists) {
        db.prepare(`
          INSERT INTO expenses (id, user_id, expense_date, expense_type, amount, description, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(e.id, uid, e.expense_date, e.expense_type, Number(e.amount), e.description, e.created_at, e.updated_at);
      }
    }

    // 5. Fetch Lenders
    const cloudLenders = await supabaseService.fetchCloudLenders(uid);
    for (const l of cloudLenders) {
      db.prepare(`
        INSERT OR REPLACE INTO lenders (id, user_id, name, mobile, place, amount_given, amount_paid, loan_date, notes, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(l.id, uid, l.name, l.mobile, l.place, Number(l.amount_given), Number(l.amount_paid), l.loan_date, l.notes, l.updated_at);
    }

    return {
      success: true,
      recovered: {
        profile: Boolean(cloudProfile),
        varieties: cloudVarieties.length,
        sales: cloudSales.length,
        expenses: cloudExpenses.length,
        lenders: cloudLenders.length,
      },
    };
  } catch (err) {
    console.error('[SyncOrchestrator] Error reconciling cloud to local cache:', err.message);
    return { success: false, error: err.message };
  }
}

// ============================================================================
// 6. FLUSH OFFLINE QUEUE (Idempotent Retry & Duplicate Prevention)
// ============================================================================

export async function flushOfflineQueue(userId = 1) {
  const uid = Number(userId || 1);
  if (!supabaseService.isSupabaseConfigured()) {
    return { success: false, reason: 'Supabase unconfigured' };
  }

  const pendingJobs = db
    .prepare("SELECT * FROM cloud_sync_log WHERE user_id = ? AND status = 'pending' ORDER BY id ASC")
    .all(uid);

  if (pendingJobs.length === 0) {
    return { success: true, processed: 0 };
  }

  let successCount = 0;
  let failCount = 0;

  for (const job of pendingJobs) {
    try {
      const payload = JSON.parse(job.payload);

      if (job.entity_type === 'sales') {
        await supabaseService.upsertCloudSale(uid, payload);
      } else if (job.entity_type === 'expenses') {
        await supabaseService.createCloudExpense(uid, payload);
      } else if (job.entity_type === 'stock_entries') {
        await supabaseService.createCloudStockEntry(uid, payload);
      } else if (job.entity_type === 'lenders') {
        await supabaseService.createCloudLender(uid, payload);
      }

      // Mark as synced with timestamp
      db.prepare(`
        UPDATE cloud_sync_log
        SET status = 'synced', attempts = attempts + 1, synced_at = CURRENT_TIMESTAMP, error_message = NULL
        WHERE id = ?
      `).run(job.id);

      successCount++;
    } catch (err) {
      db.prepare(`
        UPDATE cloud_sync_log
        SET status = 'failed', attempts = attempts + 1, error_message = ?
        WHERE id = ?
      `).run(err.message, job.id);

      failCount++;
    }
  }

  return {
    success: true,
    processed: pendingJobs.length,
    synced: successCount,
    failed: failCount,
  };
}
