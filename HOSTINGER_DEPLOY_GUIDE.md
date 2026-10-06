# 🚀 Hostinger Production Deployment & MySQL Migration Guide
### Saree Business & Accountant Management App (Version 1.0)

> **MIGRATION STATUS:** Supabase has been completely migrated to **Hostinger MySQL**.
> Your app now runs **100% natively on Hostinger** with zero external cloud dependencies and zero extra monthly bills.

---

## Telugu Quick Summary (ముఖ్యమైన వివరాలు)

1. **Supabase నుండి Hostinger MySQL కి మారడం పూర్తయింది**:
   - `backend/db/hostinger_mysql_dump.sql` లో మీ పాత డేటా మొత్తం (44 యూజర్లు, 28 ప్రొఫైల్స్, 91 వెరైటీలు, 162 స్టాక్ మూమెంట్స్, 26 సేల్స్, 166 ఖర్చులు, 67 లెండర్స్) రెడీగా ఉంది.
   - Hostinger phpMyAdmin లో `hostinger_mysql_dump.sql` ని Import చేస్తే మీ పూర్తి డేటా MySQL లోకి వచ్చేస్తుంది.
2. **Node.js వెర్షన్**:
   - Hostinger hPanel లో **Node.js 22.x** లేదా **Node.js 24.x** ఎంచుకోండి (20.x ఎంచుకోవద్దు).
3. **Environment Variables**:
   - Hostinger hPanel లో `DB_HOST=localhost`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` సెట్ చేయండి.

---

## ⚠️ 3 Critical Rules Before Deploying

1. **Node.js Version:**
   - In Hostinger hPanel, select **Node.js 22.x (latest)** or **Node.js 24.x**.
   - ⚠️ **DO NOT SELECT Node.js 20.x**.
2. **Database Protection (.htaccess):**
   - The included `.htaccess` automatically denies public HTTP access to `/data`, `/backend`, `.env`, `package.json`, and all `.db` / `.sql` files.
   - After deploying, test `https://yourdomain.com/data/app.db` and verify it returns `404 Not Found` or `403 Forbidden`.
3. **Production Secrets:**
   - Set a strong, random `JWT_SECRET` (at least 40 characters) in Hostinger hPanel Environment Variables.
   - Change your default password immediately after first login.

---

## 🗄️ Step 1: Create Hostinger MySQL Database & Import Data

1. Log in to **Hostinger hPanel**.
2. Go to **Databases** ➔ **MySQL Databases**.
3. Create a new database:
   - **Database Name**: e.g., `saree_erp` (Hostinger automatically adds a prefix, e.g., `u123456789_saree_erp`).
   - **Username**: e.g., `saree_user` (e.g., `u123456789_saree_user`).
   - **Password**: Enter a strong password and save it.
4. Click **Enter phpMyAdmin** next to your newly created database.
5. In phpMyAdmin, click the **Import** tab at the top.
6. Choose the file to upload:
   - **Option A (Full Migration with All Existing Data):**
     Choose `backend/db/hostinger_mysql_dump.sql`.
     *(Contains table schema + all 44 users, 28 profiles, 91 varieties, 162 stock entries, 26 sales, 166 expenses, 67 lenders).*
   - **Option B (Clean Empty Tables):**
     Choose `backend/db/schema_mysql.sql`.
7. Click **Import** (or **Go**) at the bottom.
   - ✅ *All tables (`users`, `business_profiles`, `daily_sales`, `expenses`, `product_varieties`, `stock_entries`, `lenders`, `sessions`, `cloud_sync_log`) will be created and populated in seconds.*

---

## 📦 Step 2: Build & Package Locally

In your local project terminal:
```bash
# 1. Build the production React frontend
npm run build

# 2. Package everything for Hostinger
node scripts/prepare_deploy.js
```
This generates:
- Staging directory: `staging_deploy/`
- Ready-to-upload zip file: `hostinger_fullstack_deploy.zip`

---

## 🚀 Step 3: Deploy on Hostinger hPanel

1. In **Hostinger hPanel**, go to **Websites** ➔ **Manage** on your domain.
2. Under **Advanced**, click **Node.js**:
   - **Node.js version**: `22.x` or `24.x`
   - **Application Mode**: `Production`
   - **Application Root**: `public_html`
   - **Application Startup File**: `backend/server.js`
3. Open **File Manager** ➔ Open `public_html`.
4. Upload all files from `staging_deploy/` (or upload and extract `hostinger_fullstack_deploy.zip`).
5. In the **Node.js** section in hPanel, scroll to **Environment Variables** and add:
   ```env
   NODE_ENV=production
   PORT=5000
   DB_HOST=localhost
   DB_PORT=3306
   DB_NAME=u123456789_saree_erp
   DB_USER=u123456789_saree_user
   DB_PASSWORD=YourStrongDatabasePasswordHere
   JWT_SECRET=GenerateRandomLongSecretKeyAtLeast40CharactersHere
   CORS_ORIGIN=https://yourdomain.com
   ```
6. Click **npm install** (or `npm install --omit=dev`).
7. Click **Restart Application**.
8. In hPanel ➔ **Security** ➔ **SSL**, ensure SSL is active and **Force HTTPS** is enabled.

---

## ✅ Step 4: Post-Deployment Verification

1. Open `https://yourdomain.com/api/health`:
   - It should return:
     ```json
     {
       "success": true,
       "hosting": "Hostinger Production Environment",
       "database": {
         "mode": "hostinger_mysql",
         "engine": "Hostinger MySQL (InnoDB)",
         "mysql_configured": true,
         "mysql_connected": true,
         "mysql_database": "u123456789_saree_erp"
       }
     }
     ```
2. Open `https://yourdomain.com/data/app.db`:
   - Must return **404 Not Found** or **403 Forbidden** (ensuring files cannot be downloaded).
3. Open `https://yourdomain.com/backend/db/hostinger_mysql_dump.sql`:
   - Must return **404 Not Found** or **403 Forbidden**.
4. Log in to the application, test:
   - Daily Sales entry
   - Expense entry
   - Stock movement
   - Lender transaction
   - Monthly Calculations & Report generation

---

## 🔄 Dual-Engine Architecture (MySQL + SQLite Fallback)

- **Primary Engine:** When `DB_HOST`, `DB_NAME`, and `DB_USER` are set in Hostinger, the app operates directly on **Hostinger MySQL (InnoDB)** for high concurrency and multi-user performance.
- **Offline / Local Fallback:** If MySQL credentials are not provided (e.g., local offline development), the application automatically operates on **Local SQLite (WAL Mode)** without failing or crashing.
