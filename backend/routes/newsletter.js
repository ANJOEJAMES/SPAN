const express = require('express');
const router = express.Router();
const { run, all, get } = require('../db');

// DELETE /api/newsletter/subscribers/:id — admin: delete a subscriber (must be before /subscribe)
router.delete('/subscribers/:id', async (req, res) => {
    console.log('DELETE /api/newsletter/subscribers/:id called', req.params.id);
    try {
        const result = await run('DELETE FROM newsletter_subscribers WHERE id = ?', [req.params.id]);
        console.log('Delete result:', result);
        res.json({ message: 'Subscriber deleted' });
    } catch (err) {
        console.error('Delete error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// GET /api/newsletter/subscribers — admin: get all subscribers
router.get('/subscribers', async (req, res, next) => {
    try {
        const subscribers = await all('SELECT * FROM newsletter_subscribers ORDER BY created_at DESC');
        res.json(subscribers);
    } catch (err) { next(err); }
});

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
