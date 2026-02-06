/**
 * Authentication middleware – verifies JWT and attaches user to request.
 * Use on routes that require the user to be logged in.
 * Sends 401 if token is missing or invalid.
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token = null;

  // Check for token in Authorization header: "Bearer <token>"
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized – no token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired – please log in again' });
    }
    return res.status(401).json({ message: 'Not authorized – invalid token' });
  }
};

module.exports = { protect };
