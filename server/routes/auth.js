import express from 'express';
import { verifyAdminPassword } from '../middleware/auth.js';

const router = express.Router();

router.post('/login', async (req, res) => {
    const { password } = req.body;
    if (await verifyAdminPassword(password)) {
        req.session.isAdmin = true;
        req.session.save((err) => {
            if (err) {
                console.error('Session save error:', err);
                return res.status(500).json({ error: 'Session error' });
            }
            res.json({ success: true });
        });
        return;
    }
    res.status(401).json({ error: 'Invalid' });
});

router.post('/logout', (req, res) => {
    req.session.destroy();
    res.json({ success: true });
});

router.get('/status', (req, res) => {
    res.json({ isAuthenticated: !!(req.session && req.session.isAdmin) });
});

router.get('/force-login/:key', async (req, res) => {
    if (await verifyAdminPassword(req.params.key)) {
        req.session.isAdmin = true;
        return res.redirect('/adminperm');
    }
    res.status(403).send('Denied');
});

import db from '../db/index.js';

// ... (existing helper)

// Login via Google (Client sends profile)
// TODO: Verify ID Token with Firebase Admin in production
router.post('/google', (req, res) => {
    const { email, uid, photoURL } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required' });

    let user = db.prepare('SELECT * FROM users WHERE googleId = ?').get(uid);
    if (!user) {
        user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    }

    const id = uid || ('user-' + Date.now());

    if (!user) {
        try {
            db.prepare('INSERT INTO users (id, email, googleId, avatarUrl) VALUES (?, ?, ?, ?)').run(id, email, uid, photoURL);
            user = { id, email, googleId: uid, avatarUrl: photoURL };
        } catch (e) {
            console.error(e);
            return res.status(500).json({ error: 'Creation failed: ' + e.message });
        }
    } else {
        // Update Google ID if matched by email
        if (!user.googleId) {
            db.prepare('UPDATE users SET googleId = ?, avatarUrl = ? WHERE id = ?').run(uid, photoURL, user.id);
        }
    }

    req.session.user = user;
    req.session.save();
    res.json({ success: true, user });
});

// Link Access Key to current User
router.post('/link-key', (req, res) => {
    if (!req.session.user) return res.status(401).json({ error: 'Not logged in' });
    const { key } = req.body;

    // Check key ownership
    const keyRow = db.prepare('SELECT * FROM access_keys WHERE key = ?').get(key);
    if (!keyRow) return res.status(404).json({ error: 'Key not found' });

    if (keyRow.userId && keyRow.userId !== req.session.user.id) {
        return res.status(403).json({ error: 'Key already used by another account' });
    }

    db.prepare('UPDATE access_keys SET userId = ? WHERE key = ?').run(req.session.user.id, key);
    res.json({ success: true });
});

export default router;
