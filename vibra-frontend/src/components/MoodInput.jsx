import React, { useState } from 'react';
import { motion } from "framer-motion";
import { FaBolt } from "react-icons/fa";
export default function MoodInput({ onSubmit, loading }) {
  const [input, setInput] = useState("");
  return (
    <motion.form
      onSubmit={e => { e.preventDefault(); if (!loading) onSubmit(input); }}
      className="flex flex-col items-center p-6"
      initial={{ y: 30, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
    >
      <label className="text-2xl font-semibold mb-2">What's your vibe? <span className="text-3xl">💬</span></label>
      <input
        value={input}
        onChange={e => setInput(e.target.value)}
        className="rounded-xl border-2 border-violet-300 px-4 py-2 text-lg w-72 focus:outline-none focus:border-cyan-400 transition"
        placeholder="Type a feeling, emoji, or phrase"
        required
        disabled={loading}
        autoFocus
      />
      <button
        type="submit"
        disabled={loading || !input.trim()}
        className="mt-4 flex items-center gap-2 bg-violet-500 text-white font-bold px-6 py-2 rounded-xl shadow hover:bg-violet-600 transition-all active:scale-95"
      >
        <FaBolt /> Analyze Vibe
      </button>
    </motion.form>
  );
}