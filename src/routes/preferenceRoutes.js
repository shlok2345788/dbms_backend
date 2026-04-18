const express = require('express');
const { savePreferences } = require('../controllers/preferenceController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/me', authMiddleware, savePreferences);

module.exports = router;
