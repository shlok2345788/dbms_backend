const express = require('express');
const {
  listCareerPaths,
  getCareerPath,
  addCareerPath,
  editCareerPath,
  removeCareerPath
} = require('../controllers/careerPathController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', authMiddleware, listCareerPaths);
router.get('/:id', authMiddleware, getCareerPath);
router.post('/', authMiddleware, addCareerPath);
router.put('/:id', authMiddleware, editCareerPath);
router.delete('/:id', authMiddleware, removeCareerPath);

module.exports = router;
