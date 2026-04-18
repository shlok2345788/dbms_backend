const express = require('express');
const multer = require('multer');
const authMiddleware = require('../middleware/authMiddleware');
const recommendationController = require('../controllers/recommendationController');
const intelligenceController = require('../controllers/intelligenceController');

const router = express.Router();
const upload = multer({
	storage: multer.memoryStorage(),
	fileFilter: (req, file, cb) => {
		const allowedMimeTypes = [
			'application/pdf',
			'application/msword',
			'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
		];

		if (allowedMimeTypes.includes(file.mimetype)) {
			return cb(null, true);
		}

		return cb(new Error('Only PDF, DOC, and DOCX files are allowed.'));
	}
});

router.get('/recommend-career', authMiddleware, recommendationController.getCareerRecommendations);
router.get('/job-readiness', authMiddleware, intelligenceController.getJobReadinessScore);
router.get('/skill-gap/:jobId', authMiddleware, intelligenceController.getSkillGapForJob);
router.get('/mini-projects', authMiddleware, intelligenceController.getMiniProjects);
router.get('/mock-interview/questions', authMiddleware, intelligenceController.getMockInterviewQuestions);
router.post('/mock-interview/feedback', authMiddleware, intelligenceController.submitMockInterviewFeedback);
router.post('/upload-resume', authMiddleware, upload.single('resume'), intelligenceController.uploadResumeAndAnalyze);
router.get('/analyze-resume/:jobId', authMiddleware, intelligenceController.analyzeResumeForJob);
router.get('/recommend-courses/:userId/:jobId', authMiddleware, intelligenceController.recommendCoursesForUserJob);

module.exports = router;
