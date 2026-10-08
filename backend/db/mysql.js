import mysql from 'mysql2/promise';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let pool = null;

/**
 * Clean database identifier from accidental whitespace or hPanel UI copy-paste strings
 * (e.g. strips accidental "1 MB", "(1 MB)", "0.00 MB", or quotes)
 */
export function cleanDbIdentifier(val) {
  if (!val || typeof val !== 'string') return '';
  let cleaned = val.trim();
  // Strip accidental copy-paste of hPanel storage sizes (e.g., "u123456_db 1 MB", "u123456_db (0.00 MB)")
  cleaned = cleaned.replace(/\s*\(?\d+(\.\d+)?\s*(MB|KB|GB|B)\)?\s*$/i, '').trim();
  // Strip accidental quotes if user wrapped value in .env
  cleaned = cleaned.replace(/^['"]|['"]$/g, '').trim();
  return cleaned;
}

/**
 * Resolve database configuration from environment variables
 * Designed for 100% Hostinger compatibility (127.0.0.1:3306 on server)
 * Reads strictly from DB_* or MYSQL_* environment variables.
 * Does NOT default user to 'root' or database to default name.
 */
export function getMySQLConfig() {
  const host = (process.env.DB_HOST || process.env.MYSQL_HOST || '127.0.0.1').trim();
  const port = Number(process.env.DB_PORT || process.env.MYSQL_PORT || 3306);
  const rawUser = process.env.DB_USER || process.env.MYSQL_USER || '';
  const user = cleanDbIdentifier(rawUser);
  const password = process.env.DB_PASSWORD !== undefined
    ? process.env.DB_PASSWORD
    : (process.env.MYSQL_PASSWORD !== undefined ? process.env.MYSQL_PASSWORD : '');
  const rawDatabase = process.env.DB_NAME || process.env.DB_DATABASE || process.env.MYSQL_DATABASE || '';
  const database = cleanDbIdentifier(rawDatabase);

  const isRoot = user.toLowerCase() === 'root';
  const allowRoot = process.env.ALLOW_LOCAL_ROOT === 'true';

  // Strictly require user, database, and password. Connecting as 'root' is not allowed on Hostinger.
  const isConfigured = Boolean(
    user &&
    database &&
    (!isRoot || allowRoot) &&
    (password || allowRoot)
  );

  return {
    host,
    port,
    user,
    password,
    database,
    waitForConnections: true,
    connectionLimit: Number(process.env.DB_CONNECTION_LIMIT || 10),
    queueLimit: 0,
    charset: 'utf8mb4',
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000,
    isConfigured,
  };
}

/**
 * Determine if MySQL is configured and should be authoritative
 */
export function isMySQLConfigured() {
  const cfg = getMySQLConfig();
  return cfg.isConfigured;
}

/**
 * Get or initialize MySQL connection pool
 */
export function getPool() {
  if (!pool) {
    const config = getMySQLConfig();
    if (!config.isConfigured) {
      let reason = 'Hostinger MySQL is not configured. Missing required environment variables (DB_USER, DB_PASSWORD, DB_NAME).';
      if (config.user && config.user.toLowerCase() === 'root') {
        reason = "Connecting as 'root' is not permitted on Hostinger. Please use the dedicated MySQL database user created in hPanel (e.g. u123456789_user) and configure DB_USER.";
      }
      throw new Error(reason);
    }

    pool = mysql.createPool({
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.password,
      database: config.database,
      waitForConnections: config.waitForConnections,
      connectionLimit: config.connectionLimit,
      queueLimit: config.queueLimit,
      charset: config.charset,
      enableKeepAlive: config.enableKeepAlive,
      keepAliveInitialDelay: config.keepAliveInitialDelay,
    });
  }
  return pool;
}

/**
 * Test MySQL connection without leaking credentials
 */
export async function testMySQLConnection() {
  const cfg = getMySQLConfig();
  if (!cfg.isConfigured) {
    let reason = 'Hostinger MySQL credentials missing. Please set DB_USER, DB_PASSWORD, and DB_NAME in environment variables.';
    if (cfg.user && cfg.user.toLowerCase() === 'root') {
      reason = "Connecting as 'root' is not permitted on Hostinger. Please create a dedicated MySQL user in hPanel (e.g. u123456789_user) and set DB_USER.";
    }
    return {
      connected: false,
      configured: false,
      host: cfg.host,
      port: cfg.port,
      database: cfg.database || null,
      user: cfg.user || null,
      error: reason,
      code: 'NOT_CONFIGURED',
    };
  }

  try {
    const p = getPool();
    const [rows] = await p.query('SELECT 1 as is_alive, NOW() as server_time, VERSION() as version');
    return {
      connected: true,
      configured: true,
      host: cfg.host,
      port: cfg.port,
      database: cfg.database,
      user: cfg.user,
      version: rows[0]?.version || 'unknown',
      server_time: rows[0]?.server_time || new Date().toISOString(),
    };
  } catch (error) {
    return {
      connected: false,
      configured: true,
      host: cfg.host,
      port: cfg.port,
      database: cfg.database,
      user: cfg.user,
      error: error.message,
      code: error.code || 'CONNECTION_FAILED',
    };
  }
}

/**
 * Execute parameterized query with automatic retry/recovery
 */
export async function query(sql, params = []) {
  const p = getPool();
  return p.query(sql, params);
}

/**
 * Execute parameterized statement with automatic retry/recovery
 */
export async function execute(sql, params = []) {
  const p = getPool();
  return p.execute(sql, params);
}

/**
 * Execute callback within a database transaction.
 * Automatically commits on success, rolls back on error, and releases connection back to the pool.
 * @param {Function} callback - async (connection) => Promise<T>
 * @returns {Promise<T>}
 */
export async function withTransaction(callback) {
  const p = getPool();
  const conn = await p.getConnection();
  try {
    await conn.beginTransaction();
    const result = await callback(conn);
    await conn.commit();
    return result;
  } catch (error) {
    try {
      await conn.rollback();
    } catch (rbError) {
      console.error('[MySQL Transaction] Rollback failed:', rbError.message);
    }
    throw error;
  } finally {
    conn.release();
  }
}

/**
 * Initialize MySQL schema from backend/db/mysql_schema.sql
 */
export async function initMySQLSchema() {
  const schemaPath = path.join(__dirname, 'mysql_schema.sql');
  if (!fs.existsSync(schemaPath)) {
    throw new Error(`MySQL schema file not found at: ${schemaPath}`);
  }

  const rawSql = fs.readFileSync(schemaPath, 'utf8');
  const p = getPool();

  // Strip block comments and line comments
  const cleanSql = rawSql
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/--.*$/gm, '');

  const statements = cleanSql
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  for (const stmt of statements) {
    if (stmt.length > 0) {
      await p.query(stmt);
    }
  }

  console.log(`[MySQL Database] Schema tables verified (${statements.length} statements executed).`);
}

/**
 * Get MySQL status and list of existing tables
 */
export async function getMySQLStatus() {
  const connTest = await testMySQLConnection();
  if (!connTest.connected) {
    return {
      status: 'disconnected',
      engine: 'Hostinger MySQL',
      ...connTest,
      tables: [],
    };
  }

  try {
    const p = getPool();
    const cfg = getMySQLConfig();
    const [rows] = await p.query(
      `SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = ?`,
      [cfg.database]
    );

    const tables = rows.map((r) => r.TABLE_NAME || r.table_name);
    return {
      status: 'connected',
      engine: 'Hostinger MySQL',
      ...connTest,
      tables,
    };
  } catch (err) {
    return {
      status: 'error',
      engine: 'Hostinger MySQL',
      error: err.message,
      tables: [],
    };
  }
}

export default {
  getPool,
  query,
  execute,
  withTransaction,
  testMySQLConnection,
  initMySQLSchema,
  getMySQLStatus,
  isMySQLConfigured,
  getMySQLConfig,
};
