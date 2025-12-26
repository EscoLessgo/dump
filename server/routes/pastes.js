import express from 'express';
import db from '../db/index.js';
import fetch from 'node-fetch';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Generate unique paste ID
function generateId() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let id = '';
    for (let i = 0; i < 8; i++) {
        id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return id;
}

// Get client IP address
function getClientIP(req) {
    return req.headers['x-forwarded-for']?.split(',')[0] ||
        req.headers['x-real-ip'] ||
        req.socket.remoteAddress ||
        '127.0.0.1';
}

// Fetch geolocation data
async function fetchGeolocation(ip) {
    try {
        if (ip === '::1' || ip === '127.0.0.1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
            return null;
        }

        const response = await fetch(
            `http://ip-api.com/json/${ip}?fields=status,message,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as,query`
        );
        const data = await response.json();

        if (data.status === 'success') {
            return data;
        }
        return null;
    } catch (error) {
        console.warn('Geolocation fetch failed:', error.message);
        return null;
    }
}

// CREATE a new paste (Protected)
router.post('/', requireAuth, async (req, res) => {
    try {
        const { title, content, language, expiresAt, isPublic, burnAfterRead } = req.body;

        if (!content) {
            return res.status(400).json({ error: 'Content is required' });
        }

        let id;
        let exists = true;

        // Generate and check ID unique
        while (exists) {
            id = generateId();
            const check = db.prepare('SELECT id FROM pastes WHERE id = ?').get(id);
            exists = !!check;
        }

        const stmt = db.prepare(`
            INSERT INTO pastes (id, title, content, language, expiresAt, isPublic, burnAfterRead)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `);

        stmt.run(
            id,
            title || 'Untitled Paste',
            content,
            language || 'plaintext',
            expiresAt || null,
            isPublic !== false ? 1 : 0,
            burnAfterRead ? 1 : 0
        );

        // Fetch back to confirm
        const newPaste = db.prepare('SELECT * FROM pastes WHERE id = ?').get(id);
        res.status(201).json(newPaste);

    } catch (error) {
        console.error('Error creating paste:', error);
        res.status(500).json({ error: 'Failed to create paste' });
    }
});

// GET a paste by ID (Public with visibility check)
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { track = 'true' } = req.query;

        // Get paste
        const paste = db.prepare('SELECT * FROM pastes WHERE id = ?').get(id);

        if (!paste) {
            return res.status(404).json({ error: 'Paste not found' });
        }

        // Visibility Check: If not public, only admin can see it
        const isAdmin = req.session && req.session.isAdmin;
        if (paste.isPublic === 0 && !isAdmin) {
            return res.status(403).json({ error: 'Access denied. This paste is private.' });
        }

        // Handle expired pastes
        if (paste.expiresAt && new Date(paste.expiresAt) < new Date()) {
            db.prepare('DELETE FROM pastes WHERE id = ?').run(id);
            return res.status(404).json({ error: 'Paste has expired' });
        }

        // Increment Views
        db.prepare('UPDATE pastes SET views = views + 1 WHERE id = ?').run(id);
        paste.views++;

        // Track location
        if (track === 'true') {
            const clientIP = getClientIP(req);
            // Async track without blocking response
            fetchGeolocation(clientIP).then(loc => {
                if (loc) {
                    try {
                        db.prepare(`
                           INSERT INTO paste_views (
                             pasteId, ip, country, countryCode, region, regionName, city, zip, lat, lon, isp, org, asName, userAgent
                           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        `).run(
                            id,
                            loc.query,
                            loc.country,
                            loc.countryCode,
                            loc.region,
                            loc.regionName,
                            loc.city,
                            loc.zip,
                            loc.lat,
                            loc.lon,
                            loc.isp,
                            loc.org,
                            loc.as,
                            req.headers['user-agent'] || ''
                        );
                    } catch (e) {
                        console.error('Track update error:', e.message);
                    }
                }
            }).catch(err => {
                console.warn('Geolocation background task failed:', err.message);
            });
        }

        // Handle burn after read (Delete if not admin)
        if (paste.burnAfterRead === 1 && !isAdmin) {
            db.prepare('DELETE FROM pastes WHERE id = ?').run(id);
        }

        res.json(paste);
    } catch (error) {
        console.error('Error getting paste:', error);
        res.status(500).json({ error: 'Failed to get paste' });
    }
});

// GET all pastes (Protected - for Admin List)
router.get('/', requireAuth, (req, res) => {
    try {
        const rows = db.prepare('SELECT id, title, language, views, createdAt, expiresAt, isPublic, burnAfterRead FROM pastes ORDER BY createdAt DESC').all();
        res.json(rows);
    } catch (error) {
        console.error('Error getting pastes:', error);
        res.status(500).json({ error: 'Failed to get pastes' });
    }
});

// DELETE a paste (Protected)
router.delete('/:id', requireAuth, (req, res) => {
    try {
        const { id } = req.params;
        const info = db.prepare('DELETE FROM pastes WHERE id = ?').run(id);

        if (info.changes === 0) {
            return res.status(404).json({ error: 'Paste not found' });
        }
        res.json({ message: 'Paste deleted successfully' });
    } catch (error) {
        console.error('Error deleting:', error);
        res.status(500).json({ error: 'Failed to delete' });
    }
});

// GET stats (Protected)
router.get('/stats/summary', requireAuth, (req, res) => {
    try {
        const totalPastes = db.prepare('SELECT COUNT(*) as count FROM pastes').get().count;
        const totalViews = db.prepare('SELECT SUM(views) as total FROM pastes').get().total || 0;

        // Group by language
        const langs = db.prepare('SELECT language, COUNT(*) as count FROM pastes GROUP BY language ORDER BY count DESC').all();
        const languageBreakdown = {};
        langs.forEach(r => languageBreakdown[r.language] = r.count);

        res.json({
            totalPastes,
            totalViews,
            languageBreakdown
        });
    } catch (error) {
        console.error('Error stats:', error);
        res.status(500).json({ error: 'Failed stats' });
    }
});

// GET Analytics Detail (Protected)
router.get('/:id/analytics', requireAuth, (req, res) => {
    try {
        const { id } = req.params;
        const paste = db.prepare('SELECT id, title, views, createdAt FROM pastes WHERE id = ?').get(id);

        if (!paste) return res.status(404).json({ error: 'Not found' });

        const views = db.prepare('SELECT * FROM paste_views WHERE pasteId = ? ORDER BY timestamp DESC').all(id);

        // Summarize
        const uniqueIPs = new Set(views.map(v => v.ip)).size;
        const uniqueCountries = new Set(views.map(v => v.country)).size;

        // Grouping helper
        const groupCount = (arr, keyFn) => {
            const map = {};
            arr.forEach(item => {
                const k = keyFn(item) || 'Unknown';
                if (!map[k]) map[k] = { name: k, count: 0 };
                map[k].count++;
            });
            return Object.values(map).sort((a, b) => b.count - a.count);
        };

        const topLocations = groupCount(views, v => v.city ? `${v.city}, ${v.country}` : v.country).slice(0, 10);
        const topRegions = groupCount(views, v => v.regionName || v.region).slice(0, 10);
        const topISPs = groupCount(views, v => v.isp).slice(0, 10);

        // Simple User Agent Parsing (Browser/OS)
        const topBrowsers = groupCount(views, v => {
            const ua = v.userAgent || '';
            if (ua.includes('Firefox')) return 'Firefox';
            if (ua.includes('Edg/')) return 'Edge';
            if (ua.includes('Chrome')) return 'Chrome';
            if (ua.includes('Safari')) return 'Safari';
            if (ua.includes('MSIE') || ua.includes('Trident/')) return 'Internet Explorer';
            return 'Other';
        }).slice(0, 5);

        res.json({
            paste,
            totalViews: paste.views,
            uniqueIPs,
            uniqueCountries,
            topLocations,
            topRegions,
            topISPs,
            topBrowsers,
            recentViews: views.slice(0, 50)
        });

    } catch (error) {
        console.error('Analytics error:', error);
        res.status(500).json({ error: 'Failed analytics' });
    }
});

export default router;
