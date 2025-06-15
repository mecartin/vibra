const mongoose = require('mongoose');

const FavoriteSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  mood: { type: String, required: true },
  quote: { type: String, required: true },
  gifUrl: { type: String, required: true },
  created: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Favorite', FavoriteSchema);