
/**
 * MongoDB database connection configuration.
 * Connects to MongoDB using the URI from environment variables.
 * Handles connection success and error events.
 */

const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      // These options help with compatibility and deprecation warnings
      // useNewUrlParser and useUnifiedTopology are default in Mongoose 6+
    });
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    if (error.message && error.message.toLowerCase().includes('auth')) {
      console.error('MongoDB connection error: Authentication failed. Check that in backend/.env:');
      console.error('  1. <db_password> is replaced with your actual Atlas database user password.');
      console.error('  2. If the password has special characters (@ # % etc), URL-encode them (e.g. @ → %40).');
    } else {
      console.error('MongoDB connection error:', error.message);
    }
    process.exit(1);
  }
};

module.exports = { connectDB };
