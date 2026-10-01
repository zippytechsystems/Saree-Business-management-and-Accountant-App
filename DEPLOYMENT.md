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
| `CORS_ORIGIN` | (Backend) Allowed frontend domains for CORS | `https://your-site.netlify.app` or `*` |
| `VITE_API_URL` | (Frontend / Netlify) Deployed Railway backend URL | `https://your-backend.up.railway.app` |

> [!CAUTION]
> **Never commit `.env` or `SUPABASE_SERVICE_ROLE_KEY` to GitHub or public repositories.** Keep it strictly in your host provider's encrypted environment variable settings.

---

## 2. Deployment Options

### Option A: Render (Recommended for Web Services)
1. Push your repository to GitHub.
2. Log into [Render.com](https://render.com) and click **New > Blueprint**.
3. Select this repository. Render will automatically read [`render.yaml`](./render.yaml).
4. In the Environment settings, provide:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
5. Click **Apply Blueprint**. Render will build the Vite bundle and start the service with zero downtime.

---

### Option B: Vercel (Serverless Deployment)
The repository includes pre-configured [`vercel.json`](./vercel.json) and [`api/index.js`](./api/index.js):
1. Import the repository in your [Vercel Dashboard](https://vercel.com).
2. Set Build Command: `npm run build`
3. Set Output Directory: `dist`
4. Add your Environment Variables:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `JWT_SECRET`
   - `CLOUD_BACKUP_PROVIDER=supabase`
5. Click **Deploy**. Vercel will serve your frontend static assets globally on CDN and route `/api/*` to the serverless function.

---

### Option C: Docker / Google Cloud Run / VPS
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
     -e SUPABASE_URL=https://your-project.supabase.co \
     -e SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key \
     --name saree-app saree-business-app:latest
   ```

---

### Option D: Railway (Backend) + Netlify (Frontend)
For decoupled architectures with the Node.js Express API on Railway and the React Vite SPA on Netlify:

1. **Deploy Backend on Railway**:
   - Create a service pointing to this repository (or `backend/` directory).
   - In Railway **Variables**, configure:
     - `PORT=5000`
     - `NODE_ENV=production`
     - `JWT_SECRET=your-secure-jwt-secret`
     - `CLOUD_BACKUP_PROVIDER=supabase`
     - `SUPABASE_URL=https://your-project.supabase.co`
     - `SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key`
     - `CORS_ORIGIN=https://your-site.netlify.app` (or `*`)
   - In Railway **Settings > Networking**, generate a **Public Domain** (e.g., `https://saree-backend-production.up.railway.app`).

2. **Deploy Frontend on Netlify**:
   - Link your GitHub repository in [Netlify](https://app.netlify.com).
   - **Build settings**:
     - Build command: `npm run build`
     - Publish directory: `dist`
   - In **Site configuration > Environment variables**, add:
     - **Key**: `VITE_API_URL`
     - **Value**: `https://<your-railway-backend>.up.railway.app` *(Your Railway public HTTPS URL, without trailing slash)*
   - Trigger a deploy or push to trigger automatic build.

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
