const express = require('express');
const { listInterests } = require('../controllers/interestController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', authMiddleware, listInterests);

module.exports = router;
