const express = require('express');
const axios = require('axios');
const router = express.Router();
const TENOR_API_KEY = process.env.TENOR_API_KEY;

// GET /api/content/gif/:mood
router.get('/gif/:mood', async (req, res) => {
  const { mood } = req.params;
  try {
    const url = `https://tenor.googleapis.com/v2/search?q=${encodeURIComponent(mood)}&key=${TENOR_API_KEY}&limit=10`;
    const resp = await axios.get(url);
    const gifs = resp.data.results.map(g => g.media_formats.gif.url);
    res.json({ gifs });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not fetch GIFs." });
  }
});

// GET /api/content/quote/:mood
router.get('/quote/:mood', async (req, res) => {
  try {
    const response = await axios.get("https://api.quotable.io/random?tags=funny|inspirational|life|happiness|sad");
    res.json({ quote: response.data.content });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not fetch quote.' });
  }
});

module.exports = router;