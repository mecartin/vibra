import axios from 'axios';

// The proxy in package.json will handle routing this to the backend.
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:5000';
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
    console.log("--- [FRONTEND] Step 1: Calling /api/mood/analyze ---");
    // 1. Get the mood analysis from the backend
    const moodResponse = await axios.post(`${API_BASE_URL}/mood/analyze`, {
      input: text,
    });
    
    // --- DIAGNOSTIC LOG ---
    // Log the *exact* data received from the backend's mood analysis
    console.log("--- [FRONTEND] Step 2: Received response from /api/mood/analyze:", moodResponse.data);


    // --- FIX: Handle the actual data structure from the ML model ---
    const mood = moodResponse.data.dominant_emotion;
    const confidence = Math.round(moodResponse.data.scores[mood] * 100);
    const confidenceWarning = confidence < 60; 

    console.log(`--- [FRONTEND] Step 3: Parsed mood: '${mood}' with confidence: ${confidence}% ---`);

    // 2. Get a GIF for the determined mood
    console.log("--- [FRONTEND] Step 4: Calling /api/content/gif ---");
    const gifResponse = await axios.get(`${API_BASE_URL}/content/gif/${mood}?userInput=${encodeURIComponent(text)}`);
    const gifUrl = gifResponse.data.url;
    console.log("--- [FRONTEND] Step 5: Received GIF URL:", gifUrl);

    // 3. Get a quote
    console.log("--- [FRONTEND] Step 6: Calling /api/content/quote ---");
    const quoteResponse = await axios.get(`${API_BASE_URL}/content/quote/${mood}?userInput=${encodeURIComponent(text)}`);
    const quote = quoteResponse.data;
    console.log("--- [FRONTEND] Step 7: Received Quote:", quote);


    // 4. Get an emoji for the mood
    const emoji = getEmojiForMood(mood);

    // 5. Assemble the final data object
    const finalVibeData = {
      mood,
      emoji,
      sentiment: quote.text,
      confidence,
      gifUrl,
      confidenceWarning,
      input: text,
    };
    
    // --- DIAGNOSTIC LOG ---
    console.log("--- [FRONTEND] Step 8: Successfully assembled final data:", finalVibeData);
    
    return finalVibeData;

  } catch (error) {
    // --- DIAGNOSTIC LOG ---
    console.error("--- [FRONTEND] AN ERROR OCCURRED ---", error);
    
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

export const checkSpotifyStatus = async () => {
  const token = localStorage.getItem('authToken');
  
  const response = await fetch(`${API_BASE_URL}/api/spotify/status`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  if (!response.ok) {
    throw new Error('Failed to check Spotify status');
  }
  
  return response.json();
};

// Initiate Spotify login - Fixed version
export const initiateSpotifyLogin = async () => {
  const token = localStorage.getItem('authToken');
  
  const response = await fetch(`${API_BASE_URL}/api/spotify/login`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  if (!response.ok) {
    throw new Error('Failed to initiate Spotify login');
  }
  
  const data = await response.json();
  if (data.authUrl) {
    window.location.href = `http://127.0.0.1:5000/api/spotify/login?token=${token}`;
  }
};

// Get Spotify recommendations
export const getSpotifyRecommendations = async (mood: string, limit: number, userInput: string) => {
  const token = localStorage.getItem('authToken');
  
  const response = await fetch(`${API_BASE_URL}/api/spotify/recommendations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ mood, limit, userInput }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch recommendations');
  }
  
  return response.json();
};

// Create Spotify playlist
export const createSpotifyPlaylist = async (playlistName: string, trackUris: string[]) => {
  const token = localStorage.getItem('authToken');
  
  const response = await fetch(`${API_BASE_URL}/api/spotify/create-playlist`, {
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

// Disconnect Spotify
export const disconnectSpotify = async () => {
  const token = localStorage.getItem('authToken');
  
  const response = await fetch(`${API_BASE_URL}/api/spotify/disconnect`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  if (!response.ok) {
    throw new Error('Failed to disconnect Spotify');
  }
  
  return response.json();
};