import express from 'express';
import db from '../db/index.js';
import fetch from 'node-fetch';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

function generateId() {
    return Math.random().toString(36).substring(2, 10);
}

function getClientIP(req) {
    return req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress || '127.0.0.1';
}

// CREATE (Admin only)
router.post('/', requireAuth, async (req, res) => {
    try {
        const { title, content, language, expiresAt, isPublic } = req.body;
        const id = generateId();

        db.prepare('INSERT INTO pastes (id, title, content, language, expiresAt, isPublic) VALUES (?, ?, ?, ?, ?, ?)')
            .run(id, title || 'Untitled', content, language || 'plaintext', expiresAt || null, isPublic !== false ? 1 : 0);

        res.status(201).json({ id, success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// PUBLIC LIST (Only shows public ones)
router.get('/public-list', (req, res) => {
    try {
        const list = db.prepare('SELECT id, title, views, createdAt FROM pastes WHERE isPublic = 1 ORDER BY createdAt DESC').all();
        res.json(list);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// GET ONE
router.get('/:id', (req, res) => {
    try {
        const paste = db.prepare('SELECT * FROM pastes WHERE id = ?').get(req.params.id);
        if (!paste) return res.status(404).json({ error: 'Not found' });

        if (paste.isPublic === 0 && (!req.session || !req.session.isAdmin)) {
            return res.status(403).json({ error: 'Private paste' });
        }

        db.prepare('UPDATE pastes SET views = views + 1 WHERE id = ?').run(req.params.id);
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

// ANALYTICS (Minimalist)
router.get('/:id/analytics', requireAuth, (req, res) => {
    const views = db.prepare('SELECT * FROM paste_views WHERE pasteId = ? ORDER BY timestamp DESC LIMIT 100').all(req.params.id);
    res.json({ views });
});

export default router;
