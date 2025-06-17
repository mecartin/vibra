import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { analyzeVibe } from '../utils/api';
import { soundManager } from '../utils/sounds';
import './InputScreen.css';

const InputScreen: React.FC = () => {
  const [input, setInput] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyPress = () => {
      soundManager.play('type');
    };

    const textarea = document.querySelector('.input-box');
    textarea?.addEventListener('input', handleKeyPress);

    return () => {
      textarea?.removeEventListener('input', handleKeyPress);
    };
  }, []);

  const handleSubmit = async () => {
    if (input.trim()) {
      soundManager.play('submit');
      setIsAnimating(true);
      sessionStorage.setItem('userInput', input);
      
      // Navigate immediately for better UX
      setTimeout(() => {
        soundManager.play('transition');
        navigate('/loading');
      }, 500);
      
      // Analyze in background
      try {
        const vibeData = await analyzeVibe(input);
        sessionStorage.setItem('vibeData', JSON.stringify(vibeData));
      } catch (error) {
        console.error('Error analyzing vibe:', error);
      }
    }
  };

  const pageVariants = {
    initial: { opacity: 0, scale: 0.9, rotate: -5 },
    in: { opacity: 1, scale: 1, rotate: 0 },
    out: { opacity: 0, scale: 1.1, rotate: 5 }
  };

  const pageTransition = {
    type: "spring" as const,
    stiffness: 50,
    duration: 0.5
  };

  return (
    <motion.div 
      className="input-screen"
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={pageTransition}
    >
      <div className="texture-overlay"></div>
      <div className="scan-lines"></div>
      <div className="rgb-split"></div>
      
      <motion.div 
        className="heart-icon-top"
        whileHover={{ scale: 1.1, rotate: 5 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => {
          soundManager.play('hover');
          navigate('/favorites');
        }}
        onHoverStart={() => soundManager.play('hover')}
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
          <path d="M20 35L17.1 32.4C8.4 24.5 3 19.6 3 13.5C3 8.4 7 4.5 12 4.5C14.8 4.5 17.5 5.9 19.1 8.1C20.7 5.9 23.4 4.5 26.2 4.5C31.2 4.5 35.2 8.5 35.2 13.5C35.2 19.6 29.8 24.5 21.1 32.4L20 35Z" 
                stroke="#FF00FF" 
                strokeWidth="2"
                fill="none"/>
        </svg>
      </motion.div>

      <div className="main-content">
        <motion.h1 
          className="logo glitch-text"
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2, type: "spring", bounce: 0.5 }}
          data-text="Vibra"
        >
          Vibra
        </motion.h1>
        
        <motion.p 
          className="tagline"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          what's your vibe
        </motion.p>
        
        <motion.div
          className="input-container"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <textarea
            className={`input-box ${isAnimating ? 'glitch' : ''}`}
            placeholder="Describe what you're feeling right now"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={4}
          />
          <div className="input-border-glow"></div>
        </motion.div>
        
        <motion.button 
          className="submit-button"
          onClick={handleSubmit}
          disabled={!input.trim()}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          onHoverStart={() => soundManager.play('hover')}
        >
          <span className="button-text">show me</span>
          <div className="button-glitch" data-text="show me">show me</div>
        </motion.button>
      </div>
    </motion.div>
  );
};

export default InputScreen;