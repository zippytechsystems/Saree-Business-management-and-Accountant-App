# Hostinger Production Deployment Guide
### Business Management & Accountant Management App

This application is built for 100% native deployment on **Hostinger (Node.js Web Hosting / VPS / Cloud Hosting)** with **Hostinger MySQL Database** as the authoritative source of truth.

---

## 🗄️ 1. Architecture Overview

- **Authoritative Database**: Hostinger MySQL (InnoDB) via local socket/port (`127.0.0.1:3306`).
- **Backend API**: Node.js & Express (`server.js` / `backend/server.js`) with MySQL connection pool.
- **Frontend SPA**: React 19 + Vite compiled statically into `./dist` and served seamlessly by the Express server.
- **Local Fallback**: High-performance SQLite (`data/app.db`) for offline resilience.

---

## ⚙️ 2. Production Environment Variables

Configure these environment variables in your Hostinger hPanel -> Node.js -> Environment Variables:

| Variable | Value / Description | Example |
| :--- | :--- | :--- |
| `NODE_ENV` | Application environment mode | `production` |
| `PORT` | Node.js web server port | `5000` |
| `JWT_SECRET` | Secret key for JWT sessions | `random-secure-secret-key-at-least-40-chars` |
| `CORS_ORIGIN` | Allowed domains for browser requests | `*` or `https://yourdomain.com` |
| `DB_HOST` | Hostinger MySQL Host (local on server) | `127.0.0.1` |
| `DB_PORT` | Hostinger MySQL Port | `3306` |
| `DB_NAME` | Your Hostinger database name | `u123456789_saree_db` |
| `DB_USER` | Your Hostinger database user | `u123456789_admin` |
| `DB_PASSWORD` | Your Hostinger database password | `YourStrongPasswordHere` |

> [!IMPORTANT]
> Always set `DB_HOST=127.0.0.1` on Hostinger. Node.js connects to MySQL internally on the same server at lightning speed.

---

## 🚀 3. Hostinger Deployment Steps

1. In **Hostinger hPanel** ➔ **Websites** ➔ **Manage** ➔ **Node.js**:
   - **Node.js Version**: `20.x` or `22.x`
   - **Application Mode**: `Production`
   - **Application Root**: `public_html` (or repository root)
   - **Application Startup File**: `server.js`
2. Connect your GitHub repository:
   - Repository: `zippytechsystems/Saree-Business-management-and-Accountant-App`
   - Branch: `main`
3. Add the **Environment Variables** listed above.
4. Click **Deploy** / **Restart Application**.
5. The application boots up, automatically verifies all 10 MySQL tables, and serves both the backend API and React frontend.

---

## 🩺 4. Verify Live Health

Visit your live URL:
```
https://yourdomain.com/api/health
```

Expected JSON response:
```json
{
  "success": true,
  "app": "Business Management & Accountant Management App",
  "hosting": "Hostinger Production Environment",
  "status": "Production Ready (V1.0)",
  "database": {
    "status": "connected",
    "mode": "hostinger_mysql_authoritative",
    "engine": "Hostinger MySQL Database (127.0.0.1:3306)",
    "mysql_configured": true,
    "mysql_connected": true
  }
}
```
