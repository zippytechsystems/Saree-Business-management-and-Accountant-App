# Saree Business Management & Accountant Management App

Production-ready multi-device Business Management and Accountant ERP system built with React, Node.js Express, and Supabase PostgreSQL (with resilient offline-first SQLite fallback).

---

## 🚀 Live Deployment Architecture

This project can be deployed seamlessly in two ways:

1. **Unified Fullstack (Recommended)**: Deploy Express backend on **Render** or **Railway**. The Express server automatically builds and serves the React frontend (`dist/`) and all `/api/*` endpoints from a single URL with zero CORS issues.
2. **Authoritative Database**: Hosted on **Supabase** (PostgreSQL) using the production schema located in [`backend/db/supabase_schema.sql`](file:///backend/db/supabase_schema.sql).

---

## 🔗 Essential Deployment Links

| Service | Purpose | Direct Link |
| :--- | :--- | :--- |
| **GitHub Repository** | Source code & CI/CD trigger | [Saree-Business-management-and-Accountant-App](https://github.com/zippytechsystems/Saree-Business-management-and-Accountant-App) |
| **Supabase Dashboard** | Authoritative Cloud Database | [https://supabase.com/dashboard](https://supabase.com/dashboard) |
| **Render Dashboard** | Unified Web Service Hosting | [https://dashboard.render.com](https://dashboard.render.com) |
| **Railway Dashboard** | Alternative Cloud Container Hosting | [https://railway.com/dashboard](https://railway.com/dashboard) |
| **Vercel Dashboard** | Optional Standalone Frontend Hosting | [https://vercel.com/dashboard](https://vercel.com/dashboard) |

---

## 🛠️ Step-by-Step Deployment Guide

### Step 1: Set Up Supabase Cloud Database
1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard) and log in.
2. Click **New Project** and name it (e.g. `saree-business-erp`).
3. Set a strong database password and choose your nearest region.
4. Once the project is created:
   - Navigate to **SQL Editor** on the left menu.
   - Open [`backend/db/supabase_schema.sql`](file:///backend/db/supabase_schema.sql) from this repository.
   - Copy the entire SQL script and paste it into the Supabase SQL Editor.
   - Click **Run** to create all tables, indexes, and constraints.
5. Retrieve your API Credentials:
   - Go to **Project Settings** -> **API**.
   - Copy the **Project URL** (e.g., `https://xxxx.supabase.co`).
   - Copy the **`service_role` secret key** (Note: Keep this key secret, do not expose to browser).

---

### Step 2: Deploy Fullstack App to Render (Free / Starter)
1. Go to [https://dashboard.render.com](https://dashboard.render.com) and sign in.
2. Click **New +** -> **Web Service**.
3. Connect your GitHub repository: `zippytechsystems/Saree-Business-management-and-Accountant-App`.
4. Configure the service:
   - **Name**: `saree-business-erp`
   - **Runtime**: `Node`
   - **Branch**: `main`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
5. Under **Environment Variables**, add:
   ```env
   NODE_ENV=production
   PORT=10000
   JWT_SECRET=your-secure-random-jwt-key
   CLOUD_BACKUP_PROVIDER=supabase
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
   ```
6. Click **Deploy Web Service**.
7. Once deployed, Render will provide you with a live HTTPS URL (e.g., `https://saree-business-erp.onrender.com`).

---

### Step 3: Run SQLite to Supabase Migration (Optional for Existing Local Data)
If you have existing sales, stock, and expense records stored locally in SQLite that you want to transfer to Supabase:
```bash
node backend/scripts/migrate_sqlite_to_supabase.js
```

---

## 💻 Local Development

1. Clone repository:
   ```bash
   git clone https://github.com/zippytechsystems/Saree-Business-management-and-Accountant-App.git
   cd Saree-Business-management-and-Accountant-App
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment:
   ```bash
   cp .env.example .env
   # Edit .env with your local or cloud database credentials
   ```
4. Start development mode:
   ```bash
   npm run dev
   ```
   - Frontend runs on: `http://localhost:3000`
   - Backend API runs on: `http://localhost:5000`
