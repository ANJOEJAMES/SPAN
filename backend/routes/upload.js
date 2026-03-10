const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
// const fs = require('fs');  // Not needed – all storage is handled by Cloudinary
const cloudinary = require('../config/cloudinary');

// ── Local uploads directory (commented out – using Cloudinary in production) ──
// const uploadDir = path.join(__dirname, '../../uploads');
// try {
//     if (!fs.existsSync(uploadDir)) {
//         fs.mkdirSync(uploadDir, { recursive: true });
//     }
// } catch (err) {
//     console.warn('Could not create uploads directory.');
// }

// Use memory storage so files are streamed directly to Cloudinary
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
 *
 * Response: { url, public_id, width, height, format }
 */
router.post('/', upload.single('image'), async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No image file provided. Use field name "image".' });
        }

        // ── Local disk storage (commented out – Cloudinary is used instead) ──
        // const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        // const filename = uniqueSuffix + path.extname(req.file.originalname);
        // const filepath = path.join(uploadDir, filename);
        // try {
        //     await fs.promises.writeFile(filepath, req.file.buffer);
        //     url = `/uploads/${filename}`;
        //     public_id = filename;
        // } catch (localErr) {
        //     console.error('Local upload failed:', localErr.message);
        // }

        const folder = req.body.folder || 'span-blog';
        const caption = req.body.caption || '';

        const result = await new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
                {
                    folder,
                    context: caption ? { alt: caption } : undefined,
                    resource_type: 'image',
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
        if (err.error && err.error.http_code === 401) {
            return res.status(500).json({ error: 'Cloudinary authentication failed. Check your API keys.' });
        }
        next(err);
    }
});

/**
 * DELETE /api/upload/:public_id
 * Deletes an image from Cloudinary by its public_id
 */
router.delete('/:public_id(*)', async (req, res, next) => {
    try {
        const public_id = req.params.public_id;

        // ── Local file delete (commented out – using Cloudinary instead) ──
        // const filepath = path.join(uploadDir, public_id);
        // if (fs.existsSync(filepath)) {
        //     try {
        //         fs.unlinkSync(filepath);
        //         return res.json({ message: 'Image deleted successfully' });
        //     } catch (err) {
        //         console.warn('Could not delete local file:', err.message);
        //     }
        // }

        const result = await cloudinary.uploader.destroy(public_id);
        if (result.result === 'ok' || result.result === 'not_found') {
            res.json({ message: 'Image deleted successfully' });
        } else {
            res.status(404).json({ error: 'Image not found or already deleted' });
        }
    } catch (err) { next(err); }
});

module.exports = router;
