import db from '../db/database.js';
import { isValidDateString, getTodayDateString } from './salesService.js';

/**
 * Add a new product variety scoped to authenticated owner
 */
export function addProductVariety(name, userId = 1) {
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    throw new Error('Product variety name is required and cannot be empty.');
  }

  const cleanName = name.trim();
  const uid = Number(userId || 1);

  // Check unique per user
  const existing = db
    .prepare('SELECT id, name FROM product_varieties WHERE name = ? AND user_id = ? COLLATE NOCASE')
    .get(cleanName, uid);

  if (existing) {
    throw new Error(`Product variety "${cleanName}" already exists.`);
  }

  const now = new Date().toISOString();
  const result = db
    .prepare('INSERT INTO product_varieties (user_id, name, created_at) VALUES (?, ?, ?)')
    .run(uid, cleanName, now);

  return {
    id: Number(result.lastInsertRowid),
    user_id: uid,
    name: cleanName,
    current_stock: 0,
    created_at: now,
  };
}

/**
 * Calculate current stock for a specific variety ID scoped to authenticated owner
 * Formula: Current Stock = Total IN - Total OUT
 */
export function getCurrentStockForVariety(varietyId, userId = 1) {
  const uid = Number(userId || 1);
  const result = db
    .prepare(`
      SELECT 
        COALESCE(SUM(CASE WHEN movement_type = 'IN' THEN quantity ELSE 0 END), 0) AS total_in,
        COALESCE(SUM(CASE WHEN movement_type = 'OUT' THEN quantity ELSE 0 END), 0) AS total_out
      FROM stock_entries
      WHERE product_id = ? AND user_id = ?
    `)
    .get(varietyId, uid);

  const totalIn = Number(result ? result.total_in : 0);
  const totalOut = Number(result ? result.total_out : 0);
  const currentStock = totalIn - totalOut;

  return {
    total_in: totalIn,
    total_out: totalOut,
    current_stock: currentStock,
  };
}

/**
 * View all product varieties along with their calculated current stock scoped to authenticated owner
 */
export function getAllVarieties(userId = 1) {
  const uid = Number(userId || 1);
  const varieties = db
    .prepare(`
      SELECT 
        pv.id,
        pv.user_id,
        pv.name,
        pv.created_at,
        COALESCE(SUM(CASE WHEN se.movement_type = 'IN' THEN se.quantity ELSE 0 END), 0) AS total_in,
        COALESCE(SUM(CASE WHEN se.movement_type = 'OUT' THEN se.quantity ELSE 0 END), 0) AS total_out
      FROM product_varieties pv
      LEFT JOIN stock_entries se ON pv.id = se.product_id AND se.user_id = pv.user_id
      WHERE pv.user_id = ?
      GROUP BY pv.id, pv.name, pv.created_at
      ORDER BY pv.name ASC
    `)
    .all(uid);

  return varieties.map((v) => {
    const totalIn = Number(v.total_in);
    const totalOut = Number(v.total_out);
    return {
      id: Number(v.id),
      user_id: Number(v.user_id),
      name: v.name,
      created_at: v.created_at,
      total_in: totalIn,
      total_out: totalOut,
      current_stock: totalIn - totalOut,
    };
  });
}

/**
 * Get single variety by ID scoped to authenticated owner
 */
export function getVarietyById(id, userId = 1) {
  const uid = Number(userId || 1);
  const variety = db
    .prepare('SELECT id, user_id, name, created_at FROM product_varieties WHERE id = ? AND user_id = ?')
    .get(id, uid);

  if (!variety) return null;

  const stockMetrics = getCurrentStockForVariety(id, uid);
  return {
    id: Number(variety.id),
    user_id: Number(variety.user_id),
    name: variety.name,
    created_at: variety.created_at,
    ...stockMetrics,
  };
}

/**
 * Record Stock Movement (IN or OUT) scoped to authenticated owner
 */
export function recordStockMovement({ product_id, movement_type, quantity, entry_date, notes = '', userId }, secondArg = 1) {
  if (!product_id) {
    throw new Error('Product variety is required.');
  }

  const uid = Number(userId || secondArg || 1);
  const variety = db
    .prepare('SELECT id, name FROM product_varieties WHERE id = ? AND user_id = ?')
    .get(product_id, uid);

  if (!variety) {
    throw new Error(`Product variety with ID ${product_id} does not exist.`);
  }

  if (!movement_type || !['IN', 'OUT'].includes(movement_type)) {
    throw new Error("Movement type must be either 'IN' or 'OUT'.");
  }

  const numQty = Number(quantity);
  if (isNaN(numQty) || numQty <= 0) {
    throw new Error('Quantity must be a number greater than 0.');
  }

  const targetDate = entry_date || getTodayDateString();
  if (!isValidDateString(targetDate)) {
    throw new Error('Valid date in YYYY-MM-DD format is required.');
  }

  const cleanNotes = notes ? String(notes).trim() : null;
  const now = new Date().toISOString();

  const result = db.prepare(
    `INSERT INTO stock_entries (user_id, product_id, movement_type, quantity, entry_date, notes, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(uid, product_id, movement_type, numQty, targetDate, cleanNotes, now);

  const updatedStock = getCurrentStockForVariety(product_id, uid);

  return {
    id: Number(result.lastInsertRowid),
    user_id: uid,
    product_id: Number(product_id),
    product_name: variety.name,
    movement_type,
    quantity: numQty,
    entry_date: targetDate,
    notes: cleanNotes,
    created_at: now,
    variety_current_stock: updatedStock.current_stock,
  };
}

/**
 * Retrieve Stock Movement History scoped to authenticated owner
 */
export function getStockHistory({ product_id, startDate, endDate, limit = 100, offset = 0 } = {}, userId = 1) {
  const uid = Number(userId || 1);
  let query = `
    SELECT 
      se.id,
      se.user_id,
      se.product_id,
      pv.name AS product_name,
      se.movement_type,
      se.quantity,
      se.entry_date,
      se.notes,
      se.created_at
    FROM stock_entries se
    JOIN product_varieties pv ON se.product_id = pv.id
    WHERE se.user_id = ?
  `;
  const params = [uid];

  if (product_id) {
    query += ' AND se.product_id = ?';
    params.push(product_id);
  }

  if (startDate) {
    query += ' AND se.entry_date >= ?';
    params.push(startDate);
  }

  if (endDate) {
    query += ' AND se.entry_date <= ?';
    params.push(endDate);
  }

  query += ' ORDER BY se.entry_date DESC, se.id DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const rows = db.prepare(query).all(...params);
  return rows.map((r) => ({
    ...r,
    quantity: Number(r.quantity),
  }));
}

/**
 * Calculate total stock summary across all product varieties scoped to authenticated owner
 */
export function getTotalStockSummary(userId = 1) {
  const uid = Number(userId || 1);
  const result = db
    .prepare(`
      SELECT 
        COALESCE(SUM(CASE WHEN movement_type = 'IN' THEN quantity ELSE 0 END), 0) AS total_in,
        COALESCE(SUM(CASE WHEN movement_type = 'OUT' THEN quantity ELSE 0 END), 0) AS total_out
      FROM stock_entries
      WHERE user_id = ?
    `)
    .get(uid);

  const varietiesCount = db
    .prepare('SELECT COUNT(*) AS total_varieties FROM product_varieties WHERE user_id = ?')
    .get(uid);

  const totalIn = Number(result ? result.total_in : 0);
  const totalOut = Number(result ? result.total_out : 0);

  return {
    total_in: totalIn,
    total_out: totalOut,
    current_stock: totalIn - totalOut,
    total_varieties: Number(varietiesCount ? varietiesCount.total_varieties : 0),
  };
}
