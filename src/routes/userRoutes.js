const express = require('express');
const {
	listUsers,
	getUserById,
	getMyProfile,
	updateMyProfile,
	editUserById,
	removeUserById
} = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/me', authMiddleware, getMyProfile);
router.put('/me', authMiddleware, updateMyProfile);
router.get('/', authMiddleware, listUsers);
router.get('/:id', authMiddleware, getUserById);
router.put('/:id', authMiddleware, editUserById);
router.delete('/:id', authMiddleware, removeUserById);

module.exports = router;
