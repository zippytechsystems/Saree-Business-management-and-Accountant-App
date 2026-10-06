import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import db from '../backend/db/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupPath = path.resolve(rootDir, 'data', `app.db.pre-audit-backup-${timestamp}.db`);

try {
  const normalized = backupPath.replace(/\\/g, '/');
  db.exec(`VACUUM INTO '${normalized}'`);
  console.log('SAFETY_BACKUP_SUCCESS:', backupPath);
} catch (err) {
  console.warn('VACUUM failed, doing file copy:', err.message);
  fs.copyFileSync(path.resolve(rootDir, 'data', 'app.db'), backupPath);
  console.log('SAFETY_BACKUP_COPY_SUCCESS:', backupPath);
}
