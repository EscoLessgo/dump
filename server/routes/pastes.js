import express from 'express';
import pool from '../db/index.js';
import fetch from 'node-fetch';

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
        req.connection.remoteAddress ||
        req.socket.remoteAddress;
}

// Fetch geolocation data from ip-api.com
async function fetchGeolocation(ip) {
    try {
        // For localhost/private IPs, use a fallback
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

// CREATE a new paste
router.post('/', async (req, res) => {
    try {
        const { title, content, language, expiresAt, isPublic, password, burnAfterRead } = req.body;

        if (!content) {
            return res.status(400).json({ error: 'Content is required' });
        }

        let id;
        let exists = true;

        // Generate unique ID
        while (exists) {
            id = generateId();
            const check = await pool.query('SELECT id FROM pastes WHERE id = $1', [id]);
            exists = check.rows.length > 0;
        }

        const query = `
      INSERT INTO pastes (id, title, content, language, expires_at, is_public, password, burn_after_read)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;

        const values = [
            id,
            title || 'Untitled Paste',
            content,
            language || 'plaintext',
            expiresAt || null,
            isPublic !== false,
            password || null,
            burnAfterRead || false
        ];

        const result = await pool.query(query, values);
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error creating paste:', error);
        res.status(500).json({ error: 'Failed to create paste' });
    }
});

// GET a paste by ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { track = 'true' } = req.query;

        // Get paste
        const result = await pool.query(
            'SELECT * FROM pastes WHERE id = $1 AND burned = false',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Paste not found' });
        }

        const paste = result.rows[0];

        // Check if expired
        if (paste.expires_at && new Date(paste.expires_at) < new Date()) {
            await pool.query('DELETE FROM pastes WHERE id = $1', [id]);
            return res.status(404).json({ error: 'Paste has expired' });
        }

        // Handle burn after read
        if (paste.burn_after_read) {
            await pool.query('UPDATE pastes SET burned = true WHERE id = $1', [id]);
            return res.json({ ...paste, burned: true });
        }

        // Increment view count
        await pool.query('UPDATE pastes SET views = views + 1 WHERE id = $1', [id]);
        paste.views++;

        // Track location if requested
        if (track === 'true') {
            const clientIP = getClientIP(req);
            const locationData = await fetchGeolocation(clientIP);

            if (locationData) {
                await pool.query(`
          INSERT INTO paste_views (
            paste_id, ip_address, country, country_code, region, region_code,
            city, zip, latitude, longitude, timezone, isp, org, asn
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        `, [
                    id,
                    locationData.query,
                    locationData.country,
                    locationData.countryCode,
                    locationData.regionName,
                    locationData.region,
                    locationData.city,
                    locationData.zip,
                    locationData.lat,
                    locationData.lon,
                    locationData.timezone,
                    locationData.isp,
                    locationData.org,
                    locationData.as
                ]);
            }
        }

        res.json(paste);
    } catch (error) {
        console.error('Error getting paste:', error);
        res.status(500).json({ error: 'Failed to get paste' });
    }
});

// GET all pastes (admin only)
router.get('/', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, title, language, created_at, expires_at, views, is_public, burn_after_read, burned FROM pastes ORDER BY created_at DESC'
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Error getting pastes:', error);
        res.status(500).json({ error: 'Failed to get pastes' });
    }
});

// GET analytics for a paste
router.get('/:id/analytics', async (req, res) => {
    try {
        const { id } = req.params;

        // Get paste info
        const pasteResult = await pool.query(
            'SELECT id, title, views, created_at FROM pastes WHERE id = $1',
            [id]
        );

        if (pasteResult.rows.length === 0) {
            return res.status(404).json({ error: 'Paste not found' });
        }

        const paste = pasteResult.rows[0];

        // Get all views
        const viewsResult = await pool.query(
            `SELECT * FROM paste_views 
       WHERE paste_id = $1 
       ORDER BY viewed_at DESC`,
            [id]
        );

        // Calculate statistics
        const views = viewsResult.rows;
        const uniqueIPs = new Set(views.map(v => v.ip_address)).size;
        const uniqueCountries = new Set(views.map(v => v.country).filter(Boolean)).size;
        const uniqueCities = new Set(views.map(v => v.city).filter(Boolean)).size;

        // Top locations
        const locationCounts = {};
        views.forEach(view => {
            if (view.city && view.region && view.country) {
                const key = `${view.city}, ${view.region}, ${view.country}`;
                if (!locationCounts[key]) {
                    locationCounts[key] = {
                        location: key,
                        count: 0,
                        city: view.city,
                        region: view.region,
                        country: view.country,
                        countryCode: view.country_code,
                        lat: parseFloat(view.latitude),
                        lon: parseFloat(view.longitude)
                    };
                }
                locationCounts[key].count++;
            }
        });

        const topLocations = Object.values(locationCounts)
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);

        res.json({
            paste: {
                id: paste.id,
                title: paste.title,
                created_at: paste.created_at
            },
            totalViews: paste.views,
            uniqueIPs,
            uniqueCountries,
            uniqueCities,
            topLocations,
            recentViews: views.slice(0, 50)
        });
    } catch (error) {
        console.error('Error getting analytics:', error);
        res.status(500).json({ error: 'Failed to get analytics' });
    }
});

// DELETE a paste
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('DELETE FROM pastes WHERE id = $1 RETURNING id', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Paste not found' });
        }

        res.json({ message: 'Paste deleted successfully' });
    } catch (error) {
        console.error('Error deleting paste:', error);
        res.status(500).json({ error: 'Failed to delete paste' });
    }
});

// GET stats
router.get('/stats/summary', async (req, res) => {
    try {
        const totalPastesResult = await pool.query('SELECT COUNT(*) as count FROM pastes');
        const totalViewsResult = await pool.query('SELECT SUM(views) as total FROM pastes');
        const languageBreakdownResult = await pool.query(
            'SELECT language, COUNT(*) as count FROM pastes GROUP BY language ORDER BY count DESC'
        );

        const languageBreakdown = {};
        languageBreakdownResult.rows.forEach(row => {
            languageBreakdown[row.language] = parseInt(row.count);
        });

        res.json({
            totalPastes: parseInt(totalPastesResult.rows[0].count),
            totalViews: parseInt(totalViewsResult.rows[0].total || 0),
            languageBreakdown
        });
    } catch (error) {
        console.error('Error getting stats:', error);
        res.status(500).json({ error: 'Failed to get stats' });
    }
});

export default router;
