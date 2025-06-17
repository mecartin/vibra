// PlaylistScreen.tsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Music, Shuffle } from 'lucide-react';
import { soundManager } from '../utils/sounds';
import { getSpotifyRecommendations, createSpotifyPlaylist } from '../utils/api';
import './PlaylistScreen.css';
import { checkSpotifyStatus, initiateSpotifyLogin } from '../utils/api';
import { useSearchParams } from 'react-router-dom';

interface Track {
  uri: string;
  name: string;
  artist: string;
  albumArt?: string;
}

const PlaylistScreen: React.FC = () => {
  const [mood, setMood] = useState('');
  const [userInput, setUserInput] = useState('');
  const [trackCount, setTrackCount] = useState(25);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);
  const [shuffling, setShuffling] = useState(false);
  const [creatingPlaylist, setCreatingPlaylist] = useState(false);
  const [error, setError] = useState('');
  const [playlistUrl, setPlaylistUrl] = useState('');
  const navigate = useNavigate();
  const [spotifyConnected, setSpotifyConnected] = useState(false);
  const [checkingConnection, setCheckingConnection] = useState(true);
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const storedMood = sessionStorage.getItem('playlistMood') || 'neutral';
    const storedInput = sessionStorage.getItem('playlistUserInput') || '';
    setMood(storedMood);
    setUserInput(storedInput);
    checkSpotifyConnection();
  const spotifyStatus = searchParams.get('spotify');
    const error = searchParams.get('error');
    
    if (spotifyStatus === 'connected') {
      setSpotifyConnected(true);
      soundManager.play('success');
      // Clean up URL
      window.history.replaceState({}, document.title, '/playlist');
    } else if (error) {
      setError('Failed to connect Spotify. Please try again.');
      // Clean up URL
      window.history.replaceState({}, document.title, '/playlist');
    }
    
    checkSpotifyConnection();
  }, [searchParams]);

  const handleBack = () => {
    soundManager.play('hover');
    navigate('/result');
  };

  const handleShuffleVibes = async () => {
    
    setShuffling(true);
    setError('');
    soundManager.play('hover');
    
    try {
      const response = await getSpotifyRecommendations(mood, trackCount, userInput);
      if (response.success) {
        setTracks(response.tracks);
        
        // Animate the shuffle effect
        setTimeout(() => {
          setShuffling(false);
        }, 1000);
      } else {
        setError('Failed to fetch tracks');
        setShuffling(false);
      }
    } catch (err) {
      setError('Please connect your Spotify account first');
      setShuffling(false);
    }
  };

  const handleCreatePlaylist = async () => {
    if (tracks.length === 0) {
      await handleShuffleVibes();
      return;
    }

    setCreatingPlaylist(true);
    setError('');
    soundManager.play('hover');
    
    try {
      const playlistName = `vibra ${mood} - ${userInput || 'vibes'}`;
      const trackUris = tracks.slice(0, trackCount).map(track => track.uri);
      const response = await createSpotifyPlaylist(playlistName, trackUris);
      
      if (response.success) {
        setPlaylistUrl(response.url);
        soundManager.play('success');
        
        // Open Spotify in new tab
        window.open(response.url, '_blank');
      } else {
        setError('Failed to create playlist');
      }
    } catch (err) {
      setError('Error creating playlist. Please try again.');
    } finally {
      setCreatingPlaylist(false);
    }
  };
  const checkSpotifyConnection = async () => {
  try {
    const status = await checkSpotifyStatus();
    setSpotifyConnected(status.connected);
  } catch (error) {
    console.error('Failed to check Spotify status:', error);
  } finally {
    setCheckingConnection(false);
  }
};

  const moodGradients: { [key: string]: string } = {
    happy: 'linear-gradient(180deg, #FFD700 0%, #FF6B6B 100%)',
    sad: 'linear-gradient(180deg, #4169E1 0%, #1E3A8A 100%)',
    angry: 'linear-gradient(180deg, #FF0000 0%, #8B0000 100%)',
    anxious: 'linear-gradient(180deg, #FF6347 0%, #DC143C 100%)',
    excited: 'linear-gradient(180deg, #00FF00 0%, #00AA00 100%)',
    calm: 'linear-gradient(180deg, #00CED1 0%, #008B8B 100%)',
    melancholic: 'linear-gradient(180deg, #9370DB 0%, #4B0082 100%)',
    contemplative: 'linear-gradient(180deg, #DDA0DD 0%, #8B008B 100%)',
    mysterious: 'linear-gradient(180deg, #4B0082 0%, #000000 100%)',
    default: 'linear-gradient(180deg, #00FF00 0%, #000000 100%)'
  };

  const bgGradient = moodGradients[mood] || moodGradients.default;

  return (
    <motion.div
      className="playlist-vibra-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ background: bgGradient }}
    >
      {/* Background Effects */}
      <div className="vibra-noise"></div>
      <div className="vibra-scan-lines"></div>
      <div className="vibra-glow-orb"></div>
      
      {/* Back Button */}
      <motion.button
        className="vibra-back-btn"
        onClick={handleBack}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onHoverStart={() => soundManager.play('hover')}
      >
        <ArrowLeft size={24} />
      </motion.button>

      {/* Main Content */}
      <div className="vibra-content">
        <motion.div
          className="vibra-logo-section"
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, type: "spring" }}
        >
          <div className="vibra-logo">
            <Music size={60} className="vibra-logo-icon" />
          </div>
          <h1 className="vibra-brand">vibra</h1>
          <p className="vibra-tagline">what's your vibe</p>
        </motion.div>

        <motion.div
          className="vibra-controls"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <div className="vibra-input-display">
            <p className="vibra-mood-label">curate your frequency</p>
            <div className="vibra-user-input">
              <span className="mood-badge">{mood}</span>
              <span className="user-text">{userInput || "pure vibes"}</span>
            </div>
          </div>

          {/* Track Count Slider */}
          <div className="vibra-slider-container">
            <div className="slider-header">
              <Music size={20} />
              <span>tracks: {trackCount}</span>
            </div>
            <div className="slider-wrapper">
              <span className="slider-min">10</span>
              <input
                type="range"
                min="10"
                max="50"
                value={trackCount}
                onChange={(e) => setTrackCount(Number(e.target.value))}
                className="vibra-slider"
              />
              <span className="slider-max">50</span>
            </div>
            <div className="slider-track-fill" style={{ width: `${((trackCount - 10) / 40) * 100}%` }}></div>
          </div>

          {/* Shuffle Button */}
          <motion.button
            className="vibra-shuffle-btn"
            onClick={handleShuffleVibes}
            disabled={shuffling}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <AnimatePresence mode="wait">
              {shuffling ? (
                <motion.div
                  key="shuffling"
                  initial={{ opacity: 0, rotate: 0 }}
                  animate={{ opacity: 1, rotate: 360 }}
                  exit={{ opacity: 0 }}
                  transition={{ rotate: { duration: 1, repeat: Infinity, ease: "linear" } }}
                >
                  <Shuffle size={24} />
                </motion.div>
              ) : (
                <motion.div
                  key="shuffle"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="shuffle-content"
                >
                  <Shuffle size={24} />
                  <span>shuffle vibes</span>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>

          {/* Create Playlist Button */}
          <motion.button
            className="vibra-create-btn"
            onClick={handleCreatePlaylist}
            disabled={creatingPlaylist}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            animate={{
              boxShadow: creatingPlaylist 
                ? ['0 0 30px rgba(0, 0, 0, 0.5)', '0 0 50px rgba(0, 0, 0, 0.8)']
                : '0 0 20px rgba(0, 0, 0, 0.3)'
            }}
          >
            <Music size={24} />
            <span>{creatingPlaylist ? 'creating...' : 'create playlist on spotify'}</span>
          </motion.button>

          {/* Track Preview */}
          {tracks.length > 0 && (
            <motion.div
              className="vibra-track-preview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <p className="preview-label">{tracks.length} tracks ready</p>
              <div className="track-dots">
                {tracks.slice(0, 5).map((_, index) => (
                  <motion.div
                    key={index}
                    className="track-dot"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                  />
                ))}
                {tracks.length > 5 && <span className="more-tracks">+{tracks.length - 5}</span>}
              </div>
            </motion.div>
          )}

          {/* Error Message */}
          {error && (
            <motion.div
              className="vibra-error"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <p>{error}</p>
              {error.includes('connect') && (
                <a href="/api/spotify/login" className="spotify-connect-link">
                  Connect Spotify →
                </a>
              )}
            </motion.div>
          )}

          {/* Success State */}
          {playlistUrl && (
            <motion.div
              className="vibra-success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <p>✨ Playlist created!</p>
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* Animated Background Elements */}
      <div className="vibra-particles">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="particle"
            initial={{ 
              x: Math.random() * window.innerWidth,
              y: window.innerHeight + 50
            }}
            animate={{ 
              y: -50,
              x: Math.random() * window.innerWidth
            }}
            transition={{
              duration: Math.random() * 10 + 10,
              repeat: Infinity,
              ease: "linear",
              delay: Math.random() * 5
            }}
          />
        ))}
        
      </div>
    
    </motion.div>
  );
};

export default PlaylistScreen;