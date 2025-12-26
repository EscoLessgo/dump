# Quick Start Guide - PasteBin Pro

## 🎯 You're Almost Ready!

Your PasteBin Pro backend has been successfully set up. Follow these steps to get it running.

## Option 1: Deploy to Railway (Recommended)

### Step-by-Step Railway Deployment:

1. **Create a GitHub Repository** (if you haven't already)
   ```bash
   git init
   git add .
   git commit -m "Initial commit - PasteBin Pro with backend"
   git remote add origin YOUR_GITHUB_REPO_URL
   git push -u origin main
   ```

2. **Go to Railway**
   - Visit https://railway.app
   - Sign in with GitHub
   - Click "New Project"

3. **Add PostgreSQL Database**
   - Click "+ New"
   - Select "Database"
   - Choose "PostgreSQL"
   - Railway will automatically provide `DATABASE_URL`

4. **Deploy Your App**
   - Click "+ New"  
   - Select "GitHub Repo"
   - Choose your `pastebin-dual` repository
   - Railway will auto-detect and deploy!

5. **Set Environment Variables** (in Railway dashboard)
   - `NODE_ENV` = `production`
   - That's it! `DATABASE_URL` is auto-set by Railway

6. **Generate Domain**
   - Go to Settings > Domains
   - Click "Generate Domain"
   - Your app will be at: `https://your-app.railway.app`

7. **Access Your App**
   - Admin: `https://your-app.railway.app/admin`
   - Public: `https://your-app.railway.app/public`

**Cost**: ~$10/month for starter usage

---

## Option 2: Run Locally

### Prerequisites:
- Node.js 18+ installed
- PostgreSQL installed and running

### Steps:

1. **Install PostgreSQL** (if not installed)
   - Windows: https://www.postgresql.org/download/windows/
   - macOS: `brew install postgresql`
   - Linux: `sudo apt-get install postgresql`

2. **Create Database**
   ```bash
   # Start PostgreSQL service (if not running)
   # Windows: Already started if installed with installer
   # macOS: brew services start postgresql
   # Linux: sudo service postgresql start

   # Create database (use psql or pgAdmin)
   createdb pastebin
   ```

3. **Create .env File**
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

4. **Edit .env File**
   Open `.env` and update `DATABASE_URL`:
   ```env
   DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/pastebin
   ```
   Replace `YOUR_PASSWORD` with your PostgreSQL password.

5. **Run the Server**
   ```bash
   npm start
   ```

   The migrations will run automatically!

6. **Open in Browser**
   - Admin: http://localhost:3000/admin
   - Public: http://localhost:3000/public
   - API: http://localhost:3000/api/health

---

## 🧪 Testing It Out

### Create a Test Paste:
1. Go to http://localhost:3000/admin (or your Railway URL/admin)
2. Fill in:
   - Title: "Test Paste"
   - Language: "JavaScript"
   - Content: `console.log("Hello World!");`
3. Click "Create Paste"
4. Copy the generated URL

### View the Paste:
1. Open the generated URL in a new browser tab
2. You should see your paste with syntax highlighting
3. The view will be tracked with geolocation!

### Check Analytics:
1. Go back to admin interface
2. Click "Analytics" button on your paste
3. See detailed visitor information!

---

## 📁 What Changed from the Old Version?

### Before (localStorage version):
- ❌ No real database (data only in browser)
- ❌ Not shareable between users
- ❌ Limited to 5MB storage
- ❌ Lost on browser clear

### After (PostgreSQL version):
- ✅ **Real PostgreSQL database**
- ✅ **Shareable URLs that work for everyone**
- ✅ **Unlimited storage** (within your plan limits)
- ✅ **Persistent data**
- ✅ **Production-ready**
- ✅ **Railway deployment ready**

### Files Added:
- `server/` - Full Express backend with API
- `server/db/` - Database connection and migrations
- `server/routes/` - API endpoints
- `shared/api.js` - API client for frontend
- `package.json` - Node.js dependencies
- `railway.json` - Railway deployment config

### Files Modified:
- `admin/index.html` - Now uses API instead of localStorage
- `public/index.html` - Now uses API instead of localStorage
- Both interfaces now work with real backend!

---

## 🆘 Troubleshooting

### "Cannot find module 'express'"
Run: `npm install`

### "Connection refused" or "ECONNREFUSED"
- Make sure PostgreSQL is running
- Check DATABASE_URL in `.env` is correct
- Try: `psql -U postgres` to test connection

### "Database does not exist"
Create it: `createdb pastebin`

### "Authentication failed for user"
Update DATABASE_URL with correct username/password

---

## 🚀 Ready to Deploy?

See **RAILWAY_DEPLOY.md** for complete deployment guide!

---

**Need help?** Check README_NEW.md for full documentation!
