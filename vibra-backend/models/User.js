const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  // --- Existing Fields ---
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email',
    ],
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 6,
    select: false,
  },
  inputHistory: {
    type: [String],
    default: [],
  },
  emotionBiases: {
    type: Map,
    of: Number,
    default: {},
  },
  // --- New Spotify Fields ---
  spotifyAccessToken: {
    type: String,
    default: null,
  },
  spotifyRefreshToken: {
    type: String,
    default: null,
  },
  spotifyTokenExpiresAt: {
    type: Date,
    default: null,
  }
});

// Keep existing pre-save hook for password hashing

module.exports = mongoose.model('User', UserSchema);
