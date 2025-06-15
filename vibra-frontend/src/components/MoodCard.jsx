import { motion } from "framer-motion";
import AnimatedEmoji from "./AnimatedEmoji";
import MoodScoresBar from "./MoodScoresBar";
import { FaHeart, FaShare, FaBookmark } from "react-icons/fa";
import { useState, useRef } from "react";

export default function MoodCard({ data, onShowAnother, onSaveFavorite, saving, moodGif, quote }) {
  const [shared, setShared] = useState(false);
  const quoteRef = useRef();

  return (
    <motion.div
      className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-xl mx-auto flex flex-col items-center relative"
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", damping: 18 }}
    >
      <div className="absolute right-6 top-6"><FaHeart className="text-red-300" size={30} /></div>
      <div className="flex flex-col items-center justify-center mb-5">
        <AnimatedEmoji mood={data.primary.label} size={80} />
        <div className="text-2xl font-extrabold mt-2 capitalize tracking-wider">{data.primary.label}</div>
        <div className="text-gray-700 font-medium mt-1">
          Confidence: {(data.primary.score * 100).toFixed(1)}%
          {data.confidenceWarning &&
            <span className="ml-3 text-sm text-orange-500 animate-pulse">
              (Not 100% sure! Is this right?)
            </span>}
        </div>
        <MoodScoresBar scores={data.allScores} />
      </div>
      <div className="mb-6">
        {moodGif && (
          <img src={moodGif} alt="gif"
            className="rounded-xl shadow w-60 mx-auto"
            style={{ background: "#eee", minHeight: 120 }}
          />
        )}
        <div className="mt-3 text-center text-lg font-semibold italic" ref={quoteRef}>
          <q>{quote}</q>
        </div>
      </div>
      <div className="flex gap-5 mt-2">
        <button
          className="flex items-center gap-2 px-4 py-2 bg-violet-500 hover:bg-violet-700 text-white rounded-xl font-bold shadow transition-all"
          onClick={onShowAnother}
        >Another!</button>
        <button
          title="Save favorite"
          className={`flex items-center gap-2 px-4 py-2 bg-pink-400 hover:bg-pink-600 text-white rounded-xl font-bold shadow transition-all ${saving ? "opacity-60 pointer-events-none" : ""}`}
          onClick={onSaveFavorite}
        ><FaBookmark /> Favorite</button>
        <button
          title="Share"
          className="flex items-center gap-2 px-4 py-2 bg-cyan-400 hover:bg-cyan-600 text-white rounded-xl font-bold shadow transition-all"
          onClick={() => {
            navigator.clipboard.writeText(
              `My current mood on Vibra: ${data.primary.label} (${(data.primary.score * 100).toFixed(0)}%). "${quoteRef.current?.innerText || ""}"`
            ).then(() => setShared(true));
            setTimeout(() => setShared(false), 1200);
          }}
        >
          <FaShare /> {shared ? "Copied!" : "Share"}
        </button>
      </div>
    </motion.div>
  );
}