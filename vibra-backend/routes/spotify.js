// vibra-backend/routes/spotify.js
const express = require('express');
const router = express.Router();
const SpotifyWebApi = require('spotify-web-api-node');
const authMiddleware = require('../middleware/auth');
const User = require('../models/User');

// Initialize Spotify API client
const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  redirectUri: process.env.SPOTIFY_REDIRECT_URI || 'http://127.0.0.1:5000/api/spotify/callback'
});

// Helper to get user-specific Spotify API instance
const getUserSpotifyApi = (accessToken, refreshToken) => {
  const userSpotifyApi = new SpotifyWebApi({
    clientId: process.env.SPOTIFY_CLIENT_ID,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
    redirectUri: process.env.SPOTIFY_REDIRECT_URI || 'http://localhost:5000/api/spotify/callback'
  });
  
  if (accessToken) userSpotifyApi.setAccessToken(accessToken);
  if (refreshToken) userSpotifyApi.setRefreshToken(refreshToken);
  
  return userSpotifyApi;
};

// Middleware to ensure valid Spotify token
const ensureValidToken = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user || !user.spotifyRefreshToken) {
      return res.status(401).json({ 
        success: false, 
        error: 'Spotify account not connected',
        requiresAuth: true 
      });
    }

    const userSpotifyApi = getUserSpotifyApi(user.spotifyAccessToken, user.spotifyRefreshToken);
    const now = Date.now();

    // Check if token needs refresh (expires in less than 5 minutes)
    if (!user.spotifyTokenExpiresAt || now > user.spotifyTokenExpiresAt.getTime() - 300000) {
      console.log('Refreshing Spotify token for user:', req.user.id);
      
      try {
        const data = await userSpotifyApi.refreshAccessToken();
        const { access_token, expires_in } = data.body;
        
        // Update user with new token
        user.spotifyAccessToken = access_token;
        user.spotifyTokenExpiresAt = new Date(now + expires_in * 1000);
        await user.save();
        
        // Update API instance with new token
        userSpotifyApi.setAccessToken(access_token);
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        
        // Clear invalid tokens
        user.spotifyAccessToken = null;
        user.spotifyRefreshToken = null;
        user.spotifyTokenExpiresAt = null;
        await user.save();
        
        return res.status(401).json({ 
          success: false, 
          error: 'Spotify authentication expired. Please reconnect.',
          requiresAuth: true 
        });
      }
    }

    req.spotifyApi = userSpotifyApi;
    req.spotifyUser = user;
    next();
  } catch (error) {
    console.error('Spotify auth middleware error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to verify Spotify connection' 
    });
  }
};

// 1. Login Route - Initiates Spotify OAuth flow
// vibra-backend/routes/spotify.js
router.get('/login', async (req, res) => {
  try {
    let userId;
    
    // Try to get user from auth header first
    if (req.headers.authorization) {
      const token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      userId = decoded.id;
    } else if (req.query.token) {
      // Fallback to query parameter
      const decoded = jwt.verify(req.query.token, process.env.JWT_SECRET);
      userId = decoded.id;
    } else {
      return res.status(401).json({ success: false, error: 'No authentication token' });
    }
    
    const scopes = [
      'playlist-modify-public',
      'playlist-modify-private',
      'user-read-private',
      'user-read-email',
      'user-top-read',
      'user-read-recently-played'
    ];
    
    const state = Buffer.from(JSON.stringify({
      userId,
      timestamp: Date.now()
    })).toString('base64');
    
    const authorizeURL = spotifyApi.createAuthorizeURL(scopes, state);
    res.redirect(authorizeURL);
  } catch (error) {
    console.error('Spotify login error:', error);
    res.redirect(`http://127.0.0.1:3000/playlist?error=auth_failed`);
  }
});

// 2. Callback Route - Handles OAuth callback
router.get('/callback', async (req, res) => {
  const { code, state, error } = req.query;
  
  if (error) {
    console.error('Spotify auth error:', error);
    return res.redirect(`http://127.0.0.1:3000/playlist?error=auth_failed`);
  }

  try {
    // Decode and verify state
    const decodedState = JSON.parse(Buffer.from(state, 'base64').toString());
    const { userId } = decodedState;

    // Exchange code for tokens
    const data = await spotifyApi.authorizationCodeGrant(code);
    const { access_token, refresh_token, expires_in } = data.body;

    // Get Spotify user info
    const tempApi = getUserSpotifyApi(access_token);
    const spotifyUserData = await tempApi.getMe();

    // Update user in database
    const user = await User.findByIdAndUpdate(
      userId,
      {
        spotifyAccessToken: access_token,
        spotifyRefreshToken: refresh_token,
        spotifyTokenExpiresAt: new Date(Date.now() + expires_in * 1000),
        spotifyUserId: spotifyUserData.body.id,
        spotifyEmail: spotifyUserData.body.email
      },
      { new: true }
    );

    if (!user) {
      throw new Error('User not found');
    }

    // Redirect to frontend with success
   res.redirect(`http://127.0.0.1:3000/playlist?spotify=connected`);
  } catch (error) {
    console.error('Spotify callback error:', error);
    res.redirect(`http://127.0.0.1:3000/playlist?error=callback_failed`);
  }
});

// 3. Check Connection Status
router.get('/status', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const isConnected = !!(user && user.spotifyRefreshToken);
    
    res.json({ 
      success: true, 
      connected: isConnected,
      spotifyEmail: user?.spotifyEmail || null
    });
  } catch (error) {
    console.error('Status check error:', error);
    res.status(500).json({ success: false, error: 'Failed to check status' });
  }
});

// 4. Disconnect Spotify
router.post('/disconnect', authMiddleware, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user.id, {
      spotifyAccessToken: null,
      spotifyRefreshToken: null,
      spotifyTokenExpiresAt: null,
      spotifyUserId: null,
      spotifyEmail: null
    });

    res.json({ success: true, message: 'Spotify disconnected successfully' });
  } catch (error) {
    console.error('Disconnect error:', error);
    res.status(500).json({ success: false, error: 'Failed to disconnect' });
  }
});

// Mood to Spotify parameters mapping
const getMoodParameters = (mood) => {
  const moodMap = {
    happy: {
      seed_genres: ['pop', 'dance', 'indie'],
      target_valence: 0.8,
      target_energy: 0.7,
      target_danceability: 0.7
    },
    sad: {
      seed_genres: ['acoustic', 'blues', 'soul'],
      target_valence: 0.2,
      target_energy: 0.3,
      target_acousticness: 0.7
    },
    angry: {
      seed_genres: ['metal', 'rock', 'punk'],
      target_valence: 0.3,
      target_energy: 0.9,
      target_loudness: -5
    },
    anxious: {
      seed_genres: ['ambient', 'classical', 'jazz'],
      target_valence: 0.4,
      target_energy: 0.4,
      target_instrumentalness: 0.5
    },
    excited: {
      seed_genres: ['electronic', 'pop', 'hip-hop'],
      target_valence: 0.9,
      target_energy: 0.9,
      target_tempo: 140
    },
    calm: {
      seed_genres: ['ambient', 'chill', 'new-age'],
      target_valence: 0.5,
      target_energy: 0.2,
      target_acousticness: 0.8
    },
    melancholic: {
      seed_genres: ['indie', 'alternative', 'folk'],
      target_valence: 0.3,
      target_energy: 0.4,
      target_mode: 0
    },
    contemplative: {
      seed_genres: ['classical', 'jazz', 'ambient'],
      target_valence: 0.5,
      target_energy: 0.3,
      target_instrumentalness: 0.7
    },
    mysterious: {
      seed_genres: ['electronic', 'ambient', 'trip-hop'],
      target_valence: 0.4,
      target_energy: 0.5,
      target_mode: 0
    }
  };

  return moodMap[mood.toLowerCase()] || moodMap.calm;
};

// 5. Get Recommendations
router.post('/recommendations', authMiddleware, ensureValidToken, async (req, res) => {
  const { mood, limit = 25, userInput } = req.body;

  try {
    const params = getMoodParameters(mood);
    
    // Build recommendation options
    const options = {
      limit: Math.min(limit, 50), // Spotify max is 100
      market: 'US',
      seed_genres: params.seed_genres.join(','),
      ...params
    };

    // Remove seed_genres from params object
    delete options.seed_genres;

    // Get recommendations
    const data = await req.spotifyApi.getRecommendations(options);

    // Format tracks
    const tracks = data.body.tracks.map(track => ({
      uri: track.uri,
      id: track.id,
      name: track.name,
      artist: track.artists.map(a => a.name).join(', '),
      albumArt: track.album.images[0]?.url || null,
      duration_ms: track.duration_ms,
      preview_url: track.preview_url
    }));

    res.json({ 
      success: true, 
      tracks,
      mood,
      totalTracks: tracks.length
    });
  } catch (error) {
    console.error('Recommendations error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get recommendations',
      details: error.message 
    });
  }
});

// 6. Create Playlist
router.post('/create-playlist', authMiddleware, ensureValidToken, async (req, res) => {
  const { playlistName, trackUris } = req.body;

  if (!playlistName || !trackUris || !trackUris.length) {
    return res.status(400).json({ 
      success: false, 
      error: 'Playlist name and tracks are required' 
    });
  }

  try {
    // Get user info
    const spotifyUserData = await req.spotifyApi.getMe();
    const spotifyUserId = spotifyUserData.body.id;

    // Create playlist
    const playlistData = await req.spotifyApi.createPlaylist(spotifyUserId, {
      name: playlistName,
      description: `Created by Vibra - ${new Date().toLocaleDateString()}`,
      public: false
    });

    const playlistId = playlistData.body.id;

    // Add tracks in batches (Spotify limit is 100 per request)
    const batchSize = 100;
    for (let i = 0; i < trackUris.length; i += batchSize) {
      const batch = trackUris.slice(i, i + batchSize);
      await req.spotifyApi.addTracksToPlaylist(playlistId, batch);
    }

    res.json({ 
      success: true, 
      playlistId,
      url: playlistData.body.external_urls.spotify,
      name: playlistData.body.name,
      tracksAdded: trackUris.length
    });
  } catch (error) {
    console.error('Create playlist error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to create playlist',
      details: error.message 
    });
  }
});
// 7. Get User's Top Tracks (for better recommendations)
router.get('/top-tracks', authMiddleware, ensureValidToken, async (req, res) => {
  try {
    const { time_range = 'medium_term', limit = 5 } = req.query;
    
    const data = await req.spotifyApi.getMyTopTracks({
      time_range,
      limit: Math.min(limit, 50)
    });

    const tracks = data.body.items.map(track => ({
      id: track.id,
      name: track.name,
      artist: track.artists.map(a => a.name).join(', '),
      popularity: track.popularity
    }));

    res.json({ success: true, tracks });
  } catch (error) {
    console.error('Top tracks error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get top tracks' 
    });
  }
});

// 8. Search Tracks
router.get('/search', authMiddleware, ensureValidToken, async (req, res) => {
  const { query, limit = 10 } = req.query;

  if (!query) {
    return res.status(400).json({ 
      success: false, 
      error: 'Search query is required' 
    });
  }

  try {
    const data = await req.spotifyApi.searchTracks(query, { limit });
    
    const tracks = data.body.tracks.items.map(track => ({
      uri: track.uri,
      id: track.id,
      name: track.name,
      artist: track.artists.map(a => a.name).join(', '),
      albumArt: track.album.images[0]?.url || null
    }));

    res.json({ success: true, tracks });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Search failed' 
    });
  }
});

module.exports = router;