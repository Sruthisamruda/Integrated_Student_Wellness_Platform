/**
 * Authentication controller: signup, login.
 * Passwords are hashed with bcrypt before storing.
 * JWT is generated on successful login and returned to the client.
 */

const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Generate JWT token for a user (id only in payload)
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};

/**
 * POST /api/auth/signup
 * Body: { email, password, name? }
 * Creates user with hashed password, returns user + token.
 */
const signup = async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({ message: 'An account with this email already exists' });
    }

    // Hash password with 10 salt rounds (security best practice)
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      name: (name || '').trim(),
    });

    const token = generateToken(user._id);
    res.status(201).json({
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
      },
      token,
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ message: messages.join('. ') });
    }
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Server error – could not create account' });
  }
};

/**
 * POST /api/auth/login
 * Body: { email, password }
 * Verifies password and returns user + token.
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = generateToken(user._id);
    res.status(200).json({
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
      },
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error – could not log in' });
  }
};

/**
 * GET /api/auth/me
 * Protected. Returns current user profile (no password).
 */
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json({
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  signup,
  login,
  getMe,
};
