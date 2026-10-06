# 🚀 Hostinger 100% Native Deployment Guide
### Saree Business & Accountant Management App

This project has been completely re-architected to run **100% natively on Hostinger** with **ZERO third-party cloud dependencies (No Supabase, No Firebase, No Railway required)**. All data, authentication, inventory, and calculations are stored and processed directly on your Hostinger server using high-performance SQLite in WAL (Write-Ahead Logging) mode.

---

## 📦 What's Included for Hostinger:
1. **`backend/`**: Express API server and business logic.
2. **`dist/`**: Production-compiled React 19 frontend with Hostinger routing.
3. **`data/app.db`**: High-performance persistent SQLite database (100% persistent on Hostinger).
4. **`ecosystem.config.cjs`**: PM2 process manager config for auto-restarting the app on Hostinger.
5. **`.htaccess`**: Apache / LiteSpeed routing rules to prevent 404 errors on page reload.
6. **`.env`**: Production environment configuration set to Hostinger Native mode.

---

## 🛠️ Step-by-Step Deployment on Hostinger

### Method 1: Using Hostinger hPanel "Node.js" Manager (Recommended)
1. Log into your **Hostinger hPanel**.
2. Go to **Websites** ➔ Click **Manage** on your domain.
3. Under the **Advanced** or **Hosting** section, click on **Node.js**.
4. Click **Create Application**:
   - **Node.js Version**: Select `20.x` or `22.x` (LTS recommended).
   - **Application Mode**: `Production`
   - **Application Root**: `public_html` (or your subdomain folder).
   - **Application Startup File**: `backend/server.js`
5. Open **File Manager** ➔ Go to `public_html`.
6. Upload the [`hostinger_fullstack_deploy.zip`](./hostinger_fullstack_deploy.zip) file into `public_html` and **Extract** it.
7. Back in the **Node.js** manager in hPanel, click **npm install** (or run `npm install --omit=dev`).
8. Click **Restart Application**.
9. Visit your domain (e.g. `https://yourdomain.com`). Your app is LIVE with zero errors!

---

### Method 2: Hostinger VPS (Virtual Private Server)
If you are using Hostinger VPS:
1. Upload the files or clone the repository to `/var/www/saree-app`.
2. Run:
   ```bash
   npm install --omit=dev
   pm2 start ecosystem.config.cjs
   pm2 save
   pm2 startup
   ```
3. Your app will run continuously with automatic restarts on server reboots.

---

## 🔐 Default Login Credentials
- **Username**: `owner`
- **Password**: `Owner@123`
*(You can also sign up new business owner accounts directly from the login page)*

---

## 💾 Backing Up Your Data on Hostinger
- You can download your complete database file (`app.db`) at any time by going to:
  **Settings** ➔ Click the blue **Download Backup (.db)** button!
