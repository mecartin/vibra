const express = require('express');
const router = express.Router();
const axios = require('axios');
const authMiddleware = require('../middleware/auth');
const Feedback = require('../models/Feedback');

const ML_API_URL = process.env.ML_API_URL || 'http://localhost:5001/analyze';

router.post('/analyze', async (req, res) => {
    const { input } = req.body;
    if (!input) {
        return res.status(400).json({ error: 'Input text is required.' });
    }
    try {
        const mlResponse = await axios.post(ML_API_URL, { text: input });
        res.json(mlResponse.data);
    } catch (error) {
        console.error('Error connecting to the ML server:', error.message);
        res.status(500).json({ error: 'Failed to connect to the emotion analysis service.' });
    }
});
router.post('/feedback', authMiddleware, async (req, res) => {
    const { input, predictedMood, isCorrect, correctMood } = req.body;
    try {
        const feedback = new Feedback({
            user: req.user.id,
            inputText: input,
            predictedMood,
            isCorrect,
            correctMood: isCorrect ? null : correctMood,
        });
        await feedback.save();
        res.status(201).json({ success: true, message: 'Feedback submitted successfully.' });
    } catch (error) {
        console.error('Error submitting feedback:', error);
        res.status(500).json({ success: false, error: 'Server error while submitting feedback.' });
    }
});
module.exports = router;