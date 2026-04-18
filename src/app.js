const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const skillRoutes = require('./routes/skillRoutes');
const interestRoutes = require('./routes/interestRoutes');
const careerPathRoutes = require('./routes/careerPathRoutes');
const recommendationRoutes = require('./routes/recommendationRoutes');
const preferenceRoutes = require('./routes/preferenceRoutes');
const jobRoutes = require('./routes/jobRoutes');
const courseRoutes = require('./routes/courseRoutes');
const intelligenceRoutes = require('./routes/intelligenceRoutes');

dotenv.config();

const app = express();

const corsOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((origin) => origin.trim())
  : '*';

app.use(
  cors({
    origin: corsOrigins,
    credentials: true
  })
);
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'AI Career Compass API is running.' });
});

app.use('/api/auth', authRoutes);
app.use('/api', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/skills', skillRoutes);
app.use('/api/interests', interestRoutes);
app.use('/api/career-paths', careerPathRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/preferences', preferenceRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api', jobRoutes);
app.use('/api', intelligenceRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: 'Internal server error' });
});

module.exports = app;
