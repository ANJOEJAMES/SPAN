const express = require('express');
const router = express.Router();
const { run, get, all } = require('../db');
const requireAuth = require('../middleware/auth');
const cloudinary = require('../config/cloudinary');

function extractPublicIdFromUrl(url) {
    if (!url || typeof url !== 'string') return null;
    
    const match = url.match(/res\.cloudinary\.com\/[^/]+\/image\/upload\/(?:v\d+\/)?(.+)$/);
    if (match && match[1]) {
        let publicId = match[1];
        publicId = publicId.replace(/^[^/]+\//, '');
        publicId = publicId.replace(/\.[^.]+$/, '');
        return publicId;
    }
    return null;
}

// GET /api/posts — list posts with optional search, category, pagination
router.get('/', async (req, res, next) => {
    try {
        const { search = '', category = '', page = 1, limit = 10 } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);
        const params = [];
        let where = 'WHERE 1=1';

        if (search) {
            where += ' AND (title LIKE ? OR excerpt LIKE ?)';
            params.push(`%${search}%`, `%${search}%`);
        }
        if (category) {
            where += ' AND category = ?';
            params.push(category);
        }

        const { total } = await get(`SELECT COUNT(*) as total FROM posts ${where}`, params);
        const posts = await all(
            `SELECT * FROM posts ${where} ORDER BY id DESC LIMIT ? OFFSET ?`,
            [...params, parseInt(limit), offset]
        );

        res.json({ data: posts, total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / parseInt(limit)) });
    } catch (err) { next(err); }
});

// GET /api/posts/:id — single post
router.get('/:id', async (req, res, next) => {
    try {
        const post = await get('SELECT * FROM posts WHERE id = ?', [req.params.id]);
        if (!post) return res.status(404).json({ error: 'Post not found' });
        res.json(post);
    } catch (err) { next(err); }
});

// POST /api/posts/:id/like — increment like count
router.post('/:id/like', async (req, res, next) => {
    try {
        const post = await get('SELECT id FROM posts WHERE id = ?', [req.params.id]);
        if (!post) return res.status(404).json({ error: 'Post not found' });
        await run('UPDATE posts SET likes = likes + 1 WHERE id = ?', [req.params.id]);
        const updated = await get('SELECT likes FROM posts WHERE id = ?', [req.params.id]);
        res.json({ likes: updated.likes });
    } catch (err) { next(err); }
});

// ── Admin-only routes (require JWT) ──────────────────────────────────────────

// POST /api/posts — create a new post
router.post('/', requireAuth, async (req, res, next) => {
    try {
        const { title, image, excerpt, content, author, date, category, is_html } = req.body;
        if (!title || !image || !excerpt || !content) {
            return res.status(400).json({ error: 'title, image, excerpt, and content are required' });
        }
        const { lastID } = await run(
            `INSERT INTO posts (title, image, excerpt, content, author, date, category, likes, comments_count, is_html)
       VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0, ?)`,
            [
                title.trim(), image.trim(), excerpt.trim(), content.trim(),
                (author || 'SPAN Team').trim(),
                date || new Date().toISOString().split('T')[0],
                (category || 'General').trim(),
                is_html ? 1 : 0
            ]
        );
        const newPost = await get('SELECT * FROM posts WHERE id = ?', [lastID]);
        res.status(201).json(newPost);
    } catch (err) { next(err); }
});

// PUT /api/posts/:id — update a post
router.put('/:id', requireAuth, async (req, res, next) => {
    try {
        const post = await get('SELECT * FROM posts WHERE id = ?', [req.params.id]);
        if (!post) return res.status(404).json({ error: 'Post not found' });
        const { title, image, excerpt, content, author, date, category, is_html } = req.body;
        await run(
            `UPDATE posts SET title=COALESCE(?,title), image=COALESCE(?,image), excerpt=COALESCE(?,excerpt),
       content=COALESCE(?,content), author=COALESCE(?,author), date=COALESCE(?,date), category=COALESCE(?,category),
       is_html=COALESCE(?,is_html)
       WHERE id=?`,
            [title, image, excerpt, content, author, date, category, is_html !== undefined ? (is_html ? 1 : 0) : null, req.params.id]
        );
        const updated = await get('SELECT * FROM posts WHERE id = ?', [req.params.id]);
        res.json(updated);
    } catch (err) { next(err); }
});

// DELETE /api/posts/:id — delete a post and its comments
router.delete('/:id', requireAuth, async (req, res, next) => {
    let cloudinaryDeleted = false;
    let publicId = null;
    try {
        const post = await get('SELECT id, image FROM posts WHERE id = ?', [req.params.id]);
        if (!post) return res.status(404).json({ error: 'Post not found' });

        console.log('Deleting post image:', post.image);

        if (post.image && post.image.includes('cloudinary')) {
            publicId = extractPublicIdFromUrl(post.image);
            console.log('Extracted public_id:', publicId);
            if (publicId) {
                try {
                    await cloudinary.uploader.destroy(publicId);
                    cloudinaryDeleted = true;
                    console.log('Cloudinary image deleted successfully');
                } catch (e) {
                    console.warn('Cloudinary delete warning:', e.message);
                }
            }
        }

        await run('DELETE FROM comments WHERE post_id = ?', [req.params.id]);
        await run('DELETE FROM posts WHERE id = ?', [req.params.id]);
        res.json({ message: 'Post deleted successfully', cloudinaryDeleted, publicId });
    } catch (err) { next(err); }
});

module.exports = router;
