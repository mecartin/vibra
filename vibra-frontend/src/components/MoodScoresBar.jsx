import { motion } from "framer-motion";
const COLORS = {
  joy: "bg-yellow-300",
  love: "bg-pink-300",
  surprise: "bg-blue-300",
  sadness: "bg-blue-500",
  anger: "bg-red-400",
  fear: "bg-purple-400",
  optimism: "bg-lime-200"
};
export default function MoodScoresBar({ scores }) {
  if (!scores) return null;
  return (
    <div className="mt-4 w-full max-w-xl">
      <div className="flex flex-col gap-2">
        {scores.map(({ label, score }) =>
          <motion.div key={label} initial={{width:0}} animate={{width: `${score*100}%`}} className="flex items-center">
            <div className="w-20 capitalize">{label}</div>
            <div className="flex-1 h-5 mx-2 rounded-full overflow-hidden bg-gray-200">
              <div className={`${COLORS[label] || "bg-slate-300"} h-full`} style={{ width: `${score * 100}%`, minWidth: 5 }} />
            </div>
            <div className="w-12 text-right">{(score * 100).toFixed(1)}%</div>
          </motion.div>
        )}
      </div>
    </div>
  );
}