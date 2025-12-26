# 🔐 Admin Authentication Setup Guide

Your PasteBin Pro now has **password-protected admin access**! Only you (with the password) can create pastes.

---

## 🎯 How It Works

- ✅ **Admin panel** (`/admin`) requires login
- ✅ **Public view** (`/public`) is accessible to everyone
- ✅ **Session-based** authentication (24-hour sessions)
- ✅ **Bcrypt hashing** for secure password storage
- ✅ **HTTPS-ready** for production security

---

## 🚀 Quick Setup

### Step 1: Generate Your Password Hash

Run this command to create a secure password hash:

```bash
npm run generate-password
```

You'll be prompted to enter your desired admin password. The script will output a bcrypt hash.

### Step 2: Add to Environment Variables

#### For Local Development:

Create/edit `.env` file and add:

```env
ADMIN_PASSWORD_HASH=<your-generated-hash>
SESSION_SECRET=<random-string-here>
```

Example:
```env
ADMIN_PASSWORD_HASH=$2a$10$abcdefgh...xyz123
SESSION_SECRET=my-super-secret-random-string-change-this
```

#### For Railway Deployment:

1. Go to your Railway project dashboard
2. Click on your service
3. Go to **Variables** tab  
4. Add these two variables:
   - `ADMIN_PASSWORD_HASH` = `<your-generated-hash>`
   - `SESSION_SECRET` = `<random-string>`

**Important:** For `SESSION_SECRET`, use a long random string. Example:
```
SESSION_SECRET=83hf92dh3f92hd93hf293hf293hf2938hf239hf
```

---

## 🔑 Using the System

### First Time Login:

1. Visit your admin URL:
   - Local: `http://localhost:3000/admin`
   - Railway: `https://your-app.railway.app/admin`

2. You'll be redirected to the login page

3. Enter your admin password

4. Click "Login"

5. You're in! Create pastes freely

### Session Duration:

- Sessions last **24 hours** after login
- After 24 hours, you'll need to log in again
- Close browser = session persists (stays logged in)

### Logout:

Currently there's no logout button, but you can:
- Clear cookies in your browser, OR
- Wait 24 hours for session to expire, OR
- Use private/incognito mode for one-time access

---

## 🛡️ Security Features

✅ **Password Hashing**: Uses bcrypt (industry standard)  
✅ **Session Management**: HTTP-only cookies  
✅ **HTTPS Support**: Secure flag enabled in production  
✅ **No Password in Code**: Hash stored in environment  
✅ **Protected API**: All admin endpoints require auth  

---

## 🌐 What's Protected vs Public

### Protected (Login Required):
- ❌ `/admin` - Admin panel
- ❌ `/admin/index.html` - Main admin page
- ❌ `POST /api/pastes` - Create paste
- ❌ `GET /api/pastes` - List all pastes
- ❌ `DELETE /api/pastes/:id` - Delete paste
- ❌ `GET /api/pastes/:id/analytics` - View analytics

### Public (No Login):
- ✅ `/admin/login.html` - Login page
- ✅ `/admin/style.css` - CSS assets
- ✅ `/public` - Public paste viewer
- ✅ `GET /api/pastes/:id?track=true` - View paste (public)
- ✅ `/api/health` - Health check

---

## 🔧 Advanced Configuration

### Change Password:

1. Run: `npm run generate-password`
2. Enter new password
3. Update `ADMIN_PASSWORD_HASH` in `.env` (or Railway variables)
4. Restart server (Railway auto-restarts)

### Change Session Duration:

Edit `server/index.js`, find:
```javascript
cookie: {
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}
```

Change to desired duration (in milliseconds).

### Multiple Admin Users:

Currently only supports one password. To add multiple users, you'd need to:
- Add a users table to database
- Implement user registration
- Update auth middleware

(This is a future enhancement - current version is single admin)

---

## 🐛 Troubleshooting

### "Please login as admin" error when creating paste

**Problem:** Not authenticated  
**Solution:** Go to `/admin/login.html` and enter password

### "ADMIN_PASSWORD_HASH not set" error

**Problem:** Missing environment variable  
**Solution:** 
1. Run `npm run generate-password`
2. Add hash to `.env` or Railway variables
3. Restart server

### "Invalid password" on login

**Problem:** Wrong password or hash mismatch  
**Solution:**
1. Double-check you're entering the right password
2. Regenerate hash if needed
3. Ensure hash in environment matches

### Session doesn't persist

**Problem:** Cookies not being saved  
**Solution:**
- Check browser allows cookies
- For Railway: Ensure domain is HTTPS
- Check `SESSION_SECRET` is set

### Can't access admin panel (keeps redirecting to login)

**Problem:** Session not created  
**Solution:**
- Clear browser cookies
- Try incognito/private mode
- Check server logs for errors
- Verify `SESSION_SECRET` is set

---

## 📝 Technical Details

### Authentication Flow:

```
1. User visits /admin
   ↓
2. Server checks session
   ↓
3. No session? → Redirect to /admin/login.html
   ↓  
4. User enters password
   ↓
5. POST to /api/auth/login
   ↓
6. Server verifies with bcrypt
   ↓
7. Valid? → Create session → Redirect to admin
   ↓
8. Invalid? → Show error message
```

### Session Storage:

- **Development**: In-memory (resets on server restart)
- **Production**: Should use Redis or database store (future enhancement)
- **Current**: Express-session default (good for single Railway instance)

---

## 🎉 You're Protected!

Your admin panel is now secure. Only someone with the password can create pastes!

**Next steps:**
1. Generate your password hash
2. Add to environment variables
3. Push to GitHub
4. Deploy to Railway
5. Login and start pasting! 🚀
