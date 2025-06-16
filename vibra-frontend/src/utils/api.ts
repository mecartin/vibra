import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export const analyzeVibe = async (text: string) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/analyze`, {
      text: text
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    // Map backend response to expected format
    return {
      mood: response.data.mood || response.data.emotion || 'contemplative',
      emoji: response.data.emoji || getEmojiForMood(response.data.mood),
      sentiment: response.data.quote || response.data.sentiment || 'vibing in the digital realm',
      confidence: response.data.confidence || Math.floor(Math.random() * 30 + 70),
      gifUrl: response.data.gif_url || response.data.gifUrl || `https://media.giphy.com/media/xT0xeJpnrWC4XWblEk/giphy.gif`
    };
  } catch (error) {
    console.error('API Error:', error);
    // Return fallback data
    return {
      mood: 'mysterious',
      emoji: '🌌',
      sentiment: 'lost in the digital void',
      confidence: 77,
      gifUrl: 'https://media.giphy.com/media/xT0xeJpnrWC4XWblEk/giphy.gif'
    };
  }
};

const getEmojiForMood = (mood: string): string => {
  const moodEmojis: { [key: string]: string } = {
    happy: '😊',
    sad: '😢',
    angry: '😠',
    anxious: '😰',
    excited: '🤩',
    calm: '😌',
    contemplative: '🤔',
    mysterious: '🌌'
  };
  return moodEmojis[mood] || '💭';
};