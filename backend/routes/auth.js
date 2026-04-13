const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { get } = require('../db');

/**
 * POST /api/auth/login
 * Body: { email, password }
 * Response: { token, expiresIn }
 */
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    const admin = await get('SELECT * FROM admin_users WHERE email = ?', [email.trim()]);

    if (!admin) {
        return res.status(401).json({ error: 'Invalid email or password' });
    }

    const passwordMatch = await bcrypt.compare(password, admin.password);
    if (!passwordMatch) {
        return res.status(401).json({ error: 'Invalid email or password' });
    }

    const secret = process.env.JWT_SECRET || 'span_dev_secret';
    const expiresIn = '8h';
    const token = jwt.sign({ email: admin.email, role: admin.role }, secret, { expiresIn });

    res.json({ token, expiresIn, email: admin.email });
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
