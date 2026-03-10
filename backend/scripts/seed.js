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
const Question = require('../models/Question');
const MoodHistory = require('../models/MoodHistory');

const TEST_EMAIL = 'student@test.com';
const TEST_PASSWORD = 'password123';
const ADMIN_EMAIL = 'admin@test.com';
const ADMIN_PASSWORD = 'admin123';

async function seed() {
  if (!process.env.MONGODB_URI) {
    console.error('Set MONGODB_URI in .env');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  const existingQuestions = await Question.countDocuments();
  if (existingQuestions === 0) {
    const baseOptions = [
      { text: 'Never', score: 1 },
      { text: 'Rarely', score: 2 },
      { text: 'Sometimes', score: 3 },
      { text: 'Often', score: 4 },
      { text: 'Always', score: 5 },
    ];

    const questions = [
      // Academic Stress (10)
      { category: 'Academic Stress', question: 'How often do you feel overwhelmed by your academic workload?', options: baseOptions },
      { category: 'Academic Stress', question: 'How often do deadlines make you feel pressured?', options: baseOptions },
      { category: 'Academic Stress', question: 'How often do you worry about your grades or performance?', options: baseOptions },
      { category: 'Academic Stress', question: 'How often do you struggle to concentrate while studying?', options: baseOptions },
      { category: 'Academic Stress', question: 'How often do you feel you do not have enough time to complete your tasks?', options: baseOptions },
      { category: 'Academic Stress', question: 'How often do you feel stressed before exams or assessments?', options: baseOptions },
      { category: 'Academic Stress', question: 'How often do you procrastinate because tasks feel too difficult?', options: baseOptions },
      { category: 'Academic Stress', question: 'How often do you feel anxious about upcoming assignments?', options: baseOptions },
      { category: 'Academic Stress', question: 'How often do you find it hard to balance multiple subjects at once?', options: baseOptions },
      { category: 'Academic Stress', question: 'How often do you feel exhausted after studying?', options: baseOptions },

      // Emotional Wellbeing (10)
      { category: 'Emotional Wellbeing', question: 'How often do you feel calm and in control of your emotions?', options: baseOptions },
      { category: 'Emotional Wellbeing', question: 'How often do you feel anxious without a clear reason?', options: baseOptions },
      { category: 'Emotional Wellbeing', question: 'How often do you feel irritable or frustrated?', options: baseOptions },
      { category: 'Emotional Wellbeing', question: 'How often do you feel motivated to do your daily activities?', options: baseOptions },
      { category: 'Emotional Wellbeing', question: 'How often do you feel down or discouraged?', options: baseOptions },
      { category: 'Emotional Wellbeing', question: 'How often do you feel confident about handling challenges?', options: baseOptions },
      { category: 'Emotional Wellbeing', question: 'How often do you feel lonely or disconnected from others?', options: baseOptions },
      { category: 'Emotional Wellbeing', question: 'How often do you feel satisfied with your progress this week?', options: baseOptions },
      { category: 'Emotional Wellbeing', question: 'How often do you feel tense or restless?', options: baseOptions },
      { category: 'Emotional Wellbeing', question: 'How often do you feel hopeful about the next few days?', options: baseOptions },

      // Lifestyle / Personal Balance (10)
      { category: 'Lifestyle / Personal Balance', question: 'How often do you get at least 7 hours of sleep?', options: baseOptions },
      { category: 'Lifestyle / Personal Balance', question: 'How often do you take short breaks during study sessions?', options: baseOptions },
      { category: 'Lifestyle / Personal Balance', question: 'How often do you do some physical activity (walk, exercise, sports)?', options: baseOptions },
      { category: 'Lifestyle / Personal Balance', question: 'How often do you eat regular and balanced meals?', options: baseOptions },
      { category: 'Lifestyle / Personal Balance', question: 'How often do you spend time on hobbies or creative activities?', options: baseOptions },
      { category: 'Lifestyle / Personal Balance', question: 'How often do you limit screen time before sleeping?', options: baseOptions },
      { category: 'Lifestyle / Personal Balance', question: 'How often do you feel you have time for friends or family?', options: baseOptions },
      { category: 'Lifestyle / Personal Balance', question: 'How often do you feel your day has a healthy balance between work and rest?', options: baseOptions },
      { category: 'Lifestyle / Personal Balance', question: 'How often do you feel physically tired during the day?', options: baseOptions },
      { category: 'Lifestyle / Personal Balance', question: 'How often do you feel organized in managing your daily routine?', options: baseOptions },
    ];

    await Question.insertMany(questions);
    console.log('Seeded', questions.length, 'mood assessment questions');
  } else {
    console.log('Questions already exist:', existingQuestions);
  }

  // Remove existing test user data so we can re-seed idempotently
  const existing = await User.findOne({ email: TEST_EMAIL });
  if (existing) {
    await Mood.deleteMany({ user: existing._id });
    await Assignment.deleteMany({ user: existing._id });
    await MoodHistory.deleteMany({ user: existing._id });
    await User.deleteOne({ _id: existing._id });
    console.log('Removed existing test user and related data');
  }

  const salt = await bcrypt.genSalt(10);

  // Create test student
  const hashedPassword = await bcrypt.hash(TEST_PASSWORD, salt);
  const user = await User.create({
    email: TEST_EMAIL,
    password: hashedPassword,
    name: 'Test Student',
    role: 'user',
  });
  console.log('Created test user:', user.email);

  // Create admin user (remove existing if present)
  const existingAdmin = await User.findOne({ email: ADMIN_EMAIL });
  if (existingAdmin) {
    await User.deleteOne({ _id: existingAdmin._id });
    console.log('Removed existing admin user');
  }
  const adminHashed = await bcrypt.hash(ADMIN_PASSWORD, salt);
  const admin = await User.create({
    email: ADMIN_EMAIL,
    password: adminHashed,
    name: 'Admin',
    role: 'admin',
  });
  console.log('Created admin user:', admin.email);

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
  console.log('Student login:');
  console.log('  Email:', TEST_EMAIL);
  console.log('  Password:', TEST_PASSWORD);
  console.log('\nAdmin login:');
  console.log('  Email:', ADMIN_EMAIL);
  console.log('  Password:', ADMIN_PASSWORD);
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
