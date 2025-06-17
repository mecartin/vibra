// vibra-backend/models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  avatar: {
    type: String,
    default: null
  },
  // Spotify Integration Fields
  spotifyUserId: {
    type: String,
    default: null
  },
  spotifyEmail: {
    type: String,
    default: null
  },
  spotifyAccessToken: {
    type: String,
    default: null
  },
  spotifyRefreshToken: {
    type: String,
    default: null
  },
  spotifyTokenExpiresAt: {
    type: Date,
    default: null
  },
  // User Preferences
  preferences: {
    favoriteGenres: [String],
    defaultMood: {
      type: String,
      default: 'neutral'
    }
  },
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update timestamp on save
userSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Check if Spotify is connected
userSchema.methods.isSpotifyConnected = function() {
  return !!(this.spotifyRefreshToken && this.spotifyUserId);
};

// Clear Spotify tokens
userSchema.methods.clearSpotifyTokens = async function() {
  this.spotifyAccessToken = null;
  this.spotifyRefreshToken = null;
  this.spotifyTokenExpiresAt = null;
  this.spotifyUserId = null;
  this.spotifyEmail = null;
  return await this.save();
};

module.exports = mongoose.model('User', userSchema);