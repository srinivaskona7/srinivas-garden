const express = require('express');
const router = express.Router();
const Garden = require('../models/Garden');
const Plant = require('../models/Plant');

// GET all gardens
router.get('/', async (req, res) => {
    try {
        const {
            location,
            gardenType,
            isActive,
            search,
            sort = '-createdAt',
            limit = 50,
            page = 1
        } = req.query;

        const query = {};

        if (location) query.location = location;
        if (gardenType) query.gardenType = gardenType;
        if (isActive !== undefined) query.isActive = isActive === 'true';
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const gardens = await Garden.find(query)
            .populate('plants')
            .sort(sort)
            .limit(parseInt(limit))
            .skip(skip);

        const total = await Garden.countDocuments(query);

        res.json({
            success: true,
            count: gardens.length,
            total,
            page: parseInt(page),
            pages: Math.ceil(total / parseInt(limit)),
            data: gardens
        });
    } catch (error) {
        console.error('Error fetching gardens:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching gardens',
            error: error.message
        });
    }
});

// GET single garden by ID
router.get('/:id', async (req, res) => {
    try {
        const garden = await Garden.findById(req.params.id).populate('plants');

        if (!garden) {
            return res.status(404).json({
                success: false,
                message: 'Garden not found'
            });
        }

        res.json({
            success: true,
            data: garden
        });
    } catch (error) {
        console.error('Error fetching garden:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching garden',
            error: error.message
        });
    }
});

// POST create new garden
router.post('/', async (req, res) => {
    try {
        const garden = new Garden(req.body);
        await garden.save();

        res.status(201).json({
            success: true,
            message: 'Garden created successfully',
            data: garden
        });
    } catch (error) {
        console.error('Error creating garden:', error);
        res.status(400).json({
            success: false,
            message: 'Error creating garden',
            error: error.message
        });
    }
});

// PUT update garden
router.put('/:id', async (req, res) => {
    try {
        const garden = await Garden.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        ).populate('plants');

        if (!garden) {
            return res.status(404).json({
                success: false,
                message: 'Garden not found'
            });
        }

        res.json({
            success: true,
            message: 'Garden updated successfully',
            data: garden
        });
    } catch (error) {
        console.error('Error updating garden:', error);
        res.status(400).json({
            success: false,
            message: 'Error updating garden',
            error: error.message
        });
    }
});

// POST add plant to garden
router.post('/:id/plants/:plantId', async (req, res) => {
    try {
        const garden = await Garden.findById(req.params.id);
        const plant = await Plant.findById(req.params.plantId);

        if (!garden) {
            return res.status(404).json({
                success: false,
                message: 'Garden not found'
            });
        }

        if (!plant) {
            return res.status(404).json({
                success: false,
                message: 'Plant not found'
            });
        }

        garden.addPlant(req.params.plantId);
        await garden.save();

        const updatedGarden = await Garden.findById(garden._id).populate('plants');

        res.json({
            success: true,
            message: 'Plant added to garden successfully',
            data: updatedGarden
        });
    } catch (error) {
        console.error('Error adding plant to garden:', error);
        res.status(400).json({
            success: false,
            message: 'Error adding plant to garden',
            error: error.message
        });
    }
});

// DELETE remove plant from garden
router.delete('/:id/plants/:plantId', async (req, res) => {
    try {
        const garden = await Garden.findById(req.params.id);

        if (!garden) {
            return res.status(404).json({
                success: false,
                message: 'Garden not found'
            });
        }

        garden.removePlant(req.params.plantId);
        await garden.save();

        const updatedGarden = await Garden.findById(garden._id).populate('plants');

        res.json({
            success: true,
            message: 'Plant removed from garden successfully',
            data: updatedGarden
        });
    } catch (error) {
        console.error('Error removing plant from garden:', error);
        res.status(400).json({
            success: false,
            message: 'Error removing plant from garden',
            error: error.message
        });
    }
});

// DELETE garden
router.delete('/:id', async (req, res) => {
    try {
        const garden = await Garden.findByIdAndDelete(req.params.id);

        if (!garden) {
            return res.status(404).json({
                success: false,
                message: 'Garden not found'
            });
        }

        res.json({
            success: true,
            message: 'Garden deleted successfully',
            data: garden
        });
    } catch (error) {
        console.error('Error deleting garden:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting garden',
            error: error.message
        });
    }
});

module.exports = router;
