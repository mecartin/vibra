import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { TransitionProvider } from './contexts/TransitionContext';
import InputScreen from './components/InputScreen';
import LoadingScreen from './components/LoadingScreen';
import ResultScreen from './components/ResultScreen';
import FavoritesScreen from './components/FavoritesScreen';
import './App.css';

function AnimatedRoutes() {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<InputScreen />} />
        <Route path="/loading" element={<LoadingScreen />} />
        <Route path="/result" element={<ResultScreen />} />
        <Route path="/favorites" element={<FavoritesScreen />} />
      </Routes>
    </AnimatePresence>
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