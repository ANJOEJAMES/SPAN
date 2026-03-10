const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { run, get, all } = require('../db');
// const fs = require('fs');    // Not needed – file deletion is handled by Cloudinary
// const path = require('path');
const cloudinary = require('../config/cloudinary');

// Inline auth middleware (auth.js does not export a middleware function)
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


// ── GET /api/gallery  — public ──────────────────────────────────────────────
// Optional ?tag=slug
router.get('/', async (req, res, next) => {
    try {
        const { tag } = req.query;
        let sql = 'SELECT * FROM gallery_photos';
        const params = [];
        if (tag) {
            sql += ' WHERE tag = ?';
            params.push(tag);
        }
        sql += ' ORDER BY sort_order ASC, id DESC';
        const photos = await all(sql, params);
        res.json(photos);
    } catch (err) { next(err); }
});

// ── POST /api/gallery  — admin only ─────────────────────────────────────────
// Body: { image, public_id, title, tag }
router.post('/', verifyToken, async (req, res, next) => {
    try {
        const { image, public_id, title, tag } = req.body;
        if (!image) return res.status(400).json({ error: 'image URL is required' });
        if (!tag) return res.status(400).json({ error: 'tag is required' });

        const result = await run(
            'INSERT INTO gallery_photos (image, public_id, title, tag) VALUES (?, ?, ?, ?)',
            [image, public_id || '', title || '', tag]
        );
        const photo = await get('SELECT * FROM gallery_photos WHERE id = ?', [result.lastID]);
        res.status(201).json(photo);
    } catch (err) { next(err); }
});

// ── DELETE /api/gallery/:id  — admin only ───────────────────────────────────
router.delete('/:id', verifyToken, async (req, res, next) => {
    try {
        const photo = await get('SELECT * FROM gallery_photos WHERE id = ?', [req.params.id]);
        if (!photo) return res.status(404).json({ error: 'Photo not found' });

        // ── Local file delete (commented out – using Cloudinary instead) ──
        // if (photo.public_id) {
        //     try {
        //         const filepath = path.join(__dirname, '../../uploads', photo.public_id);
        //         if (fs.existsSync(filepath)) {
        //             fs.unlinkSync(filepath);
        //         }
        //     } catch (e) {
        //         console.warn('Local file delete warning:', e.message);
        //     }
        // }

        // Delete from Cloudinary if a public_id is stored
        if (photo.public_id) {
            try {
                await cloudinary.uploader.destroy(photo.public_id);
            } catch (e) {
                console.warn('Cloudinary delete warning:', e.message);
            }
        }

        await run('DELETE FROM gallery_photos WHERE id = ?', [req.params.id]);
        res.json({ message: 'Photo deleted successfully' });
    } catch (err) { next(err); }
});

module.exports = router;
