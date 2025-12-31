import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import session from 'express-session';
import path from 'path';
import { fileURLToPath } from 'url';
import pastesRouter from './routes/pastes.js';
import authRouter from './routes/auth.js';
import foldersRouter from './routes/folders.js';
import imagesRouter from './routes/images.js';
import db from './db/index.js';
import sqlite3SessionStore from 'better-sqlite3-session-store';
const SqliteStore = sqlite3SessionStore(session);

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Important for deployment
app.set('trust proxy', 1);

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use(session({
    store: new SqliteStore({
        client: db,
        expired: {
            clear: true,
            intervalMs: 900000 // 15 mins
        }
    }),
    secret: process.env.SESSION_SECRET || 'minimal-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000 // 1 week
    }
}));

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/pastes', pastesRouter);
app.use('/api/folders', foldersRouter);
app.use('/api/images', imagesRouter);

// Static Folders
app.use('/shared', express.static(path.join(__dirname, '..', 'shared')));
app.use('/public', express.static(path.join(__dirname, '..', 'public')));
app.use('/uploads', express.static(process.env.RAILWAY_VOLUME_MOUNT_PATH
    ? path.join(process.env.RAILWAY_VOLUME_MOUNT_PATH, 'uploads')
    : path.join(__dirname, '..', 'public', 'uploads')));

// Redirect /admin to /adminperm for convenience
app.get('/admin', (req, res) => res.redirect('/adminperm'));

// Admin Section (/adminperm)
app.use('/adminperm', (req, res, next) => {
    if (req.path === '/login.html' || req.path.match(/\.(css|js|jpg|png|svg|ico)$/)) {
        return next();
    }
    if (!req.session || !req.session.isAdmin) {
        return res.redirect('/adminperm/login.html');
    }
    next();
}, express.static(path.join(__dirname, '..', 'admin')));

// Access Router
import accessRouter from './routes/access.js';
app.use('/api/access', accessRouter);

// Root Redirect/Entry
app.get('/', (req, res) => {
    // Show the entry screen
    res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// Public Viewer - SPA Redirects
app.get('/public', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// Short URL for viewing pastes: /v/ID
app.get('/v/:id', (req, res) => {
    // Serve index.html for SPA routing
    res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// Error handling
app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).send('Internal Server Error');
});

app.listen(PORT, () => {
    console.log(`🚀 Minimalist PasteBin Ready!`);
    console.log(`🌍 Public: http://localhost:${PORT}`);
    console.log(`🔐 Admin:  http://localhost:${PORT}/adminperm`);
});
