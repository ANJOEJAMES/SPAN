const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('../config/cloudinary');

// Use memory storage — file never hits the disk, goes straight to Cloudinary
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB max
    fileFilter: (req, file, cb) => {
        const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        if (allowed.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Only JPEG, PNG, WEBP, and GIF images are accepted'));
        }
    }
});

/**
 * POST /api/upload
 * Body: multipart/form-data with field "image"
 * Optional body fields:
 *   folder  (string) — Cloudinary folder, defaults to "span-blog"
 *   caption (string) — stored as alt text in Cloudinary metadata
 *
 * Response: { url, public_id, width, height, format }
 */
router.post('/', upload.single('image'), async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No image file provided. Use field name "image".' });
        }

        const folder = req.body.folder || 'span-blog';
        const caption = req.body.caption || '';

        // Upload buffer directly to Cloudinary using upload_stream
        const result = await new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
                {
                    folder,
                    context: caption ? { alt: caption } : undefined,
                    resource_type: 'image',
                    // Auto-optimize: convert to WebP, apply quality auto
                    transformation: [
                        { quality: 'auto', fetch_format: 'auto' }
                    ]
                },
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                }
            );
            stream.end(req.file.buffer);
        });

        res.json({
            url: result.secure_url,
            public_id: result.public_id,
            width: result.width,
            height: result.height,
            format: result.format
        });
    } catch (err) {
        if (err.message && err.message.startsWith('Only')) {
            return res.status(400).json({ error: err.message });
        }
        // Cloudinary config errors
        if (err.error && err.error.http_code === 401) {
            return res.status(500).json({ error: 'Cloudinary authentication failed. Check your CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.' });
        }
        next(err);
    }
});

/**
 * DELETE /api/upload/:public_id
 * Deletes an image from Cloudinary by its public_id
 * Note: public_id with folder looks like "span-blog/abc123" — URL-encode the slash
 */
router.delete('/:public_id(*)', async (req, res, next) => {
    try {
        const result = await cloudinary.uploader.destroy(req.params.public_id);
        if (result.result === 'ok') {
            res.json({ message: 'Image deleted successfully' });
        } else {
            res.status(404).json({ error: 'Image not found or already deleted' });
        }
    } catch (err) { next(err); }
});

module.exports = router;
