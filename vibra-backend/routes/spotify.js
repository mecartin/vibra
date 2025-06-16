const express = require('express');
const router = express.Router();
const SpotifyWebApi = require('spotify-web-api-node');
const authMiddleware = require('../middleware/auth');
const User = require('../models/User');

// --- Helper function to initialize Spotify API client ---
const getSpotifyApi = (accessToken) => {
    const spotifyApi = new SpotifyWebApi({
        clientId: process.env.SPOTIFY_CLIENT_ID,
        clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
        redirectUri: process.env.SPOTIFY_REDIRECT_URI,
    });
    if (accessToken) {
        spotifyApi.setAccessToken(accessToken);
    }
    return spotifyApi;
};

// --- 1. Login Route: Redirects user to Spotify for authentication ---
router.get('/login', authMiddleware, (req, res) => {
    const scopes = ['playlist-modify-public', 'playlist-modify-private', 'user-read-private'];
    const state = req.user.id; // Use the user's ID as the state to identify them on callback
    const spotifyApi = getSpotifyApi();
    const authorizeURL = spotifyApi.createAuthorizeURL(scopes, state);
    res.redirect(authorizeURL);
});

// --- 2. Callback Route: Handles the redirect from Spotify after login ---
router.get('/callback', async (req, res) => {
    const { code, state } = req.query;
    const userId = state; // The state is our user's ID

    try {
        const spotifyApi = getSpotifyApi();
        const data = await spotifyApi.authorizationCodeGrant(code);
        const { access_token, refresh_token, expires_in } = data.body;

        const expiresAt = new Date();
        expiresAt.setSeconds(expiresAt.getSeconds() + expires_in);

        await User.findByIdAndUpdate(userId, {
            spotifyAccessToken: access_token,
            spotifyRefreshToken: refresh_token,
            spotifyTokenExpiresAt: expiresAt,
        });

        // Redirect user back to the frontend
        res.redirect(process.env.FRONTEND_URL || 'http://localhost:3000');
    } catch (error) {
        console.error('Error during Spotify callback:', error);
        res.status(500).redirect(`${process.env.FRONTEND_URL}/error`);
    }
});

// --- Mood-to-Music Mapping ---
const getTrackParametersForMood = (mood) => {
    const params = {
        joy: { seed_genres: 'pop,happy,dance', target_valence: 0.8, target_energy: 0.8 },
        sadness: { seed_genres: 'sad,acoustic,blues', target_valence: 0.2, target_energy: 0.3 },
        anger: { seed_genres: 'rock,metal,industrial', target_valence: 0.3, target_energy: 0.9 },
        fear: { seed_genres: 'ambient,classical', target_valence: 0.3, target_energy: 0.2 },
        surprise: { seed_genres: 'electronic,pop,funk', target_valence: 0.7, target_energy: 0.7 },
        disgust: { seed_genres: 'punk,grunge', target_valence: 0.1, target_energy: 0.8 },
        neutral: { seed_genres: 'chill,ambient,instrumental', target_valence: 0.5, target_energy: 0.5 },
    };
    return params[mood] || params['neutral'];
};

// --- 3. Get Recommendations Route ---
router.post('/recommendations', authMiddleware, async (req, res) => {
    const { mood, limit = 20 } = req.body;
    const user = await User.findById(req.user.id);

    try {
        const spotifyApi = getSpotifyApi(user.spotifyAccessToken);
        const trackParams = getTrackParametersForMood(mood);
        const options = { ...trackParams, limit };

        const data = await spotifyApi.getRecommendations(options);
        const tracks = data.body.tracks.map(track => ({
            uri: track.uri,
            name: track.name,
            artist: track.artists.map(a => a.name).join(', '),
            albumArt: track.album.images[0]?.url,
        }));

        res.json({ success: true, tracks });
    } catch (error) {
        console.error('Error getting recommendations:', error);
        res.status(500).json({ success: false, error: 'Failed to get recommendations.' });
    }
});

// --- 4. Create Playlist Route ---
router.post('/create-playlist', authMiddleware, async (req, res) => {
    const { playlistName, trackUris } = req.body;
    const user = await User.findById(req.user.id);
    
    try {
        const spotifyApi = getSpotifyApi(user.spotifyAccessToken);

        // Get current user's Spotify ID
        const me = await spotifyApi.getMe();
        const spotifyUserId = me.body.id;

        // Create the playlist
        const playlist = await spotifyApi.createPlaylist(playlistName, {
            'description': `A Vibra playlist for your mood.`,
            'public': false
        });
        const playlistId = playlist.body.id;

        // Add tracks to the new playlist
        await spotifyApi.addTracksToPlaylist(playlistId, trackUris);
        
        res.json({ success: true, url: playlist.body.external_urls.spotify });

    } catch (error) {
        console.error('Error creating playlist:', error);
        res.status(500).json({ success: false, error: 'Failed to create playlist.' });
    }
});


module.exports = router;
