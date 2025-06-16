import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, X } from 'lucide-react';
import './FavoritesScreen.css';

interface Favorite {
  gifUrl: string;
  sentiment: string;
  confidence: number;
  mood: string;
  timestamp: string;
  input: string;
}

const FavoritesScreen: React.FC = () => {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('favorites') || '[]');
    setFavorites(saved);
  }, []);

  const removeFavorite = (index: number) => {
    const updated = favorites.filter((_, i) => i !== index);
    setFavorites(updated);
    localStorage.setItem('favorites', JSON.stringify(updated));
  };

  const pageVariants = {
    initial: { opacity: 0, x: -100 },
    in: { opacity: 1, x: 0 },
    out: { opacity: 0, x: 100 }
  };

  return (
    <motion.div 
      className="favorites-screen"
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
    >
      <div className="cyber-grid"></div>
      
      <div className="favorites-header">
        <motion.button 
          className="back-button"
          onClick={() => navigate('/')}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <ArrowLeft size={24} />
        </motion.button>
        
        <h1 className="logo">Vibra</h1>
        <p className="tagline">your saved vibes</p>
      </div>

      <div className="favorites-grid">
        <AnimatePresence>
          {favorites.length === 0 ? (
            <motion.div 
              className="empty-state"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="empty-heart">💔</div>
              <p>No saved vibes yet</p>
            </motion.div>
          ) : (
            favorites.map((fav, index) => (
              <motion.div
                key={index}
                className="favorite-card"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -5 }}
              >
                <button 
                  className="remove-button"
                  onClick={() => removeFavorite(index)}
                >Remove Favorite
                  <X size={16} />
                </button>
                
                <div className="favorite-content">
                  <p className="favorite-input">{fav.input}</p>
                  <div className="favorite-mood">{fav.mood}</div>
                  <p className="favorite-sentiment">"{fav.sentiment}"</p>
                  <p className="favorite-confidence">{fav.confidence}% confident</p>
                  <p className="favorite-date">
                    {new Date(fav.timestamp).toLocaleDateString()}
                  </p>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default FavoritesScreen;