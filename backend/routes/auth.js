const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

/**
 * POST /api/auth/login
 * Body: { email, password }
 * Response: { token, expiresIn }
 */
router.post('/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    const validEmail = process.env.ADMIN_EMAIL || 'admin@test.com';
    const validPassword = process.env.ADMIN_PASSWORD || 'adminspan@2026';

    if (email.trim() !== validEmail || password !== validPassword) {
        // Generic message to avoid leaking which field is wrong
        return res.status(401).json({ error: 'Invalid email or password' });
    }

    const secret = process.env.JWT_SECRET || 'span_dev_secret';
    const expiresIn = '8h';
    const token = jwt.sign({ email, role: 'admin' }, secret, { expiresIn });

    res.json({ token, expiresIn, email });
});

/**
 * POST /api/auth/verify
 * Verifies a token and returns the payload (used by frontend on page load)
 */
router.post('/verify', (req, res) => {
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: 'Token required' });

    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET || 'span_dev_secret');
        res.json({ valid: true, payload });
    } catch {
        res.status(401).json({ valid: false, error: 'Invalid or expired token' });
    }
});

module.exports = router;
