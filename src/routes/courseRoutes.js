const express = require('express');
const { listCourses } = require('../controllers/courseController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', authMiddleware, listCourses);

module.exports = router;
