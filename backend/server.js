const express = require('express');
const cors = require('cors');
const path = require('path');

// Load environment variables from backend/.env (if it exists)
try { require('dotenv').config({ path: path.join(__dirname, '.env') }); } catch (_) { }

const app = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ───────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Serve static frontend files from the parent directory ────────────────────
app.use(express.static(path.join(__dirname, '..')));

// ── API Routes ────────────────────────────────────────────────────────────────
const postsRouter = require('./routes/posts');
const commentsRouter = require('./routes/comments');
const categoriesRouter = require('./routes/categories');
const newsletterRouter = require('./routes/newsletter');
const uploadRouter = require('./routes/upload');
const authRouter = require('./routes/auth');
const galleryRouter = require('./routes/gallery');

app.use('/api/auth', authRouter);
app.use('/api/posts', postsRouter);
app.use('/api/posts/:id/comments', commentsRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/newsletter', newsletterRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/gallery', galleryRouter);

// ── Health check ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'SPAN Blog API is running' });
});

// ── Global error handler ──────────────────────────────────────────────────────
app.use((err, req, res, next) => {
    console.error('Server error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
});

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
    console.log(`\n🚀 SPAN Blog API running at http://localhost:${PORT}`);
    console.log(`   Blog:        http://localhost:${PORT}/blog.html`);
    console.log(`   Blog Post:   http://localhost:${PORT}/blog-single.html?id=1`);
    console.log(`   Upload API:  POST http://localhost:${PORT}/api/upload`);
    console.log(`   API Docs:    http://localhost:${PORT}/api/posts\n`);
});
