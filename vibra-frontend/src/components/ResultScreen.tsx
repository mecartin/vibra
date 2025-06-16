import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Share2, Heart, Download } from 'lucide-react';
import html2canvas from 'html2canvas';
import { triggerConfetti, triggerHeartConfetti } from '../utils/confetti';
import { useTransition } from '../contexts/TransitionContext';
import { soundManager } from '../utils/sounds';
import './ResultScreen.css';

interface VibeData {
  gifUrl: string;
  sentiment: string;
  confidence: number;
  mood: string;
  emoji: string;
}

const moodColors: { [key: string]: string } = {
  happy: '#FFD700',
  sad: '#4169E1',
  angry: '#FF0000',
  anxious: '#FF6347',
  excited: '#00FF00',
  calm: '#00CED1',
  melancholic: '#9370DB',
  contemplative: '#DDA0DD',
  mysterious: '#4B0082',
  default: '#0000FF'
};

const ResultScreen: React.FC = () => {
  const [vibeData, setVibeData] = useState<VibeData | null>(null);
  const [bgColor, setBgColor] = useState('#0000FF');
  const [isFavorited, setIsFavorited] = useState(false);
  const [showEmojiRain, setShowEmojiRain] = useState(false);
  const navigate = useNavigate();
  const { matrixSymbols, resultEmoji, isTransitioning } = useTransition();

  useEffect(() => {
    const data = sessionStorage.getItem('vibeData');
    if (data) {
      const parsed = JSON.parse(data);
      setVibeData(parsed);
      
      // Show emoji rain if transitioning
      if (isTransitioning) {
        setShowEmojiRain(true);
        setTimeout(() => setShowEmojiRain(false), 3000);
      }
      
      // Animate background color change
      const color = moodColors[parsed.mood] || moodColors.default;
      setTimeout(() => {
        setBgColor(color);
        soundManager.play('success');
        triggerConfetti();
      }, 500);
    }
  }, [isTransitioning]);

  const createMoodCard = async () => {
    const moodCard = document.getElementById('mood-card');
    if (moodCard) {
      moodCard.style.display = 'block';
      const canvas = await html2canvas(moodCard, {
        backgroundColor: bgColor,
        scale: 2,
        logging: false,
        useCORS: true
      } as any);
      moodCard.style.display = 'none';
      return canvas;
    }
    return null;
  };

  const handleShare = async () => {
    soundManager.play('hover');
    const canvas = await createMoodCard();
    if (canvas) {
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], 'vibra-mood.png', { type: 'image/png' });
          
          if (navigator.share) {
            navigator.share({
              files: [file],
              title: 'My Vibe',
              text: `Feeling ${vibeData?.mood || 'vibes'} - via Vibra`
            });
          } else {
            handleDownload();
          }
        }
      });
    }
  };

  const handleDownload = async () => {
    soundManager.play('hover');
    const canvas = await createMoodCard();
    if (canvas) {
      const url = canvas.toDataURL('image/jpeg', 0.9);
      const a = document.createElement('a');
      a.href = url;
      a.download = `vibra-mood-${Date.now()}.jpg`;
      a.click();
    }
  };

  const handleFavorite = () => {
    if (vibeData) {
      soundManager.play('favorite');
      const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
      const newFavorite = {
        ...vibeData,
        timestamp: new Date().toISOString(),
        input: sessionStorage.getItem('userInput')
      };
      favorites.push(newFavorite);
      localStorage.setItem('favorites', JSON.stringify(favorites));
      setIsFavorited(true);
      triggerHeartConfetti();
    }
  };

  const pageVariants = {
    initial: { opacity: 0, scale: 0.9 },
    in: { opacity: 1, scale: 1 },
    out: { opacity: 0, scale: 0.9 }
  };

  // Generate evenly distributed emoji positions
  const emojiPositions = Array(30).fill(0).map((_, i) => ({
    id: i,
    x: (i % 6) * (100 / 6) + Math.random() * (100 / 6),
    delay: Math.floor(i / 6) * 0.2 + Math.random() * 0.2
  }));

  return (
    <motion.div 
      className="result-screen"
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      style={{ backgroundColor: bgColor }}
    >
      <div className="cyber-grid"></div>
      <div className="holographic-overlay"></div>
      <div className="vhs-distortion"></div>
      
      {/* Emoji Rain Transition - More Evenly Distributed */}
      <AnimatePresence>
        {showEmojiRain && (
          <div className="emoji-rain">
            {emojiPositions.map((pos) => (
              <motion.div
                key={pos.id}
                className="falling-emoji"
                initial={{ 
                  y: -100, 
                  x: `${pos.x}%`,
                  opacity: 0,
                  scale: 0
                }}
                animate={{ 
                  y: window.innerHeight + 100,
                  opacity: [0, 1, 1, 0],
                  scale: [0, 1, 1, 0.5],
                  rotate: Math.random() * 360
                }}
                exit={{ opacity: 0 }}
                transition={{
                  duration: 2 + Math.random(),
                  delay: pos.delay,
                  ease: "easeIn"
                }}
                style={{
                  position: 'fixed',
                  fontSize: `${20 + Math.random() * 20}px`,
                  zIndex: 100
                }}
              >
                {resultEmoji}
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>

      <div className="content-wrapper">
        <motion.div 
          className="heart-icon"
          whileHover={{ scale: 1.1, rotate: 5 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => {
            soundManager.play('hover');
            navigate('/favorites');
          }}
          onHoverStart={() => soundManager.play('hover')}
        >
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
            <path d="M20 35L17.1 32.4C8.4 24.5 3 19.6 3 13.5C3 8.4 7 4.5 12 4.5C14.8 4.5 17.5 5.9 19.1 8.1C20.7 5.9 23.4 4.5 26.2 4.5C31.2 4.5 35.2 8.5 35.2 13.5C35.2 19.6 29.8 24.5 21.1 32.4L20 35Z" 
                  stroke="#FF00FF" 
                  strokeWidth="2"
                  fill="none"/>
          </svg>
        </motion.div>
        
        <motion.h1 
          className="logo glitch-text"
          data-text="Vibra"
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          Vibra
        </motion.h1>
        <p className="tagline">what's your vibe</p>
        
        <motion.div 
          className="input-display"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          {sessionStorage.getItem('userInput') || '/User Input/'}
        </motion.div>
        
        <motion.div 
          className="emoji"
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", delay: 0.4 }}
        >
          {vibeData?.emoji || '😭'}
        </motion.div>
        
        <motion.p 
          className="confidence"
          initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          We're {vibeData?.confidence || 66}% sure that you're feeling
        </motion.p>
        
        <motion.p 
          className="sentiment"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          "{vibeData?.sentiment || 'the night is darkest just before the dawn'}"
        </motion.p>
        
        <motion.div 
          className="gif-container"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1 }}
        >
          <img src={vibeData?.gifUrl || 'https://media.giphy.com/media/xT0xeJpnrWC4XWblEk/giphy.gif'} alt="Mood GIF" />
          <div className="gif-overlay">
            <div className="scan-effect"></div>
          </div>
        </motion.div>
        
        <motion.div 
          className="action-buttons"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
        >
          <motion.button 
            className="action-button share-button"
            onClick={handleShare}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onHoverStart={() => soundManager.play('hover')}
          >
            <Share2 size={20} />
            <span>Share</span>
          </motion.button>

          <motion.button 
            className="action-button download-button"
            onClick={handleDownload}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onHoverStart={() => soundManager.play('hover')}
          >
            <Download size={20} />
            <span>Download</span>
          </motion.button>
          
          <motion.button 
            className={`action-button favorite-button ${isFavorited ? 'favorited' : ''}`}
            onClick={handleFavorite}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            disabled={isFavorited}
            onHoverStart={() => soundManager.play('hover')}
          >
            <Heart size={20} fill={isFavorited ? '#FF00FF' : 'none'} />
            <span>{isFavorited ? 'Saved' : 'Favorite'}</span>
          </motion.button>
        </motion.div>
      </div>

      {/* Hidden mood card for sharing/downloading */}
      <div id="mood-card" className="mood-card-hidden">
        <div className="mood-card-content">
          <div className="mood-card-texture"></div>
          <div className="mood-card-glitch"></div>
          <h2 className="mood-card-logo">Vibra</h2>
          <div className="mood-card-emoji">{vibeData?.emoji || '😭'}</div>
          <p className="mood-card-text">{sessionStorage.getItem('userInput')}</p>
          <div className="mood-card-divider"></div>
          <p className="mood-card-sentiment">"{vibeData?.sentiment}"</p>
          <p className="mood-card-mood">{vibeData?.mood}</p>
          <p className="mood-card-confidence">{vibeData?.confidence}% confident</p>
          <div className="mood-card-footer">
            <p>vibra • what's your vibe</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ResultScreen;