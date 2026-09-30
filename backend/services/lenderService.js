import db from '../db/database.js';
import { isValidDateString, getTodayDateString } from './salesService.js';

/**
 * Validate lender input
 */
function validateLenderInput({ name, mobile, place, amount_given, amount_paid, loan_date }) {
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    throw new Error('Lender name is required.');
  }

  if (!mobile || typeof mobile !== 'string' || mobile.trim().length === 0) {
    throw new Error('Mobile number is required.');
  }

  if (!place || typeof place !== 'string' || place.trim().length === 0) {
    throw new Error('Place/location is required.');
  }

  if (!loan_date || !isValidDateString(loan_date)) {
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
}

/**
 * Add a new lender
 */
export function addLender({ name, mobile, place, amount_given = 0, amount_paid = 0, loan_date, notes = '', userId = 1 }) {
  const targetDate = loan_date || getTodayDateString();
  validateLenderInput({ name, mobile, place, amount_given, amount_paid, loan_date: targetDate });

  const numGiven = Number(amount_given ?? 0);
  const numPaid = Number(amount_paid ?? 0);
  const cleanNotes = notes ? String(notes).trim() : null;
  const now = new Date().toISOString();
  const uid = Number(userId || 1);

  const result = db.prepare(
    `INSERT INTO lenders (user_id, name, mobile, place, amount_given, amount_paid, loan_date, notes, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(uid, name.trim(), mobile.trim(), place.trim(), numGiven, numPaid, targetDate, cleanNotes, now, now);

  const id = Number(result.lastInsertRowid);
  const balance = numGiven - numPaid;

  return {
    id,
    user_id: uid,
    name: name.trim(),
    mobile: mobile.trim(),
    place: place.trim(),
    amount_given: numGiven,
    amount_paid: numPaid,
    balance: balance,
    due_amount: balance,
    loan_date: targetDate,
    notes: cleanNotes,
    created_at: now,
    updated_at: now,
  };
}

/**
 * Get single lender by ID
 */
export function getLenderById(id, userId = 1) {
  const uid = Number(userId || 1);
  const row = db
    .prepare('SELECT id, user_id, name, mobile, place, amount_given, amount_paid, loan_date, notes, created_at, updated_at FROM lenders WHERE id = ? AND user_id = ?')
    .get(id, uid);

  if (!row) return null;

  const amountGiven = Number(row.amount_given);
  const amountPaid = Number(row.amount_paid);
  const balance = amountGiven - amountPaid;

  return {
    ...row,
    amount_given: amountGiven,
    amount_paid: amountPaid,
    balance: balance,
    due_amount: balance,
  };
}

/**
 * View all lenders with calculated balance
 * Formula: Balance = Amount Given - Amount Paid
 */
export function getAllLenders(userId = 1) {
  const uid = Number(userId || 1);
  const rows = db
    .prepare('SELECT id, user_id, name, mobile, place, amount_given, amount_paid, loan_date, notes, created_at, updated_at FROM lenders WHERE user_id = ? ORDER BY id DESC')
    .all(uid);

  return rows.map((r) => {
    const amountGiven = Number(r.amount_given);
    const amountPaid = Number(r.amount_paid);
    const balance = amountGiven - amountPaid;

    return {
      ...r,
      amount_given: amountGiven,
      amount_paid: amountPaid,
      balance: balance,
      due_amount: balance,
    };
  });
}

/**
 * Update an existing lender profile / records
 */
export function updateLender(id, { name, mobile, place, amount_given, amount_paid, loan_date, notes = '', userId = 1 }) {
  const uid = Number(userId || 1);
  const existing = getLenderById(id, uid);
  if (!existing) {
    throw new Error(`Lender with ID ${id} not found.`);
  }

  const updatedName = name !== undefined ? name : existing.name;
  const updatedMobile = mobile !== undefined ? mobile : existing.mobile;
  const updatedPlace = place !== undefined ? place : existing.place;
  const updatedGiven = amount_given !== undefined ? amount_given : existing.amount_given;
  const updatedPaid = amount_paid !== undefined ? amount_paid : existing.amount_paid;
  const updatedDate = loan_date !== undefined ? loan_date : existing.loan_date;
  const updatedNotes = notes !== undefined ? notes : existing.notes;

  validateLenderInput({
    name: updatedName,
    mobile: updatedMobile,
    place: updatedPlace,
    amount_given: updatedGiven,
    amount_paid: updatedPaid,
    loan_date: updatedDate,
  });

  const numGiven = Number(updatedGiven);
  const numPaid = Number(updatedPaid);
  const cleanNotes = updatedNotes ? String(updatedNotes).trim() : null;
  const now = new Date().toISOString();

  db.prepare(
    `UPDATE lenders
     SET name = ?, mobile = ?, place = ?, amount_given = ?, amount_paid = ?, loan_date = ?, notes = ?, updated_at = ?
     WHERE id = ? AND user_id = ?`
  ).run(updatedName.trim(), updatedMobile.trim(), updatedPlace.trim(), numGiven, numPaid, updatedDate, cleanNotes, now, id, uid);

  const balance = numGiven - numPaid;

  return {
    id: Number(id),
    user_id: uid,
    name: updatedName.trim(),
    mobile: updatedMobile.trim(),
    place: updatedPlace.trim(),
    amount_given: numGiven,
    amount_paid: numPaid,
    balance: balance,
    due_amount: balance,
    loan_date: updatedDate,
    notes: cleanNotes,
    updated_at: now,
  };
}

/**
 * Record a payment / repayment towards lender balance
 */
export function recordLenderPayment(id, additionalPayment, userId = 1) {
  const uid = Number(userId || 1);
  const existing = getLenderById(id, uid);
  if (!existing) {
    throw new Error(`Lender with ID ${id} not found.`);
  }

  const numPayment = Number(additionalPayment);
  if (isNaN(numPayment) || numPayment <= 0) {
    throw new Error('Payment amount must be a number greater than 0.');
  }

  const newTotalPaid = existing.amount_paid + numPayment;
  if (newTotalPaid > existing.amount_given) {
    throw new Error(
      `Repayment amount (₹${numPayment}) would exceed total loan balance. Maximum payable is ₹${existing.balance}.`
    );
  }

  const now = new Date().toISOString();

  db.prepare(
    'UPDATE lenders SET amount_paid = ?, updated_at = ? WHERE id = ? AND user_id = ?'
  ).run(newTotalPaid, now, id, uid);

  const newBalance = existing.amount_given - newTotalPaid;

  return {
    id: Number(id),
    user_id: uid,
    name: existing.name,
    amount_given: existing.amount_given,
    previous_paid: existing.amount_paid,
    new_payment_recorded: numPayment,
    amount_paid: newTotalPaid,
    balance: newBalance,
    due_amount: newBalance,
    updated_at: now,
  };
}

/**
 * Delete a lender record
 */
export function deleteLender(id, userId = 1) {
  const uid = Number(userId || 1);
  const existing = getLenderById(id, uid);
  if (!existing) {
    throw new Error(`Lender with ID ${id} not found.`);
  }

  db.prepare('DELETE FROM lenders WHERE id = ? AND user_id = ?').run(id, uid);

  return {
    success: true,
    deleted_id: Number(id),
    message: `Lender "${existing.name}" deleted successfully`,
  };
}

/**
 * Calculate total lender due / balance aggregate
 */
export function getTotalLenderSummary(userId = 1) {
  const uid = Number(userId || 1);
  const result = db
    .prepare(`
      SELECT 
        COUNT(*) AS total_lenders,
        COALESCE(SUM(amount_given), 0) AS total_amount_given,
        COALESCE(SUM(amount_paid), 0) AS total_amount_paid
      FROM lenders
      WHERE user_id = ?
    `)
    .get(uid);

  const totalGiven = Number(result ? result.total_amount_given : 0);
  const totalPaid = Number(result ? result.total_amount_paid : 0);
  const totalDue = totalGiven - totalPaid;

  return {
    total_lenders: Number(result ? result.total_lenders : 0),
    total_amount_given: totalGiven,
    total_amount_paid: totalPaid,
    total_lender_due: totalDue,
  };
}
