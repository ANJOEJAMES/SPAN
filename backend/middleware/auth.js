const jwt = require('jsonwebtoken');

/**
 * Middleware that verifies a Bearer JWT token.
 * Attach as middleware to any route that requires admin authentication.
 */
function requireAuth(req, res, next) {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized — no token provided' });
    }

    const token = authHeader.slice(7); // strip "Bearer "
    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET || 'span_dev_secret');
        req.admin = payload;
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Unauthorized — invalid or expired token' });
    }
}

module.exports = requireAuth;
