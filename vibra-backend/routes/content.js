const express = require('express');
const axios = require('axios');
const router = express.Router();
const https = require('https');

// --- NEW: Import new libraries ---
const { hash } = require('fnv-plus'); // Robust FNV-1a hashing
const keyword_extractor = require('keyword-extractor'); // For keyword extraction

// --- FIX: Change the import for axios-retry ---
// We access the .default property to get the function itself.
const axiosRetry = require('axios-retry').default;

const TENOR_API_KEY = process.env.TENOR_API_KEY;

// --- NEW: Configure axios with retry logic ---
// This will automatically retry failed requests to the quote API
// with increasing delays, making the app more resilient.
axiosRetry(axios, {
    retries: 3, // Number of retries
    retryDelay: (retryCount) => {
        console.log(`Retry attempt: ${retryCount}`);
        return retryCount * 1000; // Exponential backoff (1s, 2s, 3s)
    },
    retryCondition: (error) => {
        // Retry on network errors and 5xx server errors
        return error.code !== 'ECONNABORTED' && (!error.response || error.response.status >= 500);
    },
});


// Custom HTTPS agent to handle potential SSL issues with the fallback API
const agent = new https.Agent({
    rejectUnauthorized: false
});

// Maps a mood to a set of fallback tags if keyword extraction fails
const getTagsForMood = (mood) => {
    const tags = {
        joy: 'happiness|inspirational|life',
        sadness: 'sad|life|pain',
        anger: 'anger|life|pain',
        fear: 'fear|life|pain',
        surprise: 'life|pain|amazing',
        disgust: 'life|pain',
        neutral: 'life'
    };
    return tags[mood] || 'life';
};


// --- Route for fetching quotes ---
// GET /api/content/quote/:mood
router.get('/quote/:mood', async (req, res) => {
    const { mood } = req.params;
    // --- NEW: Get user's original text from query parameters ---
    const { userInput } = req.query;

    let tags;
    // --- NEW: Extract keywords from user input ---
    if (userInput) {
        const keywords = keyword_extractor.extract(userInput, {
            language: "english",
            remove_digits: true,
            return_changed_case: true,
            remove_duplicates: false,
        });
        if (keywords.length > 0) {
            tags = keywords.join('|');
            console.log(`Using extracted keywords for quote search: ${tags}`);
        }
    }
    // Fallback to mood-based tags if no keywords are extracted
    if (!tags) {
        tags = getTagsForMood(mood);
        console.log(`Falling back to mood tags for quote search: ${tags}`);
    }

    const primaryTag = tags.split('|')[0];

    try {
        // --- MODIFIED: The primary API call now benefits from axios-retry ---
        const response = await axios.get(`https://api.quotable.io/quotes/random?tags=${tags}`);
        if (response.data && response.data.length > 0) {
            const quote = response.data[0];
            return res.json({ text: quote.content, author: quote.author });
        }
    } catch (err) {
        console.error("Primary quote API failed, trying fallback:", err.message);
        // Fallback API
        try {
            const fallbackResponse = await axios.get(`https://zenquotes.io/api/quotes/keyword=${primaryTag}`, { httpsAgent: agent });
            if (fallbackResponse.data && fallbackResponse.data.length > 0) {
                // --- NEW: Use FNV-1a hash for deterministic but well-distributed quote selection ---
                const hashValue = hash(userInput || mood).value;
                const index = hashValue % fallbackResponse.data.length;
                const quote = fallbackResponse.data[index];
                return res.json({ text: quote.q, author: quote.a });
            }
        } catch (fallbackErr) {
            console.error("Fallback quote API failed:", fallbackErr.message);
        }
    }

    // Ultimate fallback if both APIs fail
    res.status(500).json({ text: "The only real wisdom is in knowing you know nothing.", author: "Socrates" });
});


// --- Route for fetching GIFs ---
// GET /api/content/gif/:mood
router.get('/gif/:mood', async (req, res) => {
    const { mood } = req.params;
    // --- NEW: Get user's original text from query parameters ---
    const { userInput } = req.query;

    let searchQuery = mood;
    // --- NEW: Create a dynamic search query for Tenor ---
    if (userInput) {
         const keywords = keyword_extractor.extract(userInput, {
            language: "english",
            remove_digits: true,
            return_changed_case: true,
            remove_duplicates: true,
        });
        // Combine mood with the most relevant keyword
        if (keywords.length > 0 && keywords[0] !== mood) {
            searchQuery = `${mood} ${keywords[0]}`;
        }
    }

    console.log(`Using dynamic search query for GIF: "${searchQuery}"`);

    try {
        const url = `https://tenor.googleapis.com/v2/search?q=${encodeURIComponent(searchQuery)}&key=${TENOR_API_KEY}&limit=10&media_filter=minimal`;
        const response = await axios.get(url);
        if (response.data && response.data.results) {
            // --- NEW: Use FNV-1a hash for deterministic GIF selection ---
            const hashValue = hash(userInput || mood).value;
            const index = hashValue % response.data.results.length;
            const gif = response.data.results[index].media_formats.gif.url;
            return res.json({ url: gif });
        }
    } catch (err) {
        console.error("GIF API failed:", err.message);
    }

    // Fallback GIF if Tenor fails
    res.status(500).json({ url: 'https://media.tenor.com/yvKbA-6VscIAAAAC/kermit-the-frog-typing.gif' });
});

module.exports = router;