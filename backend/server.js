import 'dotenv/config';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import { initDatabase } from './db/database.js';
import apiRoutes from './routes/api.js';
import * as cloudBackupService from './services/cloudBackupService.js';
import * as supabaseService from './services/supabaseService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.resolve(__dirname, '../dist');

const app = express();
const PORT = process.env.PORT || 5000;

// Security & Parsing Middleware with Body Limits (1MB) and Production CORS
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim().replace(/\/+$/, ''))
  : '*';

const corsMiddleware = cors({
  origin: (origin, callback) => {
    // Requests without origin header (mobile, curl, Postman, server-to-server)
    if (!origin) return callback(null, true);

    const cleanOrigin = origin.replace(/\/+$/, '');

    if (
      allowedOrigins === '*' ||
      (Array.isArray(allowedOrigins) && (allowedOrigins.includes('*') || allowedOrigins.includes(cleanOrigin))) ||
      cleanOrigin.endsWith('.netlify.app') ||
      cleanOrigin.endsWith('.vercel.app') ||
      cleanOrigin.startsWith('http://localhost:') ||
      cleanOrigin.startsWith('http://127.0.0.1:')
    ) {
      return callback(null, origin);
    }
    return callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
});

app.use(corsMiddleware);
app.options('*', corsMiddleware);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Initialize database schema
try {
  initDatabase();
} catch (err) {
  console.error('[Database] Failed to initialize schema:', err);
}

// Routes
app.use('/api', apiRoutes);

// Root informational endpoint for Render / API consumers
app.get('/', (req, res, next) => {
  const indexPath = path.join(distPath, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      res.json({
        status: 'online',
        service: 'Saree Business Management & Accountant Backend API',
        health: '/api/health',
      });
    }
  });
});

// Serve static frontend production build
app.use(express.static(distPath));

// SPA Fallback for client-side routing
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(distPath, 'index.html'), (err) => {
    if (err) next();
  });
});

// Global Error Handler (No stack trace exposure to clients)
app.use((err, req, res, next) => {
  console.error('[Server Error]:', err.stack);
  res.status(500).json({
    success: false,
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' ? 'An unexpected internal error occurred.' : err.message,
  });
});

if (process.env.VERCEL !== '1') {
  app.listen(PORT, async () => {
    console.log(`[Server] Backend service running on http://localhost:${PORT}`);

    // Verify Authoritative Supabase Cloud Connection
    const isSupabase = supabaseService.isSupabaseConfigured();
    if (isSupabase) {
      console.log('[Database] Checking Authoritative Supabase Cloud connection...');
      try {
        const cloudConn = await supabaseService.testSupabaseConnection();
        if (cloudConn.connected) {
          console.log(`[Database] ✓ Authoritative Supabase connected: ${cloudConn.url}`);
          console.log('[Database] Database Mode: authoritative_supabase (Primary: Cloud PostgreSQL, Cache: Local SQLite)');

          // Background retry of pending cloud sync jobs
          cloudBackupService.retryPendingSyncs().catch((err) => {
            console.error('[CloudBackup] Startup sync flush error:', err.message);
          });
        } else {
          console.error('[Database] ❌ Supabase credentials configured but connection check failed:', cloudConn.error || cloudConn.reason);
          console.warn('[Database] WARNING: Falling back to local SQLite cache (/app/data/app.db).');
        }
      } catch (err) {
        console.error('[Database] Exception during Supabase connection check:', err.message);
      }
    } else {
      console.warn('================================================================');
      console.warn('[Database] ⚠️  SUPABASE NOT CONFIGURED: Running in local_sqlite_fallback mode!');
      console.warn('[Database] To enable Authoritative Supabase, add these variables in Railway:');
      console.warn('[Database]   1. SUPABASE_URL');
      console.warn('[Database]   2. SUPABASE_SERVICE_ROLE_KEY');
      console.warn('[Database]   3. CLOUD_BACKUP_PROVIDER=supabase');
      console.warn('================================================================');
    }
  });
}

export default app;
