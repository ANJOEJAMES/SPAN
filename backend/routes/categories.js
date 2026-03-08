const express = require('express');
const router = express.Router();
const { run, all, get } = require('../db');
const jwt = require('jsonwebtoken');

// Inline auth middleware for protected routes
function verifyToken(req, res, next) {
    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'Authentication required' });
    try {
        req.user = jwt.verify(token, process.env.JWT_SECRET || 'span_dev_secret');
        next();
    } catch {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
}

// ============================================================================
// BLOG CATEGORIES
// ============================================================================

// GET /api/categories/blog (Public)
router.get('/blog', async (req, res, next) => {
    try {
        // Return active categories sorted by usage count, then name
        const categories = await all(`
            SELECT bc.id, bc.name, COUNT(p.id) as usage_count
            FROM blog_categories bc
            LEFT JOIN posts p ON p.category = bc.name
            GROUP BY bc.id
            ORDER BY usage_count DESC, bc.name ASC
        `);
        res.json(categories);
    } catch (err) { next(err); }
});

// POST /api/categories/blog (Admin Only)
router.post('/blog', verifyToken, async (req, res, next) => {
    try {
        const { name } = req.body;
        if (!name || !name.trim()) return res.status(400).json({ error: 'Category name is required' });

        const trimmedName = name.trim();
        const existing = await get('SELECT id FROM blog_categories WHERE name = ? COLLATE NOCASE', [trimmedName]);
        if (existing) return res.status(400).json({ error: 'Category already exists' });

        const result = await run('INSERT INTO blog_categories (name) VALUES (?)', [trimmedName]);
        const newCat = await get('SELECT * FROM blog_categories WHERE id = ?', [result.lastID]);
        res.status(201).json(newCat);
    } catch (err) { next(err); }
});

// DELETE /api/categories/blog/:id (Admin Only)
router.delete('/blog/:id', verifyToken, async (req, res, next) => {
    try {
        await run('DELETE FROM blog_categories WHERE id = ?', [req.params.id]);
        res.json({ message: 'Blog category deleted' });
    } catch (err) { next(err); }
});

// ============================================================================
// GALLERY CATEGORIES
// ============================================================================

// GET /api/categories/gallery (Public)
router.get('/gallery', async (req, res, next) => {
    try {
        const categories = await all(`
            SELECT gc.id, gc.name, gc.slug, COUNT(gp.id) as usage_count
            FROM gallery_categories gc
            LEFT JOIN gallery_photos gp ON gp.tag = gc.slug
            GROUP BY gc.id
            ORDER BY gc.name ASC
        `);
        res.json(categories);
    } catch (err) { next(err); }
});

// POST /api/categories/gallery (Admin Only)
router.post('/gallery', verifyToken, async (req, res, next) => {
    try {
        const { name } = req.body;
        if (!name || !name.trim()) return res.status(400).json({ error: 'Category name is required' });

        const trimmedName = name.trim();
        // Generate a URL-safe slug (e.g., "Health & Medical" -> "health-medical")
        const slug = trimmedName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

        if (!slug) return res.status(400).json({ error: 'Invalid category name' });

        const existing = await get('SELECT id FROM gallery_categories WHERE slug = ?', [slug]);
        if (existing) return res.status(400).json({ error: 'A visually similar category already exists' });

        const result = await run('INSERT INTO gallery_categories (name, slug) VALUES (?, ?)', [trimmedName, slug]);
        const newCat = await get('SELECT * FROM gallery_categories WHERE id = ?', [result.lastID]);
        res.status(201).json(newCat);
    } catch (err) { next(err); }
});

// DELETE /api/categories/gallery/:id (Admin Only)
router.delete('/gallery/:id', verifyToken, async (req, res, next) => {
    try {
        await run('DELETE FROM gallery_categories WHERE id = ?', [req.params.id]);
        res.json({ message: 'Gallery category deleted' });
    } catch (err) { next(err); }
});

// Backward compatibility for old blog frontend fetching basic counts
router.get('/', async (req, res, next) => {
    try {
        const categories = await all('SELECT category AS name, COUNT(*) AS count FROM posts GROUP BY category ORDER BY count DESC');
        res.json(categories);
    } catch (err) { next(err); }
});

module.exports = router;
