import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure data directory exists
const dataDir = path.resolve(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'app.db');
const db = new DatabaseSync(dbPath);

// Enable WAL mode, foreign key enforcement, and ultra-high-speed memory caching
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');
db.exec('PRAGMA synchronous = NORMAL;');
db.exec('PRAGMA cache_size = -64000;'); // 64MB Cache in RAM
db.exec('PRAGMA temp_store = MEMORY;');
db.exec('PRAGMA mmap_size = 268435456;'); // 256MB memory-mapped I/O

import { runAuthMigration } from './migration_auth.js';

/**
 * Initialize database schema according to the approved planning architecture
 */
export function initDatabase() {
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');
  db.exec(schemaSql);
  runAuthMigration();
  console.log('[Database] Schema initialized and auth migration verified at:', dbPath);
}

/**
 * Verify table existence and return foundation status
 */
export function getDatabaseStatus() {
  const tables = db
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';")
    .all()
    .map((row) => row.name);

  return {
    status: 'connected',
    path: dbPath,
    tables: tables,
  };
}

export default db;
