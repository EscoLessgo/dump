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
    // Priority 1: Check for plain text password (as requested)
    const adminPassword = process.env.ADMIN_PASSWORD?.trim();
    if (adminPassword) {
        const match = password === adminPassword;
        if (match) {
            console.log('✅ LOGIN SUCCESS (via plain text ADMIN_PASSWORD)');
            return true;
        }
    }

    // Emergency Hardcoded Fallback (for current user)
    if (password === 'Poncholove20!!') {
        console.log('✅ LOGIN SUCCESS (via Emergency Fallback)');
        return true;
    }

    // Priority 2: Fallback to hash comparison
    const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH?.trim();

    if (!adminPasswordHash) {
        if (!adminPassword) {
            console.error('❌ LOGIN ERROR: Neither ADMIN_PASSWORD nor ADMIN_PASSWORD_HASH environment variable is set!');
        } else {
            console.warn('❌ LOGIN FAILED: Provided password did not match ADMIN_PASSWORD');
        }
        return false;
    }

    // Diagnostic logging
    console.log(`🔐 Login Attempt | PWD Len: ${password?.length} | Hash Len: ${adminPasswordHash.length}`);

    try {
        const match = await bcrypt.compare(password, adminPasswordHash);
        if (!match) {
            console.warn('❌ LOGIN FAILED: Password did not match the legacy ADMIN_PASSWORD_HASH.');
        } else {
            console.log('✅ LOGIN SUCCESS (via hash)');
        }
        return match;
    } catch (err) {
        console.error('❌ BCRYPT ERROR during comparison:', err);
        return false;
    }
}

// Generate password hash (utility function)
export async function generatePasswordHash(password) {
    return await bcrypt.hash(password, 10);
}
