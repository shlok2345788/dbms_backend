// backend/src/routes/jobRoutes.js

const express = require('express');
const jobController = require('../controllers/jobController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// ========================================
// JOB ENDPOINTS
// ========================================

// Create Job (Recruiter only)
router.post('/jobs', authMiddleware, jobController.createJob);

// Get All Jobs (Paginated)
router.get('/jobs', jobController.getJobs);

// Get Job by ID
router.get('/jobs/:id', jobController.getJobById);

// Update Job
router.put('/jobs/:id', authMiddleware, jobController.updateJob);

// Delete Job
router.delete('/jobs/:id', authMiddleware, jobController.deleteJob);

// Get Recruiter's Jobs
router.get('/recruiter/jobs', authMiddleware, jobController.getRecruiterJobs);

// ========================================
// APPLICATION ENDPOINTS
// ========================================

// Apply for Job
router.post('/apply/:jobId', authMiddleware, jobController.applyForJobByJobId);

// Get Applications (for recruiter or current user)
router.get('/applications', authMiddleware, jobController.listApplicationsByRole);

// Update Application Status
router.put('/applications/:application_id', authMiddleware, jobController.updateApplicationStatus);

// Get User's Applications
router.get('/user/applications', authMiddleware, jobController.getUserApplications);

// Get Recommended Jobs
router.get('/jobs/recommended/list', authMiddleware, jobController.getRecommendedJobs);

module.exports = router;
