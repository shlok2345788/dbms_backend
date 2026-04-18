const express = require('express');
const { 
  getCareerRecommendations, 
  getCourseRecommendations,
  getCertificationRecommendations,
  setUserSkills,
  setUserInterests,
  setUserPreferences,
  getUserDashboard,
  getMyRecommendations
} = require('../controllers/recommendationController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Set user skills
router.post('/skills', authMiddleware, setUserSkills);

// Set user interests
router.post('/interests', authMiddleware, setUserInterests);

// Get career recommendations
router.get('/careers', authMiddleware, getCareerRecommendations);

// Get course recommendations
router.get('/courses', authMiddleware, getCourseRecommendations);

// Get certification recommendations
router.get('/certifications', authMiddleware, getCertificationRecommendations);

// Set user preferences
router.post('/preferences', authMiddleware, setUserPreferences);

// Get user dashboard
router.get('/dashboard', authMiddleware, getUserDashboard);

// Get my recommendations (legacy endpoint)
router.get('/me', authMiddleware, getMyRecommendations);

module.exports = router;
