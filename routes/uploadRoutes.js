const express = require('express');
const multer = require('multer');
const path = require('path');
const { handleUpload } = require('../controllers/uploadController');

const router = express.Router();

const ALLOWED_TYPES = ['.pdf', '.docx', '.txt', '.csv'];
const MAX_SIZE_MB = 10;

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_SIZE_MB * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();

        if (ALLOWED_TYPES.includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error('Unsupported file type. Please upload a PDF, DOCX, TXT or CSV file.'));
        }
    }
});

function receiveFile(req, res, next) {
    upload.single('file')(req, res, (err) => {
        if (err) {
            const message = err.code === 'LIMIT_FILE_SIZE'
                ? `File is too large. Maximum size is ${MAX_SIZE_MB} MB.`
                : err.message;

            return res.status(400).json({ success: false, error: message });
        }
        next();
    });
}

router.post('/upload', receiveFile, handleUpload);

module.exports = router;
