const express = require('express');
const axios = require('axios');
const router = express.Router();
const https = require('https');
const { hash } = require('fnv-plus');
const keyword_extractor = require('keyword-extractor');
const axiosRetry = require('axios-retry').default;

const TENOR_API_KEY = process.env.TENOR_API_KEY;

// Configure axios with retry logic
axiosRetry(axios, {
    retries: 3,
    retryDelay: (retryCount) => retryCount * 1000,
    retryCondition: (error) => error.code !== 'ECONNABORTED' && (!error.response || error.response.status >= 500),
});

// Custom HTTPS agent for fallback API
const agent = new https.Agent({
    rejectUnauthorized: false
});

// --- Route for fetching quotes ---
// GET /api/content/quote/:mood
router.get('/quote/:mood', async (req, res) => {
    try {
        // --- NEW, MORE RELIABLE PRIMARY API ---
        // This API is simpler and does not use tags, but it is more reliable.
        console.log("Attempting to fetch quote from new primary API: dummyjson.com");
        const response = await axios.get('https://dummyjson.com/quotes/random');
        
        if (response.data) {
            // Adapt the response to match the format our frontend expects
            return res.json({ text: response.data.quote, author: response.data.author });
        }
    } catch (err) {
        console.error("Primary quote API (dummyjson.com) failed:", err.message);
        // --- Fallback API (zenquotes.io) ---
        // This will only run if the new primary API also fails.
        try {
            console.log("Primary API failed. Attempting fallback: zenquotes.io");
            const { mood } = req.params;
            const { userInput } = req.query;
            let tags = 'life'; // Default tag for fallback
            if (userInput) {
                const keywords = keyword_extractor.extract(userInput, { language: "english", remove_digits: true, return_changed_case: true, remove_duplicates: false });
                if (keywords.length > 0) tags = keywords.join('|');
            }
            const primaryTag = tags.split('|')[0];
            
            const fallbackResponse = await axios.get(`https://zenquotes.io/api/quotes/keyword=${primaryTag}`, { httpsAgent: agent });
            if (fallbackResponse.data && fallbackResponse.data.length > 0) {
                const hashValue = hash(userInput || mood).value;
                const index = hashValue % fallbackResponse.data.length;
                const quote = fallbackResponse.data[index];
                return res.json({ text: quote.q, author: quote.a });
            }
        } catch (fallbackErr) {
            console.error("Fallback quote API also failed:", fallbackErr.message);
        }
    }

    // Ultimate fallback if both APIs fail, sending a 200 OK status.
    console.log("All quote APIs failed. Sending default quote.");
    res.json({ text: "The only real wisdom is in knowing you know nothing.", author: "Socrates" });
});


// --- Route for fetching GIFs ---
// GET /api/content/gif/:mood
router.get('/gif/:mood', async (req, res) => {
    const { mood } = req.params;
    const { userInput } = req.query;
    let searchQuery = mood;

    if (userInput) {
         const keywords = keyword_extractor.extract(userInput, { language: "english", remove_digits: true, return_changed_case: true, remove_duplicates: true });
        if (keywords.length > 0 && keywords[0] !== mood) {
            searchQuery = `${mood} ${keywords[0]}`;
        }
    }

    try {
        const url = `https://tenor.googleapis.com/v2/search?q=${encodeURIComponent(searchQuery)}&key=${TENOR_API_KEY}&limit=10&media_filter=minimal`;
        const response = await axios.get(url);
        if (response.data && response.data.results) {
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
