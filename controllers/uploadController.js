const documentService = require('../services/documentService');
const vectorStoreService = require('../services/vectorStoreService');

const handleUpload = async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, error: 'No file uploaded.' });
        }

        const fileName = req.file.originalname;

        const extractedText = await documentService.extractText(req.file);

        if (!extractedText || !extractedText.trim()) {
            return res.status(400).json({ success: false, error: 'The file has no readable text.' });
        }

        const documentChunks = await documentService.splitIntoChunks(extractedText, fileName);

        await vectorStoreService.addDocuments(documentChunks, fileName);

        res.status(200).json({
            success: true,
            message: 'Document processed and indexed successfully.',
            fileName: fileName,
            files: vectorStoreService.getFileNames()
        });
    } catch (error) {
        next(error);
    }
};

module.exports = { handleUpload };
