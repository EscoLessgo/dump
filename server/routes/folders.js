import express from 'express';
import db from '../db/index.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

function generateId() {
    return Math.random().toString(36).substring(2, 10);
}

// LIST ALL FOLDERS
router.get('/', requireAuth, (req, res) => {
    try {
        const folders = db.prepare('SELECT * FROM folders ORDER BY name ASC').all();
        res.json(folders);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// CREATE FOLDER
router.post('/', requireAuth, (req, res) => {
    try {
        const { name } = req.body;
        if (!name) return res.status(400).json({ error: 'Name is required' });

        const id = generateId();
        db.prepare('INSERT INTO folders (id, name) VALUES (?, ?)').run(id, name);
        res.status(201).json({ id, name, success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// GET ONE FOLDER (and its pastes)
router.get('/:id', requireAuth, (req, res) => {
    try {
        const folder = db.prepare('SELECT * FROM folders WHERE id = ?').get(req.params.id);
        if (!folder) return res.status(404).json({ error: 'Folder not found' });

        const pastes = db.prepare('SELECT * FROM pastes WHERE folderId = ? ORDER BY createdAt DESC').all(req.params.id);
        res.json({ ...folder, pastes });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// RENAME FOLDER
router.put('/:id', requireAuth, (req, res) => {
    try {
        const { name } = req.body;
        db.prepare('UPDATE folders SET name = ? WHERE id = ?').run(name, req.params.id);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// DELETE FOLDER
router.delete('/:id', requireAuth, (req, res) => {
    try {
        db.prepare('DELETE FROM folders WHERE id = ?').run(req.params.id);
        // folderId in pastes table is SET NULL on delete
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

export default router;
