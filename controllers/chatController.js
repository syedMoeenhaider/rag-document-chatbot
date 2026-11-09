const ragService = require('../services/ragService');

const MAX_HISTORY_MESSAGES = 6;

function cleanHistory(history) {
    if (!Array.isArray(history)) return [];

    return history
        .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
        .map((m) => ({ role: m.role, content: m.content.slice(0, 1000) }))
        .slice(-MAX_HISTORY_MESSAGES);
}

const handleChat = async (req, res, next) => {
    try {
        const { question, history } = req.body;

        if (!question || typeof question !== 'string' || !question.trim()) {
            return res.status(400).json({ success: false, error: 'Invalid or missing question.' });
        }

        const result = await ragService.answerQuestion(question.trim(), cleanHistory(history));

        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        next(error);
    }
};

module.exports = { handleChat };
