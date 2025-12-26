# PasteBin Pro - Full Stack Edition

A beautiful, modern pastebin application with **PostgreSQL backend**, **geolocation tracking**, and dual admin/public interfaces.

![Version](https://img.shields.io/badge/version-2.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Stack](https://img.shields.io/badge/stack-Node.js%20%7C%20Express%20%7C%20PostgreSQL-orange)

## ✨ Features

### 🎨 Frontend
- **Dual Interfaces**: Separate admin and public views
- **Syntax Highlighting**: Support for 17+ programming languages
- **Modern UI**: Glassmorphism, gradients, smooth animations
- **Burn After Read**: Self-destructing pastes
- **Expiration Control**: Set custom expiration times
- **Keyboard Shortcuts**: Productivity-focused
- **Fully Responsive**: Works on all devices

### 🔧 Backend
- **Node.js + Express**: Fast, scalable REST API
- **PostgreSQL**: Reliable, production-ready database
- **Geolocation Tracking**: Track views by city, region, country, ISP
- **Analytics Dashboard**: Detailed visitor statistics
- **Railway Ready**: One-click deployment to Railway
- **Auto Migrations**: Database setup on first run

### 📊 Analytics
- Track every paste view with detailed geolocation
- See city, region, country, coordinates
- ISP and organization data
- View count and unique visitors
- Top locations breakdown
- Recent views table with timestamps

## 🚀 Quick Start

### Local Development

1. **Clone the repository** (or use existing folder)
   ```bash
   cd pastebin-dual
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your PostgreSQL connection string:
   ```env
   DATABASE_URL=postgresql://username:password@localhost:5432/pastebin
   PORT=3000
   NODE_ENV=development
   ```

4. **Start PostgreSQL** (if running locally)
   - Install PostgreSQL: https://www.postgresql.org/download/
   - Create a database called `pastebin`
   - Update DATABASE_URL in `.env`

5. **Run the server**
   ```bash
   npm start
   ```

   The database migrations will run automatically on first start!

6. **Open your browser**
   - Admin: http://localhost:3000/admin
   - Public: http://localhost:3000/public
   - API: http://localhost:3000/api

## 📁 Project Structure

```
pastebin-dual/
├── server/                 # Backend (Node.js/Express)
│   ├── index.js           # Main server file
│   ├── db/
│   │   ├── index.js       # PostgreSQL pool
│   │   └── migrate.js     # Database migrations
│   └── routes/
│       └── pastes.js      # API endpoints
├── admin/                  # Admin interface (frontend)
│   ├── index.html
│   ├── style.css
│   └── app.js
├── public/                 # Public interface (frontend)
│   ├── index.html
│   ├── style.css
│   └── app.js
├── shared/                 # Shared code
│   ├── api.js             # API client
│   └── storage.js         # Legacy (for reference)
├── package.json
├── .env.example
└── RAILWAY_DEPLOY.md      # Deployment guide
```

## 🌐 API Endpoints

### Pastes
- `POST /api/pastes` - Create a new paste
- `GET /api/pastes/:id` - Get paste by ID (tracks view)
- `GET /api/pastes` - Get all pastes (admin)
- `DELETE /api/pastes/:id` - Delete paste
- `GET /api/pastes/:id/analytics` - Get analytics for a paste

### Stats
- `GET /api/pastes/stats/summary` - Get overall statistics

### Health
- `GET /api/health` - Health check endpoint

## 🚢 Deployment to Railway

See [RAILWAY_DEPLOY.md](./RAILWAY_DEPLOY.md) for detailed deployment instructions.

**Quick Deploy:**
1. Push code to GitHub
2. Create new project on Railway
3. Add PostgreSQL database
4. Connect GitHub repo
5. Set environment variables
6. Deploy! 🎉

**Estimated Cost**: ~$10/month for starter usage

## 🔧 Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | ✅ Yes | - | PostgreSQL connection string |
| `NODE_ENV` | ⚠️ Recommended | development | Environment (production/development) |
| `PORT` | ⚠️ Optional | 3000 | Server port (Railway sets automatically) |
| `CORS_ORIGINS` | ⚠️ Optional | * | Allowed CORS origins (comma separated) |

## 📊 Database Schema

### `pastes` Table
```sql
- id (VARCHAR, PRIMARY KEY)
- title (VARCHAR)
- content (TEXT)
- language (VARCHAR)
- created_at (TIMESTAMP)
- expires_at (TIMESTAMP, nullable)
- views (INTEGER)
- is_public (BOOLEAN)
- password (VARCHAR, nullable)
- burn_after_read (BOOLEAN)
- burned (BOOLEAN)
```

### `paste_views` Table
```sql
- id (SERIAL, PRIMARY KEY)
- paste_id (VARCHAR, FOREIGN KEY)
- viewed_at (TIMESTAMP)
- ip_address (VARCHAR)
- country, country_code (VARCHAR)
- region, region_code (VARCHAR)
- city, zip (VARCHAR)
- latitude, longitude (DECIMAL)
- timezone (VARCHAR)
- isp, org, asn (VARCHAR)
```

## 🎨 Admin Interface

Access at `/admin`:
- Create new pastes with full configuration
- View all pastes with stats
- Delete pastes
- View detailed analytics per paste
- Export/share paste URLs
- Track geolocation data

## 👁️ Public Interface

Access at `/public`:
- Clean, distraction-free paste viewing
- Syntax highlighting
- Copy to clipboard
- Raw view
- Share functionality
- Automatic view tracking

## 🔒 Security Features

- **SQL Injection Protection**: Parameterized queries
- **CORS Configuration**: Configurable allowed origins
- **Environment Variables**: Sensitive data never in code
- **SSL Support**: Ready for HTTPS (Railway provides automatically)
- **Input Validation**: Server-side validation

## ⚡ Performance

- **Connection Pooling**: Efficient database connections
- **Indexed Queries**: Fast paste and analytics retrieval
- **Async Operations**: Non-blocking geolocation tracking
- **Static Asset Serving**: Optimized frontend delivery

## 🐛 Troubleshooting

### "Cannot connect to database"
- Check `DATABASE_URL` is correct
- Ensure PostgreSQL is running
- Verify database exists

### "CORS error in browser"
- Add your domain to `CORS_ORIGINS` in environment variables
- Format: `https://domain1.com,https://domain2.com`

### "Migrations failed"
- Check database connection
- Ensure user has CREATE TABLE permissions
- Check server logs for detailed error

### "Geolocation not working"
- ip-api.com has rate limits (45 requests/minute)
- Localhost/private IPs won't have geolocation
- Check browser console for errors

## 📈 Monitoring

### Logs
All requests are logged with timestamp and method:
```
2025-12-26T12:00:00.000Z - GET /api/pastes/abc123
```

### Health Check
Use `/api/health` for uptime monitoring:
```json
{
  "status": "ok",
  "timestamp": "2025-12-26T12:00:00.000Z",
  "environment": "production"
}
```

## 🛠️ Development

### Running in Dev Mode
```bash
npm run dev  # Auto-restarts on file changes (Node 18+)
```

### Database Migrations
```bash
npm run db:migrate  # Run migrations manually
```

### Project Dependencies
```bash
npm install  # Install all dependencies
```

## 📝 TODO / Roadmap

- [ ] User authentication (admin login)
- [ ] Paste editing
- [ ] Paste categories/tags
- [ ] Search functionality
- [ ] Paste collections
- [ ] Custom paste URLs (vanity URLs)
- [ ] Paste password protection
- [ ] Rate limiting
- [ ] API authentication/keys
- [ ] Export analytics as CSV

## 🤝 Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

MIT License - feel free to use for any purpose!

## 🆘 Support

- **Documentation**: See RAILWAY_DEPLOY.md for deployment help
- **Issues**: Create a GitHub issue
- **Questions**: Open a discussion

---

**Made with ❤️ for developers**

Enjoy your full-stack pastebin! 🚀
