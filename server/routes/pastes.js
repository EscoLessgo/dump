import express from 'express';
import db from '../db/index.js';
import fetch from 'node-fetch';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

function generateId() {
    return Math.random().toString(36).substring(2, 10);
}

function getClientIP(req) {
    let ip = req.headers['x-forwarded-for']?.split(',')[0] ||
        req.headers['x-real-ip'] ||
        req.socket.remoteAddress ||
        '127.0.0.1';

    // Normalize IPv6 mapped IPv4 addresses
    if (ip.includes('::ffff:')) {
        ip = ip.split(':').pop();
    }
    return ip.trim();
}

async function fetchGeolocation(ip) {
    try {
        if (!ip || ip === '::1' || ip === '127.0.0.1' || ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('172.')) {
            return null;
        }

        // Using a more robust backup API if the first fails
        console.log(`🌐 Geo-Lookup: ${ip}`);
        const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,message,country,countryCode,region,regionName,city,zip,lat,lon,isp,org,as,query`);
        const data = await response.json();

        if (data.status === 'success') {
            return data;
        }
        return null;
    } catch (e) {
        console.error(`Geo Error: ${e.message}`);
        return null;
    }
}

// CREATE
router.post('/', requireAuth, async (req, res) => {
    try {
        const { title, content, language, expiresAt, isPublic, burnAfterRead, folderId, password } = req.body;
        const id = generateId();

        db.prepare(`
            INSERT INTO pastes (id, title, content, language, expiresAt, isPublic, burnAfterRead, folderId, password) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(id, title || 'Untitled', content, language || 'plaintext', expiresAt || null, isPublic !== false ? 1 : 0, burnAfterRead ? 1 : 0, folderId || null, password || null);

        res.status(201).json({ id, success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// UPDATE
router.put('/:id', requireAuth, async (req, res) => {
    try {
        const { title, content, language, expiresAt, isPublic, burnAfterRead, folderId, password } = req.body;
        const { id } = req.params;

        db.prepare(`
            UPDATE pastes 
            SET title = ?, content = ?, language = ?, expiresAt = ?, isPublic = ?, burnAfterRead = ?, folderId = ?, password = ?
            WHERE id = ?
        `).run(
            title || 'Untitled',
            content,
            language || 'plaintext',
            expiresAt || null,
            isPublic !== false ? 1 : 0,
            burnAfterRead ? 1 : 0,
            folderId || null,
            password || null,
            id
        );

        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Helper to validate access key
function validateAccessKey(key) {
    if (!key) return false;
    const row = db.prepare('SELECT id FROM access_keys WHERE key = ? AND status = ?').get(key, 'active');
    return !!row;
}

// PUBLIC LIST
router.get('/public-list', (req, res) => {
    try {
        const accessKey = req.headers['x-access-key'];
        const hasAccess = validateAccessKey(accessKey);

        let query = `
            SELECT p.id, p.title, p.views, p.createdAt, p.password, p.isPublic, f.name as folderName, p.folderId 
            FROM pastes p 
            LEFT JOIN folders f ON p.folderId = f.id 
            WHERE p.isPublic = 1
        `;

        if (hasAccess) {
            // Allow private pastes too
            query = `
                SELECT p.id, p.title, p.views, p.createdAt, p.password, p.isPublic, f.name as folderName, p.folderId 
                FROM pastes p 
                LEFT JOIN folders f ON p.folderId = f.id 
                WHERE 1=1 -- Show all (public + private)
            `;
        }

        const list = db.prepare(query + ` ORDER BY p.createdAt DESC`).all();

        // Sanitize
        const sanitized = list.map(p => ({
            ...p,
            hasPassword: !!p.password,
            password: undefined,
            isPrivate: p.isPublic === 0 // Add flag for UI
        }));

        res.json(sanitized);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// STATS SUMMARY
router.get('/stats/summary', requireAuth, (req, res) => {
    const totalPastes = db.prepare('SELECT COUNT(*) as count FROM pastes').get().count;
    const totalViews = db.prepare('SELECT SUM(views) as total FROM pastes').get().total || 0;
    const langs = db.prepare('SELECT language, COUNT(*) as count FROM pastes GROUP BY language').all();
    const languageBreakdown = {};
    langs.forEach(l => languageBreakdown[l.language] = l.count);
    res.json({ totalPastes, totalViews, languageBreakdown });
});

// GET ONE
router.get('/:id', async (req, res) => {
    try {
        const paste = db.prepare('SELECT * FROM pastes WHERE id = ?').get(req.params.id);
        if (!paste) return res.status(404).json({ error: 'Not found' });

        if (paste.isPublic === 0) {
            const isAdmin = req.session && req.session.isAdmin;
            const accessKey = req.headers['x-access-key'];
            const hasAccess = validateAccessKey(accessKey);

            if (!isAdmin && !hasAccess) {
                return res.status(403).json({ error: 'Private paste' });
            }
        }

        // Password Check Logic
        if (paste.password) {
            const isAdmin = req.session && req.session.isAdmin;
            const providedPass = req.headers['x-paste-password'] || req.query.password;

            if (!isAdmin) {
                if (providedPass !== paste.password) {
                    return res.status(401).json({ error: 'Password required', passwordRequired: true });
                }
            }
        }

        db.prepare('UPDATE pastes SET views = views + 1 WHERE id = ?').run(req.params.id);

        // Track View (Ensure all fields are handled)
        const ip = getClientIP(req);
        const userAgent = req.headers['user-agent'] || '';

        fetchGeolocation(ip).then(loc => {
            if (loc) {
                db.prepare(`
                    INSERT INTO paste_views (pasteId, ip, country, countryCode, region, regionName, city, zip, lat, lon, isp, org, asName, userAgent)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `).run(
                    req.params.id, ip, loc.country, loc.countryCode, loc.region, loc.regionName,
                    loc.city, loc.zip, loc.lat, loc.lon, loc.isp, loc.org, loc.as, userAgent
                );
            } else {
                db.prepare(`INSERT INTO paste_views (pasteId, ip, userAgent) VALUES (?, ?, ?)`).run(req.params.id, ip, userAgent);
            }
        }).catch(() => {
            db.prepare(`INSERT INTO paste_views (pasteId, ip, userAgent) VALUES (?, ?, ?)`).run(req.params.id, ip, userAgent);
        });

        res.json(paste);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// ADMIN LIST
router.get('/', requireAuth, (req, res) => {
    const list = db.prepare('SELECT * FROM pastes ORDER BY createdAt DESC').all();
    res.json(list);
});

// DELETE
router.delete('/:id', requireAuth, (req, res) => {
    db.prepare('DELETE FROM pastes WHERE id = ?').run(req.params.id);
    res.json({ success: true });
});

// ANALYTICS
router.get('/:id/analytics', requireAuth, (req, res) => {
    const { id } = req.params;
    const paste = db.prepare('SELECT views FROM pastes WHERE id = ?').get(id);
    if (!paste) return res.status(404).json({ error: 'Not found' });

    const views = db.prepare('SELECT * FROM paste_views WHERE pasteId = ? ORDER BY timestamp DESC').all(id);

    const groupCount = (arr, keyFn) => {
        const map = {};
        arr.forEach(item => {
            const k = keyFn(item) || null;
            if (k) {
                if (!map[k]) map[k] = { name: k, count: 0 };
                map[k].count++;
            }
        });
        return Object.values(map).sort((a, b) => b.count - a.count);
    };

    res.json({
        totalViews: paste.views,
        uniqueIPs: new Set(views.map(v => v.ip)).size,
        uniqueCountries: new Set(views.filter(v => v.country).map(v => v.country)).size,
        topLocations: groupCount(views, v => v.city ? `${v.city}, ${v.country}` : null).slice(0, 10),
        topRegions: groupCount(views, v => v.regionName || v.region).slice(0, 10),
        topISPs: groupCount(views, v => v.isp).slice(0, 10),
        topBrowsers: groupCount(views, v => {
            const ua = v.userAgent || '';
            if (ua.includes('Firefox')) return 'Firefox';
            if (ua.includes('Chrome')) return 'Chrome';
            if (ua.includes('Safari')) return 'Safari';
            if (ua.includes('Edg/')) return 'Edge';
            return 'Other';
        }).slice(0, 5),
        recentViews: views.slice(0, 50)
    });
});

// DELETE ANALYTICS
router.delete('/:id/analytics', requireAuth, (req, res) => {
    try {
        const { id } = req.params;
        db.prepare('DELETE FROM paste_views WHERE pasteId = ?').run(id);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// CLEAR ALL ANALYTICS
router.delete('/analytics/all', requireAuth, (req, res) => {
    try {
        db.prepare('DELETE FROM paste_views').run();
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

export default router;
