# Saree Business Management & Accountant Management App

Production-ready multi-device Business Management and Accountant ERP system built with React, Node.js Express, and Hostinger MySQL (with resilient offline-first SQLite fallback).

---

## 🚀 Deployment

This application is designed for native deployment on **Hostinger (Node.js Web Hosting / VPS)**:

- **Hostinger MySQL Database**: Authoritative source of truth for all users, sales, expenses, stock, lenders, and accountant calculations.
- **Node.js Express Server**: High-performance backend running on `server.js` (`backend/server.js`).
- **Compiled React Frontend**: Pre-built in `./dist` and served statically by the Express server.

See [`HOSTINGER_DEPLOY_GUIDE.md`](./HOSTINGER_DEPLOY_GUIDE.md) and [`DEPLOYMENT.md`](./DEPLOYMENT.md) for full step-by-step instructions.

---

## 🛠️ Environment Configuration

Copy `.env.example` to `.env` and fill in your Hostinger MySQL database credentials:

```ini
PORT=5000
NODE_ENV=production
JWT_SECRET=your-random-secure-jwt-secret-key-2026
CORS_ORIGIN=*

# Hostinger Internal MySQL Connection (127.0.0.1:3306 on server)
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=u123456789_your_db_user
DB_PASSWORD=your_strong_mysql_password
DB_NAME=u123456789_your_database_name
```

---

## 💻 Local Development

1. **Clone repository**:
   ```bash
   git clone https://github.com/zippytechsystems/Saree-Business-management-and-Accountant-App.git
   cd Saree-Business-management-and-Accountant-App
   ```
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Build frontend**:
   ```bash
   npm run build
   ```
4. **Start the application**:
   ```bash
   npm start
   ```
   Or for live development:
   ```bash
   npm run dev
   ```

---

## 🩺 System Health Check

```bash
curl http://localhost:5000/api/health
```
