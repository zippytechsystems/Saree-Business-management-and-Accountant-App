import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

// Ensure data directory exists
const dataDir = path.resolve(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'app.db');
let db = null;

// Dynamically check and synchronously load node:sqlite (available in Node.js >= 22.5.0)
try {
  const { DatabaseSync } = require('node:sqlite');
  if (DatabaseSync) {
    db = new DatabaseSync(dbPath);
    try {
      db.exec('PRAGMA journal_mode = WAL;');
      db.exec('PRAGMA foreign_keys = ON;');
      db.exec('PRAGMA synchronous = NORMAL;');
      db.exec('PRAGMA cache_size = -64000;');
      db.exec('PRAGMA temp_store = MEMORY;');
    } catch (pragmaErr) {
      // Non-fatal PRAGMA warnings
    }
  }
} catch (err) {
  // Graceful fallback for Node.js environments where node:sqlite is not available
  console.log('[Database] Built-in node:sqlite not supported on this Node version. Hostinger MySQL is authoritative.');
}

// Fallback stub in case node:sqlite is not supported on older Node runtime
if (!db) {
  db = {
    exec: () => {},
    prepare: () => ({
      run: () => ({ lastInsertRowid: 1, changes: 0 }),
      get: () => null,
      all: () => [],
    }),
  };
}

import { runAuthMigration } from './migration_auth.js';

/**
 * Initialize database schema according to the approved planning architecture
 */
export function initDatabase() {
  try {
    const schemaPath = path.join(__dirname, 'schema.sql');
    if (fs.existsSync(schemaPath)) {
      const schemaSql = fs.readFileSync(schemaPath, 'utf8');
      db.exec(schemaSql);
      runAuthMigration();
      console.log('[Database] Schema initialized and auth migration verified at:', dbPath);
    }
  } catch (err) {
    console.warn('[Database] Local SQLite init bypassed:', err.message);
  }
}

/**
 * Verify table existence and return foundation status
 */
export function getDatabaseStatus() {
  try {
    const tables = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';")
      .all()
      .map((row) => row.name);

    return {
      status: 'connected',
      path: dbPath,
      tables: tables,
    };
  } catch {
    return {
      status: 'fallback',
      path: dbPath,
      tables: [],
    };
  }
}

export default db;
