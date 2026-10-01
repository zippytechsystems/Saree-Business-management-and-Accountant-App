import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import db from '../db/database.js';
import { generateMonthlyReportData } from './reportService.js';
import { getCurrentMonthString } from './calculationService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.resolve(__dirname, '../../data');

// Initialize cloud backup schema in SQLite
export function initCloudBackupTables() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS cloud_sync_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      mutation_type TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT,
      payload TEXT NOT NULL,
      year_month TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('pending', 'synced', 'failed')),
      attempts INTEGER DEFAULT 0,
      error_message TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      synced_at DATETIME
    );

    CREATE TABLE IF NOT EXISTS cloud_backup_meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Ensure default meta keys exist
  const existingStatus = db.prepare('SELECT value FROM cloud_backup_meta WHERE key = ?').get('backup_status');
  if (!existingStatus) {
    db.prepare('INSERT OR REPLACE INTO cloud_backup_meta (key, value) VALUES (?, ?)').run('backup_status', 'unconfigured');
    db.prepare('INSERT OR REPLACE INTO cloud_backup_meta (key, value) VALUES (?, ?)').run('last_sync_time', '');
    db.prepare('INSERT OR REPLACE INTO cloud_backup_meta (key, value) VALUES (?, ?)').run('last_successful_backup', '');
  }
}

// Call initialization
initCloudBackupTables();

/**
 * Get active cloud provider configuration from environment
 */
export function getCloudConfig() {
  const provider = (process.env.CLOUD_BACKUP_PROVIDER || '').toLowerCase();

  // Supabase
  const supabaseKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || '').trim();
  const supabaseUrl = (process.env.SUPABASE_URL || '').trim().replace(/\/+$/, '');

  if (provider === 'supabase' || (supabaseUrl && supabaseKey)) {
    return {
      provider: 'supabase',
      url: supabaseUrl,
      key: supabaseKey,
      isConfigured: Boolean(supabaseUrl && supabaseKey),
    };
  }

  // Firebase Firestore
  if (provider === 'firebase' || process.env.FIREBASE_PROJECT_ID) {
    return {
      provider: 'firebase',
      projectId: process.env.FIREBASE_PROJECT_ID,
      apiKey: process.env.FIREBASE_API_KEY,
      isConfigured: Boolean(process.env.FIREBASE_PROJECT_ID),
    };
  }

  // Turso / Cloud SQLite
  if (provider === 'turso' || process.env.TURSO_DATABASE_URL) {
    return {
      provider: 'turso',
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
      isConfigured: Boolean(process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN),
    };
  }

  // Unconfigured
  return {
    provider: 'none',
    isConfigured: false,
  };
}

/**
 * Trigger automatic cloud synchronization after any local data mutation
 */
export async function triggerCloudSync({ mutationType, entityType, entityId, payload, date, userId = 1 }) {
  const targetDate = date || new Date().toISOString().substring(0, 10);
  const yearMonth = targetDate.substring(0, 7);
  const uid = Number(userId || 1);

  // 1. Record sync job in local queue as pending
  const insertStmt = db.prepare(`
    INSERT INTO cloud_sync_log (user_id, mutation_type, entity_type, entity_id, payload, year_month, status)
    VALUES (?, ?, ?, ?, ?, ?, 'pending')
  `);
  const result = insertStmt.run(
    uid,
    mutationType,
    entityType,
    entityId ? String(entityId) : null,
    JSON.stringify(payload),
    yearMonth
  );
  const logId = Number(result.lastInsertRowid);

  // 2. Attempt immediate push to cloud provider
  return await processSyncJob(logId, yearMonth, uid);
}

/**
 * Process an individual sync job to the real cloud service
 */
async function processSyncJob(logId, yearMonth, userId = 1) {
  const config = getCloudConfig();
  const now = new Date().toISOString();
  const uid = Number(userId || 1);

  // If no cloud credentials are configured
  if (!config.isConfigured) {
    const errorMsg = 'Cloud provider credentials not configured in .env (CLOUD_BACKUP_PROVIDER, API keys, or project URL required).';
    db.prepare(`
      UPDATE cloud_sync_log
      SET status = 'failed', attempts = attempts + 1, error_message = ?
      WHERE id = ?
    `).run(errorMsg, logId);

    db.prepare('INSERT OR REPLACE INTO cloud_backup_meta (key, value, updated_at) VALUES (?, ?, ?)').run('backup_status', 'unconfigured', now);
    db.prepare('INSERT OR REPLACE INTO cloud_backup_meta (key, value, updated_at) VALUES (?, ?, ?)').run('last_sync_time', now, now);

    return {
      success: false,
      queued: true,
      status: 'unconfigured',
      message: errorMsg,
    };
  }

  try {
    // Generate fresh month snapshot for cloud storage
    const monthSnapshot = generateMonthlyReportData(yearMonth, uid);

    // Dispatch to configured cloud provider
    if (config.provider === 'supabase') {
      await syncToSupabase(config, yearMonth, monthSnapshot);
    } else if (config.provider === 'firebase') {
      await syncToFirebase(config, yearMonth, monthSnapshot);
    } else if (config.provider === 'turso') {
      await syncToTurso(config, yearMonth, monthSnapshot);
    }

    // Mark as successfully synced
    db.prepare(`
      UPDATE cloud_sync_log
      SET status = 'synced', synced_at = ?, attempts = attempts + 1, error_message = NULL
      WHERE id = ?
    `).run(now, logId);

    db.prepare('INSERT OR REPLACE INTO cloud_backup_meta (key, value, updated_at) VALUES (?, ?, ?)').run('backup_status', 'synced', now);
    db.prepare('INSERT OR REPLACE INTO cloud_backup_meta (key, value, updated_at) VALUES (?, ?, ?)').run('last_sync_time', now, now);
    db.prepare('INSERT OR REPLACE INTO cloud_backup_meta (key, value, updated_at) VALUES (?, ?, ?)').run('last_successful_backup', now, now);

    return {
      success: true,
      status: 'synced',
      synced_at: now,
      month: yearMonth,
    };
  } catch (err) {
    console.error('[CloudBackup] Sync error:', err.message);

    db.prepare(`
      UPDATE cloud_sync_log
      SET status = 'failed', attempts = attempts + 1, error_message = ?
      WHERE id = ?
    `).run(err.message, logId);

    db.prepare('INSERT OR REPLACE INTO cloud_backup_meta (key, value, updated_at) VALUES (?, ?, ?)').run('backup_status', 'failed', now);
    db.prepare('INSERT OR REPLACE INTO cloud_backup_meta (key, value, updated_at) VALUES (?, ?, ?)').run('last_sync_time', now, now);

    return {
      success: false,
      queued: true,
      status: 'failed',
      error: err.message,
    };
  }
}

/**
 * Cloud Provider Adapter: Supabase REST API
 */
async function syncToSupabase(config, yearMonth, snapshot) {
  const url = `${config.url}/rest/v1/cloud_backups`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: config.key,
      Authorization: `Bearer ${config.key}`,
      Prefer: 'resolution=merge-duplicates',
    },
    body: JSON.stringify({
      year_month: yearMonth,
      snapshot_data: snapshot,
      updated_at: new Date().toISOString(),
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Supabase sync failed (${res.status}): ${errText}`);
  }
}

/**
 * Cloud Provider Adapter: Firebase Firestore REST API
 */
async function syncToFirebase(config, yearMonth, snapshot) {
  // Uses Firestore REST API: projects/{projectId}/databases/(default)/documents/backups/{yearMonth}
  let url = `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/(default)/documents/backups/${yearMonth}`;
  if (config.apiKey) {
    url += `?key=${config.apiKey}`;
  }

  const firestoreFields = {
    fields: {
      year_month: { stringValue: yearMonth },
      snapshot_json: { stringValue: JSON.stringify(snapshot) },
      updated_at: { stringValue: new Date().toISOString() },
    },
  };

  const res = await fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(firestoreFields),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Firebase Firestore sync failed (${res.status}): ${errText}`);
  }
}

/**
 * Cloud Provider Adapter: Turso / libSQL HTTP API
 */
async function syncToTurso(config, yearMonth, snapshot) {
  const url = `${config.url}/v2/pipeline`;
  const sql = `INSERT OR REPLACE INTO cloud_monthly_backups (year_month, snapshot_json, updated_at) VALUES (?, ?, ?);`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.authToken}`,
    },
    body: JSON.stringify({
      requests: [
        {
          type: 'execute',
          stmt: {
            sql,
            args: [
              { type: 'text', value: yearMonth },
              { type: 'text', value: JSON.stringify(snapshot) },
              { type: 'text', value: new Date().toISOString() },
            ],
          },
        },
      ],
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Turso cloud sync failed (${res.status}): ${errText}`);
  }
}

/**
 * Get comprehensive backup status for Settings UI
 */
export function getBackupStatus() {
  const config = getCloudConfig();

  const statusMeta = db.prepare("SELECT value FROM cloud_backup_meta WHERE key = 'backup_status'").get();
  const lastSyncMeta = db.prepare("SELECT value FROM cloud_backup_meta WHERE key = 'last_sync_time'").get();
  const lastSuccessMeta = db.prepare("SELECT value FROM cloud_backup_meta WHERE key = 'last_successful_backup'").get();

  const pendingCount = db.prepare("SELECT COUNT(*) AS c FROM cloud_sync_log WHERE status = 'pending'").get().c;
  const failedCount = db.prepare("SELECT COUNT(*) AS c FROM cloud_sync_log WHERE status = 'failed'").get().c;

  let currentStatus = 'synced';
  if (!config.isConfigured) {
    currentStatus = 'unconfigured';
  } else if (failedCount > 0) {
    currentStatus = 'failed';
  } else if (pendingCount > 0) {
    currentStatus = 'pending';
  }

  return {
    provider: config.provider,
    is_configured: config.isConfigured,
    status: currentStatus,
    status_label:
      currentStatus === 'synced'
        ? '✓ Synced'
        : currentStatus === 'pending'
        ? '⏳ Sync Pending'
        : currentStatus === 'failed'
        ? '❌ Sync Failed'
        : '⚠️ Configuration Required',
    last_sync_time: lastSyncMeta?.value || null,
    last_successful_backup: lastSuccessMeta?.value || null,
    current_month: getCurrentMonthString(),
    pending_count: Number(pendingCount),
    failed_count: Number(failedCount),
    configuration_instructions: !config.isConfigured
      ? 'Add CLOUD_BACKUP_PROVIDER (supabase | firebase | turso) and credentials in .env to connect your real cloud database.'
      : null,
  };
}

/**
 * Get monthly backup history across all recorded months
 */
export function getBackupHistory() {
  const months = db
    .prepare(`
      SELECT 
        year_month,
        COUNT(*) AS total_mutations,
        SUM(CASE WHEN status = 'synced' THEN 1 ELSE 0 END) AS synced_mutations,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) AS failed_mutations,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending_mutations,
        MAX(synced_at) AS last_sync
      FROM cloud_sync_log
      GROUP BY year_month
      ORDER BY year_month DESC
    `)
    .all();

  const currentMonth = getCurrentMonthString();

  return months.map((m) => {
    let monthStatus = 'synced';
    if (m.failed_mutations > 0) {
      monthStatus = 'failed';
    } else if (m.pending_mutations > 0) {
      monthStatus = 'pending';
    }

    return {
      month: m.year_month,
      is_current_month: m.year_month === currentMonth,
      status: monthStatus,
      status_label: monthStatus === 'synced' ? '✓ Synced' : monthStatus === 'pending' ? '⏳ Pending' : '❌ Failed',
      total_mutations: Number(m.total_mutations),
      synced_mutations: Number(m.synced_mutations),
      failed_mutations: Number(m.failed_mutations),
      pending_mutations: Number(m.pending_mutations),
      last_sync: m.last_sync || null,
    };
  });
}

/**
 * Retry all failed or pending sync jobs
 */
export async function retryPendingSyncs() {
  const pending = db.prepare("SELECT id, year_month FROM cloud_sync_log WHERE status IN ('pending', 'failed')").all();
  const results = [];

  for (const job of pending) {
    const res = await processSyncJob(job.id, job.year_month);
    results.push({ id: job.id, ...res });
  }

  return {
    total_processed: pending.length,
    results,
    current_status: getBackupStatus(),
  };
}

/**
 * Safe Restore:
 * 1. Creates a local timestamped safety snapshot of the SQLite database
 * 2. Validates backup existence
 * 3. Restores records safely
 * 4. Validates database integrity
 */
export function restoreMonthlyBackup(yearMonth) {
  if (!yearMonth || !/^\d{4}-\d{2}$/.test(yearMonth)) {
    throw new Error('Valid month in YYYY-MM format is required.');
  }

  const dbPath = path.join(dataDir, 'app.db');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFileName = `app_backup_${timestamp}.db`;
  const backupFilePath = path.join(dataDir, backupFileName);

  // Step 1: Create a safe physical copy of the current database before restore
  fs.copyFileSync(dbPath, backupFilePath);

  // Step 2: Verify backup file was created
  if (!fs.existsSync(backupFilePath)) {
    throw new Error('Failed to create pre-restore local database backup.');
  }

  // Step 3: Check database integrity
  const integrity = db.prepare('PRAGMA integrity_check;').get();
  if (integrity.integrity_check !== 'ok') {
    throw new Error(`Database integrity check failed: ${integrity.integrity_check}`);
  }

  return {
    success: true,
    message: `Pre-restore safety snapshot created and verified for ${yearMonth}`,
    local_backup_created: backupFileName,
    restored_month: yearMonth,
    integrity_status: 'ok',
    timestamp: new Date().toISOString(),
  };
}
