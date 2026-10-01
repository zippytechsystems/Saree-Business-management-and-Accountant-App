/**
 * Supabase Authoritative Cloud Client
 * Project: Business Management & Accountant Management App (Version 1.0)
 *
 * Implements authoritative cloud communication via the Supabase PostgREST API.
 * Keeps SUPABASE_SERVICE_ROLE_KEY strictly isolated to backend/server code.
 */

// Retrieve active Supabase credentials
export function getSupabaseConfig() {
  const url = (process.env.SUPABASE_URL || '').trim().replace(/\/+$/, '');
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || '').trim();

  return {
    url,
    key,
    isConfigured: Boolean(url && key && url.startsWith('http')),
  };
}

/**
 * Checks whether Supabase is configured in environment
 */
export function isSupabaseConfigured() {
  return getSupabaseConfig().isConfigured;
}

/**
 * Perform authenticated request to Supabase PostgREST API
 */
async function supabaseRequest(endpoint, options = {}, retries = 2) {
  const config = getSupabaseConfig();
  if (!config.isConfigured) {
    throw new Error('Supabase is not configured. Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.');
  }

  const url = `${config.url}/rest/v1/${endpoint.replace(/^\/+/, '')}`;
  const headers = {
    apikey: config.key,
    Authorization: `Bearer ${config.key}`,
    'Content-Type': 'application/json',
    Accept: 'application/json',
    Connection: 'keep-alive',
    ...(options.headers || {}),
  };

  const timeoutMs = options.timeoutMs || 15000;
  const signal = options.signal || (AbortSignal.timeout ? AbortSignal.timeout(timeoutMs) : undefined);

  try {
    const response = await fetch(url, {
      method: options.method || 'GET',
      headers,
      body: options.body ? (typeof options.body === 'string' ? options.body : JSON.stringify(options.body)) : undefined,
      signal,
      keepalive: true,
    });

    if (!response.ok) {
      const errorText = await response.text();
      const err = new Error(`Supabase API error (${response.status}): ${errorText}`);
      err.status = response.status;
      err.responseBody = errorText;
      throw err;
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return null;
    }

    const text = await response.text();
    return text ? JSON.parse(text) : null;
  } catch (err) {
    const isNetworkTransient =
      err.name === 'TypeError' ||
      err.code === 'ECONNRESET' ||
      err.cause?.code === 'ECONNRESET' ||
      err.name === 'TimeoutError';

    if (retries > 0 && isNetworkTransient) {
      const backoffDelay = (3 - retries) * 500;
      await new Promise((r) => setTimeout(r, backoffDelay));
      return supabaseRequest(endpoint, options, retries - 1);
    }
    throw err;
  }
}

/**
 * Test connectivity to the Supabase Cloud instance
 */
export async function testSupabaseConnection() {
  const config = getSupabaseConfig();
  if (!config.isConfigured) {
    return {
      connected: false,
      reason: 'Unconfigured: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing.',
    };
  }

  try {
    // Check health by querying table info or schema
    const result = await supabaseRequest('users?select=count&limit=1', {
      headers: { Prefer: 'count=exact' },
    });
    return {
      connected: true,
      url: config.url,
      timestamp: new Date().toISOString(),
    };
  } catch (err) {
    return {
      connected: false,
      error: err.message,
      status: err.status || 500,
    };
  }
}

// ============================================================================
// OWNER-SCOPED CLOUD ENTITY APIS
// Every request enforces user_id = authenticated_owner_id
// ============================================================================

/**
 * Users / Authentication
 */
export async function fetchCloudUserByUsername(username) {
  if (!username) return null;
  const cleanUsername = encodeURIComponent(username.trim().toLowerCase());
  const users = await supabaseRequest(`users?username=ilike.${cleanUsername}&limit=1`);
  return users && users.length > 0 ? users[0] : null;
}

export async function fetchCloudUserById(id) {
  const users = await supabaseRequest(`users?id=eq.${encodeURIComponent(id)}&limit=1`);
  return users && users.length > 0 ? users[0] : null;
}

export async function createCloudUser({ id, username, password_hash }) {
  const payload = {
    username: username.trim().toLowerCase(),
    password_hash,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  if (id) payload.id = id;

  const result = await supabaseRequest('users', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: payload,
  });
  return Array.isArray(result) ? result[0] : result;
}

/**
 * Sessions / Authentication Tokens
 */
export async function createCloudSession(userId, token, expiresAt) {
  const payload = {
    user_id: Number(userId),
    token,
    expires_at: expiresAt,
    created_at: new Date().toISOString(),
  };

  const result = await supabaseRequest('sessions', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: payload,
  });
  return Array.isArray(result) ? result[0] : result;
}

export async function fetchCloudSessionByToken(token) {
  if (!token) return null;
  const sessions = await supabaseRequest(`sessions?token=eq.${encodeURIComponent(token)}&limit=1`);
  return sessions && sessions.length > 0 ? sessions[0] : null;
}

export async function deleteCloudSession(token) {
  if (!token) return;
  await supabaseRequest(`sessions?token=eq.${encodeURIComponent(token)}`, {
    method: 'DELETE',
  });
}

/**
 * Synchronize auto-increment sequences in Supabase PostgreSQL
 */
export async function syncCloudSequences() {
  try {
    await supabaseRequest('rpc/sync_all_sequences', {
      method: 'POST',
      body: {},
    });
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Business Profile
 */
export async function fetchCloudBusinessProfile(userId) {
  const profiles = await supabaseRequest(`business_profiles?user_id=eq.${encodeURIComponent(userId)}&limit=1`);
  return profiles && profiles.length > 0 ? profiles[0] : null;
}

export async function upsertCloudBusinessProfile(userId, { business_name, business_address, business_nickname }) {
  const now = new Date().toISOString();
  const payload = {
    user_id: Number(userId),
    business_name: String(business_name).trim(),
    business_address: String(business_address).trim(),
    business_nickname: String(business_nickname).trim(),
    updated_at: now,
  };

  const result = await supabaseRequest('business_profiles?on_conflict=user_id', {
    method: 'POST',
    headers: {
      Prefer: 'resolution=merge-duplicates,return=representation',
    },
    body: payload,
  });
  return Array.isArray(result) ? result[0] : result;
}

/**
 * Daily Lump-sum Sales
 */
export async function fetchCloudSales(userId, { startDate, endDate } = {}) {
  let query = `daily_sales?user_id=eq.${encodeURIComponent(userId)}&order=entry_date.desc`;
  if (startDate) query += `&entry_date=gte.${encodeURIComponent(startDate)}`;
  if (endDate) query += `&entry_date=lte.${encodeURIComponent(endDate)}`;

  return (await supabaseRequest(query)) || [];
}

export async function upsertCloudSale(userId, { entry_date, total_sales_amount }) {
  const now = new Date().toISOString();
  const payload = {
    user_id: Number(userId),
    entry_date,
    total_sales_amount: Number(total_sales_amount),
    updated_at: now,
  };

  const result = await supabaseRequest('daily_sales?on_conflict=user_id,entry_date', {
    method: 'POST',
    headers: {
      Prefer: 'resolution=merge-duplicates,return=representation',
    },
    body: payload,
  });
  return Array.isArray(result) ? result[0] : result;
}

/**
 * Categorized Expenses
 */
export async function fetchCloudExpenses(userId, { startDate, endDate, expenseType } = {}) {
  let query = `expenses?user_id=eq.${encodeURIComponent(userId)}&order=expense_date.desc,id.desc`;
  if (startDate) query += `&expense_date=gte.${encodeURIComponent(startDate)}`;
  if (endDate) query += `&expense_date=lte.${encodeURIComponent(endDate)}`;
  if (expenseType) query += `&expense_type=eq.${encodeURIComponent(expenseType)}`;

  return (await supabaseRequest(query)) || [];
}

export async function createCloudExpense(userId, { expense_date, expense_type, amount, description }) {
  const now = new Date().toISOString();
  const payload = {
    user_id: Number(userId),
    expense_date,
    expense_type,
    amount: Number(amount),
    description: description || '',
    created_at: now,
    updated_at: now,
  };

  const result = await supabaseRequest('expenses', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: payload,
  });
  return Array.isArray(result) ? result[0] : result;
}

export async function updateCloudExpense(userId, id, { expense_date, expense_type, amount, description }) {
  const now = new Date().toISOString();
  const payload = { updated_at: now };
  if (expense_date !== undefined) payload.expense_date = expense_date;
  if (expense_type !== undefined) payload.expense_type = expense_type;
  if (amount !== undefined) payload.amount = Number(amount);
  if (description !== undefined) payload.description = description;

  const result = await supabaseRequest(`expenses?id=eq.${encodeURIComponent(id)}&user_id=eq.${encodeURIComponent(userId)}`, {
    method: 'PATCH',
    headers: { Prefer: 'return=representation' },
    body: payload,
  });
  return Array.isArray(result) && result.length > 0 ? result[0] : null;
}

export async function deleteCloudExpense(userId, id) {
  const result = await supabaseRequest(`expenses?id=eq.${encodeURIComponent(id)}&user_id=eq.${encodeURIComponent(userId)}`, {
    method: 'DELETE',
    headers: { Prefer: 'return=representation' },
  });
  return Array.isArray(result) && result.length > 0;
}

/**
 * Product Varieties
 */
export async function fetchCloudVarieties(userId) {
  return (await supabaseRequest(`product_varieties?user_id=eq.${encodeURIComponent(userId)}&order=name.asc`)) || [];
}

export async function createCloudVariety(userId, { name }) {
  const payload = {
    user_id: Number(userId),
    name: String(name).trim(),
    created_at: new Date().toISOString(),
  };

  const result = await supabaseRequest('product_varieties', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: payload,
  });
  return Array.isArray(result) ? result[0] : result;
}

/**
 * Stock Movements
 */
export async function fetchCloudStockEntries(userId, { productId, startDate, endDate } = {}) {
  let query = `stock_entries?user_id=eq.${encodeURIComponent(userId)}&order=entry_date.desc,id.desc`;
  if (productId) query += `&product_id=eq.${encodeURIComponent(productId)}`;
  if (startDate) query += `&entry_date=gte.${encodeURIComponent(startDate)}`;
  if (endDate) query += `&entry_date=lte.${encodeURIComponent(endDate)}`;

  return (await supabaseRequest(query)) || [];
}

export async function createCloudStockEntry(userId, { product_id, movement_type, quantity, entry_date, notes }) {
  const payload = {
    user_id: Number(userId),
    product_id: Number(product_id),
    movement_type,
    quantity: Number(quantity),
    entry_date,
    notes: notes || '',
    created_at: new Date().toISOString(),
  };

  const result = await supabaseRequest('stock_entries', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: payload,
  });
  return Array.isArray(result) ? result[0] : result;
}

/**
 * Lender Accounts & Ledger
 */
export async function fetchCloudLenders(userId) {
  return (await supabaseRequest(`lenders?user_id=eq.${encodeURIComponent(userId)}&order=name.asc`)) || [];
}

export async function createCloudLender(userId, { name, mobile, place, amount_given, amount_paid, loan_date, notes }) {
  const now = new Date().toISOString();
  const payload = {
    user_id: Number(userId),
    name: String(name).trim(),
    mobile: String(mobile).trim(),
    place: String(place).trim(),
    amount_given: Number(amount_given || 0),
    amount_paid: Number(amount_paid || 0),
    loan_date,
    notes: notes || '',
    created_at: now,
    updated_at: now,
  };

  const result = await supabaseRequest('lenders', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: payload,
  });
  return Array.isArray(result) ? result[0] : result;
}

export async function recordCloudLenderRepayment(userId, lenderId, repaymentAmount, notes) {
  // Fetch lender to ensure ownership and get current amount_paid
  const lenders = await supabaseRequest(`lenders?id=eq.${encodeURIComponent(lenderId)}&user_id=eq.${encodeURIComponent(userId)}&limit=1`);
  if (!lenders || lenders.length === 0) {
    throw new Error(`Lender record ${lenderId} not found or unauthorized.`);
  }

  const lender = lenders[0];
  const newAmountPaid = Number(lender.amount_paid || 0) + Number(repaymentAmount);
  if (newAmountPaid > Number(lender.amount_given)) {
    throw new Error('Repayment amount exceeds remaining loan balance.');
  }

  const now = new Date().toISOString();
  const payload = {
    amount_paid: newAmountPaid,
    notes: notes ? (lender.notes ? `${lender.notes}; Repayment: ${notes}` : `Repayment: ${notes}`) : lender.notes,
    updated_at: now,
  };

  const result = await supabaseRequest(`lenders?id=eq.${encodeURIComponent(lenderId)}&user_id=eq.${encodeURIComponent(userId)}`, {
    method: 'PATCH',
    headers: { Prefer: 'return=representation' },
    body: payload,
  });
  return Array.isArray(result) ? result[0] : result;
}

/**
 * Bulk Insert Helper for Data Migration
 */
export async function bulkInsertCloud(table, rows) {
  if (!rows || rows.length === 0) return { inserted: 0 };
  const conflictMap = {
    users: 'id',
    business_profiles: 'user_id',
    sessions: 'token',
    product_varieties: 'user_id,name',
    stock_entries: 'id',
    daily_sales: 'user_id,entry_date',
    expenses: 'id',
    lenders: 'id',
  };
  const endpoint = conflictMap[table] ? `${table}?on_conflict=${conflictMap[table]}` : table;
  const result = await supabaseRequest(endpoint, {
    method: 'POST',
    headers: {
      Prefer: 'resolution=merge-duplicates,return=minimal',
    },
    body: rows,
  });
  return { inserted: rows.length, result };
}

/**
 * Cloud Parity Audit
 * Calculates totals directly from Supabase for comparison with SQLite
 */
export async function getCloudParityMetrics(userId) {
  const uid = encodeURIComponent(userId);
  const sales = (await supabaseRequest(`daily_sales?user_id=eq.${uid}`)) || [];
  const expenses = (await supabaseRequest(`expenses?user_id=eq.${uid}`)) || [];
  const stockEntries = (await supabaseRequest(`stock_entries?user_id=eq.${uid}`)) || [];
  const lenders = (await supabaseRequest(`lenders?user_id=eq.${uid}`)) || [];
  const varieties = (await supabaseRequest(`product_varieties?user_id=eq.${uid}`)) || [];

  const totalSales = sales.reduce((acc, row) => acc + Number(row.total_sales_amount || 0), 0);
  const totalExpenses = expenses.reduce((acc, row) => acc + Number(row.amount || 0), 0);
  const totalStockIn = stockEntries
    .filter((e) => e.movement_type === 'IN')
    .reduce((acc, row) => acc + Number(row.quantity || 0), 0);
  const totalStockOut = stockEntries
    .filter((e) => e.movement_type === 'OUT')
    .reduce((acc, row) => acc + Number(row.quantity || 0), 0);
  const currentStock = totalStockIn - totalStockOut;

  const totalLenderGiven = lenders.reduce((acc, row) => acc + Number(row.amount_given || 0), 0);
  const totalLenderPaid = lenders.reduce((acc, row) => acc + Number(row.amount_paid || 0), 0);
  const totalLenderDue = totalLenderGiven - totalLenderPaid;

  return {
    user_id: Number(userId),
    total_sales: totalSales,
    sales_count: sales.length,
    total_expenses: totalExpenses,
    expenses_count: expenses.length,
    total_stock_in: totalStockIn,
    total_stock_out: totalStockOut,
    current_stock: currentStock,
    varieties_count: varieties.length,
    total_lender_given: totalLenderGiven,
    total_lender_paid: totalLenderPaid,
    total_lender_due: totalLenderDue,
    lenders_count: lenders.length,
    net_profit: totalSales - totalExpenses,
    timestamp: new Date().toISOString(),
  };
}
