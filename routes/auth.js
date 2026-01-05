const express = require('express');
const router = express.Router();
const { Auth } = require('../config/memoryDb');

// POST login
router.post('/login', (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: 'Username and password are required'
            });
        }

        const result = Auth.login(username, password);

        if (result.success) {
            res.json({
                success: true,
                message: 'Login successful',
                token: result.token,
                user: result.user
            });
        } else {
            res.status(401).json({
                success: false,
                message: 'Invalid username or password'
            });
        }
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Login failed',
            error: error.message
        });
    }
});

// POST logout
router.post('/logout', (req, res) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (token) {
            Auth.logout(token);
        }
        res.json({
            success: true,
            message: 'Logged out successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Logout failed'
        });
    }
});

// GET verify session
router.get('/verify', (req, res) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'No token provided'
            });
        }

        const user = Auth.verify(token);
        if (user) {
            res.json({
                success: true,
                user
            });
        } else {
            res.status(401).json({
                success: false,
                message: 'Invalid or expired token'
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Verification failed'
        });
    }
});

module.exports = router;
