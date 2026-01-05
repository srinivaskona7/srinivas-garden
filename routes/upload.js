const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '..', 'public', 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(7)}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 1024 * 1024 * 1024 }, // 1GB limit for videos
    fileFilter: (req, file, cb) => {
        // Check file extension
        const allowedExtensions = /\.(jpeg|jpg|png|gif|webp|mp4|mov|avi|webm)$/i;
        const hasValidExt = allowedExtensions.test(file.originalname);

        // Check mimetype - allow image/* and video/*
        const isImage = file.mimetype.startsWith('image/');
        const isVideo = file.mimetype.startsWith('video/');

        if (hasValidExt && (isImage || isVideo)) {
            cb(null, true);
        } else {
            cb(new Error(`Invalid file type: ${file.mimetype}. Only images and videos are allowed.`));
        }
    }
});

// Error handling middleware for multer
const handleUpload = (req, res, next) => {
    upload.single('file')(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(413).json({
                    success: false,
                    message: 'File too large. Maximum size is 1GB for videos and 10MB for images.'
                });
            }
            return res.status(400).json({ success: false, message: err.message });
        } else if (err) {
            return res.status(400).json({ success: false, message: err.message });
        }
        next();
    });
};

// Upload endpoint with proper error handling
router.post('/', handleUpload, async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }

        const isImage = req.file.mimetype.startsWith('image/');
        const isVideo = req.file.mimetype.startsWith('video/');
        let finalSize = req.file.size;

        // Optimize image if it's an image
        if (isImage) {
            try {
                const start = Date.now();
                const filePath = req.file.path;
                const tempPath = filePath + '.temp';

                // Resize and compress
                await sharp(filePath)
                    .resize(1920, 1920, { fit: 'inside', withoutEnlargement: true })
                    .jpeg({ quality: 80, mozjpeg: true })
                    .toFile(tempPath);

                // Replace original file with optimized version
                fs.unlinkSync(filePath);
                fs.renameSync(tempPath, filePath);

                // Update size check
                const stats = fs.statSync(filePath);
                finalSize = stats.size;
                const savedBytes = req.file.size - finalSize;

                console.log(`⚡ Optimized ${req.file.originalname}: ${((Date.now() - start) / 1000).toFixed(2)}s`);
                console.log(`   Size: ${(req.file.size / 1024).toFixed(1)}KB -> ${(finalSize / 1024).toFixed(1)}KB (Saved ${(savedBytes / 1024).toFixed(1)}KB)`);
            } catch (optError) {
                console.error('Image optimization failed, creating unoptimized fallback:', optError);
                // Continue with original file if optimization fails
            }
        }

        const fileUrl = `/uploads/${req.file.filename}`;

        console.log(`✅ File uploaded: ${req.file.originalname} (${(finalSize / 1024 / 1024).toFixed(2)}MB) - ${isVideo ? 'VIDEO' : 'IMAGE'}`);

        res.json({
            success: true,
            message: 'File uploaded successfully',
            data: {
                url: fileUrl,
                filename: req.file.filename,
                originalName: req.file.originalname,
                type: isVideo ? 'video' : 'image',
                mimetype: req.file.mimetype,
                size: finalSize
            }
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ success: false, message: 'Upload failed', error: error.message });
    }
});

module.exports = router;
