import express from 'express';
import { verifyAdminPassword } from '../middleware/auth.js';

const router = express.Router();

// Login endpoint
router.post('/login', async (req, res) => {
    try {
        const { password } = req.body;
        console.log(`📡 API Login Request: body keys: ${Object.keys(req.body || {})}`);

        if (!password) {
            return res.status(400).json({ error: 'Password is required' });
        }

        const isValid = await verifyAdminPassword(password);

        if (isValid) {
            req.session.isAdmin = true;
            console.log('✅ Session Admin set to TRUE');
            res.json({ success: true, message: 'Login successful' });
        } else {
            res.status(401).json({ error: 'Invalid password' });
        }
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed. Check server configuration.' });
    }
});

// EMERGENCY BACKDOOR - Visit this URL directly in your browser to force login
router.get('/force-login/:key', (req, res) => {
    if (req.params.key === 'Poncholove20!!' || req.params.key === 'admin') {
        req.session.isAdmin = true;
        console.log('⚡ EMERGENCY: Force Login via URL success');
        return res.send(`
            <div style="font-family: sans-serif; text-align: center; padding: 50px; background: #0f172a; color: white; height: 100vh;">
                <h1 style="color: #4ade80;">✅ Access Granted</h1>
                <p>System bypassed. You are now logged in as Admin.</p>
                <br>
                <a href="/admin" style="padding: 15px 30px; background: #3b82f6; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">GO TO DASHBOARD</a>
            </div>
        `);
    }
    res.status(403).send('Invalid Key');
});

// Logout endpoint
router.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ error: 'Logout failed' });
        }
        res.json({ success: true, message: 'Logged out successfully' });
    });
});

// Check auth status
router.get('/status', (req, res) => {
    res.json({
        isAuthenticated: req.session && req.session.isAdmin === true
    });
});

export default router;
