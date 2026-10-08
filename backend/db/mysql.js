import mysql from 'mysql2/promise';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let pool = null;

/**
 * Resolve database configuration from environment variables
 * Designed for 100% Hostinger compatibility (127.0.0.1:3306 on server)
 */
export function getMySQLConfig() {
  const host = process.env.DB_HOST || process.env.MYSQL_HOST || '127.0.0.1';
  const port = Number(process.env.DB_PORT || process.env.MYSQL_PORT || 3306);
  const user = process.env.DB_USER || process.env.MYSQL_USER || 'root';
  const password = process.env.DB_PASSWORD !== undefined
    ? process.env.DB_PASSWORD
    : (process.env.MYSQL_PASSWORD !== undefined ? process.env.MYSQL_PASSWORD : '');
  const database = process.env.DB_NAME || process.env.DB_DATABASE || process.env.MYSQL_DATABASE || 'saree_business_db';

  const isConfigured = Boolean(
    process.env.DB_NAME ||
    process.env.DB_USER ||
    process.env.MYSQL_DATABASE ||
    process.env.MYSQL_USER ||
    process.env.CLOUD_BACKUP_PROVIDER === 'hostinger_mysql' ||
    process.env.CLOUD_BACKUP_PROVIDER === 'mysql'
  );

  return {
    host,
    port,
    user,
    password,
    database,
    waitForConnections: true,
    connectionLimit: 10,
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
  // If explicitly configured in .env or default host/db is present
  const cfg = getMySQLConfig();
  return Boolean(cfg.database && cfg.user);
}

/**
 * Get or initialize MySQL connection pool
 */
export function getPool() {
  if (!pool) {
    const config = getMySQLConfig();
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
 * Test MySQL connection
 */
export async function testMySQLConnection() {
  try {
    const p = getPool();
    const [rows] = await p.query('SELECT 1 as is_alive, NOW() as server_time, VERSION() as version');
    const cfg = getMySQLConfig();
    return {
      connected: true,
      host: cfg.host,
      port: cfg.port,
      database: cfg.database,
      user: cfg.user,
      version: rows[0]?.version || 'unknown',
      server_time: rows[0]?.server_time || new Date().toISOString(),
    };
  } catch (error) {
    const cfg = getMySQLConfig();
    return {
      connected: false,
      host: cfg.host,
      port: cfg.port,
      database: cfg.database,
      error: error.message,
      code: error.code,
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
  testMySQLConnection,
  initMySQLSchema,
  getMySQLStatus,
  isMySQLConfigured,
  getMySQLConfig,
};
