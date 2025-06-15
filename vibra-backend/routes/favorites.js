const express = require('express');
const Favorite = require('../models/Favorite');
const auth = require('../middleware/auth');
const router = express.Router();

// GET /api/favorites
router.get('/', auth, async (req, res) => {
  try {
    const favs = await Favorite.find({ user: req.user._id }).sort({ created: -1 }).limit(50);
    res.json({ favorites: favs });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to get favorites.' });
  }
});

// POST /api/favorites
router.post('/', auth, async (req, res) => {
  try {
    const { mood, quote, gifUrl } = req.body;
    const fav = await Favorite.create({ user: req.user._id, mood, quote, gifUrl });
    res.json({ favorite: fav });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save favorite.' });
  }
});

module.exports = router;