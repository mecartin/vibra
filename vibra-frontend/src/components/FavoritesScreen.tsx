import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, X } from 'lucide-react';
import { soundManager } from '../utils/sounds';
import './FavoritesScreen.css';

interface Favorite {
  gifUrl: string;
  sentiment: string;
  confidence: number;
  mood: string;
  emoji: string;
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
    soundManager.play('hover');
    const updated = favorites.filter((_, i) => i !== index);
    setFavorites(updated);
    localStorage.setItem('favorites', JSON.stringify(updated));
  };

  const handleBack = () => {
    soundManager.play('transition');
    navigate('/');
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
      <div className="vhs-overlay"></div>
      
      <div className="favorites-container">
        <div className="favorites-header">
          <motion.button 
            className="back-button"
            onClick={handleBack}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onHoverStart={() => soundManager.play('hover')}
          >
            <ArrowLeft size={24} />
          </motion.button>
          
          <motion.h1 
            className="logo glitch-text"
            data-text="Vibra"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
          >
            Vibra
          </motion.h1>
          <p className="tagline">your saved vibes</p>
        </div>

        <div className="favorites-content">
          <AnimatePresence>
            {favorites.length === 0 ? (
              <motion.div 
                className="empty-state"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <div className="empty-heart">💔</div>
                <p>No saved vibes yet</p>
                <motion.button
                  className="back-to-home"
                  onClick={handleBack}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  create your first vibe
                </motion.button>
              </motion.div>
            ) : (
              <div className="favorites-grid">
                {favorites.map((fav, index) => (
                  <motion.div
                    key={index}
                    className="favorite-card"
                    initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
                    animate={{ opacity: 1, scale: 1, rotate: 0 }}
                    exit={{ opacity: 0, scale: 0.8, rotate: 5 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ y: -5, boxShadow: '0 10px 30px rgba(255, 0, 255, 0.4)' }}
                  >
                    <motion.button 
                      className="remove-button"
                      onClick={() => removeFavorite(index)}
                      whileHover={{ scale: 1.2, rotate: 90 }}
                      whileTap={{ scale: 0.8 }}
                      onHoverStart={() => soundManager.play('hover')}
                    >
                      <X size={16} />
                    </motion.button>
                    
                    <div className="favorite-content">
                      <div className="favorite-emoji">{fav.emoji}</div>
                      <p className="favorite-input">{fav.input}</p>
                      <p className="favorite-mood">{fav.mood}</p>
                      <p className="favorite-sentiment">"{fav.sentiment}"</p>
                      <p className="favorite-confidence">{fav.confidence}% confident</p>
                      <p className="favorite-date">
                        {new Date(fav.timestamp).toLocaleDateString()}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};

export default FavoritesScreen;