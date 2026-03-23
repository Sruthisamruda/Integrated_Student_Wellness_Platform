/**
 * Main Express server for the Integrated Student Wellness Platform API.
 * Sets up CORS, JSON parsing, routes, and error handling.
 * Requires .env with PORT, MONGODB_URI, JWT_SECRET.
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { connectDB } = require('./config/database');

const authRoutes = require('./routes/authRoutes');
const moodRoutes = require('./routes/moodRoutes');
const assignmentRoutes = require('./routes/assignmentRoutes');
const activityRoutes = require('./routes/activityRoutes');
const relaxationRoutes = require('./routes/relaxationRoutes');
const forumRoutes = require('./routes/forumRoutes');
const wellnessRoutes = require('./routes/wellnessRoutes');
const adminRoutes = require('./routes/adminRoutes');
const studentRoutes = require('./routes/studentRoutes');

const app = express();

// --- Middleware ---

// CORS: allow frontend origin (and common dev ports)
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:3000',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173',
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  })
);

// Parse JSON request bodies
app.use(express.json());

// Serve uploaded forum images
const path = require('path');
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Optional: health check for deployment
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// --- API Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/mood', moodRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/relaxation', relaxationRoutes);
app.use('/api/forum', forumRoutes);
app.use('/api/wellness', wellnessRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/student', studentRoutes);

// Serve React frontend (production build)
const frontendDist = path.join(__dirname, '..', 'frontend', 'dist');
app.use(express.static(frontendDist));

// Catch-all: send index.html for any non-API route (React Router support)
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendDist, 'index.html'));
});

// Global error handler (e.g. CORS errors)
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || 'Server error' });
});

// --- Start server after DB connect ---
const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });

module.exports = app;
