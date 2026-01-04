import express from 'express';
import db from '../db/index.js';

const router = express.Router();

// --- API Endpoints ---

// Create a new access key (Admin only)
router.post('/create', (req, res) => {
    if (!req.session.isAdmin) {
        return res.status(403).json({ error: 'Unauthorized' });
    }
    const { key, type, uses } = req.body;
    if (!key) return res.status(400).json({ error: 'Key required' });

    try {
        db.prepare('INSERT INTO access_keys (key, type, remaining_uses) VALUES (?, ?, ?)').run(key, type || 'standard', uses || 1);
        res.json({ success: true, key });
    } catch (err) {
        res.status(500).json({ error: 'Creation failed: ' + err.message });
    }
});

// List all keys (Admin only)
router.get('/list', (req, res) => {
    if (!req.session.isAdmin) {
        return res.status(403).json({ error: 'Unauthorized' });
    }
    try {
        const keys = db.prepare('SELECT * FROM access_keys ORDER BY created_at DESC').all();
        res.json({ success: true, keys });
    } catch (err) {
        res.status(500).json({ error: 'Fetch failed' });
    }
});

// Delete a key (Admin only)
router.delete('/:key', (req, res) => {
    if (!req.session.isAdmin) {
        return res.status(403).json({ error: 'Unauthorized' });
    }
    try {
        db.prepare('DELETE FROM access_keys WHERE key = ?').run(req.params.key);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Delete failed' });
    }
});

// --- Public / Bot Endpoints ---

// Request Access (Public)
router.post('/request', (req, res) => {
    // 1. Get identity from body (manual) or session (discord)
    let identity = 'Anonymous';
    let userId = null;
    let avatarUrl = null;

    if (req.session.user) {
        identity = `${req.session.user.username}#${req.session.user.discriminator}`;
        userId = req.session.user.id;
        avatarUrl = req.session.user.avatarUrl;
    } else if (req.body.identity) {
        identity = req.body.identity;
    }

    const { reason, discordId } = req.body;

    // Use discordId from body if available (passed from manual input) or session
    const finalDiscordId = discordId || (req.session.user ? req.session.user.id : null);

    try {
        db.prepare('INSERT INTO access_requests (user_identity, reason, discord_id, avatar_url) VALUES (?, ?, ?, ?)').run(identity, reason, finalDiscordId, avatarUrl);

        // Notify Admin (optional logging/hook)
        console.log(`New Access Request from ${identity}: ${reason}`);

        res.json({ success: true });
    } catch (err) {
        console.error("Request failed", err);
        res.status(500).json({ error: 'Request failed to save' });
    }
});

// List Requests (Admin only)
router.get('/requests/list', (req, res) => {
    if (!req.session.isAdmin) {
        return res.status(403).json({ error: 'Unauthorized' });
    }
    const requests = db.prepare('SELECT * FROM access_requests ORDER BY created_at DESC').all();
    res.json({ success: true, requests });
});

// Approve Request -> Generate Key (Admin only)
router.post('/requests/approve/:id', (req, res) => {
    if (!req.session.isAdmin) {
        return res.status(403).json({ error: 'Unauthorized' });
    }
    const reqId = req.params.id;
    const { type, uses } = req.body;

    const request = db.prepare('SELECT * FROM access_requests WHERE id = ?').get(reqId);
    if (!request) return res.status(404).json({ error: 'Request not found' });

    const newKey = `sk-${Math.random().toString(36).substring(2, 10)}`;

    db.transaction(() => {
        // 1. Create Key
        db.prepare('INSERT INTO access_keys (key, type, remaining_uses, userId) VALUES (?, ?, ?, ?)').run(newKey, type || 'standard', uses || 1, request.discord_id); // Link to user ID immediately if known
        // 2. Mark Request Approved
        db.prepare('UPDATE access_requests SET status = ?, granted_at = CURRENT_TIMESTAMP WHERE id = ?').run('approved', reqId);
    })();

    res.json({ success: true, key: newKey, user_identity: request.user_identity });
});

// Deny Request (Admin only)
router.post('/requests/deny/:id', (req, res) => {
    if (!req.session.isAdmin) {
        return res.status(403).json({ error: 'Unauthorized' });
    }
    db.prepare('UPDATE access_requests SET status = ? WHERE id = ?').run('denied', req.params.id);
    res.json({ success: true });
});


// Discord Bot Integration Routes (Protected by shared secret or simplified for now)
// Ideally: add middleware to verify a "Bot-Secret" header
router.get('/bot/pending-requests', (req, res) => {
    // SECURITY: In prod, add check here!
    const requests = db.prepare("SELECT * FROM access_requests WHERE status = 'pending'").all();
    res.json(requests);
});

router.post('/bot/approve', (req, res) => {
    const { requestId, key } = req.body;
    db.transaction(() => {
        db.prepare('UPDATE access_requests SET status = "approved" WHERE id = ?').run(requestId);
        // We assume bot generated key or we generate one here? 
        // Let's assume bot sends the key it created/dm'd
        // If we want to store it:
        if (key) {
            // Link key to the requester if possible, but here we just ensure it exists?
            // Actually, usually bot asks API to generate key. 
        }
    })();
    res.json({ success: true });
});

export default router;
