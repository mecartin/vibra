const express = require('express');
const router = express.Router();
const axios = require('axios');
const authMiddleware = require('../middleware/auth');
const User = require('../models/User');
const Feedback = require('../models/Feedback');

const ML_SERVER_URL = process.env.ML_SERVER_URL || 'http://localhost:5001';

// --- Main Analysis Route ---
// POST /api/mood/analyze
router.post('/analyze', authMiddleware, async (req, res) => {
    const { text } = req.body;
    if (!text) {
        return res.status(400).json({ success: false, error: 'Text input is required' });
    }

    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        // Prepare data for the ML server
        const payload = {
            text: text,
            history: user.inputHistory || [],
            user_bias: user.emotionBiases || {},
        };

        const { data } = await axios.post(`${ML_SERVER_URL}/analyze`, payload);

        // Update user's input history (keep the last 5 entries)
        user.inputHistory.push(text);
        if (user.inputHistory.length > 5) {
            user.inputHistory.shift();
        }
        await user.save();

        res.status(200).json({ success: true, ...data });

    } catch (error) {
        console.error('Error contacting ML server:', error.message);
        res.status(500).json({ success: false, error: 'Error analyzing mood' });
    }
});


// --- New Feedback Route ---
// POST /api/mood/feedback
router.post('/feedback', authMiddleware, async (req, res) => {
    const { originalText, incorrectEmotion, correctEmotion } = req.body;

    if (!originalText || !incorrectEmotion || !correctEmotion) {
        return res.status(400).json({ success: false, error: 'Missing required feedback fields.' });
    }

    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        // 1. Save the feedback record
        await Feedback.create({
            userId: req.user.id,
            originalText,
            incorrectEmotion,
            correctEmotion
        });

        // 2. Update user's emotion biases
        // This is a simple implementation. A more advanced one might use a learning rate.
        const BIAS_ADJUSTMENT = 0.05; // The amount to adjust bias by

        // Decrease the bias for the incorrect emotion
        const currentIncorrectBias = user.emotionBiases.get(incorrectEmotion) || 0;
        user.emotionBiases.set(incorrectEmotion, currentIncorrectBias - BIAS_ADJUSTMENT);

        // Increase the bias for the correct emotion
        const currentCorrectBias = user.emotionBiases.get(correctEmotion) || 0;
        user.emotionBiases.set(correctEmotion, currentCorrectBias + BIAS_ADJUSTMENT);

        // Mark the map as modified for Mongoose to save it
        user.markModified('emotionBiases');
        await user.save();
        
        res.status(201).json({ success: true, message: 'Feedback received and bias updated.' });

    } catch (error) {
        console.error('Error processing feedback:', error.message);
        res.status(500).json({ success: false, error: 'Error processing feedback.' });
    }
});


module.exports = router;