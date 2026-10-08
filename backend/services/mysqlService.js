/**
 * Hostinger MySQL Authoritative Database Service
 * Project: Saree Business Management & Accountant App (Hostinger Production)
 *
 * Implements high-speed, persistent relational database operations directly
 * against Hostinger MySQL using mysql2 connection pool with keep-alives.
 */

import mysqlClient from '../db/mysqlClient.js';

export function isMysqlConfigured() {
  return mysqlClient.isMysqlConfigured();
}

export async function testMysqlConnection() {
  return mysqlClient.testMysqlConnection();
}

export async function initMysqlSchema() {
  return mysqlClient.initMysqlSchema();
}

export function getMysqlConfig() {
  return {
    isConfigured: isMysqlConfigured(),
  };
}

// ============================================================================
// 1. USERS & AUTHENTICATION
// ============================================================================

export async function fetchUserByUsername(username) {
  if (!username) return null;
  const rows = await mysqlClient.query(
    'SELECT * FROM users WHERE LOWER(username) = LOWER(?) LIMIT 1',
    [username.trim()]
  );
  return rows.length > 0 ? rows[0] : null;
}

export async function fetchUserById(id) {
  if (!id) return null;
  const rows = await mysqlClient.query(
    'SELECT * FROM users WHERE id = ? LIMIT 1',
    [Number(id)]
  );
  return rows.length > 0 ? rows[0] : null;
}

export async function createUser({ id, username, password_hash }) {
  if (id) {
    await mysqlClient.execute(
      'INSERT INTO users (id, username, password_hash) VALUES (?, ?, ?)',
      [Number(id), username.trim().toLowerCase(), password_hash]
    );
    return { id: Number(id), username: username.trim().toLowerCase() };
  } else {
    const result = await mysqlClient.execute(
      'INSERT INTO users (username, password_hash) VALUES (?, ?)',
      [username.trim().toLowerCase(), password_hash]
    );
    return { id: result.insertId, username: username.trim().toLowerCase() };
  }
}

// ============================================================================
// 2. ACTIVE MULTI-DEVICE SESSIONS
// ============================================================================

export async function createSession(userId, token, expiresAt) {
  const result = await mysqlClient.execute(
    'INSERT INTO sessions (user_id, token, expires_at) VALUES (?, ?, ?)',
    [Number(userId), token, expiresAt]
  );
  return { id: result.insertId, user_id: Number(userId), token, expires_at: expiresAt };
}

export async function fetchSessionByToken(token) {
  if (!token) return null;
  const rows = await mysqlClient.query(
    'SELECT * FROM sessions WHERE token = ? AND expires_at > NOW() LIMIT 1',
    [token]
  );
  return rows.length > 0 ? rows[0] : null;
}

export async function deleteSession(token) {
  if (!token) return;
  await mysqlClient.execute('DELETE FROM sessions WHERE token = ?', [token]);
}

// ============================================================================
// 3. BUSINESS PROFILE
// ============================================================================

export async function fetchBusinessProfile(userId) {
  const rows = await mysqlClient.query(
    'SELECT * FROM business_profiles WHERE user_id = ? LIMIT 1',
    [Number(userId)]
  );
  return rows.length > 0 ? rows[0] : null;
}

export async function upsertBusinessProfile(userId, { business_name, business_address, business_nickname }) {
  const uid = Number(userId);
  const name = String(business_name || '').trim();
  const address = String(business_address || '').trim();
  const nickname = String(business_nickname || '').trim();

  await mysqlClient.execute(
    `INSERT INTO business_profiles (user_id, business_name, business_address, business_nickname)
     VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       business_name = VALUES(business_name),
       business_address = VALUES(business_address),
       business_nickname = VALUES(business_nickname)`,
    [uid, name, address, nickname]
  );

  return fetchBusinessProfile(uid);
}

// ============================================================================
// 4. DAILY LUMP-SUM SALES
// ============================================================================

export async function fetchSales(userId, { startDate, endDate } = {}) {
  const uid = Number(userId);
  let sql = 'SELECT * FROM daily_sales WHERE user_id = ?';
  const params = [uid];

  if (startDate) {
    sql += ' AND entry_date >= ?';
    params.push(startDate);
  }
  if (endDate) {
    sql += ' AND entry_date <= ?';
    params.push(endDate);
  }

  sql += ' ORDER BY entry_date DESC';
  const rows = await mysqlClient.query(sql, params);
  return rows.map((r) => ({
    id: Number(r.id),
    user_id: Number(r.user_id),
    entry_date: r.entry_date,
    total_sales_amount: Number(r.total_sales_amount),
    created_at: r.created_at,
    updated_at: r.updated_at,
  }));
}

export async function upsertSale(userId, { entry_date, total_sales_amount }) {
  const uid = Number(userId);
  const amount = Number(total_sales_amount);

  await mysqlClient.execute(
    `INSERT INTO daily_sales (user_id, entry_date, total_sales_amount)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE
       total_sales_amount = VALUES(total_sales_amount)`,
    [uid, entry_date, amount]
  );

  const rows = await mysqlClient.query(
    'SELECT * FROM daily_sales WHERE user_id = ? AND entry_date = ? LIMIT 1',
    [uid, entry_date]
  );
  return rows.length > 0
    ? {
        id: Number(rows[0].id),
        user_id: Number(rows[0].user_id),
        entry_date: rows[0].entry_date,
        total_sales_amount: Number(rows[0].total_sales_amount),
      }
    : null;
}

export async function getSaleByDate(userId, entry_date) {
  const rows = await mysqlClient.query(
    'SELECT * FROM daily_sales WHERE user_id = ? AND entry_date = ? LIMIT 1',
    [Number(userId), entry_date]
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

// ============================================================================
// 5. CATEGORIZED EXPENSES
// ============================================================================

export async function fetchExpenses(userId, { startDate, endDate, expenseType } = {}) {
  const uid = Number(userId);
  let sql = 'SELECT * FROM expenses WHERE user_id = ?';
  const params = [uid];

  if (startDate) {
    sql += ' AND expense_date >= ?';
    params.push(startDate);
  }
  if (endDate) {
    sql += ' AND expense_date <= ?';
    params.push(endDate);
  }
  if (expenseType) {
    sql += ' AND expense_type = ?';
    params.push(expenseType);
  }

  sql += ' ORDER BY expense_date DESC, id DESC';
  const rows = await mysqlClient.query(sql, params);
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

export async function createExpense(userId, { expense_date, expense_type, amount, description }) {
  const uid = Number(userId);
  const result = await mysqlClient.execute(
    'INSERT INTO expenses (user_id, expense_date, expense_type, amount, description) VALUES (?, ?, ?, ?, ?)',
    [uid, expense_date, expense_type, Number(amount), description || '']
  );

  return {
    id: result.insertId,
    user_id: uid,
    expense_date,
    expense_type,
    amount: Number(amount),
    description: description || '',
  };
}

export async function updateExpense(userId, id, { expense_date, expense_type, amount, description }) {
  const uid = Number(userId);
  const eid = Number(id);

  const updates = [];
  const params = [];

  if (expense_date !== undefined) {
    updates.push('expense_date = ?');
    params.push(expense_date);
  }
  if (expense_type !== undefined) {
    updates.push('expense_type = ?');
    params.push(expense_type);
  }
  if (amount !== undefined) {
    updates.push('amount = ?');
    params.push(Number(amount));
  }
  if (description !== undefined) {
    updates.push('description = ?');
    params.push(description);
  }

  if (updates.length === 0) return null;

  params.push(eid, uid);
  await mysqlClient.execute(
    `UPDATE expenses SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`,
    params
  );

  const rows = await mysqlClient.query('SELECT * FROM expenses WHERE id = ? AND user_id = ? LIMIT 1', [eid, uid]);
  return rows.length > 0
    ? {
        id: Number(rows[0].id),
        user_id: Number(rows[0].user_id),
        expense_date: rows[0].expense_date,
        expense_type: rows[0].expense_type,
        amount: Number(rows[0].amount),
        description: rows[0].description,
      }
    : null;
}

export async function deleteExpense(userId, id) {
  const result = await mysqlClient.execute(
    'DELETE FROM expenses WHERE id = ? AND user_id = ?',
    [Number(id), Number(userId)]
  );
  return result.affectedRows > 0;
}

// ============================================================================
// 6. PRODUCT VARIETIES & CATALOG
// ============================================================================

export async function fetchVarieties(userId) {
  const rows = await mysqlClient.query(
    'SELECT * FROM product_varieties WHERE user_id = ? ORDER BY name ASC',
    [Number(userId)]
  );
  return rows.map((r) => ({
    id: Number(r.id),
    user_id: Number(r.user_id),
    name: r.name,
    created_at: r.created_at,
  }));
}

export async function createVariety(userId, { name }) {
  const uid = Number(userId);
  const cleanName = String(name).trim();

  const result = await mysqlClient.execute(
    'INSERT INTO product_varieties (user_id, name) VALUES (?, ?)',
    [uid, cleanName]
  );

  return {
    id: result.insertId,
    user_id: uid,
    name: cleanName,
  };
}

// ============================================================================
// 7. STOCK ENTRIES & INVENTORY
// ============================================================================

export async function fetchStockEntries(userId, { productId, startDate, endDate } = {}) {
  const uid = Number(userId);
  let sql = `
    SELECT se.*, pv.name as product_name
    FROM stock_entries se
    LEFT JOIN product_varieties pv ON se.product_id = pv.id
    WHERE se.user_id = ?
  `;
  const params = [uid];

  if (productId) {
    sql += ' AND se.product_id = ?';
    params.push(Number(productId));
  }
  if (startDate) {
    sql += ' AND se.entry_date >= ?';
    params.push(startDate);
  }
  if (endDate) {
    sql += ' AND se.entry_date <= ?';
    params.push(endDate);
  }

  sql += ' ORDER BY se.entry_date DESC, se.id DESC';
  const rows = await mysqlClient.query(sql, params);
  return rows.map((r) => ({
    id: Number(r.id),
    user_id: Number(r.user_id),
    product_id: Number(r.product_id),
    product_name: r.product_name || 'Unknown',
    movement_type: r.movement_type,
    quantity: Number(r.quantity),
    entry_date: r.entry_date,
    notes: r.notes || '',
    created_at: r.created_at,
  }));
}

export async function createStockEntry(userId, { product_id, movement_type, quantity, entry_date, notes }) {
  const uid = Number(userId);
  const pid = Number(product_id);
  const qty = Number(quantity);

  const result = await mysqlClient.execute(
    'INSERT INTO stock_entries (user_id, product_id, movement_type, quantity, entry_date, notes) VALUES (?, ?, ?, ?, ?, ?)',
    [uid, pid, movement_type, qty, entry_date, notes || '']
  );

  return {
    id: result.insertId,
    user_id: uid,
    product_id: pid,
    movement_type,
    quantity: qty,
    entry_date,
    notes: notes || '',
  };
}

// ============================================================================
// 8. LENDER ACCOUNTS & CREDIT LEDGER
// ============================================================================

export async function fetchLenders(userId) {
  const rows = await mysqlClient.query(
    'SELECT * FROM lenders WHERE user_id = ? ORDER BY name ASC',
    [Number(userId)]
  );
  return rows.map((r) => ({
    id: Number(r.id),
    user_id: Number(r.user_id),
    name: r.name,
    mobile: r.mobile,
    place: r.place,
    amount_given: Number(r.amount_given),
    amount_paid: Number(r.amount_paid),
    amount_due: Number(r.amount_given) - Number(r.amount_paid),
    loan_date: r.loan_date,
    notes: r.notes || '',
    created_at: r.created_at,
    updated_at: r.updated_at,
  }));
}

export async function createLender(userId, { name, mobile, place, amount_given, amount_paid, loan_date, notes }) {
  const uid = Number(userId);
  const given = Number(amount_given || 0);
  const paid = Number(amount_paid || 0);

  const result = await mysqlClient.execute(
    'INSERT INTO lenders (user_id, name, mobile, place, amount_given, amount_paid, loan_date, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [uid, String(name).trim(), String(mobile).trim(), String(place).trim(), given, paid, loan_date, notes || '']
  );

  return {
    id: result.insertId,
    user_id: uid,
    name: String(name).trim(),
    mobile: String(mobile).trim(),
    place: String(place).trim(),
    amount_given: given,
    amount_paid: paid,
    amount_due: given - paid,
    loan_date,
    notes: notes || '',
  };
}

export async function recordLenderRepayment(userId, lenderId, repaymentAmount, notes) {
  const uid = Number(userId);
  const lid = Number(lenderId);
  const amt = Number(repaymentAmount);

  const rows = await mysqlClient.query(
    'SELECT * FROM lenders WHERE id = ? AND user_id = ? LIMIT 1',
    [lid, uid]
  );
  if (rows.length === 0) {
    throw new Error(`Lender record ${lid} not found or unauthorized.`);
  }

  const lender = rows[0];
  const newAmountPaid = Number(lender.amount_paid || 0) + amt;
  if (newAmountPaid > Number(lender.amount_given)) {
    throw new Error('Repayment amount exceeds remaining loan balance.');
  }

  const newNotes = notes
    ? lender.notes
      ? `${lender.notes}; Repayment: ${notes}`
      : `Repayment: ${notes}`
    : lender.notes;

  await mysqlClient.execute(
    'UPDATE lenders SET amount_paid = ?, notes = ? WHERE id = ? AND user_id = ?',
    [newAmountPaid, newNotes, lid, uid]
  );

  const updatedRows = await mysqlClient.query('SELECT * FROM lenders WHERE id = ? AND user_id = ? LIMIT 1', [lid, uid]);
  const u = updatedRows[0];
  return {
    id: Number(u.id),
    user_id: Number(u.user_id),
    name: u.name,
    mobile: u.mobile,
    place: u.place,
    amount_given: Number(u.amount_given),
    amount_paid: Number(u.amount_paid),
    amount_due: Number(u.amount_given) - Number(u.amount_paid),
    loan_date: u.loan_date,
    notes: u.notes,
  };
}

export async function deleteLender(userId, lenderId) {
  const result = await mysqlClient.execute(
    'DELETE FROM lenders WHERE id = ? AND user_id = ?',
    [Number(lenderId), Number(userId)]
  );
  return result.affectedRows > 0;
}

// ============================================================================
// 9. METRICS & AUDIT PARITY
// ============================================================================

export async function getMysqlParityMetrics(userId) {
  const uid = Number(userId);

  const [sales] = await mysqlClient.query(
    'SELECT COUNT(*) as count, COALESCE(SUM(total_sales_amount), 0) as total FROM daily_sales WHERE user_id = ?',
    [uid]
  );
  const [expenses] = await mysqlClient.query(
    'SELECT COUNT(*) as count, COALESCE(SUM(amount), 0) as total FROM expenses WHERE user_id = ?',
    [uid]
  );
  const [stockIn] = await mysqlClient.query(
    "SELECT COALESCE(SUM(quantity), 0) as total FROM stock_entries WHERE user_id = ? AND movement_type = 'IN'",
    [uid]
  );
  const [stockOut] = await mysqlClient.query(
    "SELECT COALESCE(SUM(quantity), 0) as total FROM stock_entries WHERE user_id = ? AND movement_type = 'OUT'",
    [uid]
  );
  const [lenders] = await mysqlClient.query(
    'SELECT COUNT(*) as count, COALESCE(SUM(amount_given), 0) as total_given, COALESCE(SUM(amount_paid), 0) as total_paid FROM lenders WHERE user_id = ?',
    [uid]
  );
  const [varieties] = await mysqlClient.query(
    'SELECT COUNT(*) as count FROM product_varieties WHERE user_id = ?',
    [uid]
  );

  const totalSales = Number(sales[0]?.total || 0);
  const totalExpenses = Number(expenses[0]?.total || 0);
  const totalStockIn = Number(stockIn[0]?.total || 0);
  const totalStockOut = Number(stockOut[0]?.total || 0);
  const totalLenderGiven = Number(lenders[0]?.total_given || 0);
  const totalLenderPaid = Number(lenders[0]?.total_paid || 0);

  return {
    user_id: uid,
    provider: 'hostinger_mysql',
    total_sales: totalSales,
    sales_count: Number(sales[0]?.count || 0),
    total_expenses: totalExpenses,
    expenses_count: Number(expenses[0]?.count || 0),
    total_stock_in: totalStockIn,
    total_stock_out: totalStockOut,
    current_stock: totalStockIn - totalStockOut,
    varieties_count: Number(varieties[0]?.count || 0),
    total_lender_given: totalLenderGiven,
    total_lender_paid: totalLenderPaid,
    total_lender_due: totalLenderGiven - totalLenderPaid,
    lenders_count: Number(lenders[0]?.count || 0),
    net_profit: totalSales - totalExpenses,
    timestamp: new Date().toISOString(),
  };
}

export default {
  isMysqlConfigured,
  testMysqlConnection,
  initMysqlSchema,
  getMysqlConfig,
  fetchUserByUsername,
  fetchUserById,
  createUser,
  createSession,
  fetchSessionByToken,
  deleteSession,
  fetchBusinessProfile,
  upsertBusinessProfile,
  fetchSales,
  upsertSale,
  getSaleByDate,
  fetchExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
  fetchVarieties,
  createVariety,
  fetchStockEntries,
  createStockEntry,
  fetchLenders,
  createLender,
  recordLenderRepayment,
  deleteLender,
  getMysqlParityMetrics,
};
