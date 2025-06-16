import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTransition } from '../contexts/TransitionContext';
import { soundManager } from '../utils/sounds';
import './LoadingScreen.css';

const LoadingScreen: React.FC = () => {
  const [progress, setProgress] = useState(0);
  const [matrixChars, setMatrixChars] = useState<{ char: string; id: number }[]>([]);
  const navigate = useNavigate();
  const { setMatrixSymbols, setResultEmoji, setIsTransitioning } = useTransition();

  useEffect(() => {
    // Generate matrix rain characters with better distribution
    const chars = '01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン';
    const columns = Math.floor(window.innerWidth / 20);
    const newChars = Array(columns).fill(0).map((_, i) => ({
      char: chars[Math.floor(Math.random() * chars.length)],
      id: i
    }));
    setMatrixChars(newChars);
    setMatrixSymbols(newChars.map(c => c.char));

    // Get emoji from stored data
    const vibeData = JSON.parse(sessionStorage.getItem('vibeData') || '{}');
    const emoji = vibeData.emoji || '😭';
    setResultEmoji(emoji);

    const interval = setInterval(() => {
      setProgress((prev) => {
        const newProgress = Math.min(prev + Math.random() * 15, 100);
        if (newProgress >= 100) {
          clearInterval(interval);
          // Start emoji rain transition
          setTimeout(() => {
            setIsTransitioning(true);
            soundManager.play('transition');
            navigate('/result');
          }, 500);
        }
        return newProgress;
      });
    }, 200);

    return () => clearInterval(interval);
  }, [navigate, setMatrixSymbols, setResultEmoji, setIsTransitioning]);

  const pageVariants = {
    initial: { opacity: 0 },
    in: { opacity: 1 },
    out: { opacity: 0 }
  };

  return (
    <motion.div 
      className="loading-screen"
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
    >
      <div className="matrix-rain">
        {matrixChars.map((item, i) => (
          <motion.span
            key={item.id}
            className="matrix-char"
            initial={{ y: -20, opacity: 0 }}
            animate={{ 
              y: window.innerHeight + 20, 
              opacity: [0, 1, 1, 0]
            }}
            transition={{
              duration: Math.random() * 5 + 5,
              repeat: Infinity,
              delay: i * 0.1,
              ease: "linear"
            }}
            style={{
              left: `${(i / matrixChars.length) * 100}%`,
              fontSize: `${Math.random() * 10 + 14}px`
            }}
          >
            {item.char}
          </motion.span>
        ))}
      </div>

      <div className="content-container">
        <motion.div 
          className="heart-icon"
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
            <path d="M20 35L17.1 32.4C8.4 24.5 3 19.6 3 13.5C3 8.4 7 4.5 12 4.5C14.8 4.5 17.5 5.9 19.1 8.1C20.7 5.9 23.4 4.5 26.2 4.5C31.2 4.5 35.2 8.5 35.2 13.5C35.2 19.6 29.8 24.5 21.1 32.4L20 35Z" 
                  stroke="#FF00FF" 
                  strokeWidth="2"
                  fill="none"/>
          </svg>
        </motion.div>
        
        <h1 className="logo glitch-text" data-text="Vibra">Vibra</h1>
        <p className="tagline">what's your vibe</p>
        
        <motion.div 
          className="input-display"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          {sessionStorage.getItem('userInput') || '/User Input/'}
        </motion.div>
        
        <div className="matrix-progress-container">
          <div className="matrix-grid">
            {Array(20).fill(0).map((_, i) => (
              <motion.div 
                key={i} 
                className={`matrix-cell ${i < Math.floor(progress / 5) ? 'active' : ''}`}
                initial={{ scale: 0 }}
                animate={{ scale: i < Math.floor(progress / 5) ? 1 : 0.8 }}
                transition={{ delay: i * 0.05 }}
              />
            ))}
          </div>
          <motion.div 
            className="progress-text"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1, repeat: Infinity }}
          >
            {Math.floor(progress)}%
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default LoadingScreen;