import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
dotenv.config({ path: path.join(rootDir, '.env') });
dotenv.config();

import express from 'express';
import cors from 'cors';

// Suppress experimental node warnings (e.g. built-in SQLite)
process.removeAllListeners('warning');
process.on('warning', (warning) => {
  if (warning.name === 'ExperimentalWarning' && /sqlite/i.test(warning.message)) {
    return;
  }
  process.stderr.write(`[runtime-warning] ${warning.name}: ${warning.message}\n`);
});

// Crash resilience handlers
process.on('unhandledRejection', (reason) => {
  process.stderr.write(`[fatal-unhandled-rejection] ${reason?.stack || reason}\n`);
});
process.on('uncaughtException', (err) => {
  process.stderr.write(`[fatal-uncaught-exception] ${err.stack || err}\n`);
  process.exit(1);
});

import { initDatabase } from './db/database.js';
import * as mysql from './db/mysql.js';
import apiRoutes from './routes/api.js';

// Initialize local database schema & authentication migrations
initDatabase();

const distPath = path.resolve(__dirname, '../dist');

const app = express();
const PORT = process.env.PORT && !isNaN(Number(process.env.PORT)) ? Number(process.env.PORT) : (process.env.PORT || 3000);

// ====================================================================
// COMPREHENSIVE SECURITY & PERFORMANCE MIDDLEWARE
// ====================================================================

// 1. Strict Security Headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; font-src 'self' data:; img-src 'self' data: blob: https:; connect-src 'self' https: http:;"
  );
  res.removeHeader('X-Powered-By');
  next();
});

// 2. Secret File Access Protection (Blocks .env, .git, .db, config files)
app.use((req, res, next) => {
  const p = req.path.toLowerCase();
  if (
    p.includes('.env') ||
    p.includes('.git') ||
    p.includes('node_modules') ||
    p.startsWith('/backend') ||
    p.includes('package.json') ||
    p.includes('package-lock.json') ||
    p.includes('ecosystem.config') ||
    p.endsWith('.db') ||
    p.endsWith('.sqlite') ||
    p.endsWith('.log') ||
    p.endsWith('.key') ||
    p.endsWith('.pem')
  ) {
    return res.status(403).json({ success: false, error: 'Access Denied: Protected System Resource' });
  }
  next();
});

// 3. Sliding Window In-Memory Rate Limiter
const rateLimitStore = new Map();
function rateLimiter({ windowMs, maxRequests, message }) {
  return (req, res, next) => {
    const ip = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.ip || req.socket?.remoteAddress || '127.0.0.1';
    const route = (req.originalUrl || req.baseUrl || req.path || '/api').split('?')[0];
    const key = `${route}_${ip}`;
    const now = Date.now();

    let record = rateLimitStore.get(key);
    if (!record || now - record.startTime > windowMs) {
      record = { count: 1, startTime: now };
      rateLimitStore.set(key, record);
    } else {
      record.count++;
    }

    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - record.count));

    if (record.count > maxRequests) {
      const retryAfterSec = Math.ceil((record.startTime + windowMs - now) / 1000);
      res.setHeader('Retry-After', retryAfterSec);
      return res.status(429).json({
        success: false,
        error: message || 'Too many requests. Please slow down.',
        retryAfter: retryAfterSec,
      });
    }
    next();
  };
}

// Clean up expired rate limit entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of rateLimitStore.entries()) {
    if (now - v.startTime > 15 * 60 * 1000) rateLimitStore.delete(k);
  }
}, 5 * 60 * 1000).unref();

const globalApiLimiter = rateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 180,
  message: 'API rate limit exceeded. Please wait a moment.',
});

// 4. Strict CORS Protection
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim().replace(/\/+$/, ''))
  : '*';

const corsMiddleware = cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const cleanOrigin = origin.replace(/\/+$/, '');
    if (
      cleanOrigin.startsWith('http://localhost:') ||
      cleanOrigin.startsWith('http://127.0.0.1:') ||
      allowedOrigins === '*' ||
      (Array.isArray(allowedOrigins) && (allowedOrigins.includes('*') || allowedOrigins.includes(cleanOrigin)))
    ) {
      return callback(null, origin);
    }
    return callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Disposition', 'X-RateLimit-Limit', 'X-RateLimit-Remaining'],
});

app.use(corsMiddleware);
app.options('*', corsMiddleware);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// 5. Form Input Sanitization (XSS Filter)
function sanitizeData(input) {
  if (typeof input === 'string') {
    return input
      .replace(/\0/g, '')
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/\s*on\w+\s*=\s*(?:'[^']*'|"[^"]*"|[^\s>]+)/gi, '');
  }
  if (Array.isArray(input)) return input.map(sanitizeData);
  if (input !== null && typeof input === 'object') {
    const clean = {};
    for (const k of Object.keys(input)) {
      clean[k] = sanitizeData(input[k]);
    }
    return clean;
  }
  return input;
}

app.use((req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeData(req.body);
  }
  next();
});

// Initialize database schema
try {
  initDatabase();
} catch (err) {
  console.error('[Database] Failed to initialize schema:', err);
}

// 6. Routes with API Rate Limiting
app.use('/api', globalApiLimiter, apiRoutes);

// Dedicated JSON 404 handler for ALL unhandled /api requests (GET, POST, PUT, DELETE, etc.)
// Prevents Express from ever falling back to an HTML error page for API consumers
app.all('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    error: `API endpoint '${req.method} ${req.originalUrl}' not found.`,
    path: req.originalUrl,
    method: req.method,
  });
});

// Root informational endpoint for API consumers & uptime monitors
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

// 7. High-Performance Static Asset Caching (Near-by speed boost)
app.use(
  '/assets',
  express.static(path.join(distPath, 'assets'), {
    maxAge: '1y',
    immutable: true,
  })
);

app.use(
  express.static(distPath, {
    maxAge: '1h',
    etag: true,
  })
);

// SPA Fallback for client-side routing
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({
      success: false,
      error: `API endpoint '${req.method} ${req.originalUrl}' not found.`,
      path: req.originalUrl,
      method: req.method,
    });
  }
  const indexPath = path.join(distPath, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      res.status(200).json({
        status: 'online',
        service: 'Saree Business Management & Accountant Backend API',
        health: '/api/health',
        notice: 'Frontend dist/index.html not found. Please run "npm run build".',
      });
    }
  });
});

// 8. Production Error Handler (Zero stack trace exposure, always JSON for /api)
app.use((err, req, res, next) => {
  const isApi = req.path.startsWith('/api');
  const statusCode = err.status || err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    error: isApi ? (err.message || 'Internal Server Error') : 'Internal Server Error',
    message: isApi
      ? 'An error occurred while processing the API request.'
      : 'An unexpected internal error occurred. Please try again.',
  });
});

let serverInstance = null;

export const startServer = async () => {
  if (serverInstance) return serverInstance;

  serverInstance = app.listen(PORT, async () => {
    console.log(`[Server] Backend service running on http://localhost:${PORT}`);

    // Check Hostinger MySQL Configuration
    const isMySQL = mysql.isMySQLConfigured();
    if (isMySQL) {
      console.log('[Hostinger MySQL] Initializing schema and checking database connection...');
      try {
        await mysql.initMySQLSchema();
        const mysqlStatus = await mysql.testMySQLConnection();
        if (mysqlStatus.connected) {
          console.log('================================================================');
          console.log(`[Hostinger MySQL] ✓ Connected to Hostinger MySQL Database: ${mysqlStatus.database} on ${mysqlStatus.host}:${mysqlStatus.port}`);
          console.log(`[Hostinger MySQL] Mode: hostinger_mysql_authoritative (100% Authoritative Source of Truth)`);
          console.log(`[Hostinger MySQL] Tables Verified: ${mysqlStatus.tables?.length || 0}`);
          console.log('================================================================');
        } else {
          console.error('[Hostinger MySQL] ❌ MySQL connection failed:', mysqlStatus.error);
          console.warn('[Hostinger MySQL] Falling back to local SQLite cache (data/app.db).');
        }
      } catch (err) {
        console.error('[Hostinger MySQL] Schema initialization error:', err.message);
      }
    } else {
      const cfg = mysql.getMySQLConfig();
      console.log('================================================================');
      console.log(`[Hostinger Server] ✓ App active on Hostinger (Port: ${PORT})`);
      if (cfg.user && cfg.user.toLowerCase() === 'root') {
        console.warn("[Hostinger MySQL] Notice: 'root' user is not permitted on Hostinger MySQL. Please create a user in hPanel.");
      } else {
        console.log('[Hostinger MySQL] Notice: MySQL credentials (DB_USER, DB_PASSWORD, DB_NAME) not yet configured.');
      }
      console.log('[Hostinger Database] ✓ Resilient local SQLite database operational at data/app.db (WAL Mode)');
      console.log('[Hostinger Database] Mode: hostinger_authoritative');
      console.log('================================================================');
    }
  });

  return serverInstance;
};

if (process.env.NODE_ENV !== 'test') {
  startServer();
}

export default app;
