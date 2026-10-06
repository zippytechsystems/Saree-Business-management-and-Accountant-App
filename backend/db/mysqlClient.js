import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mysql from 'mysql2/promise';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Hostinger MySQL Connection Pool Configuration
 * Supports both DB_* and MYSQL_* environment variables
 */
function getPoolConfig() {
  return {
    host: process.env.DB_HOST || process.env.MYSQL_HOST || 'localhost',
    user: process.env.DB_USER || process.env.MYSQL_USER || '',
    password: process.env.DB_PASSWORD || process.env.MYSQL_PASSWORD || '',
    database: process.env.DB_NAME || process.env.MYSQL_DATABASE || '',
    port: Number(process.env.DB_PORT || process.env.MYSQL_PORT || 3306),
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000,
    decimalNumbers: true,
  };
}

let pool = null;

export function isMysqlConfigured() {
  const cfg = getPoolConfig();
  return Boolean(cfg.host && cfg.database && cfg.user);
}

export function getMysqlPool() {
  if (!pool && isMysqlConfigured()) {
    pool = mysql.createPool(getPoolConfig());
  }
  return pool;
}

export async function testMysqlConnection() {
  try {
    if (!isMysqlConfigured()) {
      return {
        connected: false,
        message: 'Hostinger MySQL not configured. Please define DB_HOST, DB_NAME, DB_USER in Hostinger environment or .env',
      };
    }
    const p = getMysqlPool();
    const [rows] = await p.query('SELECT 1 as test');
    const cfg = getPoolConfig();
    return {
      connected: true,
      message: 'Connected to Hostinger MySQL successfully',
      host: cfg.host,
      database: cfg.database,
      user: cfg.user,
    };
  } catch (err) {
    return {
      connected: false,
      message: err.message,
    };
  }
}

export async function query(sql, params = []) {
  const p = getMysqlPool();
  if (!p) throw new Error('Hostinger MySQL is not initialized. Please configure DB_HOST, DB_NAME, DB_USER.');
  const [rows] = await p.execute(sql, params);
  return rows;
}

export async function execute(sql, params = []) {
  const p = getMysqlPool();
  if (!p) throw new Error('Hostinger MySQL is not initialized. Please configure DB_HOST, DB_NAME, DB_USER.');
  const [result] = await p.execute(sql, params);
  return result;
}

/**
 * Initialize MySQL Schema if tables do not exist
 */
export async function initMysqlSchema() {
  if (!isMysqlConfigured()) return false;
  try {
    const schemaPath = path.join(__dirname, 'schema_mysql.sql');
    if (!fs.existsSync(schemaPath)) return false;

    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    const statements = schemaSql
      .split(';')
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith('--'));

    const p = getMysqlPool();
    for (const stmt of statements) {
      await p.query(stmt);
    }
    console.log('[Hostinger MySQL] Schema verified and all tables ready.');
    return true;
  } catch (err) {
    console.error('[Hostinger MySQL] Schema initialization warning:', err.message);
    return false;
  }
}

/**
 * Retrieve database status & table counts from MySQL
 */
export async function getMysqlDatabaseStatus() {
  if (!isMysqlConfigured()) {
    return { status: 'unconfigured', tables: [] };
  }
  try {
    const p = getMysqlPool();
    const cfg = getPoolConfig();
    const [rows] = await p.query(
      'SELECT TABLE_NAME FROM information_schema.tables WHERE TABLE_SCHEMA = ?',
      [cfg.database]
    );
    return {
      status: 'connected',
      database: cfg.database,
      host: cfg.host,
      tables: rows.map((r) => r.TABLE_NAME || r.table_name),
    };
  } catch (err) {
    return {
      status: 'error',
      error: err.message,
      tables: [],
    };
  }
}

export default {
  isMysqlConfigured,
  getMysqlPool,
  testMysqlConnection,
  query,
  execute,
  initMysqlSchema,
  getMysqlDatabaseStatus,
};
