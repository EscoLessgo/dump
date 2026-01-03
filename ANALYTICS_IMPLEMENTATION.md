# Analytics & Admin Panel Implementation Guide

This guide provides the configuration and code snippets to implement the detailed analytics logging (IP, Geolocation, Device, Hostname) and the Admin Panel into your other projects.

## 1. Database Schema (SQLite)

Ensure your database has the following tables. If you are using a different DB (Postgres/MySQL), adjust the types accordingly.

```javascript
// Analytics Tables
db.exec(`
    CREATE TABLE IF NOT EXISTS paste_views (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        pasteId TEXT,
        ip TEXT,
        country TEXT,
        countryCode TEXT,
        region TEXT,
        regionName TEXT,
        city TEXT,
        zip TEXT,
        lat REAL,
        lon REAL,
        isp TEXT,
        org TEXT,
        asName TEXT,
        userAgent TEXT,
        hostname TEXT, -- new reverse DNS field
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS paste_reactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        pasteId TEXT,
        type TEXT, -- 'heart', 'star', 'like'
        ip TEXT,
        country TEXT,
        countryCode TEXT,
        region TEXT,
        regionName TEXT,
        city TEXT,
        zip TEXT,
        lat REAL,
        lon REAL,
        isp TEXT,
        org TEXT,
        asName TEXT,
        userAgent TEXT,
        discordId TEXT,
        username TEXT,
        avatarUrl TEXT,
        hostname TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );
`);
```

## 2. Server-Side Helpers

Add these helper functions to your clean server module (e.g., `utils/analytics.js` or directly in your routes).

### Dependencies
```bash
npm install node-fetch
```

### Code Snippets

```javascript
import fetch from 'node-fetch';
import dns from 'dns';

// 1. Get Client IP Helper
export function getClientIP(req) {
    let ip = req.headers['x-forwarded-for']?.split(',')[0] ||
        req.headers['x-real-ip'] ||
        req.socket.remoteAddress ||
        '127.0.0.1';
    if (ip.includes('::ffff:')) ip = ip.split(':').pop();
    return ip.trim();
}

// 2. Geolocation Helper
export async function fetchGeolocation(ip) {
    try {
        if (!ip || ip === '::1' || ip === '127.0.0.1' || ip.startsWith('192.168.') || ip.startsWith('10.')) return null;
        
        const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,message,country,countryCode,region,regionName,city,zip,lat,lon,isp,org,as,query`);
        const data = await response.json();
        return data.status === 'success' ? data : null;
    } catch (e) {
        return null; // Fail silently
    }
}

// 3. Reverse DNS Helper (Async Update)
export async function updateHostname(db, table, id, ip) {
    if (ip === '127.0.0.1' || ip.includes(':')) return;
    try {
        const { promises: dnsPromises } = await import('dns');
        const hostnames = await dnsPromises.reverse(ip);
        if (hostnames && hostnames.length > 0) {
            db.prepare(`UPDATE ${table} SET hostname = ? WHERE id = ?`).run(hostnames[0], id);
        }
    } catch (e) {
        // Limit logging to avoid noise
    }
}
```

## 3. Route Integration

When a user views a page or resource, call this logic.

```javascript
// Inside your GET /page/:id route
const ip = getClientIP(req);
const userAgent = req.headers['user-agent'] || '';

// Kick off async logging (don't await if you want speed)
fetchGeolocation(ip).then(loc => {
    let rowId;
    if (loc) {
        const res = db.prepare(`
            INSERT INTO paste_views (pasteId, ip, country, countryCode, region, regionName, city, zip, lat, lon, isp, org, asName, userAgent)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
            req.params.id, ip, loc.country, loc.countryCode, loc.region, loc.regionName,
            loc.city, loc.zip, loc.lat, loc.lon, loc.isp, loc.org, loc.as, userAgent
        );
        rowId = res.lastInsertRowid;
    } else {
        const res = db.prepare(`INSERT INTO paste_views (pasteId, ip, userAgent) VALUES (?, ?, ?)`).run(req.params.id, ip, userAgent);
        rowId = res.lastInsertRowid;
    }
    
    // Trigger Reverse DNS
    updateHostname(db, 'paste_views', rowId, ip);
});
```

## 4. Admin UI Logic

For the "Device / Network" column in your admin panel, use this parsing logic on the `userAgent` string.

```javascript
function parsePlatform(ua) {
    if (!ua) return 'Unknown';
    let platform = 'Unknown Device';
    
    if (ua.includes('Windows')) platform = 'Windows PC';
    else if (ua.includes('Macintosh')) platform = 'Mac';
    else if (ua.includes('iPhone')) platform = 'iPhone';
    else if (ua.includes('iPad')) platform = 'iPad';
    else if (ua.includes('Android')) platform = 'Android';
    else if (ua.includes('Linux')) platform = 'Linux';
    
    if (ua.includes('Chrome/')) platform += ' (Chrome)';
    else if (ua.includes('Firefox/')) platform += ' (Firefox)';
    else if (ua.includes('Safari/')) platform += ' (Safari)';

    return platform;
}
```
