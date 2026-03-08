const express = require('express');
const router = express.Router({ mergeParams: true });
const { run, get, all } = require('../db');

// GET /api/posts/:id/comments
router.get('/', async (req, res, next) => {
    try {
        const post = await get('SELECT id FROM posts WHERE id = ?', [req.params.id]);
        if (!post) return res.status(404).json({ error: 'Post not found' });
        const comments = await all(
            'SELECT * FROM comments WHERE post_id = ? ORDER BY created_at DESC',
            [req.params.id]
        );
        res.json(comments);
    } catch (err) { next(err); }
});

// POST /api/posts/:id/comments
router.post('/', async (req, res, next) => {
    try {
        const { name, email, message } = req.body;
        if (!name || !email || !message) {
            return res.status(400).json({ error: 'name, email, and message are required' });
        }
        const post = await get('SELECT id FROM posts WHERE id = ?', [req.params.id]);
        if (!post) return res.status(404).json({ error: 'Post not found' });

        const { lastID } = await run(
            'INSERT INTO comments (post_id, name, email, message) VALUES (?, ?, ?, ?)',
            [req.params.id, name.trim(), email.trim(), message.trim()]
        );
        await run('UPDATE posts SET comments_count = comments_count + 1 WHERE id = ?', [req.params.id]);
        const newComment = await get('SELECT * FROM comments WHERE id = ?', [lastID]);
        res.status(201).json(newComment);
    } catch (err) { next(err); }
});

module.exports = router;
