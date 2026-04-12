const express = require('express');
const router = express.Router();
const { get, all, run } = require('../db');
const requireAuth = require('../middleware/auth');

// GET /api/stats — public: get all stats
router.get('/', async (req, res) => {
    try {
        const stats = await all('SELECT * FROM stats ORDER BY id');
        res.json(stats);
    } catch (err) {
        console.error('📊 GET Error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// GET /api/stats/:key — get single stat
router.get('/:key', async (req, res) => {
    try {
        const stat = await get('SELECT * FROM stats WHERE key = ?', [req.params.key]);
        if (!stat) {
            return res.status(404).json({ error: 'Stat not found' });
        }
        res.json(stat);
    } catch (err) {
        console.error('📊 GET single Error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/stats/:key — admin only: update a stat
router.put('/:key', requireAuth, async (req, res) => {
    try {
        const { key } = req.params;
        let { value } = req.body;
        
        if (typeof value === 'string') {
            value = parseInt(value, 10);
        }
        
        if (isNaN(value) || value < 0) {
            return res.status(400).json({ error: 'Invalid value. Must be a positive number.' });
        }

        await run(
            'UPDATE stats SET value = ?, updated_at = CURRENT_TIMESTAMP WHERE key = ?',
            [value, key]
        );

        const updated = await get('SELECT * FROM stats WHERE key = ?', [key]);
        res.json(updated);
    } catch (err) {
        console.error('📊 Put Error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;