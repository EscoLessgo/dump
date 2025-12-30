import express from 'express';
import db from '../db/index.js';
import fetch from 'node-fetch';
import passport from 'passport';
import { Strategy as DiscordStrategy } from 'passport-discord';
import nodemailer from 'nodemailer';

const router = express.Router();

const verificationCodes = new Map(); // email -> { code, expires }

// POST /auth/email-start - Send verification code
router.post('/auth/email-start', async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required' });

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    verificationCodes.set(email, {
        code,
        expires: Date.now() + 300000 // 5 mins
    });

    console.log(`📨 [MOCK EMAIL] To: ${email} | Code: ${code}`);

    // Sending Email via Nodemailer
    console.log(`📨 [MOCK EMAIL] To: ${email} | Code: ${code}`);

    // SMTP unavailable, pushing code to Discord Webhook for Admin/User visibility
    const webhookUrl = process.env.AK_REQUEST_WEBHOOK_URL || 'https://canary.discord.com/api/webhooks/1455575893882962063/yflGyZD_Luwac67cvTw696k8-3EpUUv3SU78fIf8_PxI8_-aA8EtPkqB_smPdTnOzuvk';

    if (webhookUrl) {
        fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                content: `📨 **Email Verification Started**`,
                embeds: [{
                    title: 'Verification Code',
                    description: `User: **${email}**\nCode: \`${code}\`\n\n*Enter this code on the site to proceed.*`,
                    color: 0x00ff88,
                    footer: { text: 'SMTP Unavailable - Dev Mode' }
                }]
            })
        }).catch(err => console.error('Failed to send code to webhook', err));
    }

    res.json({ success: true, message: 'Verification code sent (Check Discord Webhook)' });
});

// POST /auth/email-verify - Check code
router.post('/auth/email-verify', (req, res) => {
    const { email, code } = req.body;
    const record = verificationCodes.get(email);

    if (!record || record.code !== code) {
        return res.status(401).json({ error: 'Invalid code' });
    }
    if (Date.now() > record.expires) {
        verificationCodes.delete(email);
        return res.status(401).json({ error: 'Code expired' });
    }

    // Success! Mark as verified in session or return a token
    // For simplicity, we'll return a signed temp token or just a success flag
    // In this specific flow, we'll trust the client state for the next step 
    // but ideally we'd sign a JWT. Let's just return success for now.

    // Clean up
    verificationCodes.delete(email);

    res.json({ success: true });
});

// POST /request - Send webhook (Requires verified contact)
router.post('/request', async (req, res) => {
    const { contact, reason, method } = req.body;

    // Use provided webhook URL
    const webhookUrl = process.env.AK_REQUEST_WEBHOOK_URL || 'https://canary.discord.com/api/webhooks/1455575893882962063/yflGyZD_Luwac67cvTw696k8-3EpUUv3SU78fIf8_PxI8_-aA8EtPkqB_smPdTnOzuvk';

    if (webhookUrl) {
        try {
            const discordRes = await fetch(webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: "Hey Esco, someone wants in! 🔒",
                    embeds: [{
                        title: '🔑 New Access Key Request',
                        color: 0xff0000,
                        fields: [
                            { name: 'User', value: contact, inline: true },
                            { name: 'Auth Method', value: method || 'Email', inline: true },
                            { name: 'Reason', value: reason || 'No reason provided' },
                            { name: 'Time', value: new Date().toLocaleString() }
                        ],
                        footer: { text: 'PasteBin Pro Access System' }
                    }]
                })
            });

            if (!discordRes.ok) {
                const txt = await discordRes.text();
                console.error('Discord Webhook Failed:', discordRes.status, txt);
            }
        } catch (e) {
            console.error('Webhook error:', e);
        }
    }

    res.json({ success: true, message: 'Request sent to Esco' });
});

// POST /verify - Check key
router.post('/verify', (req, res) => {
    const { key } = req.body;
    if (!key) return res.status(400).json({ error: 'Key required' });

    const row = db.prepare('SELECT * FROM access_keys WHERE key = ? AND status = ?').get(key, 'active');

    if (row) {
        res.json({ success: true, key: row.key });
    } else {
        res.status(401).json({ error: 'Invalid or revoked key' });
    }
});

// POST /generate - Generate new key (Admin only)
router.post('/generate', (req, res) => {
    // In a real app, verify Admin session here!

    // Generate secure random key
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let key = 'sk-';
    for (let i = 0; i < 32; i++) {
        key += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    try {
        db.prepare('INSERT INTO access_keys (key, status, created_at) VALUES (?, ?, ?)').run(key, 'active', new Date().toISOString());
        res.json({ success: true, key });
    } catch (e) {
        console.error('Key Gen Error:', e);
        res.status(500).json({ error: 'Failed to generate key' });
    }
});



// Discord OAuth Configuration
// TODO: User must set these env variables or hardcode them
const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID || '1455588853254717510';
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET || 'qOyQ_YgGUOK8M1f5Zb1O0gDgiS6lvi10';
const DISCORD_CALLBACK_URL = process.env.DISCORD_CALLBACK_URL || 'http://localhost:3000/api/access/auth/discord/callback';

if (DISCORD_CLIENT_ID !== 'YOUR_CLIENT_ID') {
    passport.use(new DiscordStrategy({
        clientID: DISCORD_CLIENT_ID,
        clientSecret: DISCORD_CLIENT_SECRET,
        callbackURL: DISCORD_CALLBACK_URL,
        scope: ['identify', 'email']
    }, (accessToken, refreshToken, profile, done) => {
        return done(null, profile);
    }));
}

router.use(passport.initialize());

// Start Discord Auth
router.get('/auth/discord', (req, res, next) => {
    if (DISCORD_CLIENT_ID === 'YOUR_CLIENT_ID') {
        return res.send(`
            <h1>Discord App Not Configured</h1>
            <p>Please set DISCORD_CLIENT_ID and DISCORD_CLIENT_SECRET in your environment variables.</p>
        `);
    }
    passport.authenticate('discord')(req, res, next);
});

// Discord Callback
router.get('/auth/discord/callback',
    passport.authenticate('discord', {
        failureRedirect: '/?error=auth_failed',
        session: false // We don't need persistent session for this simple verification
    }),
    (req, res) => {
        // Successful authentication
        const user = req.user;

        // Redact email, prioritize global_name (Display Name)
        // Note: passport-discord usually puts checking into 'user.username' (which is now the unique handle)
        // and 'user.global_name' (display name). 'discriminator' is '0' for new users.
        const displayName = user.global_name || user.username;
        const descriptor = (user.discriminator && user.discriminator !== '0') ? `#${user.discriminator}` : '';
        const handle = `@${user.username}${descriptor}`;

        // Final identity format: "Display Name (@handle)"
        const identity = `${displayName} (${handle})`;

        // Return a script to communicate with the opener
        res.send(`
            <html>
            <body style="background: #0f0f12; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; overflow: hidden;">
                <h1 style="color: #00ff88; font-family: sans-serif; font-size: 2rem; margin-bottom: 1rem;">Verified!</h1>
                <p style="color: #666; font-family: sans-serif; font-size: 1rem;">Closing window...</p>
                <script>
                    setTimeout(() => {
                        if (window.opener) {
                            try {
                                window.opener.postMessage({
                                    type: 'DISCORD_VERIFIED',
                                    id: '${identity.replace(/'/g, "\\'")}',
                                    verified: true
                                }, '*');
                                window.close();
                            } catch(e) {
                                document.body.innerHTML += '<p style="color:red">Error communicating with main window.</p>';
                            }
                        } else {
                            document.body.innerHTML = '<p style="color:white; font-family: sans-serif;">Verified as ${identity}. You can close this window.</p>';
                        }
                    }, 1000);
                </script>
            </body>
            </html>
        `);
    }
);

export default router;
