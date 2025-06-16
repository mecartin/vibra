import axios from 'axios';

// The proxy in package.json will handle routing this to the backend.
const API_BASE_URL = '/api';

/**
 * Gets an emoji corresponding to a given mood.
 * @param {string} mood - The mood string (e.g., "joy", "sadness").
 * @returns {string} The corresponding emoji.
 */
const getEmojiForMood = (mood: string): string => {
  const moodEmojis: { [key: string]: string } = {
    joy: '😊',
    love: '😍',
    sadness: '😢',
    surprise: '😲',
    anger: '😠',
    fear: '😨',
    optimism: '✨',
    default: '🤔',
  };
  return moodEmojis[mood.toLowerCase()] || moodEmojis.default;
};

/**
 * Analyzes the user's text to determine the vibe, then fetches related content.
 * @param {string} text - The user's input text.
 * @returns {Promise<object>} An object containing the mood, emoji, quote, GIF, and confidence level.
 */
export const analyzeVibe = async (text: string) => {
  try {
    // 1. Get the mood analysis from the backend
    const moodResponse = await axios.post(`${API_BASE_URL}/mood/analyze`, {
      input: text,
    });

    const { primary, confidenceWarning } = moodResponse.data;
    const mood = primary.label;
    const confidence = Math.round(primary.score * 100);

    // 2. Get a GIF for the determined mood
    const gifResponse = await axios.get(`${API_BASE_URL}/content/gif/${mood}`);
    const gifs = gifResponse.data.gifs;
    // Select a random GIF from the list
    const gifUrl = gifs[Math.floor(Math.random() * gifs.length)];

    // 3. Get a quote, passing the user's text for a more personalized selection
    const quoteResponse = await axios.get(`${API_BASE_URL}/content/quote/${mood}?userInput=${encodeURIComponent(text)}`);
    const quote = quoteResponse.data.quote;

    // 4. Get an emoji for the mood
    const emoji = getEmojiForMood(mood);

    // 5. Return the consolidated vibe data
    return {
      mood,
      emoji,
      sentiment: quote,
      confidence,
      gifUrl,
      confidenceWarning,
      input: text,
    };
  } catch (error) {
    console.error('API Error:', error);
    // Provide fallback data in case of an API error to prevent crashes
    return {
      mood: 'mysterious',
      emoji: '🌌',
      sentiment: 'Lost in the digital void. The server seems to be sleeping.',
      confidence: 77,
      gifUrl: 'https://media.giphy.com/media/xT0xeJpnrWC4XWblEk/giphy.gif',
      input: text,
      confidenceWarning: true,
    };
  }
};

// --- Placeholder functions for Authentication and Favorites ---
// You would implement these to handle user login and saving favorites.

export const getFavorites = async (token: string) => {
    const response = await axios.get(`${API_BASE_URL}/favorites`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data.favorites;
};

export const addFavorite = async (favoriteData: any, token: string) => {
    const response = await axios.post(`${API_BASE_URL}/favorites`, favoriteData, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data.favorite;
};

export const removeFavorite = async (id: string, token: string) => {
    await axios.delete(`${API_BASE_URL}/favorites/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
};

export const getSpotifyRecommendations = async (mood: string, limit: number, userInput: string) => {
  const token = localStorage.getItem('authToken');
  const response = await fetch('/api/spotify/recommendations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    // Add userInput to the body so the backend can use it
    body: JSON.stringify({ mood, limit, userInput }),
  });
  if (!response.ok) {
    throw new Error('Failed to fetch recommendations');
  }
  return response.json();
};

export const createSpotifyPlaylist = async (playlistName: string, trackUris: string[]) => {
  const token = localStorage.getItem('authToken');
  const response = await fetch('/api/spotify/create-playlist', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ playlistName, trackUris }),
  });
  if (!response.ok) {
    throw new Error('Failed to create playlist');
  }
  return response.json();
};
