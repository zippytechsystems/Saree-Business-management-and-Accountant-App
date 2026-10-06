# Production Deployment & Hosting Guide
### Business Management & Accountant Management App (Version 1.0)

This application is engineered with a **Cloud-Authoritative Architecture**:
- **Authoritative Database**: Supabase PostgreSQL (handles real-time multi-device synchronization, RLS, and global persistence).
- **Backend API**: Node.js & Express (provides secure authenticated endpoints, business calculation logic, and offline sync orchestration).
- **Frontend SPA**: React 19 + Vite (responsive interface optimized for mobile and desktop accounting).
- **Offline Cache**: Local SQLite (guarantees local transactions never fail even during cloud outages).

---

## 1. Required Production Environment Variables

Configure these environment variables in your deployment dashboard:

| Variable | Description | Example / Value |
| :--- | :--- | :--- |
| `NODE_ENV` | Application environment mode | `production` |
| `PORT` | HTTP Server port | `5000` (or assigned by host) |
| `JWT_SECRET` | Secret key for session authentication tokens | Strong random string (e.g. 64 chars) |
| `CLOUD_BACKUP_PROVIDER` | Active cloud provider | `supabase` |
| `SUPABASE_URL` | Supabase Project URL | `https://your-project.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase secret service-role API key | `eyJhbGciOi...` (bypasses RLS for backend) |
| `CORS_ORIGIN` | (Backend) Allowed frontend domains for CORS | `https://yourdomain.com` or `*` |
| `VITE_API_URL` | (Frontend) Optional custom backend API URL (Leave blank for Hostinger same-origin) | `https://yourdomain.com` |

> [!CAUTION]
> **Never commit `.env` or `SUPABASE_SERVICE_ROLE_KEY` to GitHub or public repositories.** Keep it strictly in your host provider's encrypted environment variable settings.

---

## 2. Deployment Options

### Option A: Hostinger (100% Native Full-Stack - Recommended)
See the full guide in [`HOSTINGER_DEPLOY_GUIDE.md`](./HOSTINGER_DEPLOY_GUIDE.md):
1. In Hostinger hPanel, create a Node.js Application pointing startup file to `backend/server.js`.
2. Upload and extract [`hostinger_fullstack_deploy.zip`](./hostinger_fullstack_deploy.zip) directly into `public_html`.
3. Run `npm install --omit=dev` and click **Restart Application**.
4. Both the Express backend API and compiled React SPA are served seamlessly on your custom domain with `.htaccess` rewrite rules.

---

### Option B: Render (Web Services)
1. Push your repository to GitHub.
2. Log into [Render.com](https://render.com) and click **New > Web Service**.
3. Set build command `npm run build` and start command `npm start`.

---

### Option C: Docker / VPS
A multi-stage production [`Dockerfile`](./Dockerfile) and [`.dockerignore`](./.dockerignore) are included:

1. **Build container image**:
   ```bash
   docker build -t saree-business-app:latest .
   ```

2. **Run container**:
   ```bash
   docker run -d \
     -p 5000:5000 \
     -e NODE_ENV=production \
     -e JWT_SECRET=your-secure-secret \
     --name saree-app saree-business-app:latest
   ```

---

## 3. Database Migration & Parity Verification

Before opening the app to live store traffic, ensure your database schema and historical records are aligned:

1. **Apply Supabase Schema**:
   Copy and run the contents of [`backend/db/supabase_schema.sql`](./backend/db/supabase_schema.sql) in your **Supabase Dashboard > SQL Editor**.

2. **Run Data Migration & Parity Check**:
   ```bash
   npm run migrate:supabase
   ```
   This verifies 100% financial and inventory parity across all owner accounts.

---

## 4. Production Health Verification

Once deployed, verify health and connectivity:
```bash
curl https://your-deployed-domain.com/api/health
```

Expected JSON response:
```json
{
  "success": true,
  "app": "Business Management & Accountant Management App",
  "status": "Production Ready (V1.0)",
  "database": {
    "status": "connected",
    "mode": "authoritative_supabase",
    "supabase_configured": true,
    "supabase_connected": true
  }
}
```
