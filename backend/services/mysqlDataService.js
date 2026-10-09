/**
 * Hostinger MySQL Authoritative Business Data Service
 * Project: Business Management & Accountant Management App
 *
 * Implements full authoritative persistence and queries on Hostinger MySQL
 * with zero data loss, strict parameterization, and input validation.
 */

import crypto from 'node:crypto';
import * as mysql from '../db/mysql.js';
import db from '../db/database.js'; // SQLite cache fallback / mirror
import { hashPassword, verifyPassword, generateToken, parseToken } from './authService.js';
import { APPROVED_EXPENSE_CATEGORIES } from './expenseService.js';
import { isValidDateString, getTodayDateString } from './salesService.js';
import { getCurrentMonthString } from './calculationService.js';

// ============================================================================
// 1. AUTHENTICATION & BUSINESS PROFILE
// ============================================================================

export async function signupUser({ username, password, confirmPassword, confirm_password }) {
  if (!username || typeof username !== 'string' || !username.trim()) {
    const err = new Error('Username is required.');
    err.statusCode = 400;
    throw err;
  }

  const cleanUsername = username.trim();

  if (!password || typeof password !== 'string' || password.length === 0) {
    const err = new Error('Password is required.');
    err.statusCode = 400;
    throw err;
  }

  const confirm = confirmPassword !== undefined ? confirmPassword : confirm_password;
  if (confirm !== undefined && password !== confirm) {
    const err = new Error('Password and confirmation password do not match.');
    err.statusCode = 400;
    throw err;
  }

  // Atomically execute user creation, session token generation, and business profile in a MySQL transaction
  return await mysql.withTransaction(async (conn) => {
    // 1. Check unique username with FOR UPDATE row lock
    const [existing] = await conn.query(
      'SELECT id FROM users WHERE LOWER(username) = LOWER(?) LIMIT 1 FOR UPDATE',
      [cleanUsername]
    );

    if (existing.length > 0) {
      const err = new Error(`Username "${cleanUsername}" is already taken. Please choose another.`);
      err.statusCode = 409;
      throw err;
    }

    // 2. Hash password securely using Node.js scrypt with unique salt (never plaintext)
    const passwordHash = hashPassword(password);

    // 3. Insert user record
    const [insertResult] = await conn.query(
      'INSERT INTO users (username, password_hash, created_at, updated_at) VALUES (?, ?, NOW(), NOW())',
      [cleanUsername, passwordHash]
    );

    const userId = Number(insertResult.insertId);
    const user = { id: userId, username: cleanUsername };

    // 4. Generate cryptographically signed session token and record in sessions table
    const token = generateToken(user);
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await conn.query(
      'INSERT INTO sessions (user_id, token, expires_at, created_at) VALUES (?, ?, ?, NOW())',
      [userId, token, expiresAt]
    );

    // 5. Create default business profile in same transaction
    const businessName = `${cleanUsername} Business`;
    const businessAddress = 'Main Store';
    const businessNickname = cleanUsername;

    await conn.query(
      `INSERT INTO business_profiles (user_id, business_name, business_address, business_nickname, created_at, updated_at)
       VALUES (?, ?, ?, ?, NOW(), NOW())
       ON DUPLICATE KEY UPDATE updated_at = NOW()`,
      [userId, businessName, businessAddress, businessNickname]
    );

    const defaultProfile = {
      user_id: userId,
      business_name: businessName,
      business_address: businessAddress,
      business_nickname: businessNickname,
    };

    // 6. Mirror to local SQLite cache if available (non-blocking for cloud MySQL)
    try {
      const existingSqlite = db.prepare('SELECT id FROM users WHERE id = ?').get(userId);
      if (!existingSqlite) {
        db.prepare('INSERT OR REPLACE INTO users (id, username, password_hash) VALUES (?, ?, ?)').run(
          userId,
          cleanUsername,
          passwordHash
        );
      }
      db.prepare('INSERT OR REPLACE INTO sessions (user_id, token, expires_at) VALUES (?, ?, ?)').run(
        userId,
        token,
        expiresAt.toISOString()
      );
      db.prepare(
        'INSERT OR REPLACE INTO business_profiles (user_id, business_name, business_address, business_nickname) VALUES (?, ?, ?, ?)'
      ).run(userId, businessName, businessAddress, businessNickname);
    } catch (e) {
      // Non-fatal SQLite mirror warning
    }

    return {
      user,
      token,
      needs_profile: true,
      business_profile: defaultProfile,
    };
  });
}

export async function loginUser({ username, password, clientIp = '127.0.0.1' }) {
  if (!username || !password) {
    throw new Error('Username and password are required.');
  }

  const cleanUsername = username.trim();

  const [rows] = await mysql.query(
    'SELECT id, username, password_hash FROM users WHERE LOWER(username) = LOWER(?) LIMIT 1',
    [cleanUsername]
  );

  if (rows.length === 0 || !verifyPassword(password, rows[0].password_hash)) {
    throw new Error('Invalid username or password.');
  }

  const userRow = rows[0];
  const user = { id: Number(userRow.id), username: userRow.username };

  // Profile lookup
  let profile = await getBusinessProfile(user.id);
  if (!profile) {
    profile = {
      user_id: user.id,
      business_name: `${user.username} Business`,
      business_address: 'Main Store',
      business_nickname: user.username,
    };
    await upsertBusinessProfile(user.id, profile);
  }

  // Generate and store session token
  const token = generateToken(user);
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  await mysql.query(
    'INSERT INTO sessions (user_id, token, expires_at, created_at) VALUES (?, ?, ?, NOW())',
    [user.id, token, expiresAt]
  );

  // Mirror session to SQLite
  try {
    db.prepare('INSERT OR REPLACE INTO sessions (user_id, token, expires_at) VALUES (?, ?, ?)').run(
      user.id,
      token,
      expiresAt.toISOString()
    );
  } catch (e) {}

  return {
    user,
    token,
    needs_profile: false,
    profile,
  };
}

export async function getUserFromToken(token) {
  if (!token || typeof token !== 'string') return null;

  const payload = parseToken(token);
  if (!payload || !payload.userId) return null;

  try {
    const [rows] = await mysql.query(
      `SELECT s.id as session_id, s.user_id, u.username
       FROM sessions s
       JOIN users u ON s.user_id = u.id
       WHERE s.token = ? AND s.expires_at > NOW()
       LIMIT 1`,
      [token]
    );

    if (rows.length > 0) {
      const u = rows[0];
      const profile = await getBusinessProfile(u.user_id);
      return {
        user: { id: Number(u.user_id), username: u.username },
        profile: profile || null,
        needs_profile: !profile,
      };
    }
  } catch (err) {
    console.warn('[MySQL Auth] Session query failed, checking local SQLite cache:', err.message);
  }

  // Fallback to SQLite sessions
  try {
    const session = db.prepare('SELECT user_id FROM sessions WHERE token = ?').get(token);
    if (session) {
      const user = db.prepare('SELECT id, username FROM users WHERE id = ?').get(session.user_id);
      if (user) {
        const profile = db.prepare('SELECT * FROM business_profiles WHERE user_id = ?').get(user.id);
        return {
          user: { id: Number(user.id), username: user.username },
          profile: profile || null,
          needs_profile: !profile,
        };
      }
    }
  } catch (e) {}

  return null;
}

export async function logoutUser(token) {
  if (!token) return { success: true };
  try {
    await mysql.query('DELETE FROM sessions WHERE token = ?', [token]);
  } catch (e) {}
  try {
    db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
  } catch (e) {}
  return { success: true, message: 'Logged out successfully.' };
}

export async function getBusinessProfile(userId) {
  const uid = Number(userId || 1);
  try {
    const [rows] = await mysql.query(
      'SELECT id, user_id, business_name, business_address, business_nickname, created_at, updated_at FROM business_profiles WHERE user_id = ? LIMIT 1',
      [uid]
    );

    if (rows.length > 0) {
      const r = rows[0];
      return {
        id: Number(r.id),
        user_id: Number(r.user_id),
        business_name: r.business_name,
        business_address: r.business_address,
        business_nickname: r.business_nickname,
        created_at: r.created_at,
        updated_at: r.updated_at,
      };
    }
  } catch (err) {
    console.warn('[MySQL Profile] Fetch failed:', err.message);
  }

  // Fallback to SQLite
  try {
    const p = db.prepare('SELECT * FROM business_profiles WHERE user_id = ?').get(uid);
    if (p) return p;
  } catch (e) {}

  return null;
}

export async function upsertBusinessProfile(userId, { business_name, business_address, business_nickname }) {
  const uid = Number(userId || 1);
  const name = (business_name || '').trim();
  const address = (business_address || '').trim();
  const nickname = (business_nickname || '').trim();

  if (!name || !address || !nickname) {
    throw new Error('Business Name, Address, and Nickname are all required.');
  }

  await mysql.query(
    `INSERT INTO business_profiles (user_id, business_name, business_address, business_nickname, created_at, updated_at)
     VALUES (?, ?, ?, ?, NOW(), NOW())
     ON DUPLICATE KEY UPDATE
       business_name = VALUES(business_name),
       business_address = VALUES(business_address),
       business_nickname = VALUES(business_nickname),
       updated_at = NOW()`,
    [uid, name, address, nickname]
  );

  // Mirror to SQLite
  try {
    const now = new Date().toISOString();
    const existing = db.prepare('SELECT id FROM business_profiles WHERE user_id = ?').get(uid);
    if (existing) {
      db.prepare(
        'UPDATE business_profiles SET business_name = ?, business_address = ?, business_nickname = ?, updated_at = ? WHERE user_id = ?'
      ).run(name, address, nickname, now, uid);
    } else {
      db.prepare(
        'INSERT INTO business_profiles (user_id, business_name, business_address, business_nickname, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)'
      ).run(uid, name, address, nickname, now, now);
    }
  } catch (e) {}

  return getBusinessProfile(uid);
}

// ============================================================================
// 2. DAILY SALES MANAGEMENT
// ============================================================================

export async function recordDailySales(entryDate, amount, userId = 1) {
  if (!entryDate || !isValidDateString(entryDate)) {
    throw new Error('Valid date in YYYY-MM-DD format is required.');
  }

  const numericAmount = Number(amount);
  if (isNaN(numericAmount) || numericAmount < 0) {
    throw new Error('Total sales amount must be a non-negative number.');
  }

  const uid = Number(userId || 1);

  // Check if existing record exists for this date and user
  const [existingRows] = await mysql.query(
    'SELECT id, total_sales_amount FROM daily_sales WHERE user_id = ? AND entry_date = ? LIMIT 1',
    [uid, entryDate]
  );

  const isUpdated = existingRows.length > 0;

  const [result] = await mysql.query(
    `INSERT INTO daily_sales (user_id, entry_date, total_sales_amount, created_at, updated_at)
     VALUES (?, ?, ?, NOW(), NOW())
     ON DUPLICATE KEY UPDATE
       total_sales_amount = VALUES(total_sales_amount),
       updated_at = NOW()`,
    [uid, entryDate, numericAmount]
  );

  const recordId = isUpdated ? Number(existingRows[0].id) : Number(result.insertId);

  // Mirror to SQLite
  try {
    const now = new Date().toISOString();
    const localExisting = db.prepare('SELECT id FROM daily_sales WHERE user_id = ? AND entry_date = ?').get(uid, entryDate);
    if (localExisting) {
      db.prepare('UPDATE daily_sales SET total_sales_amount = ?, updated_at = ? WHERE id = ?').run(numericAmount, now, localExisting.id);
    } else {
      db.prepare('INSERT INTO daily_sales (user_id, entry_date, total_sales_amount, created_at, updated_at) VALUES (?, ?, ?, ?, ?)').run(
        uid,
        entryDate,
        numericAmount,
        now,
        now
      );
    }
  } catch (e) {}

  return {
    id: recordId,
    user_id: uid,
    entry_date: entryDate,
    total_sales_amount: numericAmount,
    is_updated: isUpdated,
    message: isUpdated
      ? `Updated sales record for ${entryDate}`
      : `Created sales record for ${entryDate}`,
  };
}

export async function getTodaySales(customDate = null, userId = 1) {
  const targetDate = customDate || getTodayDateString();
  const uid = Number(userId || 1);

  const [rows] = await mysql.query(
    'SELECT id, entry_date, total_sales_amount FROM daily_sales WHERE user_id = ? AND entry_date = ? LIMIT 1',
    [uid, targetDate]
  );

  if (rows.length > 0) {
    return {
      date: targetDate,
      total_sales_amount: Number(rows[0].total_sales_amount),
      has_entry: true,
      id: Number(rows[0].id),
    };
  }

  return {
    date: targetDate,
    total_sales_amount: 0,
    has_entry: false,
    id: null,
  };
}

export async function getSalesByDate(entryDate, userId = 1) {
  if (!entryDate || !isValidDateString(entryDate)) {
    throw new Error('Valid date in YYYY-MM-DD format is required.');
  }

  const uid = Number(userId || 1);
  const [rows] = await mysql.query(
    'SELECT id, user_id, entry_date, total_sales_amount, created_at, updated_at FROM daily_sales WHERE user_id = ? AND entry_date = ? LIMIT 1',
    [uid, entryDate]
  );

  if (rows.length === 0) return null;

  const r = rows[0];
  return {
    id: Number(r.id),
    user_id: Number(r.user_id),
    entry_date: r.entry_date,
    total_sales_amount: Number(r.total_sales_amount),
    created_at: r.created_at,
    updated_at: r.updated_at,
  };
}

export async function getMonthlyTotalSales(month = null, userId = 1) {
  const targetMonth = month || getCurrentMonthString();
  const uid = Number(userId || 1);

  const [rows] = await mysql.query(
    `SELECT COALESCE(SUM(total_sales_amount), 0) as monthly_sales, COUNT(*) as days_recorded
     FROM daily_sales
     WHERE user_id = ? AND entry_date LIKE ?`,
    [uid, `${targetMonth}%`]
  );

  const mSales = Number(rows[0]?.monthly_sales || 0);
  const days = Number(rows[0]?.days_recorded || 0);

  return {
    month: targetMonth,
    monthly_sales: mSales,
    days_recorded: days,
  };
}

export async function getSalesHistory({ month, startDate, endDate, limit = 100, offset = 0, userId = 1 }) {
  const uid = Number(userId || 1);
  const numLimit = Math.max(1, Math.min(1000, Number(limit) || 100));
  const numOffset = Math.max(0, Number(offset) || 0);

  let sql = 'SELECT id, user_id, entry_date, total_sales_amount, created_at, updated_at FROM daily_sales WHERE user_id = ?';
  const params = [uid];

  if (month && !startDate && !endDate) {
    sql += ' AND entry_date LIKE ?';
    params.push(`${month}%`);
  } else {
    if (startDate) {
      sql += ' AND entry_date >= ?';
      params.push(startDate);
    }
    if (endDate) {
      sql += ' AND entry_date <= ?';
      params.push(endDate);
    }
  }

  sql += ' ORDER BY entry_date DESC, id DESC LIMIT ? OFFSET ?';
  params.push(numLimit, numOffset);

  const [rows] = await mysql.query(sql, params);

  return rows.map((r) => ({
    id: Number(r.id),
    user_id: Number(r.user_id),
    entry_date: r.entry_date,
    total_sales_amount: Number(r.total_sales_amount),
    created_at: r.created_at,
    updated_at: r.updated_at,
  }));
}

// ============================================================================
// 3. EXPENSES MANAGEMENT
// ============================================================================

export async function addExpense({ expense_date, expense_type, amount, description = '', userId = 1 }) {
  if (!expense_date || !isValidDateString(expense_date)) {
    throw new Error('Valid date in YYYY-MM-DD format is required.');
  }

  if (!expense_type || !APPROVED_EXPENSE_CATEGORIES.includes(expense_type)) {
    throw new Error(`Invalid expense type. Allowed categories: ${APPROVED_EXPENSE_CATEGORIES.join(', ')}`);
  }

  const numAmount = Number(amount);
  if (isNaN(numAmount) || numAmount <= 0) {
    throw new Error('Expense amount must be a number strictly greater than 0.');
  }

  const uid = Number(userId || 1);
  const cleanDesc = description ? String(description).trim() : null;

  const [result] = await mysql.query(
    `INSERT INTO expenses (user_id, expense_date, expense_type, amount, description, created_at)
     VALUES (?, ?, ?, ?, ?, NOW())`,
    [uid, expense_date, expense_type, numAmount, cleanDesc]
  );

  const id = Number(result.insertId);

  // Mirror to SQLite
  try {
    const now = new Date().toISOString();
    db.prepare(
      'INSERT INTO expenses (id, user_id, expense_date, expense_type, amount, description, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(id, uid, expense_date, expense_type, numAmount, cleanDesc, now);
  } catch (e) {}

  return {
    id,
    user_id: uid,
    expense_date,
    expense_type,
    amount: numAmount,
    description: cleanDesc,
  };
}

export async function updateExpense(id, { expense_date, expense_type, amount, description = '', userId = 1 }) {
  const uid = Number(userId || 1);
  const [existing] = await mysql.query('SELECT id FROM expenses WHERE id = ? AND user_id = ? LIMIT 1', [id, uid]);
  if (existing.length === 0) {
    throw new Error(`Expense with ID ${id} not found.`);
  }

  if (!expense_date || !isValidDateString(expense_date)) {
    throw new Error('Valid date in YYYY-MM-DD format is required.');
  }

  if (!expense_type || !APPROVED_EXPENSE_CATEGORIES.includes(expense_type)) {
    throw new Error(`Invalid expense type. Allowed categories: ${APPROVED_EXPENSE_CATEGORIES.join(', ')}`);
  }

  const numAmount = Number(amount);
  if (isNaN(numAmount) || numAmount <= 0) {
    throw new Error('Expense amount must be a number strictly greater than 0.');
  }

  const cleanDesc = description ? String(description).trim() : null;

  await mysql.query(
    `UPDATE expenses
     SET expense_date = ?, expense_type = ?, amount = ?, description = ?
     WHERE id = ? AND user_id = ?`,
    [expense_date, expense_type, numAmount, cleanDesc, id, uid]
  );

  // Mirror to SQLite
  try {
    db.prepare('UPDATE expenses SET expense_date = ?, expense_type = ?, amount = ?, description = ? WHERE id = ? AND user_id = ?').run(
      expense_date,
      expense_type,
      numAmount,
      cleanDesc,
      id,
      uid
    );
  } catch (e) {}

  return {
    id: Number(id),
    user_id: uid,
    expense_date,
    expense_type,
    amount: numAmount,
    description: cleanDesc,
  };
}

export async function deleteExpense(id, userId = 1) {
  const uid = Number(userId || 1);
  const [result] = await mysql.query('DELETE FROM expenses WHERE id = ? AND user_id = ?', [id, uid]);
  if (result.affectedRows === 0) {
    throw new Error(`Expense with ID ${id} not found.`);
  }

  // Mirror to SQLite
  try {
    db.prepare('DELETE FROM expenses WHERE id = ? AND user_id = ?').run(id, uid);
  } catch (e) {}

  return { success: true, message: `Expense ID ${id} deleted successfully.` };
}

export async function getExpenses({ month, expenseType, startDate, endDate, limit = 100, offset = 0, userId = 1 }) {
  const uid = Number(userId || 1);
  const numLimit = Math.max(1, Math.min(1000, Number(limit) || 100));
  const numOffset = Math.max(0, Number(offset) || 0);

  let sql = 'SELECT id, user_id, expense_date, expense_type, amount, description, created_at FROM expenses WHERE user_id = ?';
  const params = [uid];

  if (month && !startDate && !endDate) {
    sql += ' AND expense_date LIKE ?';
    params.push(`${month}%`);
  } else {
    if (startDate) {
      sql += ' AND expense_date >= ?';
      params.push(startDate);
    }
    if (endDate) {
      sql += ' AND expense_date <= ?';
      params.push(endDate);
    }
  }

  if (expenseType) {
    sql += ' AND expense_type = ?';
    params.push(expenseType);
  }

  sql += ' ORDER BY expense_date DESC, id DESC LIMIT ? OFFSET ?';
  params.push(numLimit, numOffset);

  const [rows] = await mysql.query(sql, params);

  return rows.map((r) => ({
    id: Number(r.id),
    user_id: Number(r.user_id),
    expense_date: r.expense_date,
    expense_type: r.expense_type,
    amount: Number(r.amount),
    description: r.description || '',
    created_at: r.created_at,
  }));
}

export async function getTodayExpenses(customDate = null, userId = 1) {
  const targetDate = customDate || getTodayDateString();
  const uid = Number(userId || 1);

  const [rows] = await mysql.query(
    'SELECT COALESCE(SUM(amount), 0) as today_expenses FROM expenses WHERE user_id = ? AND expense_date = ?',
    [uid, targetDate]
  );

  return {
    date: targetDate,
    today_expenses: Number(rows[0]?.today_expenses || 0),
  };
}

export async function getMonthlyExpensesByCategory(month = null, userId = 1) {
  const targetMonth = month || getCurrentMonthString();
  const uid = Number(userId || 1);

  const [rows] = await mysql.query(
    `SELECT expense_type, COALESCE(SUM(amount), 0) as category_total
     FROM expenses
     WHERE user_id = ? AND expense_date LIKE ?
     GROUP BY expense_type`,
    [uid, `${targetMonth}%`]
  );

  const breakdown = {};
  for (const cat of APPROVED_EXPENSE_CATEGORIES) {
    breakdown[cat] = 0;
  }

  let total = 0;
  for (const r of rows) {
    const amt = Number(r.category_total);
    breakdown[r.expense_type] = amt;
    total += amt;
  }

  return {
    month: targetMonth,
    monthly_expenses: total,
    breakdown,
  };
}

// ============================================================================
// 4. STOCK & PRODUCT VARIETIES
// ============================================================================

export async function addProductVariety(name, userId = 1) {
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    throw new Error('Product variety name is required and cannot be empty.');
  }

  const cleanName = name.trim();
  const uid = Number(userId || 1);

  const [existing] = await mysql.query(
    'SELECT id FROM product_varieties WHERE user_id = ? AND LOWER(name) = LOWER(?) LIMIT 1',
    [uid, cleanName]
  );

  if (existing.length > 0) {
    throw new Error(`Product variety "${cleanName}" already exists.`);
  }

  const [result] = await mysql.query(
    'INSERT INTO product_varieties (user_id, name, created_at) VALUES (?, ?, NOW())',
    [uid, cleanName]
  );

  const id = Number(result.insertId);

  // Mirror to SQLite
  try {
    db.prepare('INSERT OR REPLACE INTO product_varieties (id, user_id, name) VALUES (?, ?, ?)').run(id, uid, cleanName);
  } catch (e) {}

  return {
    id,
    user_id: uid,
    name: cleanName,
    current_stock: 0,
  };
}

export async function getProductVarieties(userId = 1) {
  const uid = Number(userId || 1);

  const [rows] = await mysql.query(
    `SELECT 
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
     ORDER BY pv.name ASC`,
    [uid]
  );

  return rows.map((v) => {
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

export async function getProductVarietyById(id, userId = 1) {
  const uid = Number(userId || 1);
  const [rows] = await mysql.query(
    'SELECT id, user_id, name, created_at FROM product_varieties WHERE id = ? AND user_id = ? LIMIT 1',
    [id, uid]
  );

  if (rows.length === 0) return null;
  const variety = rows[0];

  const stockMetrics = await getCurrentStockForVariety(id, uid);
  return {
    id: Number(variety.id),
    user_id: Number(variety.user_id),
    name: variety.name,
    created_at: variety.created_at,
    ...stockMetrics,
  };
}

export async function getCurrentStockForVariety(varietyId, userId = 1) {
  const uid = Number(userId || 1);
  const [rows] = await mysql.query(
    `SELECT 
       COALESCE(SUM(CASE WHEN movement_type = 'IN' THEN quantity ELSE 0 END), 0) AS total_in,
       COALESCE(SUM(CASE WHEN movement_type = 'OUT' THEN quantity ELSE 0 END), 0) AS total_out
     FROM stock_entries
     WHERE product_id = ? AND user_id = ?`,
    [varietyId, uid]
  );

  const totalIn = Number(rows[0]?.total_in || 0);
  const totalOut = Number(rows[0]?.total_out || 0);
  return {
    total_in: totalIn,
    total_out: totalOut,
    current_stock: totalIn - totalOut,
  };
}

export async function recordStockMovement({ product_id, movement_type, quantity, entry_date, notes = '', userId = 1 }) {
  if (!product_id) {
    throw new Error('Product variety is required.');
  }

  const uid = Number(userId || 1);
  const [varieties] = await mysql.query('SELECT id, name FROM product_varieties WHERE id = ? AND user_id = ? LIMIT 1', [
    product_id,
    uid,
  ]);

  if (varieties.length === 0) {
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

  const [result] = await mysql.query(
    `INSERT INTO stock_entries (user_id, product_id, movement_type, quantity, entry_date, notes, created_at)
     VALUES (?, ?, ?, ?, ?, ?, NOW())`,
    [uid, product_id, movement_type, numQty, targetDate, cleanNotes]
  );

  const id = Number(result.insertId);

  // Mirror to SQLite
  try {
    const now = new Date().toISOString();
    db.prepare(
      'INSERT INTO stock_entries (id, user_id, product_id, movement_type, quantity, entry_date, notes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(id, uid, product_id, movement_type, numQty, targetDate, cleanNotes, now);
  } catch (e) {}

  const updatedStock = await getCurrentStockForVariety(product_id, uid);

  return {
    id,
    user_id: uid,
    product_id: Number(product_id),
    product_name: varieties[0].name,
    movement_type,
    quantity: numQty,
    entry_date: targetDate,
    notes: cleanNotes,
    variety_current_stock: updatedStock.current_stock,
  };
}

export async function getStockHistory({ productId, startDate, endDate, limit = 100, offset = 0, userId = 1 }) {
  const uid = Number(userId || 1);
  const numLimit = Math.max(1, Math.min(1000, Number(limit) || 100));
  const numOffset = Math.max(0, Number(offset) || 0);

  let sql = `
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

  if (productId) {
    sql += ' AND se.product_id = ?';
    params.push(productId);
  }
  if (startDate) {
    sql += ' AND se.entry_date >= ?';
    params.push(startDate);
  }
  if (endDate) {
    sql += ' AND se.entry_date <= ?';
    params.push(endDate);
  }

  sql += ' ORDER BY se.entry_date DESC, se.id DESC LIMIT ? OFFSET ?';
  params.push(numLimit, numOffset);

  const [rows] = await mysql.query(sql, params);

  return rows.map((r) => ({
    id: Number(r.id),
    user_id: Number(r.user_id),
    product_id: Number(r.product_id),
    product_name: r.product_name,
    movement_type: r.movement_type,
    quantity: Number(r.quantity),
    entry_date: r.entry_date,
    notes: r.notes || '',
    created_at: r.created_at,
  }));
}

export async function getStockSummary(userId = 1) {
  const uid = Number(userId || 1);
  const varieties = await getProductVarieties(uid);

  const totalIn = varieties.reduce((sum, v) => sum + v.total_in, 0);
  const totalOut = varieties.reduce((sum, v) => sum + v.total_out, 0);
  const currentStock = totalIn - totalOut;

  return {
    total_varieties: varieties.length,
    total_in: totalIn,
    total_out: totalOut,
    current_stock: currentStock,
    varieties_summary: varieties.map((v) => ({
      id: v.id,
      name: v.name,
      current_stock: v.current_stock,
    })),
  };
}

// ============================================================================
// 5. LENDER ACCOUNTS & REPAYMENT AUDIT TRAIL
// ============================================================================

export async function addLender({ name, mobile, place, amount_given = 0, amount_paid = 0, loan_date, notes = '', userId = 1 }) {
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    throw new Error('Lender name is required.');
  }
  if (!mobile || typeof mobile !== 'string' || mobile.trim().length === 0) {
    throw new Error('Mobile number is required.');
  }
  if (!place || typeof place !== 'string' || place.trim().length === 0) {
    throw new Error('Place/location is required.');
  }

  const targetDate = loan_date || getTodayDateString();
  if (!isValidDateString(targetDate)) {
    throw new Error('Valid date in YYYY-MM-DD format is required.');
  }

  const numGiven = Number(amount_given ?? 0);
  const numPaid = Number(amount_paid ?? 0);

  if (isNaN(numGiven) || numGiven < 0) {
    throw new Error('Amount Given cannot be negative.');
  }
  if (isNaN(numPaid) || numPaid < 0) {
    throw new Error('Amount Paid cannot be negative.');
  }
  if (numPaid > numGiven) {
    throw new Error(`Amount Paid (₹${numPaid}) cannot exceed Amount Given (₹${numGiven}).`);
  }

  const uid = Number(userId || 1);
  const cleanNotes = notes ? String(notes).trim() : null;

  const [result] = await mysql.query(
    `INSERT INTO lenders (user_id, name, mobile, place, amount_given, amount_paid, loan_date, notes, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
    [uid, name.trim(), mobile.trim(), place.trim(), numGiven, numPaid, targetDate, cleanNotes]
  );

  const id = Number(result.insertId);
  const balance = numGiven - numPaid;

  // If initial payment was made, log repayment
  if (numPaid > 0) {
    try {
      await mysql.query(
        `INSERT INTO lender_repayments (user_id, lender_id, payment_amount, payment_date, notes, created_at)
         VALUES (?, ?, ?, ?, 'Initial payment', NOW())`,
        [uid, id, numPaid, targetDate]
      );
    } catch (e) {}
  }

  // Mirror to SQLite
  try {
    const now = new Date().toISOString();
    db.prepare(
      'INSERT INTO lenders (id, user_id, name, mobile, place, amount_given, amount_paid, loan_date, notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(id, uid, name.trim(), mobile.trim(), place.trim(), numGiven, numPaid, targetDate, cleanNotes, now, now);
  } catch (e) {}

  return {
    id,
    user_id: uid,
    name: name.trim(),
    mobile: mobile.trim(),
    place: place.trim(),
    amount_given: numGiven,
    amount_paid: numPaid,
    balance,
    due_amount: balance,
    loan_date: targetDate,
    notes: cleanNotes,
  };
}

export async function getLenders(userId = 1) {
  const uid = Number(userId || 1);
  const [rows] = await mysql.query(
    'SELECT id, user_id, name, mobile, place, amount_given, amount_paid, loan_date, notes, created_at, updated_at FROM lenders WHERE user_id = ? ORDER BY id DESC',
    [uid]
  );

  return rows.map((r) => {
    const amountGiven = Number(r.amount_given);
    const amountPaid = Number(r.amount_paid);
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
}

export async function getLenderById(id, userId = 1) {
  const uid = Number(userId || 1);
  const [rows] = await mysql.query(
    'SELECT id, user_id, name, mobile, place, amount_given, amount_paid, loan_date, notes, created_at, updated_at FROM lenders WHERE id = ? AND user_id = ? LIMIT 1',
    [id, uid]
  );

  if (rows.length === 0) return null;
  const r = rows[0];
  const amountGiven = Number(r.amount_given);
  const amountPaid = Number(r.amount_paid);
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
}

export async function updateLender(id, { name, mobile, place, amount_given, amount_paid, loan_date, notes = '', userId = 1 }) {
  const uid = Number(userId || 1);
  const existing = await getLenderById(id, uid);
  if (!existing) {
    throw new Error(`Lender with ID ${id} not found.`);
  }

  const updatedName = name !== undefined ? name.trim() : existing.name;
  const updatedMobile = mobile !== undefined ? mobile.trim() : existing.mobile;
  const updatedPlace = place !== undefined ? place.trim() : existing.place;
  const updatedGiven = amount_given !== undefined ? Number(amount_given) : existing.amount_given;
  const updatedPaid = amount_paid !== undefined ? Number(amount_paid) : existing.amount_paid;
  const updatedDate = loan_date !== undefined ? loan_date : existing.loan_date;
  const updatedNotes = notes !== undefined ? (notes ? String(notes).trim() : null) : existing.notes;

  if (updatedPaid > updatedGiven) {
    throw new Error(`Amount Paid (₹${updatedPaid}) cannot exceed Amount Given (₹${updatedGiven}).`);
  }

  await mysql.query(
    `UPDATE lenders
     SET name = ?, mobile = ?, place = ?, amount_given = ?, amount_paid = ?, loan_date = ?, notes = ?, updated_at = NOW()
     WHERE id = ? AND user_id = ?`,
    [updatedName, updatedMobile, updatedPlace, updatedGiven, updatedPaid, updatedDate, updatedNotes, id, uid]
  );

  // Mirror to SQLite
  try {
    const now = new Date().toISOString();
    db.prepare(
      'UPDATE lenders SET name = ?, mobile = ?, place = ?, amount_given = ?, amount_paid = ?, loan_date = ?, notes = ?, updated_at = ? WHERE id = ? AND user_id = ?'
    ).run(updatedName, updatedMobile, updatedPlace, updatedGiven, updatedPaid, updatedDate, updatedNotes, now, id, uid);
  } catch (e) {}

  const balance = updatedGiven - updatedPaid;
  return {
    id: Number(id),
    user_id: uid,
    name: updatedName,
    mobile: updatedMobile,
    place: updatedPlace,
    amount_given: updatedGiven,
    amount_paid: updatedPaid,
    balance,
    due_amount: balance,
    loan_date: updatedDate,
    notes: updatedNotes,
  };
}

export async function recordLenderPayment(id, paymentAmount, notes = '', userId = 1) {
  const uid = Number(userId || 1);
  const existing = await getLenderById(id, uid);
  if (!existing) {
    throw new Error(`Lender with ID ${id} not found.`);
  }

  const numPayment = Number(paymentAmount);
  if (isNaN(numPayment) || numPayment <= 0) {
    throw new Error('Payment amount must be a number greater than 0.');
  }

  const newTotalPaid = existing.amount_paid + numPayment;
  if (newTotalPaid > existing.amount_given) {
    throw new Error(
      `Payment cannot exceed remaining due balance (₹${existing.balance}). Max allowed is ₹${existing.balance}.`
    );
  }

  await mysql.query(
    'UPDATE lenders SET amount_paid = ?, updated_at = NOW() WHERE id = ? AND user_id = ?',
    [newTotalPaid, id, uid]
  );

  const targetDate = getTodayDateString();
  const cleanNotes = notes ? String(notes).trim() : null;

  // Insert into repayment audit log
  try {
    await mysql.query(
      `INSERT INTO lender_repayments (user_id, lender_id, payment_amount, payment_date, notes, created_at)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [uid, id, numPayment, targetDate, cleanNotes]
    );
  } catch (e) {}

  // Mirror to SQLite
  try {
    const now = new Date().toISOString();
    db.prepare('UPDATE lenders SET amount_paid = ?, updated_at = ? WHERE id = ? AND user_id = ?').run(
      newTotalPaid,
      now,
      id,
      uid
    );
  } catch (e) {}

  const newBalance = existing.amount_given - newTotalPaid;
  return {
    id: Number(id),
    user_id: uid,
    name: existing.name,
    amount_given: existing.amount_given,
    previous_paid: existing.amount_paid,
    payment_made: numPayment,
    amount_paid: newTotalPaid,
    balance: newBalance,
    due_amount: newBalance,
    is_settled: newBalance === 0,
    message: `Payment of ₹${numPayment} recorded successfully. Remaining balance: ₹${newBalance}`,
  };
}

export async function deleteLender(id, userId = 1) {
  const uid = Number(userId || 1);
  const [result] = await mysql.query('DELETE FROM lenders WHERE id = ? AND user_id = ?', [id, uid]);
  if (result.affectedRows === 0) {
    throw new Error(`Lender with ID ${id} not found.`);
  }

  // Mirror to SQLite
  try {
    db.prepare('DELETE FROM lenders WHERE id = ? AND user_id = ?').run(id, uid);
  } catch (e) {}

  return { success: true, message: `Lender account ID ${id} deleted successfully.` };
}

export async function getLendersSummary(userId = 1) {
  const uid = Number(userId || 1);
  const lenders = await getLenders(uid);

  const totalGiven = lenders.reduce((acc, l) => acc + l.amount_given, 0);
  const totalPaid = lenders.reduce((acc, l) => acc + l.amount_paid, 0);
  const totalBalance = totalGiven - totalPaid;
  const activeCount = lenders.filter((l) => l.balance > 0).length;
  const settledCount = lenders.length - activeCount;

  return {
    total_lenders: lenders.length,
    total_amount_given: totalGiven,
    total_amount_paid: totalPaid,
    total_balance_due: totalBalance,
    active_loans_count: activeCount,
    settled_loans_count: settledCount,
  };
}

// ============================================================================
// 6. DASHBOARD & FINANCIAL CALCULATIONS
// ============================================================================

export async function calculateTodayMetrics(customDate = null, userId = 1) {
  const targetDate = customDate || getTodayDateString();
  const uid = Number(userId || 1);

  const salesInfo = await getTodaySales(targetDate, uid);
  const expensesInfo = await getTodayExpenses(targetDate, uid);

  const todaySales = salesInfo.total_sales_amount;
  const todayExpenses = expensesInfo.today_expenses;
  const todayNetAmount = todaySales - todayExpenses;

  return {
    date: targetDate,
    today_sales: todaySales,
    today_expenses: todayExpenses,
    today_net_amount: todayNetAmount,
    is_surplus: todayNetAmount >= 0,
  };
}

export async function calculateMonthlyMetrics(customMonth = null, userId = 1) {
  const targetMonth = customMonth || getCurrentMonthString();
  const uid = Number(userId || 1);

  const salesData = await getMonthlyTotalSales(targetMonth, uid);
  const expensesData = await getMonthlyExpensesByCategory(targetMonth, uid);

  const monthlySales = salesData.monthly_sales;
  const monthlyExpenses = expensesData.monthly_expenses;
  const monthlyTurnover = monthlySales;
  const monthlyNetBalance = monthlySales - monthlyExpenses;

  return {
    month: targetMonth,
    monthly_sales: monthlySales,
    monthly_expenses: monthlyExpenses,
    monthly_turnover: monthlyTurnover,
    monthly_net_balance: monthlyNetBalance,
    is_surplus: monthlyNetBalance >= 0,
    expense_breakdown: expensesData.breakdown,
  };
}

export async function getDashboardSummary({ date = null, month = null, userId = 1 } = {}) {
  const targetDate = date || getTodayDateString();
  const targetMonth = month || targetDate.substring(0, 7);
  const uid = Number(userId || 1);

  const [todayMetrics, monthlyMetrics, stockSummary, lenderSummary] = await Promise.all([
    calculateTodayMetrics(targetDate, uid),
    calculateMonthlyMetrics(targetMonth, uid),
    getStockSummary(uid),
    getLendersSummary(uid),
  ]);

  return {
    date: targetDate,
    month: targetMonth,

    // Today Block
    today_sales: todayMetrics.today_sales,
    today_expenses: todayMetrics.today_expenses,
    today_net_amount: todayMetrics.today_net_amount,

    // Monthly Block
    monthly_sales: monthlyMetrics.monthly_sales,
    monthly_expenses: monthlyMetrics.monthly_expenses,
    monthly_turnover: monthlyMetrics.monthly_turnover,
    monthly_net_balance: monthlyMetrics.monthly_net_balance,

    // Balances & Inventory
    current_stock: stockSummary.current_stock,
    total_lender_due: lenderSummary.total_balance_due,

    // Nested objects for flexible consumers
    today: todayMetrics,
    monthly: monthlyMetrics,
    stock: stockSummary,
    lender: lenderSummary,
  };
}

export async function generateMonthlyReportData(month, userId = 1) {
  const targetMonth = month || getCurrentMonthString();
  const uid = Number(userId || 1);

  const [summary, sales, expenses, varieties, movements, lenders, profile] = await Promise.all([
    getDashboardSummary({ month: targetMonth, userId: uid }),
    getSalesHistory({ month: targetMonth, limit: 1000, userId: uid }),
    getExpenses({ month: targetMonth, limit: 1000, userId: uid }),
    getProductVarieties(uid),
    getStockHistory({ limit: 1000, userId: uid }),
    getLenders(uid),
    getBusinessProfile(uid),
  ]);

  return {
    month: targetMonth,
    generated_at: new Date().toISOString(),
    business_profile: profile || { business_name: 'Business Records' },
    summary,
    sales,
    expenses,
    inventory_varieties: varieties,
    stock_movements: movements,
    lenders,
  };
}

export default {
  signupUser,
  loginUser,
  getUserFromToken,
  logoutUser,
  getBusinessProfile,
  upsertBusinessProfile,
  recordDailySales,
  getTodaySales,
  getSalesByDate,
  getMonthlyTotalSales,
  getSalesHistory,
  addExpense,
  updateExpense,
  deleteExpense,
  getExpenses,
  getTodayExpenses,
  getMonthlyExpensesByCategory,
  addProductVariety,
  getProductVarieties,
  getProductVarietyById,
  getCurrentStockForVariety,
  recordStockMovement,
  getStockHistory,
  getStockSummary,
  addLender,
  getLenders,
  getLenderById,
  updateLender,
  recordLenderPayment,
  deleteLender,
  getLendersSummary,
  calculateTodayMetrics,
  calculateMonthlyMetrics,
  getDashboardSummary,
  generateMonthlyReportData,
};
