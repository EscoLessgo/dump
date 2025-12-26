// Minimalist Admin Auth - No hashing, just plain text
export function requireAuth(req, res, next) {
    if (req.session && req.session.isAdmin) {
        return next();
    }

    if (req.path.startsWith('/api')) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    res.redirect('/adminperm/login.html');
}

export async function verifyAdminPassword(password) {
    // Priority: Env var, fallback to hardcoded
    const adminPassword = process.env.ADMIN_PASSWORD?.trim() || 'Poncholove20!!';

    if (password === adminPassword) {
        console.log('✅ Admin login success (Plain Text)');
        return true;
    }

    console.warn(`❌ Admin login failed. Expected: ${adminPassword}, Got: ${password}`);
    return false;
}
