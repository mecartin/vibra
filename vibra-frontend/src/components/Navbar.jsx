import { Link } from "react-router-dom";
import { FaSmileBeam } from "react-icons/fa";
export default function Navbar() {
  return (
    <nav className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-violet-500 to-cyan-400 shadow text-white sticky top-0 z-10">
      <Link to="/" className="flex items-center gap-2 text-2xl font-bold drop-shadow">
        <FaSmileBeam size={32} /> Vibra
      </Link>
      <div className="flex gap-6 text-lg">
        <Link to="/" className="hover:underline">Home</Link>
        <Link to="/favorites" className="hover:underline">Favorites</Link>
        <Link to="/about" className="hover:underline">About</Link>
      </div>
    </nav>
  );
}