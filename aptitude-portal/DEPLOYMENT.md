# Production Deployment Guide: College Placement Aptitude Portal

This guide provides step-by-step instructions for deploying the **College Placement Aptitude Test Portal** to the cloud and obtaining a live public URL.

---

## 1. System Architecture & Technology Stack

The project consists of three core components designed to operate either as decoupled cloud microservices or within a single containerized host:

```
[ Frontend Client (Vercel / Netlify / CDN) ]
                   │
                   │ HTTPS REST API requests (Bearer Token + JSON)
                   ▼
  [ Backend API (Render / Railway / Node.js) ]
                   │
                   │ Prisma ORM (TLS / SSL Connection)
                   ▼
 [ PostgreSQL Database (Neon / Supabase / Cloud SQL) ]
```

| Component | Technology Stack | Recommended Host | Free Tier Available |
| :--- | :--- | :--- | :--- |
| **Frontend** | React 18, TypeScript, Vite, TailwindCSS, React Router 6 | [Vercel](https://vercel.com) or [Netlify](https://netlify.com) | Yes (Fast Global CDN) |
| **Backend API** | Node.js, Express, TypeScript, Prisma ORM, JWT, bcryptjs | [Render](https://render.com) or [Railway](https://railway.app) | Yes (Free Web Service) |
| **Database** | PostgreSQL 15/16 (13 relational models, 2,100 questions) | [Neon](https://neon.tech) or [Supabase](https://supabase.com) | Yes (Serverless Postgres) |

---

## 2. Pre-Deployment Step: Initialize Git & Push to GitHub

Ensure that your repository has `.gitignore` files in place so that local `.env` files and `.pgdata` are **never** committed.

### Initialize Git Repository

Open your terminal in `aptitude-portal`:

```bash
cd "c:\Users\devuser\coding app\aptitude-portal"
git init
git add .
git commit -m "feat: production-ready aptitude portal configuration"
```

### Push to GitHub

1. Create a **Private** or **Public** repository on [GitHub](https://github.com/new).
2. Connect and push your local repository:

```bash
git remote add origin https://github.com/<YOUR_GITHUB_USERNAME>/<YOUR_REPOSITORY_NAME>.git
git branch -M main
git push -u origin main
```

---

## 3. Step-by-Step Cloud Deployment (Recommended Approach)

### Step A: Provision Cloud PostgreSQL Database (using Neon or Supabase)

1. **Sign up at [Neon.tech](https://neon.tech) or [Supabase.com](https://supabase.com)** (both offer instant free PostgreSQL databases).
2. Create a new project named `aptitude-portal`.
3. In the project dashboard, locate the **Connection Details** / **Connection String** (URI format).
4. Copy the connection string. It will look like this:
   ```text
   postgresql://username:password@ep-cool-frost-123456.us-east-2.aws.neon.tech/aptitude_portal?sslmode=require
   ```
   *(Keep this connection string ready for Step B & C).*

---

### Step B: Deploy the Backend API (using Render)

1. Sign up / log in to [Render.com](https://render.com).
2. Click **New +** and select **Web Service**.
3. Connect your GitHub repository.
4. Configure the service settings:
   - **Name**: `aptitude-portal-api` (or your preferred name)
   - **Region**: Choose the region closest to your database (e.g., Oregon, Frankfurt, Singapore)
   - **Root Directory**: `backend` *(Important!)*
   - **Environment**: `Node`
   - **Build Command**:
     ```bash
     npm install && npm run build
     ```
   - **Start Command**:
     ```bash
     npm start
     ```
   - **Plan**: `Free`
5. Expand the **Advanced / Environment Variables** section and add:

   | Variable Key | Example Value | Description |
   | :--- | :--- | :--- |
   | `NODE_ENV` | `production` | Enables production security & optimizations |
   | `PORT` | `5000` | Server listening port (Render sets this dynamically) |
   | `DATABASE_URL` | `postgresql://user:pass@ep-host.region.neon.tech/dbname?sslmode=require` | Connection string from Step A |
   | `JWT_SECRET` | *(64-char random string)* | E.g., `8f4b23cd76e1a90d45f32b8c91a0e43d7890abcdef1234567890abcdef12` |
   | `JWT_REFRESH_SECRET` | *(64-char random string)* | E.g., `45f32b8c91a0e43d7890abcdef1234567890abcdef128f4b23cd76e1a90d` |
   | `FRONTEND_URL` | `http://localhost:5173` *(Update with Vercel URL in Step D)* | Allowed CORS origin |

6. Click **Deploy Web Service**.
7. Once deployed, Render will provide a live URL such as:
   `https://aptitude-portal-api.onrender.com`

---

### Step C: Initialize & Seed Database Schema and Questions

Your database needs the schema tables, default administrative accounts, 35 topics, and 2,100 questions. You have two easy ways to run this:

#### Method 1: Using the Render Web Shell (Direct on Server)
1. In your Render Dashboard for `aptitude-portal-api`, click the **Shell** tab.
2. Run the all-in-one setup command:
   ```bash
   npm run db:setup
   ```
3. This command will:
   - Synchronize tables (`prisma db push`)
   - Seed topics & admin account `ADMIN001` (`prisma/seed.ts`)
   - Seed all 105 tests and 2,100 questions (`scripts/seed-questions.ts`)

#### Method 2: Locally targeting Cloud Database
From your local development machine:
```bash
cd "aptitude-portal/backend"
# Temporarily set your cloud connection string in terminal
$env:DATABASE_URL="your-cloud-database-url-with-sslmode=require"
npm run db:setup
```

#### Verify Backend Health
Open `https://<YOUR_BACKEND_URL>/api/health` in your browser. You should see:
```json
{
  "status": "ok",
  "success": true,
  "database": "connected",
  "portal": "College Placement Aptitude Test Portal",
  "version": "5.0",
  "timestamp": "..."
}
```

---

### Step D: Deploy the Frontend (using Vercel)

1. Sign up / log in to [Vercel.com](https://vercel.com).
2. Click **Add New...** -> **Project**.
3. Import your GitHub repository.
4. Configure the project:
   - **Framework Preset**: `Vite`
   - **Root Directory**: Click "Edit" and choose `frontend` *(Crucial!)*
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Under **Environment Variables**, add:
   - **Name**: `VITE_API_URL`
   - **Value**: `https://<YOUR_RENDER_BACKEND_URL>/api`
   *(Example: `https://aptitude-portal-api.onrender.com/api` — be sure to include the `/api` path suffix!)*
6. Click **Deploy**.
7. Within 1–2 minutes, Vercel will generate your live production URL:
   `https://<YOUR_PROJECT_NAME>.vercel.app`

---

### Step E: Final Connection (Bind Frontend URL to Backend CORS)

1. Copy your live Vercel URL (e.g. `https://aptitude-portal.vercel.app`).
2. Go back to your [Render Dashboard](https://dashboard.render.com).
3. Select `aptitude-portal-api` -> **Environment**.
4. Update the `FRONTEND_URL` variable to your Vercel URL:
   ```text
   FRONTEND_URL=https://aptitude-portal.vercel.app
   ```
5. Click **Save Changes** (Render will automatically re-deploy with the new CORS origin).

---

## 4. Default Credentials & Access Accounts

Once seeded, you can immediately log in to the portal using the following accounts or use the self-registration page:

### Placement Staff / Administrator Account
- **Portal URL**: `https://<YOUR_FRONTEND_URL>/login`
- **Role**: Staff
- **Username / Staff ID**: `ADMIN001`
- **Password**: `PlacementCell2026!`
- **Access**: Staff Dashboard, Student Management, Question Bank Editor, System Analytics, Audit Logs, Settings.

### Student Self-Registration
- Any student can register directly on the portal via the **Register as Student** link on the login page using their Roll Number, Name, Department, Year, Section, and Password.

---

## 5. Alternative: Containerized Deployment (Docker Compose)

If you prefer deploying the full stack onto an Ubuntu/Debian VPS (such as a DigitalOcean Droplet, AWS EC2, or GCP Compute Engine):

### Requirements
- Docker and Docker Compose installed on the host.

### Commands
1. Clone the repository onto your server:
   ```bash
   git clone <YOUR_REPO_URL>
   cd aptitude-portal
   ```
2. Create your `.env` file in the root directory:
   ```bash
   DB_PASSWORD=your_super_strong_postgres_password
   JWT_SECRET=your_super_strong_jwt_secret_min_32_chars
   JWT_REFRESH_SECRET=your_super_strong_jwt_refresh_secret
   FRONTEND_URL=https://yourdomain.com
   VITE_API_URL=https://yourdomain.com/api
   ```
3. Start the entire containerized stack:
   ```bash
   docker compose up -d --build
   ```
4. Run the database seed inside the backend container:
   ```bash
   docker compose exec backend npm run db:setup
   ```
5. Access your website at `http://<SERVER_IP>:3000` (or configure Nginx Reverse Proxy with Let's Encrypt SSL for port 80/443).

---

## 6. Pre-Flight Verification Checklist

Before announcing your website to students and staff, verify each of the following:

- [ ] **Backend Health Check**: Navigate to `https://<BACKEND_URL>/api/health` and verify `"database": "connected"`.
- [ ] **Staff Login**: Log in with `ADMIN001` / `PlacementCell2026!` and confirm redirect to `/staff/dashboard`.
- [ ] **Question Bank Verification**: Navigate to Question Bank in Staff Dashboard and confirm all 35 topics and 2,100 questions are listed.
- [ ] **Student Registration & Login**: Register a test student and verify login redirect to `/student/dashboard`.
- [ ] **Test Engine Verification**: Start a practice test, select options, and submit to verify score calculation, accuracy analytics, and database persistence.
- [ ] **SPA Route Refresh Test**: Navigate to `/student/dashboard` or `/staff/dashboard` and press browser refresh (`F5`) to verify that `vercel.json` / `_redirects` correctly serves the page without 404 errors.
- [ ] **CORS Verification**: Open DevTools (`F12`) -> Network tab and verify no CORS blocks appear on API calls.

---

## 7. Troubleshooting Common Deployment Issues

| Issue | Cause | Resolution |
| :--- | :--- | :--- |
| **CORS policy error in browser console** | `FRONTEND_URL` on backend does not match the frontend URL. | Update `FRONTEND_URL` in the backend environment variables to match your exact Vercel URL (e.g., `https://aptitude-portal.vercel.app` without trailing slash). |
| **Prisma `P1001: Can't reach database server`** | Database URL is incorrect or network restrictions apply. | Check that your Neon/Supabase project is active and that `?sslmode=require` is appended to the connection string. |
| **Page refresh displays 404 Not Found on Vercel** | SPA rewrites missing. | Ensure `vercel.json` is present in the `frontend` folder with rewrite rule to `/index.html`. |
| **Render Web Service sleep delay (Free tier)** | Render puts free web services to sleep after 15 min of inactivity. | The first request after a period of inactivity may take ~30–50 seconds to wake up. For zero-sleep hosting, upgrade to a Starter instance or use a free uptime monitor (e.g., UptimeRobot) pinging `/api/health` every 10 minutes. |
