// PlaylistScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Music, Shuffle, Check, ExternalLink, Disc3, Sparkles, Volume2, Heart } from 'lucide-react';
import { getSpotifyRecommendations, createSpotifyPlaylist } from '../utils/api';
import { soundManager } from '../utils/sounds';
import { triggerConfetti } from '../utils/confetti';
import './PlaylistScreen.css';

interface Track {
  uri: string;
  name: string;
  artist: string;
  albumArt?: string;
  preview_url?: string;
}

interface PlaylistScreenProps {
  mood: string;
  userInput: string;
  onBack: () => void;
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

const PlaylistScreen: React.FC<PlaylistScreenProps> = ({ mood, userInput, onBack }) => {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [playlistName, setPlaylistName] = useState(`${mood} vibes ~ ${userInput.substring(0, 30)}`);
  const [trackCount, setTrackCount] = useState(20);
  const [isCreating, setIsCreating] = useState(false);
  const [createdPlaylistUrl, setCreatedPlaylistUrl] = useState('');
  const [selectedTrack, setSelectedTrack] = useState<string | null>(null);
  const [removedTracks, setRemovedTracks] = useState<string[]>([]);
  const [playingPreview, setPlayingPreview] = useState<string | null>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  const bgColor = moodColors[mood] || moodColors.default;

  const fetchRecommendations = useCallback(async () => {
    setLoading(true);
    setError('');
    soundManager.play('loading');
    
    try {
      const data = await getSpotifyRecommendations(mood, trackCount, userInput);
      if (data.success) {
        setTracks(data.tracks);
        soundManager.play('success');
      } else {
        setError('Could not tune into your vibe frequency. Try again?');
        soundManager.play('error');
      }
    } catch (err) {
      setError('Lost connection to the vibe dimension.');
      soundManager.play('error');
    } finally {
      setLoading(false);
    }
  }, [mood, trackCount, userInput]);

  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioElement) {
        audioElement.pause();
        audioElement.src = '';
      }
    };
  }, [audioElement]);

  const handleCreatePlaylist = async () => {
    if (!playlistName || tracks.length === 0) return;
    
    setIsCreating(true);
    setError('');
    soundManager.play('click');
    
    try {
      const filteredTracks = tracks.filter(t => !removedTracks.includes(t.uri));
      const trackUris = filteredTracks.map(t => t.uri);
      const data = await createSpotifyPlaylist(playlistName, trackUris);
      
      if (data.success) {
        setCreatedPlaylistUrl(data.url);
        soundManager.play('success');
        triggerConfetti();
      } else {
        setError('The vibe gods are not pleased. Try again.');
        soundManager.play('error');
      }
    } catch (err) {
      setError('A glitch in the matrix occurred.');
      soundManager.play('error');
    } finally {
      setIsCreating(false);
    }
  };

  const handleTrackToggle = (trackUri: string) => {
    soundManager.play('hover');
    if (removedTracks.includes(trackUri)) {
      setRemovedTracks(removedTracks.filter(uri => uri !== trackUri));
    } else {
      setRemovedTracks([...removedTracks, trackUri]);
    }
  };

  const handlePlayPreview = (track: Track) => {
    if (!track.preview_url) return;

    if (playingPreview === track.uri) {
      // Stop playing
      if (audioElement) {
        audioElement.pause();
        audioElement.src = '';
      }
      setPlayingPreview(null);
    } else {
      // Start playing new track
      if (audioElement) {
        audioElement.pause();
      }
      
      const audio = new Audio(track.preview_url);
      audio.volume = 0.5;
      audio.play();
      
      audio.addEventListener('ended', () => {
        setPlayingPreview(null);
      });
      
      setAudioElement(audio);
      setPlayingPreview(track.uri);
      soundManager.play('hover');
    }
  };

  const navigateToFavorites = () => {
    soundManager.play('hover');
    onBack();
  };

  if (createdPlaylistUrl) {
    return (
      <motion.div 
        className="playlist-screen success-screen"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{ backgroundColor: bgColor }}
      >
        <div className="cyber-grid"></div>
        <div className="holographic-overlay"></div>
        <div className="vhs-distortion"></div>
        
        <motion.div 
          className="playlist-success"
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", damping: 10 }}
        >
          <motion.div
            className="success-icon"
            animate={{ 
              rotate: [0, 360],
              scale: [1, 1.2, 1]
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              repeatType: "reverse"
            }}
          >
            <Sparkles size={80} color="#00FF00" />
          </motion.div>
          
          <h2 className="glitch-text" data-text="Playlist Created!">
            Playlist Created!
          </h2>
          <p className="success-message">Your vibe has been immortalized in the Spotify realm</p>
          
          <motion.a 
            href={createdPlaylistUrl} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="spotify-button primary"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onHoverStart={() => soundManager.play('hover')}
          >
            <ExternalLink size={20} />
            <span>Launch in Spotify</span>
          </motion.a>
          
          <motion.button 
            onClick={onBack} 
            className="back-to-vibe"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onHoverStart={() => soundManager.play('hover')}
          >
            Return to the Vibe
          </motion.button>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      className="playlist-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{ backgroundColor: bgColor }}
    >
      <div className="cyber-grid"></div>
      <div className="holographic-overlay"></div>
      <div className="vhs-distortion"></div>
      
      <motion.div 
        className="heart-icon"
        whileHover={{ scale: 1.1, rotate: 5 }}
        whileTap={{ scale: 0.9 }}
        onClick={navigateToFavorites}
        onHoverStart={() => soundManager.play('hover')}
      >
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
          <path d="M20 35L17.1 32.4C8.4 24.5 3 19.6 3 13.5C3 8.4 7 4.5 12 4.5C14.8 4.5 17.5 5.9 19.1 8.1C20.7 5.9 23.4 4.5 26.2 4.5C31.2 4.5 35.2 8.5 35.2 13.5C35.2 19.6 29.8 24.5 21.1 32.4L20 35Z" 
                stroke="#FF00FF" 
                strokeWidth="2"
                fill="none"/>
        </svg>
      </motion.div>

      <div className="content-wrapper">
        <motion.h1 
          className="logo glitch-text"
          data-text="Vibra"
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          onClick={onBack}
          style={{ cursor: 'pointer' }}
          whileHover={{ scale: 1.05 }}
          onHoverStart={() => soundManager.play('hover')}
        >
          Vibra
        </motion.h1>
        <p className="tagline">curate your frequency</p>

        <motion.div 
          className="playlist-header"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="playlist-controls">
            <div className="input-wrapper">
              <input
                type="text"
                value={playlistName}
                onChange={(e) => setPlaylistName(e.target.value)}
                placeholder="Name your vibe..."
                className="playlist-name-input"
                onFocus={() => soundManager.play('hover')}
              />
              <div className="input-glow"></div>
            </div>

            <div className="slider-container">
              <label className="slider-label">
                <Music size={16} />
                <span>Tracks: {trackCount}</span>
              </label>
              <div className="slider-wrapper">
                <input
                  type="range"
                  min="10"
                  max="50"
                  value={trackCount}
                  onChange={(e) => setTrackCount(Number(e.target.value))}
                  onMouseUp={() => fetchRecommendations()}
                  className="vibe-slider"
                  placeholder="Select number of tracks"
                  title="Select number of tracks"
                />
                <div className="slider-fill" style={{ width: `${((trackCount - 10) / 40) * 100}%` }}></div>
              </div>
            </div>

            <motion.button
              className="shuffle-button"
              onClick={fetchRecommendations}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              disabled={loading}
              onHoverStart={() => soundManager.play('hover')}
            >
              <Shuffle size={20} />
              <span>Shuffle Vibes</span>
            </motion.button>
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div 
              key="loader"
              className="loader-container"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="vibe-loader">
                <Disc3 className="spinning-disc" size={60} />
                                <p>Tuning into your frequency...</p>
              </div>
            </motion.div>
          ) : error ? (
            <motion.div 
              key="error"
              className="error-container"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <p className="error-message">{error}</p>
            </motion.div>
          ) : (
            <motion.div 
              key="tracks"
              className="track-list-container"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="track-list">
                {tracks.map((track, index) => (
                  <motion.div
                    key={track.uri}
                    className={`track-item ${removedTracks.includes(track.uri) ? 'removed' : ''}`}
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.02 }}
                    whileHover={{ x: 10 }}
                    onHoverStart={() => soundManager.play('hover')}
                  >
                    <div className="track-number">{index + 1}</div>
                    
                    <div className="track-album-art">
                      <img 
                        src={track.albumArt || '/placeholder-album.png'} 
                        alt={track.name}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/placeholder-album.png';
                        }}
                      />
                      <div className="album-overlay">
                        <div className="scan-line"></div>
                      </div>
                    </div>

                    <div className="track-info">
                      <h4 className="track-name">{track.name}</h4>
                      <p className="track-artist">{track.artist}</p>
                    </div>

                    <div className="track-actions">
                      {track.preview_url && (
                        <motion.button
                          className={`preview-button ${playingPreview === track.uri ? 'playing' : ''}`}
                          onClick={() => handlePlayPreview(track)}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <Volume2 size={16} className={playingPreview === track.uri ? 'pulse' : ''} />
                        </motion.button>
                      )}
                      
                      <motion.button
                        className={`toggle-button ${removedTracks.includes(track.uri) ? 'removed' : ''}`}
                        onClick={() => handleTrackToggle(track.uri)}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <Check size={16} />
                      </motion.button>
                    </div>
                  </motion.div>
                ))}
              </div>
              
              <div className="track-count-info">
                {tracks.length - removedTracks.length} tracks selected
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div 
          className="create-playlist-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <motion.button
            className="spotify-button create-button"
            onClick={handleCreatePlaylist}
            disabled={loading || isCreating || tracks.length === removedTracks.length}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onHoverStart={() => soundManager.play('hover')}
          >
            {isCreating ? (
              <>
                <Disc3 className="spinning-disc" size={20} />
                <span>Creating your vibe...</span>
              </>
            ) : (
              <>
                <Sparkles size={20} />
                <span>Create Playlist on Spotify</span>
              </>
            )}
          </motion.button>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default PlaylistScreen;