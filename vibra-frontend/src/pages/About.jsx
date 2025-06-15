import { useEffect, useState } from "react";
import { FaSmileBeam, FaTrash } from "react-icons/fa";

export default function Favorites() {
  const [favs, setFavs] = useState([]);
  useEffect(() => {
    const local = JSON.parse(localStorage.getItem("vibra_favorites") || "[]");
    setFavs(local);
  }, []);
  function handleRemove(i) {
    const updated = [...favs];
    updated.splice(i,1);
    setFavs(updated);
    localStorage.setItem("vibra_favorites", JSON.stringify(updated));
  }
  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-7 flex items-center gap-2 text-violet-600">
        <FaSmileBeam /> My Favorites
      </h2>
      {favs.length === 0 &&
        <div className="text-xl mt-10 text-gray-400">No favorites yet. Save a mood on the home page!</div>}
      {favs.map((fav, i) => (
        <div key={i} className="bg-white/80 rounded-xl shadow p-4 mb-4 flex flex-col md:flex-row items-center">
          <span className="text-4xl">{fav.emoji}</span>
          <span className="capitalize text-xl font-semibold mx-4">{fav.primaryMood}</span>
          {fav.gif && <img src={fav.gif} alt="fav gif"
            className="rounded shadow h-24 my-2 mx-4" />}
          <span className="flex-1 italic text-blue-900 mx-2 mb-1">
            "{fav.quote}"
          </span>
          <button className="ml-4 text-red-400 hover:text-red-800"
            title="Remove" onClick={()=>handleRemove(i)}>
            <FaTrash />
          </button>
        </div>
      ))}
    </div>
  );
}