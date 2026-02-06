/**
 * Seed script: creates a test user and sample mood/assignment data.
 * Run with: node scripts/seed.js (from backend directory).
 * Requires MONGODB_URI and JWT_SECRET in .env (or set inline for seed only).
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Mood = require('../models/Mood');
const Assignment = require('../models/Assignment');

const TEST_EMAIL = 'student@test.com';
const TEST_PASSWORD = 'password123';

async function seed() {
  if (!process.env.MONGODB_URI) {
    console.error('Set MONGODB_URI in .env');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  // Remove existing test user data so we can re-seed idempotently
  const existing = await User.findOne({ email: TEST_EMAIL });
  if (existing) {
    await Mood.deleteMany({ user: existing._id });
    await Assignment.deleteMany({ user: existing._id });
    await User.deleteOne({ _id: existing._id });
    console.log('Removed existing test user and related data');
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(TEST_PASSWORD, salt);
  const user = await User.create({
    email: TEST_EMAIL,
    password: hashedPassword,
    name: 'Test Student',
  });
  console.log('Created test user:', user.email);

  const now = new Date();
  const moods = [
    { mood: 'happy', note: 'Finished a project', date: new Date(now - 0 * 24 * 60 * 60 * 1000) },
    { mood: 'calm', note: 'Good study session', date: new Date(now - 1 * 24 * 60 * 60 * 1000) },
    { mood: 'tired', note: 'Long day', date: new Date(now - 2 * 24 * 60 * 60 * 1000) },
    { mood: 'energetic', note: 'Morning workout', date: new Date(now - 3 * 24 * 60 * 60 * 1000) },
    { mood: 'neutral', note: '', date: new Date(now - 4 * 24 * 60 * 60 * 1000) },
    { mood: 'anxious', note: 'Exam tomorrow', date: new Date(now - 5 * 24 * 60 * 60 * 1000) },
    { mood: 'happy', note: 'Weekend plans', date: new Date(now - 6 * 24 * 60 * 60 * 1000) },
  ];
  for (const m of moods) {
    await Mood.create({ user: user._id, ...m });
  }
  console.log('Created', moods.length, 'sample mood entries');

  const assignments = [
    { title: 'Math homework Ch.5', description: 'Problems 1-20', dueDate: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000), priority: 'high' },
    { title: 'Essay draft', description: 'English 101', dueDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000), priority: 'medium' },
    { title: 'Lab report', description: 'Chemistry lab 3', dueDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), priority: 'high' },
    { title: 'Read Ch. 4', description: 'History', dueDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000), priority: 'low' },
    { title: 'Group project proposal', description: 'CS 200', dueDate: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000), priority: 'medium', completed: false },
  ];
  for (const a of assignments) {
    await Assignment.create({ user: user._id, ...a });
  }
  console.log('Created', assignments.length, 'sample assignments');

  console.log('\n--- Seed complete ---');
  console.log('Log in with:');
  console.log('  Email:', TEST_EMAIL);
  console.log('  Password:', TEST_PASSWORD);
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
