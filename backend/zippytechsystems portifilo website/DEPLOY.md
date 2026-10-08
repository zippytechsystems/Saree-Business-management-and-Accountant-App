# 🚀 Hostinger Self-Hosted Deployment Guide (PHP 8 + MySQL)
### ZippyTechSystems Pvt. Ltd. — Production Architecture
**Domain:** `https://zippysoftwares.in`  
**Brand Name:** `ZippyTechSystems` (ZippyTechSystems Pvt. Ltd.)

---

## 🏗️ Architecture Overview

- **Frontend:** Vite + React Single Page Application (SPA), zero third-party backend lock-in.
- **Backend:** Native PHP 8 REST API in `public_html/api/`, using PDO prepared statements, security headers, rate limiting, and HttpOnly session cookies.
- **Database:** MySQL 8 on Hostinger (`database/schema.sql`).
- **File Storage:** Local secure storage in `public_html/uploads/` with script execution blocked via `.htaccess`.
- **Web Server:** Hostinger LiteSpeed / Apache with `.htaccess` enforcing HTTPS, 301 redirects from legacy domains, API routing, Gzip, and SPA client routing.

---

## 📋 Step-by-Step Deployment Instructions

### 1. Create MySQL Database on Hostinger
1. Log in to your Hostinger hPanel (`https://hpanel.hostinger.com`).
2. Go to **Databases** > **Management** > **Create New MySQL Database**.
3. Note down:
   - **Database Name** (e.g., `u914601002_zippytech`)
   - **Database Username** (e.g., `u914601002_zippyuser`)
   - **Password** (e.g., strong password created by you)
   - **MySQL Host**: `localhost` (default for Hostinger)

### 2. Import Database Schema
1. In hPanel, click **Enter phpMyAdmin** next to your newly created database.
2. Click the **Import** tab at the top.
3. Choose the file `database/schema.sql` from this repository.
4. Click **Go** (Import).
5. All 25 production tables and default seed data (settings, services, packages, projects, testimonials, faqs, admin user) will be created instantly.

### 3. Build the Frontend
In your local project terminal:
```bash
npm run build
```
This generates the optimized production build in the `dist/` directory.

### 4. Upload Files to Hostinger `public_html/`
In Hostinger **File Manager** (or via FTP):
1. Navigate to your website's **`public_html/`** folder.
2. Upload the contents of `dist/` directly into `public_html/`:
   - `index.html`
   - `.htaccess`
   - `assets/` folder
   - `robots.txt`, `sitemap.xml`, etc.
3. Upload the **`api/`** directory into `public_html/api/`:
   - `api/bootstrap.php`
   - `api/index.php`
   - `api/auth.php`
   - `api/chat.php`
   - `api/voice.php`
   - `api/upload.php`
   - `api/whatsapp/`
   - `api/config.example.php`
4. In `public_html/api/`, make a copy of `config.example.php` named **`config.php`**.
5. Edit `config.php` and enter your Hostinger MySQL database name, username, and password:
   ```php
   'db' => [
       'host'     => 'localhost',
       'port'     => 3306,
       'dbname'   => 'u914601002_zippytech',
       'username' => 'u914601002_zippyuser',
       'password' => 'YOUR_STRONG_DATABASE_PASSWORD',
       'charset'  => 'utf8mb4',
   ],
   ```
6. Ensure a folder named **`uploads`** exists inside `public_html/` (`public_html/uploads/`) with permission `755`.

---

## 🔐 Default Admin Login
Navigate to: `https://zippysoftwares.in/admin`
- **Username / Email:** `lingaswamymaddeboina` (or `lingaswamymaddeboina@gmail.com`)
- **Password:** `linga@123`

You can change your password anytime directly inside the Admin Panel under Settings!

---

## 🔄 Importing Existing Data from Supabase (Optional)
If you want to migrate existing live data from your old Supabase project:
1. In your Hostinger terminal or SSH (or local machine pointing to the MySQL DB):
   ```bash
   php database/import_from_supabase.php
   ```
2. Or open `https://zippysoftwares.in/database/import_from_supabase.php` in your browser after logging in as admin.

---

## 🌐 SSL & Domain Verification
1. In Hostinger hPanel > **SSL**, ensure **Lifetime Free SSL** is active for `zippysoftwares.in`.
2. Visit `https://zippysoftwares.in` to verify that everything works seamlessly!
