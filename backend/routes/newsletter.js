const express = require('express');
const router = express.Router();
const { run } = require('../db');

// POST /api/newsletter/subscribe
router.post('/subscribe', async (req, res, next) => {
    try {
        const { email } = req.body;
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({ error: 'A valid email address is required' });
        }
        await run(
            'INSERT INTO newsletter_subscribers (email) VALUES (?)',
            [email.trim().toLowerCase()]
        );
        res.json({ message: 'Thank you for subscribing to our newsletter!' });
    } catch (err) {
        if (err.message && err.message.includes('UNIQUE constraint failed')) {
            return res.status(409).json({ error: 'This email is already subscribed.' });
        }
        next(err);
    }
});

module.exports = router;
