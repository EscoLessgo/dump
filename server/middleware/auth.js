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
    // Trim the hash in case there are accidental spaces in Railway dashboard
    const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH?.trim();

    if (!adminPasswordHash) {
        console.error('❌ LOGIN ERROR: ADMIN_PASSWORD_HASH environment variable is NOT set!');
        return false;
    }

    // Diagnostic logging
    console.log(`🔐 Login Attempt | PWD Len: ${password?.length} | Hash Len: ${adminPasswordHash.length}`);

    try {
        const match = await bcrypt.compare(password, adminPasswordHash);
        if (!match) {
            console.warn('❌ LOGIN FAILED: Password did not match the hash provided.');
        } else {
            console.log('✅ LOGIN SUCCESS');
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
