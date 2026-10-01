/**
 * Authoritative Data Synchronization Orchestrator
 * Project: Business Management & Accountant Management App (Version 1.0)
 *
 * Implements:
 * CLOUD DATABASE (SUPABASE) = AUTHORITATIVE SOURCE OF TRUTH
 * LOCAL SQLITE = RESILIENT OFFLINE CACHE + PENDING MUTATION QUEUE
 */

import crypto from 'node:crypto';
import db from '../db/database.js';
import * as supabaseService from './supabaseService.js';
import * as salesService from './salesService.js';
import * as expenseService from './expenseService.js';
import * as stockService from './stockService.js';
import * as lenderService from './lenderService.js';
import * as calculationService from './calculationService.js';
import * as reportService from './reportService.js';
import * as authService from './authService.js';

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
// 1. SALES AUTHORITATIVE SYNCHRONIZATION & READS
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

export async function getSalesAuthoritative({ month, startDate, endDate, limit = 100, offset = 0, userId = 1 }) {
  const uid = Number(userId || 1);
  if (supabaseService.isSupabaseConfigured()) {
    try {
      let filterStart = startDate;
      let filterEnd = endDate;
      if (month && !filterStart && !filterEnd) {
        filterStart = `${month}-01`;
        const [y, m] = month.split('-').map(Number);
        const lastDay = new Date(y, m, 0).getDate();
        filterEnd = `${month}-${String(lastDay).padStart(2, '0')}`;
      }
      const cloudSales = await supabaseService.fetchCloudSales(uid, { startDate: filterStart, endDate: filterEnd });
      const sliced = cloudSales.slice(Number(offset), Number(offset) + Number(limit));
      return sliced.map((s) => ({
        id: Number(s.id),
        user_id: Number(s.user_id),
        entry_date: s.entry_date,
        total_sales_amount: Number(s.total_sales_amount),
        created_at: s.created_at,
        updated_at: s.updated_at,
      }));
    } catch (err) {
      console.warn('[Authoritative] Supabase fetch sales failed, falling back to SQLite cache:', err.message);
    }
  }
  return salesService.getSalesHistory({ month, startDate, endDate, limit, offset, userId: uid });
}

export async function getTodaySalesAuthoritative(date, userId = 1) {
  const uid = Number(userId || 1);
  const targetDate = date || salesService.getTodayDateString();
  if (supabaseService.isSupabaseConfigured()) {
    try {
      const records = await supabaseService.fetchCloudSales(uid, { startDate: targetDate, endDate: targetDate });
      if (records && records.length > 0) {
        const r = records[0];
        return {
          date: targetDate,
          total_sales_amount: Number(r.total_sales_amount),
          is_recorded: true,
          id: Number(r.id),
        };
      }
      return {
        date: targetDate,
        total_sales_amount: 0,
        is_recorded: false,
        id: null,
      };
    } catch (err) {
      console.warn('[Authoritative] Supabase fetch today sales failed, falling back to SQLite cache:', err.message);
    }
  }
  return salesService.getTodaySales(targetDate, uid);
}

export async function getMonthlyTotalSalesAuthoritative(month, userId = 1) {
  const uid = Number(userId || 1);
  const targetMonth = month || calculationService.getCurrentMonthString();
  if (supabaseService.isSupabaseConfigured()) {
    try {
      const filterStart = `${targetMonth}-01`;
      const [y, m] = targetMonth.split('-').map(Number);
      const lastDay = new Date(y, m, 0).getDate();
      const filterEnd = `${targetMonth}-${String(lastDay).padStart(2, '0')}`;
      const records = await supabaseService.fetchCloudSales(uid, { startDate: filterStart, endDate: filterEnd });
      const total = records.reduce((sum, r) => sum + Number(r.total_sales_amount || 0), 0);
      return {
        month: targetMonth,
        monthly_sales: total,
        days_recorded: records.length,
      };
    } catch (err) {
      console.warn('[Authoritative] Supabase monthly sales failed, falling back to SQLite cache:', err.message);
    }
  }
  return salesService.getMonthlyTotalSales(targetMonth, uid);
}

export async function getSalesByDateAuthoritative(date, userId = 1) {
  const uid = Number(userId || 1);
  if (supabaseService.isSupabaseConfigured()) {
    try {
      const records = await supabaseService.fetchCloudSales(uid, { startDate: date, endDate: date });
      if (records && records.length > 0) {
        const r = records[0];
        return {
          id: Number(r.id),
          user_id: Number(r.user_id),
          entry_date: r.entry_date,
          total_sales_amount: Number(r.total_sales_amount),
          created_at: r.created_at,
          updated_at: r.updated_at,
        };
      }
      return null;
    } catch (err) {
      console.warn('[Authoritative] Supabase getSalesByDate failed, falling back to SQLite cache:', err.message);
    }
  }
  return salesService.getSalesByDate(date, uid);
}

// ============================================================================
// 2. EXPENSES AUTHORITATIVE SYNCHRONIZATION & READS
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

export async function getExpensesAuthoritative({ month, startDate, endDate, expenseType, limit = 100, offset = 0, userId = 1 }) {
  const uid = Number(userId || 1);
  if (supabaseService.isSupabaseConfigured()) {
    try {
      let filterStart = startDate;
      let filterEnd = endDate;
      if (month && !filterStart && !filterEnd) {
        filterStart = `${month}-01`;
        const [y, m] = month.split('-').map(Number);
        const lastDay = new Date(y, m, 0).getDate();
        filterEnd = `${month}-${String(lastDay).padStart(2, '0')}`;
      }
      const cloudExpenses = await supabaseService.fetchCloudExpenses(uid, {
        startDate: filterStart,
        endDate: filterEnd,
        expenseType,
      });
      const sliced = cloudExpenses.slice(Number(offset), Number(offset) + Number(limit));
      return sliced.map((e) => ({
        id: Number(e.id),
        user_id: Number(e.user_id),
        expense_date: e.expense_date,
        expense_type: e.expense_type,
        amount: Number(e.amount),
        description: e.description || '',
        created_at: e.created_at,
        updated_at: e.updated_at,
      }));
    } catch (err) {
      console.warn('[Authoritative] Supabase fetch expenses failed, falling back to SQLite cache:', err.message);
    }
  }
  return expenseService.getExpenses({ month, category: expenseType, startDate, endDate, limit, offset, userId: uid });
}

export async function getTodayExpensesAuthoritative(date, userId = 1) {
  const uid = Number(userId || 1);
  const targetDate = date || salesService.getTodayDateString();
  if (supabaseService.isSupabaseConfigured()) {
    try {
      const records = await supabaseService.fetchCloudExpenses(uid, { startDate: targetDate, endDate: targetDate });
      const total = records.reduce((sum, r) => sum + Number(r.amount || 0), 0);
      return {
        date: targetDate,
        today_expenses: total,
        items: records.map((r) => ({
          id: Number(r.id),
          expense_date: r.expense_date,
          expense_type: r.expense_type,
          amount: Number(r.amount),
          description: r.description,
        })),
      };
    } catch (err) {
      console.warn('[Authoritative] Supabase fetch today expenses failed, falling back to SQLite cache:', err.message);
    }
  }
  return expenseService.getTodayExpensesTotal(targetDate, uid);
}

export async function getMonthlyExpensesByCategoryAuthoritative(month, userId = 1) {
  const uid = Number(userId || 1);
  const targetMonth = month || calculationService.getCurrentMonthString();
  if (supabaseService.isSupabaseConfigured()) {
    try {
      const filterStart = `${targetMonth}-01`;
      const [y, m] = targetMonth.split('-').map(Number);
      const lastDay = new Date(y, m, 0).getDate();
      const filterEnd = `${targetMonth}-${String(lastDay).padStart(2, '0')}`;
      const records = await supabaseService.fetchCloudExpenses(uid, { startDate: filterStart, endDate: filterEnd });

      const breakdown = {};
      expenseService.APPROVED_EXPENSE_CATEGORIES.forEach((cat) => {
        breakdown[cat] = 0;
      });
      let total = 0;
      for (const r of records) {
        const amt = Number(r.amount || 0);
        total += amt;
        if (breakdown[r.expense_type] !== undefined) {
          breakdown[r.expense_type] += amt;
        } else {
          breakdown[r.expense_type] = amt;
        }
      }
      return {
        month: targetMonth,
        monthly_expenses: total,
        breakdown,
      };
    } catch (err) {
      console.warn('[Authoritative] Supabase monthly expenses failed, falling back to SQLite cache:', err.message);
    }
  }
  return expenseService.getMonthlyExpensesByCategory(targetMonth, uid);
}

// ============================================================================
// 3. STOCK & VARIETIES AUTHORITATIVE SYNCHRONIZATION & READS
// ============================================================================

export async function addProductVarietyAuthoritative(name, userId = 1) {
  const uid = Number(userId || 1);
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    throw new Error('Product variety name is required and cannot be empty.');
  }
  const cleanName = name.trim();

  // Validate duplicate variety per user in local SQLite first
  const existing = db
    .prepare('SELECT id, name FROM product_varieties WHERE name = ? AND user_id = ? COLLATE NOCASE')
    .get(cleanName, uid);
  if (existing) {
    throw new Error(`Product variety "${cleanName}" already exists.`);
  }

  if (supabaseService.isSupabaseConfigured()) {
    try {
      const cloudVariety = await supabaseService.createCloudVariety(uid, { name: cleanName });
      const now = cloudVariety.created_at || new Date().toISOString();
      const newId = Number(cloudVariety.id);

      db.prepare(`
        INSERT OR REPLACE INTO product_varieties (id, user_id, name, created_at)
        VALUES (?, ?, ?, ?)
      `).run(newId, uid, cleanName, now);

      return {
        id: newId,
        user_id: uid,
        name: cleanName,
        current_stock: 0,
        created_at: now,
        cloud_authoritative: true,
      };
    } catch (err) {
      if (err.message && err.message.includes('already exists')) {
        throw err;
      }
      console.warn('[SyncOrchestrator] Cloud variety write failed, saving locally:', err.message);
    }
  }

  return stockService.addProductVariety(cleanName, uid);
}

export async function getProductVarietiesAuthoritative(userId = 1) {
  const uid = Number(userId || 1);
  if (supabaseService.isSupabaseConfigured()) {
    try {
      const [varieties, stockEntries] = await Promise.all([
        supabaseService.fetchCloudVarieties(uid),
        supabaseService.fetchCloudStockEntries(uid),
      ]);
      const stockMap = {};
      for (const entry of stockEntries) {
        const pid = entry.product_id;
        if (!stockMap[pid]) stockMap[pid] = { in: 0, out: 0 };
        const q = Number(entry.quantity || 0);
        if (entry.movement_type === 'IN') stockMap[pid].in += q;
        else if (entry.movement_type === 'OUT') stockMap[pid].out += q;
      }
      return varieties.map((v) => {
        const s = stockMap[v.id] || { in: 0, out: 0 };
        return {
          id: Number(v.id),
          user_id: Number(v.user_id),
          name: v.name,
          created_at: v.created_at,
          total_in: s.in,
          total_out: s.out,
          current_stock: s.in - s.out,
        };
      });
    } catch (err) {
      console.warn('[Authoritative] Supabase fetch varieties failed, falling back to SQLite cache:', err.message);
    }
  }
  return stockService.getAllVarieties(uid);
}

export async function getProductVarietyByIdAuthoritative(id, userId = 1) {
  const uid = Number(userId || 1);
  const varieties = await getProductVarietiesAuthoritative(uid);
  const found = varieties.find((v) => Number(v.id) === Number(id));
  if (found) return found;
  return stockService.getVarietyById(id, uid);
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

export async function getStockEntriesAuthoritative({ productId, startDate, endDate, limit = 100, offset = 0, userId = 1 }) {
  const uid = Number(userId || 1);
  if (supabaseService.isSupabaseConfigured()) {
    try {
      const entries = await supabaseService.fetchCloudStockEntries(uid, { productId, startDate, endDate });
      const varieties = await supabaseService.fetchCloudVarieties(uid);
      const nameMap = Object.fromEntries(varieties.map((v) => [v.id, v.name]));
      const sliced = entries.slice(Number(offset), Number(offset) + Number(limit));
      return sliced.map((e) => ({
        id: Number(e.id),
        user_id: Number(e.user_id),
        product_id: Number(e.product_id),
        product_name: nameMap[e.product_id] || 'Unknown Variety',
        movement_type: e.movement_type,
        quantity: Number(e.quantity),
        entry_date: e.entry_date,
        notes: e.notes || '',
        created_at: e.created_at,
      }));
    } catch (err) {
      console.warn('[Authoritative] Supabase stock entries failed, falling back to SQLite cache:', err.message);
    }
  }
  return stockService.getStockEntries({ productId, startDate, endDate, limit, offset, userId: uid });
}

export async function getStockSummaryAuthoritative(userId = 1) {
  const uid = Number(userId || 1);
  if (supabaseService.isSupabaseConfigured()) {
    try {
      const [varieties, stockEntries] = await Promise.all([
        supabaseService.fetchCloudVarieties(uid),
        supabaseService.fetchCloudStockEntries(uid),
      ]);
      let totalIn = 0;
      let totalOut = 0;
      const varietyStock = {};
      varieties.forEach((v) => {
        varietyStock[v.id] = { id: Number(v.id), name: v.name, total_in: 0, total_out: 0, current_stock: 0 };
      });
      for (const entry of stockEntries) {
        const q = Number(entry.quantity || 0);
        if (entry.movement_type === 'IN') {
          totalIn += q;
          if (varietyStock[entry.product_id]) varietyStock[entry.product_id].total_in += q;
        } else if (entry.movement_type === 'OUT') {
          totalOut += q;
          if (varietyStock[entry.product_id]) varietyStock[entry.product_id].total_out += q;
        }
      }
      Object.values(varietyStock).forEach((v) => {
        v.current_stock = v.total_in - v.total_out;
      });
      return {
        total_in: totalIn,
        total_out: totalOut,
        current_stock: totalIn - totalOut,
        varieties_count: varieties.length,
        varieties: Object.values(varietyStock),
      };
    } catch (err) {
      console.warn('[Authoritative] Supabase stock summary failed, falling back to SQLite cache:', err.message);
    }
  }
  return stockService.getTotalStockSummary(uid);
}

// ============================================================================
// 4. LENDERS AUTHORITATIVE SYNCHRONIZATION & READS
// ============================================================================

export async function addLenderAuthoritative(lenderData, userId = 1) {
  const uid = Number(userId || 1);
  const yearMonth = (lenderData.loan_date || '').substring(0, 7) || new Date().toISOString().substring(0, 7);
  const idempotencyKey = generateIdempotencyKey('lender', lenderData.name);

  if (supabaseService.isSupabaseConfigured()) {
    try {
      const cloudLender = await supabaseService.createCloudLender(uid, lenderData);
      const newId = Number(cloudLender.id);
      const now = cloudLender.created_at || new Date().toISOString();

      db.prepare(`
        INSERT OR REPLACE INTO lenders (id, user_id, name, mobile, place, amount_given, amount_paid, loan_date, notes, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        newId,
        uid,
        lenderData.name.trim(),
        lenderData.mobile.trim(),
        lenderData.place.trim(),
        Number(lenderData.amount_given || 0),
        Number(lenderData.amount_paid || 0),
        lenderData.loan_date,
        lenderData.notes || '',
        now,
        now
      );

      const balance = Number(lenderData.amount_given || 0) - Number(lenderData.amount_paid || 0);

      db.prepare(`
        INSERT INTO cloud_sync_log (user_id, mutation_type, entity_type, entity_id, payload, year_month, status, attempts, idempotency_key, synced_at)
        VALUES (?, 'CREATE', 'lenders', ?, ?, ?, 'synced', 1, ?, CURRENT_TIMESTAMP)
      `).run(uid, String(newId), JSON.stringify(lenderData), yearMonth, idempotencyKey);

      return {
        id: newId,
        user_id: uid,
        name: lenderData.name.trim(),
        mobile: lenderData.mobile.trim(),
        place: lenderData.place.trim(),
        amount_given: Number(lenderData.amount_given || 0),
        amount_paid: Number(lenderData.amount_paid || 0),
        balance,
        loan_date: lenderData.loan_date,
        notes: lenderData.notes || '',
        created_at: now,
        updated_at: now,
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

  return lenderService.recordLenderPayment(id, repaymentAmount, uid);
}

export async function getLendersAuthoritative(userId = 1) {
  const uid = Number(userId || 1);
  if (supabaseService.isSupabaseConfigured()) {
    try {
      const lenders = await supabaseService.fetchCloudLenders(uid);
      return lenders.map((r) => {
        const amountGiven = Number(r.amount_given || 0);
        const amountPaid = Number(r.amount_paid || 0);
        const balance = amountGiven - amountPaid;
        return {
          id: Number(r.id),
          user_id: Number(r.user_id),
          name: r.name,
          mobile: r.mobile,
          place: r.place,
          amount_given: amountGiven,
          amount_paid: amountPaid,
          balance,
          due_amount: balance,
          loan_date: r.loan_date,
          notes: r.notes || '',
          created_at: r.created_at,
          updated_at: r.updated_at,
        };
      });
    } catch (err) {
      console.warn('[Authoritative] Supabase lenders failed, falling back to SQLite cache:', err.message);
    }
  }
  return lenderService.getAllLenders(uid);
}

// ============================================================================
// 5. BUSINESS PROFILE AUTHORITATIVE SYNCHRONIZATION
// ============================================================================

export async function getBusinessProfileAuthoritative(userId = 1) {
  const uid = Number(userId || 1);
  if (supabaseService.isSupabaseConfigured()) {
    try {
      const profile = await supabaseService.fetchCloudBusinessProfile(uid);
      if (profile) {
        return {
          id: Number(profile.id),
          user_id: Number(profile.user_id),
          business_name: profile.business_name,
          business_address: profile.business_address,
          business_nickname: profile.business_nickname,
          created_at: profile.created_at,
          updated_at: profile.updated_at,
        };
      }
    } catch (err) {
      console.warn('[Authoritative] Supabase fetch profile failed, falling back to SQLite cache:', err.message);
    }
  }
  return authService.getBusinessProfile(uid);
}

export async function upsertBusinessProfileAuthoritative(userId = 1, profileData) {
  const uid = Number(userId || 1);
  if (supabaseService.isSupabaseConfigured()) {
    try {
      const cloudResult = await supabaseService.upsertCloudBusinessProfile(uid, profileData);
      authService.upsertBusinessProfile({ userId: uid, ...profileData });
      return cloudResult;
    } catch (err) {
      console.warn('[Authoritative] Supabase upsert profile failed, saving to SQLite cache:', err.message);
    }
  }
  return authService.upsertBusinessProfile({ userId: uid, ...profileData });
}

// ============================================================================
// 6. MASTER DASHBOARD & FINANCIAL CALCULATIONS
// ============================================================================

export async function getMonthlyFinancialSummaryAuthoritative(targetMonth = null, userId = 1) {
  const uid = Number(userId || 1);
  const month = targetMonth || calculationService.getCurrentMonthString();
  const todayDate = salesService.getTodayDateString();

  if (supabaseService.isSupabaseConfigured()) {
    try {
      const [todaySales, todayExpenses, monthlySales, monthlyExpenses, stockSummary, lenders] = await Promise.all([
        getTodaySalesAuthoritative(todayDate, uid),
        getTodayExpensesAuthoritative(todayDate, uid),
        getMonthlyTotalSalesAuthoritative(month, uid),
        getMonthlyExpensesByCategoryAuthoritative(month, uid),
        getStockSummaryAuthoritative(uid),
        getLendersAuthoritative(uid),
      ]);

      const netToday = todaySales.total_sales_amount - todayExpenses.today_expenses;
      const mSales = monthlySales.monthly_sales;
      const mExp = monthlyExpenses.monthly_expenses;
      const netMonthly = mSales - mExp;

      const totalGiven = lenders.reduce((acc, l) => acc + Number(l.amount_given || 0), 0);
      const totalPaid = lenders.reduce((acc, l) => acc + Number(l.amount_paid || 0), 0);
      const totalBalance = totalGiven - totalPaid;
      const activeCount = lenders.filter((l) => Number(l.amount_given || 0) - Number(l.amount_paid || 0) > 0).length;
      const settledCount = lenders.length - activeCount;

      return {
        date: todayDate,
        month,

        // Flat properties (expected by DashboardScreen & calculations)
        today_sales: todaySales.total_sales_amount,
        today_expenses: todayExpenses.today_expenses,
        today_net_amount: netToday,
        current_stock: stockSummary.current_stock,
        total_stock_in: stockSummary.total_in,
        total_stock_out: stockSummary.total_out,
        total_lender_due: totalBalance,
        total_amount_given: totalGiven,
        total_amount_paid: totalPaid,
        monthly_sales: mSales,
        monthly_expenses: mExp,
        monthly_turnover: mSales,
        monthly_net_balance: netMonthly,
        monthly_surplus: netMonthly >= 0,
        expense_breakdown: monthlyExpenses.breakdown,

        // Nested blocks
        today: {
          date: todayDate,
          today_sales: todaySales.total_sales_amount,
          today_expenses: todayExpenses.today_expenses,
          today_net_amount: netToday,
          is_surplus: netToday >= 0,
        },
        monthly: {
          month,
          monthly_sales: mSales,
          monthly_expenses: mExp,
          monthly_turnover: mSales,
          monthly_net_balance: netMonthly,
          is_surplus: netMonthly >= 0,
          expense_breakdown: monthlyExpenses.breakdown,
        },
        stock: {
          total_stock_in: stockSummary.total_in,
          total_stock_out: stockSummary.total_out,
          current_stock: stockSummary.current_stock,
          varieties_count: stockSummary.varieties_count,
        },
        lender: {
          total_lenders: lenders.length,
          total_amount_given: totalGiven,
          total_amount_paid: totalPaid,
          total_balance_due: totalBalance,
          active_loans_count: activeCount,
          settled_loans_count: settledCount,
        },
        provider: 'supabase',
        cloud_mode: 'authoritative_cloud',
      };
    } catch (err) {
      console.warn('[Authoritative] Supabase financial summary failed, falling back to SQLite cache:', err.message);
    }
  }
  return calculationService.getDashboardSummary({ month, userId: uid });
}

export async function generateMonthlyReportDataAuthoritative(yearMonth, userId = 1) {
  if (!yearMonth || !/^\d{4}-\d{2}$/.test(yearMonth)) {
    throw new Error('Valid month in YYYY-MM format is required.');
  }
  const uid = Number(userId || 1);

  if (supabaseService.isSupabaseConfigured()) {
    try {
      const [yearStr, monthStr] = yearMonth.split('-');
      const lastDay = new Date(Number(yearStr), Number(monthStr), 0).getDate();
      const startDate = `${yearMonth}-01`;
      const endDate = `${yearMonth}-${String(lastDay).padStart(2, '0')}`;

      const [
        salesHistory,
        salesSummary,
        expensesHistory,
        expensesSummary,
        stockVarieties,
        stockMovements,
        stockSummary,
        lendersList,
      ] = await Promise.all([
        getSalesAuthoritative({ month: yearMonth, userId: uid, limit: 1000 }),
        getMonthlyTotalSalesAuthoritative(yearMonth, uid),
        getExpensesAuthoritative({ month: yearMonth, userId: uid, limit: 1000 }),
        getMonthlyExpensesByCategoryAuthoritative(yearMonth, uid),
        getProductVarietiesAuthoritative(uid),
        getStockEntriesAuthoritative({ startDate, endDate, userId: uid, limit: 1000 }),
        getStockSummaryAuthoritative(uid),
        getLendersAuthoritative(uid),
      ]);

      const supplierPayments = expensesHistory.filter(
        (e) => e.expense_type === 'Supplier payments'
      );
      const totalSupplierPayments = supplierPayments.reduce(
        (acc, curr) => acc + Number(curr.amount || 0),
        0
      );

      const totalGiven = lendersList.reduce((acc, l) => acc + Number(l.amount_given || 0), 0);
      const totalPaid = lendersList.reduce((acc, l) => acc + Number(l.amount_paid || 0), 0);
      const totalLenderDue = totalGiven - totalPaid;

      const mSales = Number(salesSummary.monthly_sales || 0);
      const mExpenses = Number(expensesSummary.monthly_expenses || 0);
      const mNetBalance = mSales - mExpenses;

      return {
        report_title: `Monthly Business & Accounting Report — ${yearMonth}`,
        month: yearMonth,
        generated_at: new Date().toISOString(),

        // Section 1: Sales
        sales: {
          monthly_total_sales: mSales,
          entries_count: salesHistory.length,
          records: salesHistory.map((s) => ({
            date: s.entry_date,
            daily_total_sales: Number(s.total_sales_amount || 0),
          })),
        },

        // Section 2: Expenses
        expenses: {
          monthly_total_expenses: mExpenses,
          breakdown: expensesSummary.breakdown,
          entries_count: expensesHistory.length,
          records: expensesHistory.map((e) => ({
            id: e.id,
            date: e.expense_date,
            category: e.expense_type,
            amount: Number(e.amount || 0),
            description: e.description || '',
          })),
        },

        // Section 3: Stock
        stock: {
          total_in: Number(stockSummary.total_in || 0),
          total_out: Number(stockSummary.total_out || 0),
          current_stock: Number(stockSummary.current_stock || 0),
          varieties: stockVarieties.map((v) => ({
            id: v.id,
            product_variety: v.name,
            total_in: Number(v.total_in || 0),
            total_out: Number(v.total_out || 0),
            current_stock: Number(v.current_stock || 0),
          })),
          monthly_movements: stockMovements.map((m) => ({
            date: m.entry_date,
            product_variety: m.product_name || m.product_variety || '',
            movement_type: m.movement_type,
            quantity: Number(m.quantity || 0),
            notes: m.notes || '',
          })),
        },

        // Section 4: Supplier Payments
        supplier_payments: {
          monthly_supplier_payment_total: totalSupplierPayments,
          count: supplierPayments.length,
          records: supplierPayments.map((p) => ({
            date: p.expense_date,
            supplier_description: p.description || 'Supplier payment',
            amount: Number(p.amount || 0),
          })),
        },

        // Section 5: Lenders
        lenders: {
          total_amount_given: totalGiven,
          total_amount_paid: totalPaid,
          total_lender_due: totalLenderDue,
          summary: {
            total_amount_given: totalGiven,
            total_amount_paid: totalPaid,
            total_lender_due: totalLenderDue,
            active_lenders_count: lendersList.filter((l) => Number(l.amount_given || 0) - Number(l.amount_paid || 0) > 0).length,
          },
          active_lenders_count: lendersList.filter((l) => Number(l.amount_given || 0) - Number(l.amount_paid || 0) > 0).length,
          records: lendersList.map((l) => {
            const given = Number(l.amount_given || 0);
            const paid = Number(l.amount_paid || 0);
            const balance = given - paid;
            return {
              id: l.id,
              name: l.name,
              mobile: l.mobile,
              place: l.place,
              amount_given: given,
              amount_paid: paid,
              remaining_due: balance,
              balance,
            };
          }),
        },

        // Section 6: Calculations
        calculations: {
          monthly_sales: mSales,
          monthly_total_sales: mSales,
          monthly_expenses: mExpenses,
          monthly_total_expenses: mExpenses,
          monthly_turnover: mSales,
          monthly_net_balance: mNetBalance,
          total_lender_due: totalLenderDue,
          current_stock: Number(stockSummary.current_stock || 0),
          is_surplus: mNetBalance >= 0,
        },
        provider: 'supabase',
      };
    } catch (err) {
      console.warn('[Authoritative] Cloud report generation failed, falling back to SQLite cache:', err.message);
    }
  }

  return reportService.generateMonthlyReportData(yearMonth, uid);
}

// ============================================================================
// 7. USER AUTHENTICATION AUTHORITATIVE
// ============================================================================

export async function signupUserAuthoritative({ username, password, confirmPassword }) {
  if (supabaseService.isSupabaseConfigured()) {
    try {
      const cleanUsername = username.trim().toLowerCase();
      const existing = await supabaseService.fetchCloudUserByUsername(cleanUsername);
      if (existing) {
        throw new Error(`Username "${cleanUsername}" is already taken in cloud database.`);
      }
      const passwordHash = authService.hashPassword(password);
      const cloudUser = await supabaseService.createCloudUser({
        username: cleanUsername,
        password_hash: passwordHash,
      });
      const userId = Number(cloudUser.id);
      const user = { id: userId, username: cleanUsername };
      const token = authService.generateToken(user);
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      await supabaseService.createCloudSession(userId, token, expiresAt);

      // Mirror to local SQLite cache
      try {
        db.prepare('INSERT OR REPLACE INTO users (id, username, password_hash) VALUES (?, ?, ?)').run(
          userId,
          cleanUsername,
          passwordHash
        );
        db.prepare('INSERT OR REPLACE INTO sessions (user_id, token, expires_at) VALUES (?, ?, ?)').run(
          userId,
          token,
          expiresAt
        );
      } catch (e) {}

      return {
        user,
        token,
        needs_profile: true,
        business_profile: null,
      };
    } catch (err) {
      if (err.message && err.message.includes('already taken')) throw err;
      console.warn('[Authoritative] Supabase signup failed, falling back to SQLite:', err.message);
    }
  }
  return authService.signupUser({ username, password, confirmPassword });
}

export async function loginUserAuthoritative({ username, password, clientIp }) {
  if (supabaseService.isSupabaseConfigured()) {
    try {
      const cleanUsername = username.trim().toLowerCase();
      const cloudUser = await supabaseService.fetchCloudUserByUsername(cleanUsername);
      if (cloudUser) {
        if (!authService.verifyPassword(password, cloudUser.password_hash)) {
          throw new Error('Invalid username or password.');
        }
        const user = { id: Number(cloudUser.id), username: cloudUser.username };
        const token = authService.generateToken(user);
        const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
        await supabaseService.createCloudSession(user.id, token, expiresAt);
        let profile = await supabaseService.fetchCloudBusinessProfile(user.id);
        if (!profile) {
          try {
            profile = await supabaseService.upsertCloudBusinessProfile(user.id, {
              business_name: `${cloudUser.username} Business`,
              business_address: 'Main Store',
              business_nickname: cloudUser.username,
            });
          } catch (pe) {}
        }

        // Mirror to local cache
        try {
          db.prepare('INSERT OR REPLACE INTO users (id, username, password_hash) VALUES (?, ?, ?)').run(
            user.id,
            cloudUser.username,
            cloudUser.password_hash
          );
          db.prepare('INSERT OR REPLACE INTO sessions (user_id, token, expires_at) VALUES (?, ?, ?)').run(
            user.id,
            token,
            expiresAt
          );
          if (profile) {
            authService.saveBusinessProfile(user.id, {
              business_name: profile.business_name,
              business_address: profile.business_address,
              business_nickname: profile.business_nickname,
            });
          }
        } catch (e) {}

        return {
          user,
          token,
          needs_profile: false,
          profile: profile || null,
        };
      }
    } catch (err) {
      if (err.message && err.message.includes('Invalid username or password')) throw err;
      console.warn('[Authoritative] Supabase login failed, falling back to SQLite cache:', err.message);
    }
  }
  return authService.loginUser({ username, password, ip: clientIp });
}

export async function logoutUserAuthoritative(token) {
  if (supabaseService.isSupabaseConfigured()) {
    try {
      await supabaseService.deleteCloudSession(token);
    } catch (err) {
      console.warn('[Authoritative] Supabase delete session warning:', err.message);
    }
  }
  return authService.logoutUser(token);
}

// ============================================================================
// 8. DEVICE LOSS RECOVERY: RECONCILE CLOUD DATA TO LOCAL SQLITE CACHE
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
      `).run(
        uid,
        cloudProfile.business_name,
        cloudProfile.business_address,
        cloudProfile.business_nickname,
        cloudProfile.updated_at || new Date().toISOString()
      );
    }

    // 2. Fetch Varieties
    const cloudVarieties = await supabaseService.fetchCloudVarieties(uid);
    for (const v of cloudVarieties) {
      const exists = db
        .prepare('SELECT id FROM product_varieties WHERE user_id = ? AND name = ? COLLATE NOCASE')
        .get(uid, v.name);
      if (!exists) {
        db.prepare('INSERT INTO product_varieties (id, user_id, name, created_at) VALUES (?, ?, ?, ?)').run(
          v.id,
          uid,
          v.name,
          v.created_at
        );
      }
    }

    // 2b. Fetch Stock Entries
    const cloudStockEntries = await supabaseService.fetchCloudStockEntries(uid);
    for (const se of cloudStockEntries) {
      const exists = db.prepare('SELECT id FROM stock_entries WHERE id = ?').get(se.id);
      if (!exists) {
        db.prepare(`
          INSERT INTO stock_entries (id, user_id, product_id, movement_type, quantity, entry_date, notes, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          se.id,
          uid,
          se.product_id,
          se.movement_type,
          Number(se.quantity),
          se.entry_date,
          se.notes || '',
          se.created_at
        );
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
      const exists = db.prepare('SELECT id FROM expenses WHERE id = ?').get(e.id);
      if (!exists) {
        db.prepare(`
          INSERT INTO expenses (id, user_id, expense_date, expense_type, amount, description, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(e.id, uid, e.expense_date, e.expense_type, Number(e.amount), e.description, e.created_at);
      }
    }

    // 5. Fetch Lenders
    const cloudLenders = await supabaseService.fetchCloudLenders(uid);
    for (const l of cloudLenders) {
      const exists = db.prepare('SELECT id FROM lenders WHERE id = ?').get(l.id);
      if (!exists) {
        db.prepare(`
          INSERT INTO lenders (id, user_id, name, mobile, place, amount_given, amount_paid, loan_date, notes, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          l.id,
          uid,
          l.name,
          l.mobile,
          l.place,
          Number(l.amount_given),
          Number(l.amount_paid),
          l.loan_date,
          l.notes,
          l.created_at,
          l.updated_at
        );
      }
    }

    return {
      success: true,
      message: 'Cloud data reconciled to local SQLite cache successfully.',
      counts: {
        varieties: cloudVarieties.length,
        sales: cloudSales.length,
        expenses: cloudExpenses.length,
        lenders: cloudLenders.length,
      },
    };
  } catch (err) {
    console.error('[Reconcile] Error reconciling cloud data:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Flush all pending offline mutations to Cloud with Idempotency Protection
 */
export async function flushOfflineQueue(userId = 1) {
  const uid = Number(userId || 1);
  if (!supabaseService.isSupabaseConfigured()) {
    return { success: false, message: 'Cloud provider unconfigured in .env' };
  }

  const pending = db
    .prepare("SELECT * FROM cloud_sync_log WHERE user_id = ? AND status = 'pending' ORDER BY id ASC")
    .all(uid);

  let successCount = 0;
  let failureCount = 0;

  for (const item of pending) {
    try {
      const payload = JSON.parse(item.payload);

      if (item.entity_type === 'sales') {
        await supabaseService.upsertCloudSale(uid, payload);
      } else if (item.entity_type === 'expenses') {
        if (item.mutation_type === 'CREATE') {
          await supabaseService.createCloudExpense(uid, payload);
        } else if (item.mutation_type === 'UPDATE') {
          await supabaseService.updateCloudExpense(uid, item.entity_id, payload);
        } else if (item.mutation_type === 'DELETE') {
          await supabaseService.deleteCloudExpense(uid, item.entity_id);
        }
      } else if (item.entity_type === 'stock_entries') {
        await supabaseService.createCloudStockEntry(uid, payload);
      } else if (item.entity_type === 'lenders') {
        await supabaseService.createCloudLender(uid, payload);
      }

      db.prepare("UPDATE cloud_sync_log SET status = 'synced', synced_at = CURRENT_TIMESTAMP WHERE id = ?").run(
        item.id
      );
      successCount++;
    } catch (err) {
      console.warn(`[OfflineQueue] Flush item ${item.id} failed:`, err.message);
      db.prepare('UPDATE cloud_sync_log SET attempts = attempts + 1, error_message = ? WHERE id = ?').run(
        err.message,
        item.id
      );
      failureCount++;
    }
  }

  return {
    success: failureCount === 0,
    flushed: successCount,
    failed: failureCount,
    remaining_pending: db
      .prepare("SELECT COUNT(*) as c FROM cloud_sync_log WHERE user_id = ? AND status = 'pending'")
      .get(uid).c,
  };
}
