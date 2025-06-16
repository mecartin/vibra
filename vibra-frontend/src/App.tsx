// App.tsx - Add the PlaylistScreen route

import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { TransitionProvider } from './contexts/TransitionContext';
import InputScreen from './components/InputScreen';
import LoadingScreen from './components/LoadingScreen';
import ResultScreen from './components/ResultScreen';
import FavoritesScreen from './components/FavoritesScreen';
import PlaylistScreen from './components/PlaylistScreen'; // Add this import
import './App.css';
import { useNavigate } from 'react-router-dom'; // Add this import at the top of App.tsx

function AnimatedRoutes() {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<InputScreen />} />
        <Route path="/loading" element={<LoadingScreen />} />
        <Route path="/result" element={<ResultScreen />} />
        <Route path="/favorites" element={<FavoritesScreen />} />
        <Route path="/playlist" element={<PlaylistWrapper />} /> {/* Add this route */}
      </Routes>
    </AnimatePresence>
  );
}

// Create a wrapper component for PlaylistScreen to handle props
function PlaylistWrapper() {
  const navigate = useNavigate();
  const mood = sessionStorage.getItem('playlistMood') || 'neutral';
  const userInput = sessionStorage.getItem('playlistUserInput') || '';
  
  return (
    <PlaylistScreen 
      mood={mood}
      userInput={userInput}
      onBack={() => navigate('/result')}
    />
  );
}

function App() {
  return (
    <div className="App">
      <div className="y2k-overlay"></div>
      <div className="grain-overlay"></div>
      <div className="noise-layer"></div>
      <div className="glitch-layer"></div>
      <div className="vhs-overlay"></div>
      <Router>
        <TransitionProvider>
          <AnimatedRoutes />
        </TransitionProvider>
      </Router>
    </div>
  );
}

export default App;