const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendVerificationEmail } = require('../utils/mailer');

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User with that email already exists.' });
    }

    // Create verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = Date.now() + 1000 * 60 * 60 * 24; // 24 hours

    const user = new User({ username, email, password, verificationToken, verificationExpires });
    await user.save();

    // Send verification email and report status
    let emailError = null;
    try {
      await sendVerificationEmail(email, verificationToken);
    } catch (emailErr) {
      emailError = emailErr;
      console.error('Failed to send verification email:', emailErr);
    }

    const responsePayload = { message: 'User registered successfully! Please check your email to verify your account.' };
    if (emailError) responsePayload.emailError = (emailError && emailError.message) ? emailError.message : String(emailError);
    res.status(201).json(responsePayload);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials.' });
    }

    // Check if verified
    if (!user.isVerified) {
      return res.status(403).json({ message: 'Account not verified. Please check your email for the verification link.' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials.' });
    }

    // Generate JWT token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ message: 'Logged in successfully!', token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

// Email verification endpoint
router.get('/verify', async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).json({ message: 'No token provided.' });

    const user = await User.findOne({ verificationToken: token, verificationExpires: { $gt: Date.now() } });
    if (!user) return res.status(400).json({ message: 'Invalid or expired token.' });

    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationExpires = undefined;
    await user.save();

    // Redirect to frontend verified page or respond with success
    const front = process.env.FRONTEND_BASE_URL || process.env.VITE_APP_BASE_URL || 'https://lsp-frontend.onrender.com';
    return res.redirect(`${front.replace(/\/$/, '')}/verified`);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});
