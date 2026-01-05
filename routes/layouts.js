const express = require('express');
const router = express.Router();
const { Layout, createLayout } = require('../config/memoryDb');

// GET all layouts
router.get('/', async (req, res) => {
    try {
        const layouts = await Layout.find({ isActive: true });
        res.json({
            success: true,
            count: layouts.length,
            data: layouts
        });
    } catch (error) {
        console.error('Error fetching layouts:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching layouts',
            error: error.message
        });
    }
});

// GET single layout by ID
router.get('/:id', async (req, res) => {
    try {
        const layout = await Layout.findById(req.params.id);
        if (!layout) {
            return res.status(404).json({
                success: false,
                message: 'Layout not found'
            });
        }
        res.json({
            success: true,
            data: layout
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching layout',
            error: error.message
        });
    }
});

// POST create new layout
router.post('/', async (req, res) => {
    try {
        const layout = createLayout(req.body);
        await layout.save();
        res.status(201).json({
            success: true,
            message: 'Layout created successfully',
            data: layout
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error creating layout',
            error: error.message
        });
    }
});

// PUT update layout
router.put('/:id', async (req, res) => {
    try {
        const layout = await Layout.findByIdAndUpdate(req.params.id, req.body);
        if (!layout) {
            return res.status(404).json({
                success: false,
                message: 'Layout not found'
            });
        }
        res.json({
            success: true,
            message: 'Layout updated successfully',
            data: layout
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error updating layout',
            error: error.message
        });
    }
});

// DELETE layout
router.delete('/:id', async (req, res) => {
    try {
        const layout = await Layout.findByIdAndDelete(req.params.id);
        if (!layout) {
            return res.status(404).json({
                success: false,
                message: 'Layout not found'
            });
        }
        res.json({
            success: true,
            message: 'Layout deleted successfully',
            data: layout
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting layout',
            error: error.message
        });
    }
});

module.exports = router;
