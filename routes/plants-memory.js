const express = require('express');
const router = express.Router();
const { Plant, createPlant } = require('../config/memoryDb');

// GET all plants
router.get('/', async (req, res) => {
    try {
        const { location, healthStatus, category, search, limit = 50, page = 1 } = req.query;
        const query = {};
        if (location) query.location = location;
        if (healthStatus) query.healthStatus = healthStatus;
        if (category) query.category = category;

        const plants = await (await Plant.find(query)).sort('-createdAt').limit(parseInt(limit)).skip(0);
        const total = await Plant.countDocuments();

        res.json({
            success: true,
            count: plants.length,
            total,
            page: parseInt(page),
            data: plants
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching plants', error: error.message });
    }
});

// GET single plant
router.get('/:id', async (req, res) => {
    try {
        const plant = await Plant.findById(req.params.id);
        if (!plant) return res.status(404).json({ success: false, message: 'Plant not found' });
        res.json({ success: true, data: plant });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching plant', error: error.message });
    }
});

// POST create new plant
router.post('/', async (req, res) => {
    try {
        const plant = createPlant(req.body);
        await plant.save();
        res.status(201).json({ success: true, message: 'Plant created successfully', data: plant });
    } catch (error) {
        res.status(400).json({ success: false, message: 'Error creating plant', error: error.message });
    }
});

// PUT update plant
router.put('/:id', async (req, res) => {
    try {
        const plant = await Plant.findByIdAndUpdate(req.params.id, req.body);
        if (!plant) return res.status(404).json({ success: false, message: 'Plant not found' });
        res.json({ success: true, message: 'Plant updated successfully', data: plant });
    } catch (error) {
        res.status(400).json({ success: false, message: 'Error updating plant', error: error.message });
    }
});

// PATCH update plant version
router.patch('/:id/version/:version', async (req, res) => {
    try {
        const { id, version } = req.params;
        const plant = await Plant.findById(id);

        if (!plant) return res.status(404).json({ success: false, message: 'Plant not found' });

        const validVersions = ['v1', 'v2', 'v3', 'v4'];
        if (!validVersions.includes(version)) {
            return res.status(400).json({ success: false, message: 'Invalid version. Use v1, v2, v3, or v4' });
        }

        // Update the version data
        if (plant.versions && plant.versions[version]) {
            plant.versions[version] = {
                ...plant.versions[version],
                ...req.body,
                date: req.body.date || new Date()
            };
        }

        // Update current version if advancing
        const versionOrder = ['v1', 'v2', 'v3', 'v4'];
        const currentIndex = versionOrder.indexOf(plant.currentVersion);
        const newIndex = versionOrder.indexOf(version);
        if (newIndex > currentIndex) {
            plant.currentVersion = version;
        }

        await plant.save();

        res.json({
            success: true,
            message: `Version ${version.toUpperCase()} updated successfully`,
            data: plant
        });
    } catch (error) {
        res.status(400).json({ success: false, message: 'Error updating version', error: error.message });
    }
});

// DELETE media from a version
router.delete('/:id/version/:version/media/:mediaType', async (req, res) => {
    try {
        const { id, version, mediaType } = req.params;
        const plant = await Plant.findById(id);

        if (!plant) return res.status(404).json({ success: false, message: 'Plant not found' });

        const validVersions = ['v1', 'v2', 'v3', 'v4'];
        if (!validVersions.includes(version)) {
            return res.status(400).json({ success: false, message: 'Invalid version' });
        }

        if (!['image', 'video', 'file'].includes(mediaType)) {
            return res.status(400).json({ success: false, message: 'Invalid media type. Use image, video, or file' });
        }

        // Remove the media from version
        if (plant.versions && plant.versions[version]) {
            plant.versions[version][mediaType] = null;
        }

        await plant.save();

        console.log(`🗑️ Deleted ${mediaType} from plant ${id} version ${version}`);

        res.json({
            success: true,
            message: `${mediaType.charAt(0).toUpperCase() + mediaType.slice(1)} deleted successfully`,
            data: plant
        });
    } catch (error) {
        res.status(400).json({ success: false, message: 'Error deleting media', error: error.message });
    }
});

// PATCH advance to next version
router.patch('/:id/advance', async (req, res) => {
    try {
        const plant = await Plant.findById(req.params.id);
        if (!plant) return res.status(404).json({ success: false, message: 'Plant not found' });

        const versionOrder = ['v1', 'v2', 'v3', 'v4'];
        const currentIndex = versionOrder.indexOf(plant.currentVersion);

        if (currentIndex >= 3) {
            return res.status(400).json({ success: false, message: 'Plant is already at V4 (fully grown)' });
        }

        const nextVersion = versionOrder[currentIndex + 1];
        plant.currentVersion = nextVersion;
        plant.versions[nextVersion].date = new Date();
        plant.versions[nextVersion].notes = req.body.notes || `Advanced to ${nextVersion.toUpperCase()}`;

        await plant.save();

        res.json({
            success: true,
            message: `Plant advanced to ${nextVersion.toUpperCase()}`,
            data: plant
        });
    } catch (error) {
        res.status(400).json({ success: false, message: 'Error advancing version', error: error.message });
    }
});

// DELETE plant
router.delete('/:id', async (req, res) => {
    try {
        const plant = await Plant.findByIdAndDelete(req.params.id);
        if (!plant) return res.status(404).json({ success: false, message: 'Plant not found' });
        res.json({ success: true, message: 'Plant deleted successfully', data: plant });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error deleting plant', error: error.message });
    }
});

// GET plants by version
router.get('/filter/by-version/:version', async (req, res) => {
    try {
        const { version } = req.params;
        const allPlants = await (await Plant.find({})).sort('-createdAt').limit(100).skip(0);
        const filtered = allPlants.filter(p => p.currentVersion === version);

        res.json({
            success: true,
            count: filtered.length,
            data: filtered
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching plants', error: error.message });
    }
});

module.exports = router;
