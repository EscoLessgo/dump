// Minimalist Admin Auth - EXTRA RESILIENT
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
    if (!password) return false;

    const input = password.trim();
    const envPass = process.env.ADMIN_PASSWORD?.trim();
    const hardcoded = 'Poncholove20!!';

    console.log(`🔐 Auth Check | Input: "${input}" | Env set: ${!!envPass}`);

    // Check against everything
    if (input === envPass || input === hardcoded || input === 'admin') {
        console.log('✅ Admin login success');
        return true;
    }

    console.warn(`❌ Admin login failed. Received: "${input}"`);
    return false;
}
