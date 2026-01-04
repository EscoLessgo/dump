import express from 'express';
import db from '../db/index.js';
import fetch from 'node-fetch';
import crypto from 'crypto';

const router = express.Router();

const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
const DISCORD_REDIRECT_URI = process.env.DISCORD_REDIRECT_URI || 'https://idump.veroe.space/api/access/auth/discord/callback';

// --- Helpers ---
function generateKey() {
    return 'sk-' + crypto.randomBytes(16).toString('hex');
}

// --- Routes ---

// Verify a key
router.post('/verify', (req, res) => {
    const { key } = req.body;
    if (!key) return res.status(400).json({ error: 'Key required' });

    const keyRow = db.prepare('SELECT * FROM access_keys WHERE key = ? AND status = ?').get(key, 'active');
    if (keyRow) {
        db.prepare('UPDATE access_keys SET lastUsedAt = CURRENT_TIMESTAMP WHERE id = ?').run(keyRow.id);
        res.json({ success: true, key: keyRow.key });
    } else {
        res.status(401).json({ error: 'Invalid or inactive key' });
    }
});

// Request access
router.post('/request', (req, res) => {
    const { contact, reason, method } = req.body;
    if (!contact || !reason) return res.status(400).json({ error: 'Missing fields' });

    try {
        const id = crypto.randomUUID();
        // Check if a key already exists for this contact (if Discord/Email)
        let existing = db.prepare('SELECT * FROM access_keys WHERE (discordId = ? OR email = ?) AND status = ?').get(contact, contact, 'active');

        if (existing) {
            return res.json({ success: true, existingKey: existing.key });
        }

        const key = generateKey();
        db.prepare(`
            INSERT INTO access_keys (id, key, discordId, email, status) 
            VALUES (?, ?, ?, ?, ?)
        `).run(id, key, method === 'Discord' ? contact : null, method === 'Manual' ? contact : null, 'pending');

        console.log(`[ACCESS REQUEST] Method: ${method}, Contact: ${contact}, Key Generated: ${key}`);
        res.json({ success: true });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to process request' });
    }
});

// Discord Auth Initial
router.get('/auth/discord', (req, res) => {
    const url = `https://discord.com/api/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&redirect_uri=${encodeURIComponent(DISCORD_REDIRECT_URI)}&response_type=code&scope=identify%20email`;
    res.redirect(url);
});

// Discord Callback
router.get('/auth/discord/callback', async (req, res) => {
    const { code } = req.query;
    if (!code) return res.status(400).send('No code provided');

    try {
        // Exchange code for token
        const tokenRes = await fetch('https://discord.com/api/oauth2/token', {
            method: 'POST',
            body: new URLSearchParams({
                client_id: DISCORD_CLIENT_ID,
                client_secret: DISCORD_CLIENT_SECRET,
                grant_type: 'authorization_code',
                code,
                redirect_uri: DISCORD_REDIRECT_URI,
            }),
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        });

        const tokenData = await tokenRes.json();
        if (tokenData.error) throw new Error(tokenData.error_description || tokenData.error);

        // Fetch User Info
        const userRes = await fetch('https://discord.com/api/users/@me', {
            headers: { Authorization: `Bearer ${tokenData.access_token}` },
        });
        const userData = await userRes.json();

        // Check if user already has a key
        let existingKey = null;
        const row = db.prepare('SELECT key FROM access_keys WHERE discordId = ? AND status = ?').get(userData.id, 'active');
        if (row) existingKey = row.key;

        // Return a page that posts message to opener
        res.send(`
            <html>
            <body>
                <script>
                    window.opener.postMessage({
                        type: 'DISCORD_VERIFIED',
                        id: '${userData.id}',
                        email: '${userData.email || ""}',
                        username: '${userData.username}',
                        existingKey: ${existingKey ? `'${existingKey}'` : 'null'}
                    }, '*');
                    window.close();
                </script>
                <p>Authenticated! You can close this window.</p>
            </body>
            </html>
        `);
    } catch (e) {
        console.error('Discord Auth Error:', e);
        res.status(500).send('Authentication failed: ' + e.message);
    }
});

export default router;
