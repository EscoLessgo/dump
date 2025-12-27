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

export default router;
