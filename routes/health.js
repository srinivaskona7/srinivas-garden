const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// Health check endpoint for Kubernetes probes
router.get('/', async (req, res) => {
    try {
        const healthStatus = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            environment: process.env.NODE_ENV || 'development',
            version: process.env.npm_package_version || '1.0.0'
        };

        res.json(healthStatus);
    } catch (error) {
        res.status(503).json({
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            error: error.message
        });
    }
});

// Liveness probe - basic check if app is running
router.get('/live', (req, res) => {
    res.status(200).json({
        status: 'alive',
        timestamp: new Date().toISOString()
    });
});

// Readiness probe - check if app can accept traffic
router.get('/ready', async (req, res) => {
    try {
        // Check MongoDB connection
        const mongoState = mongoose.connection.readyState;
        const mongoStates = {
            0: 'disconnected',
            1: 'connected',
            2: 'connecting',
            3: 'disconnecting'
        };

        if (mongoState !== 1) {
            return res.status(503).json({
                status: 'not ready',
                timestamp: new Date().toISOString(),
                checks: {
                    mongodb: {
                        status: mongoStates[mongoState],
                        healthy: false
                    }
                }
            });
        }

        res.status(200).json({
            status: 'ready',
            timestamp: new Date().toISOString(),
            checks: {
                mongodb: {
                    status: 'connected',
                    healthy: true
                }
            }
        });
    } catch (error) {
        res.status(503).json({
            status: 'not ready',
            timestamp: new Date().toISOString(),
            error: error.message
        });
    }
});

module.exports = router;
