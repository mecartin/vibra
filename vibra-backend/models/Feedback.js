const mongoose = require('mongoose');

const FeedbackSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    originalText: {
        type: String,
        required: true,
    },
    incorrectEmotion: {
        type: String,
        required: true,
    },
    correctEmotion: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('Feedback', FeedbackSchema);