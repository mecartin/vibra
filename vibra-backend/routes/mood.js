const express = require('express');
const axios = require('axios');
const router = express.Router();

// Emoji & slang shortcut mapping
const emojiRules = {
  "😂": "joy", "🤣": "joy", "😄": "joy", "😃": "joy", "😊": "joy",
  "😍": "love", "❤️": "love", "🥰": "love",
  "😭": "sadness", "😢": "sadness", "😩": "sadness", "😔": "sadness",
  "😱": "surprise", "😯": "surprise", "😲": "surprise",
  "😡": "anger", "🤬": "anger",
  "😨": "fear", "😰": "fear"
};

const slangMap = {
  "lit": "joy", "vibe": "joy", "buzzkill": "sadness", "goat": "love",
  "yeet": "surprise", "bet": "joy", "slay": "joy", "sus": "fear", "smh": "sadness"
};

function preprocessInput(input) {
  let processed = input;
  for (const emo in emojiRules) {
    if (processed.includes(emo)) {
      processed = processed.split(emo).join(" " + emojiRules[emo] + " ");
    }
  }
  return processed;
}

function fastDetect(input) {
  input = input.trim();
  if (emojiRules[input]) return emojiRules[input];
  for (const word in slangMap) {
    if (input.toLowerCase().includes(word)) return slangMap[word];
  }
  return null;
}

function flattenScores(respData) {
  let data = respData;
  // Keep unwrapping arrays until the first element has a .label
  while (Array.isArray(data) && data[0] && Array.isArray(data[0])) {
    data = data[0];
  }
  return data;
}

router.post('/analyze', async (req, res) => {
  const { input } = req.body;
  // Emoji/slang shortcut:
  const fastMood = fastDetect(input);
  if (fastMood) {
    const moods = ["joy", "love", "surprise", "sadness", "fear", "anger", "optimism"];
    const scores = moods.map(label => ({
      label,
      score: label === fastMood ? 1.0 : 0.0
    }));
    return res.json({
      primary: { label: fastMood, score: 1.0 },
      secondary: scores[1],
      allScores: scores,
      method: "emoji_or_slang"
    });
  }
  const cleanText = preprocessInput(input);
  try {
    const resp = await axios.post('http://127.0.0.1:5001/analyze', { text: cleanText });

    let scores = flattenScores(resp.data);

    if (!Array.isArray(scores) || !scores.length || !scores[0].label) {
      console.error('Unexpected ML server data:', resp.data);
      return res.status(500).json({ error: "Unexpected ML response structure", data: resp.data });
    }

    const sorted = scores.filter(x => x && x.label && typeof x.score === "number")
      .sort((a, b) => b.score - a.score);

    if (!sorted.length) {
      console.error('After filtering, no valid score found:', scores);
      return res.status(500).json({ error: "No valid emotion scores." });
    }

    const confidenceWarning = (sorted[0].score < 0.6 || (sorted[0].score - (sorted[1]?.score || 0)) < 0.2);

    res.json({
      primary: sorted[0],
      secondary: sorted[1] || null,
      allScores: sorted,
      confidenceWarning,
      method: "ml_model"
    });
  } catch (err) {
    console.error('ML analyze failed:', err.message, err.response?.data || '');
    res.status(500).json({ error: "Mood detection error.", details: err.message });
  }
});

module.exports = router;