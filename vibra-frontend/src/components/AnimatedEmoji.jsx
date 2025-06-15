import { motion } from "framer-motion";
const emojiMap = {
  joy: "😄",
  sadness: "😭",
  anger: "😡",
  love: "😍",
  surprise: "😲",
  fear: "😨",
  optimism: "🌈"
};
export default function AnimatedEmoji({ mood, size=64 }) {
  return (
    <motion.span
      initial={{ scale: 0.2, rotate: -20, opacity: 0 }}
      animate={{ scale: 1, rotate: 0, opacity: 1 }}
      exit={{ scale: 0, opacity: 0, rotate: 20 }}
      transition={{ type: "spring", stiffness: 300, damping: 15 }}
      className="inline-block"
      style={{ fontSize: size }}
    >
      {emojiMap[mood] || "🤔"}
    </motion.span>
  );
}