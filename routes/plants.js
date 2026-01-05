const express = require('express');
const router = express.Router();
const Plant = require('../models/Plant');

// GET all plants
router.get('/', async (req, res) => {
    try {
        const {
            location,
            healthStatus,
            wateringFrequency,
            search,
            sort = '-createdAt',
            limit = 50,
            page = 1
        } = req.query;

        const query = {};

        if (location) query.location = location;
        if (healthStatus) query.healthStatus = healthStatus;
        if (wateringFrequency) query.wateringFrequency = wateringFrequency;
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { species: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const plants = await Plant.find(query)
            .sort(sort)
            .limit(parseInt(limit))
            .skip(skip);

        const total = await Plant.countDocuments(query);

        res.json({
            success: true,
            count: plants.length,
            total,
            page: parseInt(page),
            pages: Math.ceil(total / parseInt(limit)),
            data: plants
        });
    } catch (error) {
        console.error('Error fetching plants:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching plants',
            error: error.message
        });
    }
});

// GET single plant by ID
router.get('/:id', async (req, res) => {
    try {
        const plant = await Plant.findById(req.params.id);

        if (!plant) {
            return res.status(404).json({
                success: false,
                message: 'Plant not found'
            });
        }

        res.json({
            success: true,
            data: plant
        });
    } catch (error) {
        console.error('Error fetching plant:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching plant',
            error: error.message
        });
    }
});

// POST create new plant
router.post('/', async (req, res) => {
    try {
        const plant = new Plant(req.body);
        await plant.save();

        res.status(201).json({
            success: true,
            message: 'Plant created successfully',
            data: plant
        });
    } catch (error) {
        console.error('Error creating plant:', error);
        res.status(400).json({
            success: false,
            message: 'Error creating plant',
            error: error.message
        });
    }
});

// PUT update plant
router.put('/:id', async (req, res) => {
    try {
        const plant = await Plant.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!plant) {
            return res.status(404).json({
                success: false,
                message: 'Plant not found'
            });
        }

        res.json({
            success: true,
            message: 'Plant updated successfully',
            data: plant
        });
    } catch (error) {
        console.error('Error updating plant:', error);
        res.status(400).json({
            success: false,
            message: 'Error updating plant',
            error: error.message
        });
    }
});

// PATCH water a plant
router.patch('/:id/water', async (req, res) => {
    try {
        const plant = await Plant.findById(req.params.id);

        if (!plant) {
            return res.status(404).json({
                success: false,
                message: 'Plant not found'
            });
        }

        plant.lastWatered = new Date();
        plant.calculateNextWatering();
        await plant.save();

        res.json({
            success: true,
            message: 'Plant watered successfully',
            data: plant
        });
    } catch (error) {
        console.error('Error watering plant:', error);
        res.status(400).json({
            success: false,
            message: 'Error watering plant',
            error: error.message
        });
    }
});

// DELETE plant
router.delete('/:id', async (req, res) => {
    try {
        const plant = await Plant.findByIdAndDelete(req.params.id);

        if (!plant) {
            return res.status(404).json({
                success: false,
                message: 'Plant not found'
            });
        }

        res.json({
            success: true,
            message: 'Plant deleted successfully',
            data: plant
        });
    } catch (error) {
        console.error('Error deleting plant:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting plant',
            error: error.message
        });
    }
});

// GET plants that need watering
router.get('/status/needs-water', async (req, res) => {
    try {
        const plants = await Plant.find({
            nextWatering: { $lte: new Date() }
        }).sort('nextWatering');

        res.json({
            success: true,
            count: plants.length,
            data: plants
        });
    } catch (error) {
        console.error('Error fetching plants that need water:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching plants',
            error: error.message
        });
    }
});

module.exports = router;
