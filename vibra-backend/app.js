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



app.use('/api/spotify', spotifyRoutes);
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true, useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected!'))
.catch(err => console.log(err));

app.use('/api/auth', authRoutes);
app.use('/api/mood', moodRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/favorites', favorRoutes);
app.use('/api/spotify', spotifyRoutes);

app.get('/', (_, res) => res.json({ msg: "Vibra backend running!" }));

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));