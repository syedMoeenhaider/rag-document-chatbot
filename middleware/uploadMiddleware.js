const multer = require('multer');

const storage = multer.memoryStorage();
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'text/plain', 'text/csv'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only PDF, TXT, and CSV are allowed.'), false);
    }
};

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter
});

module.exports = upload;