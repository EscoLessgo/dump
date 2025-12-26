import bcrypt from 'bcryptjs';

// Middleware to check if user is authenticated for admin routes
export function requireAuth(req, res, next) {
    if (req.session && req.session.isAdmin) {
        return next();
    }

    // For API requests, return JSON error
    if (req.path.startsWith('/api')) {
        return res.status(401).json({ error: 'Unauthorized. Please login as admin.' });
    }

    // For page requests, redirect to login
    res.redirect('/admin/login.html');
}

// Verify admin password
export async function verifyAdminPassword(password) {
    const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH;

    if (!adminPasswordHash) {
        throw new Error('ADMIN_PASSWORD_HASH not set in environment variables');
    }

    return await bcrypt.compare(password, adminPasswordHash);
}

// Generate password hash (utility function)
export async function generatePasswordHash(password) {
    return await bcrypt.hash(password, 10);
}
