const express = require('express');
const router = express.Router();
const { run, all } = require('../db');

// GET all testimonials
router.get('/', async (req, res) => {
    try {
        const query = `
            SELECT id, quote, author, designation, created_at 
            FROM testimonials 
            ORDER BY created_at DESC
        `;
        const testimonials = await all(query);
        res.json(testimonials);
    } catch (err) {
        console.error('Error fetching testimonials:', err);
        res.status(500).json({ error: 'Failed to fetch testimonials' });
    }
});

// POST a new testimonial
router.post('/', async (req, res) => {
    const { quote, author, designation } = req.body;

    if (!quote || !author || !designation) {
        return res.status(400).json({ error: 'Quote, author, and designation are required' });
    }

    try {
        const query = `
            INSERT INTO testimonials (quote, author, designation)
            VALUES (?, ?, ?)
        `;
        const { lastID } = await run(query, [quote, author, designation]);
        res.status(201).json({ id: lastID, message: 'Testimonial added successfully' });
    } catch (err) {
        console.error('Error adding testimonial:', err);
        res.status(500).json({ error: 'Failed to add testimonial' });
    }
});

// DELETE a testimonial by ID
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    
    try {
        const query = 'DELETE FROM testimonials WHERE id = ?';
        const result = await run(query, [id]);
        
        if (result.changes === 0) {
            return res.status(404).json({ error: 'Testimonial not found' });
        }
        res.json({ message: 'Testimonial deleted successfully' });
    } catch (err) {
        console.error('Error deleting testimonial:', err);
        res.status(500).json({ error: 'Failed to delete testimonial' });
    }
});

module.exports = router;
