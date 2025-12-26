# PasteBin Pro - Railway Deployment Guide

## 🚀 Quick Deploy to Railway

### Prerequisites
- GitHub account
- Railway account (sign up at [railway.app](https://railway.app))

### Step 1: Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin YOUR_GITHUB_REPO_URL
git push -u origin main
```

### Step 2: Deploy on Railway

1. **Go to Railway Dashboard**
   - Visit [railway.app](https://railway.app)
   - Click "New Project"

2. **Add PostgreSQL Database**
   - Click "+ New"
   - Select "Database"
   - Choose "PostgreSQL"
   - Railway will automatically create the database and provide `DATABASE_URL`

3. **Deploy Your Application**
   - Click "+ New"
   - Select "GitHub Repo"
   - Choose your `pastebin-dual` repository
   - Railway will auto-detect Node.js and deploy

4. **Configure Environment Variables**
   - Click on your service
   - Go to "Variables" tab
   - The following is automatically set by Railway:
     - `DATABASE_URL` (from PostgreSQL service)
   - Add these manually:
     - `NODE_ENV` = `production`
     - `PORT` = `3000` (optional, Railway sets this automatically)
     - `CORS_ORIGINS` = `https://your-app.railway.app` (update after deployment)

5. **Get Your Deployment URL**
   - Go to "Settings" tab
   - Click "Generate Domain"
   - Copy your URL (e.g., `https://your-app.railway.app`)

6. **Update CORS Settings**
   - Go back to "Variables"
   - Update `CORS_ORIGINS` with your domain
   - Example: `https://your-app.railway.app,https://www.yourdomain.com`

### Step 3: Access Your App

Your app will be available at:
- **Admin Interface**: `https://your-app.railway.app/admin`
- **Public Interface**: `https://your-app.railway.app/public`
- **API**: `https://your-app.railway.app/api`

## 🔧 Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | ✅ Yes | - | PostgreSQL connection string (auto-set by Railway) |
| `NODE_ENV` | ✅ Yes | development | Set to `production` for Railway |
| `PORT` | ⚠️ Auto | 3000 | Railway sets this automatically |
| `CORS_ORIGINS` | ⚠️ Optional | * | Comma-separated list of allowed origins |

## 📊 Database Migrations

Migrations run automatically when the server starts. No manual action needed!

If you need to run migrations manually:
```bash
npm run db:migrate
```

## 🌐 Custom Domain (Optional)

1. Go to your Railway project
2. Click on your service
3. Go to "Settings" > "Domains"
4. Click "Custom Domain"
5. Enter your domain (e.g., `paste.yourdomain.com`)
6. Add the CNAME record to your DNS provider:
   - Name: `paste` (or your subdomain)
   - Value: Your Railway domain

## 🔐 Security Best Practices

### For Production:
1. **Add Authentication** (admin interface)
2. **Rate Limiting** (prevent abuse)
3. **Content Validation** (prevent XSS)
4. **HTTPS Only** (Railway provides this automatically)
5. **Privacy Policy** (for geolocation tracking)

## 📈 Monitoring

Railway provides:
- **Logs**: View real-time server logs
- **Metrics**: CPU, Memory, Network usage
- **Deployments**: Track deployment history

Access via your project dashboard.

## 💰 Pricing

- **PostgreSQL**: $5/month for Hobby plan (500MB storage)
- **Web Service**: $5/month for 500 hours (Hobby plan)
- **Total**: ~$10/month for starter usage

Free trial credit available for new users!

## 🐛 Troubleshooting

### Build Failed
- Check Node.js version in `package.json` ("engines" field)
- Verify all dependencies are in `package.json`
- Check Railway build logs for errors

### Database Connection Failed
- Verify `DATABASE_URL` is set in variables
- Check PostgreSQL service is running
- Restart your service

### 502 Bad Gateway
- Check if server is listening on correct PORT
- Verify `npm start` command works
- Check application logs for errors

### CORS Errors
- Add your frontend domain to `CORS_ORIGINS`
- Use Railway-provided domain initially
- Update after setting custom domain

## 🔄 Updates & Redeployment

Railway automatically redeploys when you push to GitHub:
```bash
git add .
git commit -m "Your update message"
git push
```

## 📞 Support

- Railway Docs: https://docs.railway.app
- Railway Discord: https://discord.gg/railway
- GitHub Issues: Create an issue in your repo

---

**Happy Deploying! 🎉**
