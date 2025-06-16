import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Share2, Heart, Download, MessageSquare, X , Music } from 'lucide-react';
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

// Master emotions for feedback
const MASTER_EMOTIONS = ['happy', 'sad', 'angry', 'anxious', 'excited', 'calm', 'neutral'];

// Emoji mapping for emotions
const EMOTION_EMOJIS: { [key: string]: string } = {
  happy: '😊',
  sad: '😢',
  angry: '😠',
  anxious: '😰',
  excited: '🤩',
  calm: '😌',
  neutral: '😐'
};

const ResultScreen: React.FC = () => {
  const [vibeData, setVibeData] = useState<VibeData | null>(null);
  const [bgColor, setBgColor] = useState('#0000FF');
  const [isFavorited, setIsFavorited] = useState(false);
  const [showEmojiRain, setShowEmojiRain] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
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

  const handleFeedbackSubmit = async (correctEmotion: string) => {
    try {
      soundManager.play('click');
      
      // Submit feedback to API
      const response = await fetch('/api/submit-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalText: sessionStorage.getItem('userInput'),
          incorrectEmotion: vibeData?.mood,
          correctEmotion: correctEmotion,
          timestamp: new Date().toISOString()
        })
      });

      if (response.ok) {
        setFeedbackSubmitted(true);
        setShowFeedback(false);
        soundManager.play('success');
        
        // Update the current vibe data with correct emotion
        if (vibeData) {
          const updatedVibeData = {
            ...vibeData,
            mood: correctEmotion,
            emoji: EMOTION_EMOJIS[correctEmotion] || vibeData.emoji
          };
          setVibeData(updatedVibeData);
          sessionStorage.setItem('vibeData', JSON.stringify(updatedVibeData));
          
          // Update background color
          const newColor = moodColors[correctEmotion] || moodColors.default;
          setBgColor(newColor);
        }
      }
    } catch (error) {
      console.error("Failed to submit feedback", error);
      // Could add error toast notification here
    }
  };

  const pageVariants = {
    initial: { opacity: 0, scale: 0.9 },
    in: { opacity: 1, scale: 1 },
    out: { opacity: 0, scale: 0.9 }
  };
  const handleCreatePlaylist = () => {
    soundManager.play('click');
    // Store current mood and input for playlist screen
    sessionStorage.setItem('playlistMood', vibeData?.mood || 'neutral');
    sessionStorage.setItem('playlistUserInput', sessionStorage.getItem('userInput') || '');
    navigate('/playlist');
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
          className="spotify-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.3 }}
        >
          <motion.button 
            className="spotify-playlist-button"
            onClick={handleCreatePlaylist}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onHoverStart={() => soundManager.play('hover')}
          >
            <Music size={20} />
            <span>Create Spotify Playlist</span>
          </motion.button>
        </motion.div>

        {/* Feedback Section */}
        <motion.div 
          className="feedback-section"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4 }}
        >
          {!showFeedback && !feedbackSubmitted && (
            <motion.button 
              className="feedback-toggle"
              onClick={() => {
                setShowFeedback(true);
                soundManager.play('hover');
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onHoverStart={() => soundManager.play('hover')}
            >
              <MessageSquare size={16} />
              <span>Wrong vibe?</span>
            </motion.button>
          )}

          {feedbackSubmitted && (
            <motion.p 
              className="feedback-thanks"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              ✨ Thanks for helping us vibe better!
            </motion.p>
          )}
        </motion.div>
      </div>

      {/* Feedback Modal */}
      <AnimatePresence>
        {showFeedback && (
          <motion.div 
            className="feedback-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowFeedback(false)}
          >
            <motion.div 
              className="feedback-modal"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="feedback-header">
                <h3>What's the right vibe?</h3>
                <motion.button 
                  className="close-button"
                  onClick={() => {
                    setShowFeedback(false);
                    soundManager.play('hover');
                  }}
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <X size={20} />
                </motion.button>
              </div>

              <p className="feedback-subtitle">Help us understand your emotions better</p>

              <div className="emotion-choices">
                {MASTER_EMOTIONS.filter(e => e !== vibeData?.mood).map((emotion, index) => (
                  <motion.button 
                    key={emotion}
                    className="emotion-choice"
                    onClick={() => handleFeedbackSubmit(emotion)}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ 
                      scale: 1.05,
                      backgroundColor: moodColors[emotion] || moodColors.default,
                      color: '#000'
                    }}
                    whileTap={{ scale: 0.95 }}
                    onHoverStart={() => soundManager.play('hover')}
                  >
                    <span className="emotion-emoji">{EMOTION_EMOJIS[emotion]}</span>
                    <span className="emotion-name">{emotion}</span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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