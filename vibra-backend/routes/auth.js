const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();

// Register route
router.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (await User.findOne({ email })) return res.status(400).json({ error: "Email exists." });
    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({ email, password: hash });
    return res.json({ msg: "Registered!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Registration error." });
  }
});

// Login route
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: "No user." });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: "Wrong password." });
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
    res.json({ token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Login error." });
  }
});

module.exports = router;