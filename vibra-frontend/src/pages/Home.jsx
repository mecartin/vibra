import { useState } from "react";
import { analyzeMood, getGifs, getQuote } from "../api/vibra";
import MoodInput from "../components/MoodInput";
import MoodCard from "../components/MoodCard";
import { AnimatePresence } from "framer-motion";

const moodToEmoji = {
  joy: "😄", sadness: "😭", anger: "😡", love: "😍", surprise: "😲", fear: "😨", optimism: "🌈"
};

export default function Home() {
  const [moodData, setMoodData] = useState(null);
  const [moodGif, setMoodGif] = useState(null);
  const [quote, setQuote] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleMoodSubmit(input) {
    setLoading(true);
    setMoodData(null);
    setQuote("");
    setMoodGif(null);
    try {
      const moodRes = await analyzeMood(input);
      setMoodData(moodRes.data);
      const [gifRes, quoteRes] = await Promise.all([
        getGifs(moodRes.data.primary.label),
        getQuote(moodRes.data.primary.label)
      ]);
      setMoodGif(gifRes.data.gifs?.[0]);
      setQuote(quoteRes.data.quote);
    } finally { setLoading(false); }
  }

  function handleShowAnother() {
    if (moodData) handleMoodSubmit(moodData.primary.label);
  }

  function handleSaveFavorite() {
    setSaving(true);
    // Using localStorage for favorites demo
    const favs = JSON.parse(localStorage.getItem("vibra_favorites") || "[]");
    favs.unshift({
      primaryMood: moodData.primary.label,
      allScores: moodData.allScores,
      emoji: moodToEmoji[moodData.primary.label] || "💫",
      gif: moodGif,
      quote,
      at: new Date().toISOString()
    });
    localStorage.setItem("vibra_favorites", JSON.stringify(favs.slice(0, 20)));
    setTimeout(() => setSaving(false), 1000);
  }

  return (
    <div className="flex flex-col items-center mt-10">
      <MoodInput onSubmit={handleMoodSubmit} loading={loading} />
      <AnimatePresence>
        {moodData && (
          <MoodCard
            key={moodData.primary.label + moodGif + quote}
            data={moodData}
            onShowAnother={handleShowAnother}
            saving={saving}
            onSaveFavorite={handleSaveFavorite}
            moodGif={moodGif}
            quote={quote}
          />
        )}
      </AnimatePresence>
    </div>
  );
}