const express = require('express');
const axios = require('axios');
const router = express.Router();
const https = require('https');
const TENOR_API_KEY = process.env.TENOR_API_KEY;

// Create a custom HTTPS agent to bypass SSL certificate errors.
// This is used as a fallback for the quotable.io API, which has an expired certificate.
// NOTE: This is generally not recommended for production environments but is used here for resilience.
const agent = new https.Agent({
  rejectUnauthorized: false
});

/**
 * Returns a list of relevant API tags based on a given mood.
 * This helps in fetching quotes that are contextually appropriate.
 * @param {string} mood - The detected mood from the emotion analysis (e.g., "joy", "sadness").
 * @returns {string} A pipe-separated string of tags to be used in the quote API.
 */
const getTagsForMood = (mood) => {
  const moodTagMapping = {
    joy: 'happiness|inspirational',
    love: 'love|friendship',
    sadness: 'sadness|life',
    surprise: 'famous-quotes|change',
    anger: 'wisdom|change',
    fear: 'courage|perseverance',
    optimism: 'inspirational|success|future',
    default: 'inspirational|life|wisdom' // Default tags if mood is not found
  };
  return moodTagMapping[mood.toLowerCase()] || moodTagMapping.default;
};

/**
 * Creates a simple numeric hash from a string.
 * This is used to select a quote in a way that is deterministic based on the user's input.
 * Same input will result in the same quote, but different inputs will result in different quotes.
 * @param {string} str - The input string (the user's original text).
 * @returns {number} A positive integer hash.
 */
const simpleHash = (str) => {
  let hash = 0;
  if (!str || str.length === 0) {
    return Math.floor(Math.random() * 1000); // Return a random hash if input is empty
  }
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash);
};


// --- API Routes ---

// GET /api/content/gif/:mood
// Fetches a random GIF from Tenor based on the detected mood.
router.get('/gif/:mood', async (req, res) => {
  const { mood } = req.params;
  try {
    const url = `https://tenor.googleapis.com/v2/search?q=${encodeURIComponent(mood)}&key=${TENOR_API_KEY}&limit=10`;
    const resp = await axios.get(url);
    const gifs = resp.data.results.map(g => g.media_formats.gif.url);
    res.json({ gifs });
  } catch (err) {
    console.error("GIF API Error:", err.message);
    res.status(500).json({ error: "Could not fetch GIFs." });
  }
});

// GET /api/content/quote/:mood
// Fetches a quote relevant to the mood and personalized by the user's input.
router.get('/quote/:mood', async (req, res) => {
    const { mood } = req.params;
    const { userInput } = req.query; // The user's original text from the query parameter
    const tags = getTagsForMood(mood);
    const primaryTag = tags.split('|')[0]; // Use the most relevant tag for the primary API

    try {
        // 1. Try the primary API (ZenQuotes) with a relevant keyword.
        const response = await axios.get(`https://zenquotes.io/api/quotes/keyword=${primaryTag}`);
        const quotes = response.data;

        if (quotes && quotes.length > 0 && !quotes[0].q.includes('Too many requests')) {
            // If quotes are found, use the hash of the user's input to pick one.
            const hash = simpleHash(userInput);
            const index = hash % quotes.length;
            res.json({ quote: quotes[index].q });
        } else {
            // 2. If no specific quote is found, get a completely random one from the primary API.
            const randomResponse = await axios.get("https://zenquotes.io/api/random");
            res.json({ quote: randomResponse.data[0].q });
        }
    } catch (err) {
        console.error(`Primary quote API failed: ${err.message}. Falling back.`);
        // 3. If the primary API fails, fallback to quotable.io with tags.
        try {
            const fallbackResponse = await axios.get(`https://api.quotable.io/random?tags=${tags}`, { httpsAgent: agent });
            if (fallbackResponse.data.content) {
                res.json({ quote: fallbackResponse.data.content });
            } else {
                // 4. If still no quote, get any random quote from the fallback API.
                const anyQuoteResponse = await axios.get(`https://api.quotable.io/random`, { httpsAgent: agent });
                res.json({ quote: anyQuoteResponse.data.content });
            }
        } catch (fallbackErr) {
            console.error(`Fallback API failed: ${fallbackErr.message}`);
            res.status(500).json({ error: 'Could not fetch quote from any source.' });
        }
    }
});

module.exports = router;