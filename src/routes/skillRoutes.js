const express = require('express');
const { listSkills, addSkill, editSkill, removeSkill } = require('../controllers/skillController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', authMiddleware, listSkills);
router.post('/', authMiddleware, addSkill);
router.put('/:id', authMiddleware, editSkill);
router.delete('/:id', authMiddleware, removeSkill);

module.exports = router;
