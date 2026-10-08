# 🚀 Hostinger Deployment & MySQL Database Guide
### Business Management & Accountant Management App

This application connects directly to a **Hostinger MySQL Database** as the authoritative source of truth, with automatic fallback and local caching.

---

## 🗄️ Step 1: Create Hostinger MySQL Database

1. Log into your **Hostinger hPanel**.
2. Navigate to **Databases** ➔ **MySQL Databases**.
3. Under **Create a New MySQL Database and Database User**:
   - **MySQL Database Name**: e.g., `u123456789_saree_db`
   - **MySQL Username**: e.g., `u123456789_admin`
   - **Password**: Generate or enter a strong password (keep this safe)
4. Click **Create**.
5. Note the full database name and username (Hostinger prefixes them with your account ID, e.g., `u123456789_`).

---

## 📋 Step 2: Initialize Database Schema (phpMyAdmin)

You can import the schema via phpMyAdmin, or let the Node.js backend automatically initialize the tables on first startup.

### Option A: Via phpMyAdmin (Recommended)
1. In hPanel ➔ **Databases** ➔ click **Enter phpMyAdmin** next to your database.
2. Click on the **Import** tab at the top.
3. Choose the file: [`backend/db/mysql_schema.sql`](./backend/db/mysql_schema.sql).
4. Click **Go** (or **Import**) at the bottom.
5. All 10 tables will be created:
   - `users`
   - `business_profiles`
   - `sessions`
   - `product_varieties`
   - `stock_entries`
   - `daily_sales`
   - `expenses`
   - `lenders`
   - `lender_repayments`
   - `cloud_backup_meta`

### Option B: Automatic Startup Initialization
When `DB_HOST`, `DB_USER`, `DB_PASSWORD`, and `DB_NAME` are configured in your `.env`, the backend server automatically runs `initMySQLSchema()` during startup (`server.js`).

---

## ⚙️ Step 3: Configure Environment Variables

In your Hostinger Node.js application settings (or your server `.env` file), configure the following environment variables:

```ini
PORT=5000
NODE_ENV=production
JWT_SECRET=your-random-secure-jwt-secret-key-2026
CORS_ORIGIN=*

# Hostinger Internal MySQL Connection (Always connects via 127.0.0.1 on the server)
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=u123456789_your_user
DB_PASSWORD=your_strong_password
DB_NAME=u123456789_your_db
```

> [!IMPORTANT]
> - Always use `DB_HOST=127.0.0.1` (or `localhost`) on Hostinger so the Node.js backend connects directly via localhost socket/port.
> - Hostinger blocks remote external MySQL connections by default, but local connections (`127.0.0.1:3306`) from Node.js running on the same server are fully enabled and fast.
> - Never expose your MySQL credentials to frontend browser code.

---

## 📦 Step 4: Deploying on Hostinger

### Method 1: Hostinger hPanel "Node.js" Manager
1. In **hPanel** ➔ **Websites** ➔ **Manage** ➔ **Node.js**:
   - **Node.js Version**: Select `20.x` or `22.x` (LTS recommended)
   - **Application Mode**: `Production`
   - **Application Root**: `public_html` (or your chosen directory)
   - **Application Startup File**: `backend/server.js`
2. Upload the project files to your application directory.
3. Build the frontend:
   ```bash
   npm run build
   ```
4. Install production dependencies:
   ```bash
   npm install --omit=dev
   ```
5. Click **Restart Application** in hPanel.

### Method 2: Hostinger VPS
If you are hosting on a Hostinger VPS with Ubuntu/Debian:
1. Clone or copy files to `/var/www/saree-app`:
   ```bash
   cd /var/www/saree-app
   npm install
   npm run build
   ```
2. Start the application with PM2:
   ```bash
   pm2 start ecosystem.config.cjs
   pm2 save
   pm2 startup
   ```

---

## 🩺 Step 5: Verify Connectivity

To verify that your Hostinger MySQL database is connected:
1. Make a GET request to:
   ```
   https://yourdomain.com/api/health
   ```
2. The response will confirm:
   ```json
   {
     "success": true,
     "database": {
       "mode": "hostinger_mysql_authoritative",
       "engine": "Hostinger MySQL Database (127.0.0.1:3306)",
       "mysql_configured": true,
       "mysql_connected": true,
       "mysql_info": {
         "status": "connected",
         "database": "u123456789_your_db",
         "tables": ["users", "business_profiles", "sessions", "product_varieties", "stock_entries", "daily_sales", "expenses", "lenders", "lender_repayments", "cloud_backup_meta"]
       }
     }
   }
   ```
