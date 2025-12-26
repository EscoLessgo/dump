import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import session from 'express-session';
import path from 'path';
import { fileURLToPath } from 'url';
import pastesRouter from './routes/pastes.js';
import authRouter from './routes/auth.js';
import { requireAuth } from './middleware/auth.js';
import migrate from './db/migrate.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// CORS configuration
// CORS configuration
const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps, curl, or standard browser navigations)
        if (!origin) return callback(null, true);

        // Get allowed origins from env
        const allowedOrigins = process.env.CORS_ORIGINS?.split(',') || ['*'];

        // Check if we should allow this origin
        // 1. If '*' is configured, we allow everyone (by reflecting the origin)
        // 2. Or if the specific origin is in the list
        if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            console.log('Blocked by CORS:', origin);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Session middleware
app.use(session({
    secret: process.env.SESSION_SECRET || 'pastebin-secret-change-this-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Request logging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Auth routes (public - for login)
app.use('/api/auth', authRouter);

// API Routes (protected - requires admin login)
app.use('/api/pastes', requireAuth, pastesRouter);

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// Serve static files
// Public interface - no auth required
app.use('/public', express.static(path.join(__dirname, '..', 'public')));
app.use('/shared', express.static(path.join(__dirname, '..', 'shared')));

// Admin interface - auth required (except login page)
app.use('/admin', (req, res, next) => {
    // Allow login page and assets without auth
    if (req.path === '/login.html' || req.path.match(/\.(css|js|jpg|png|svg|ico)$/)) {
        return next();
    }

    // Require auth for everything else
    if (!req.session || !req.session.isAdmin) {
        return res.redirect('/admin/login.html');
    }

    next();
}, express.static(path.join(__dirname, '..', 'admin')));

// Root redirect
app.get('/', (req, res) => {
    res.redirect('/admin');
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Start server
async function startServer() {
    try {
        // Run migrations
        console.log('🔄 Running database migrations...');
        await migrate();

        // Start listening
        app.listen(PORT, () => {
            console.log('');
            console.log('🚀 PasteBin Pro Server Started!');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log(`📍 Server running on port ${PORT}`);
            console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log('');
            console.log('📱 Access points:');
            console.log(`   Admin:  http://localhost:${PORT}/admin`);
            console.log(`   Public: http://localhost:${PORT}/public`);
            console.log(`   API:    http://localhost:${PORT}/api`);
            console.log(`   Health: http://localhost:${PORT}/api/health`);
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('');
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

startServer();

export default app;
