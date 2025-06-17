const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const moodRoutes = require('./routes/mood');
const contentRoutes = require('./routes/content');
const favorRoutes = require('./routes/favorites');
const spotifyRoutes = require('./routes/spotify');

const PORT = process.env.PORT || 5000;
const app = express();

// Apply CORS as one of the first middleware
app.use(cors({
  origin: [
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5173',
    'http://localhost:3000', // Keep for backward compatibility
    'http://localhost:5173'
  ],
  credentials: true
}));

// Other middleware
app.use(express.json());

// Connect to the database
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true, useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected!'))
.catch(err => console.log(err));

// Define your routes AFTER applying CORS
app.use('/api/auth', authRoutes);
app.use('/api/mood', moodRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/favorites', favorRoutes);
app.use('/api/spotify', spotifyRoutes);

app.get('/', (_, res) => res.json({ msg: "Vibra backend running!" }));

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));