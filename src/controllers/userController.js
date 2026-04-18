const {
  findUserById,
  updateUserProfile,
  getAllUsers,
  updateUserById,
  deleteUserById
} = require('../models/userModel');

const listUsers = async (req, res) => {
  try {
    const users = await getAllUsers();
    return res.json(users);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch users.' });
  }
};

const getUserById = async (req, res) => {
  try {
    const user = await findUserById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found.' });
    return res.json(user);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch user.' });
  }
};

const getMyProfile = async (req, res) => {
  try {
    const user = await findUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }
    return res.json(user);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch profile.' });
  }
};

const updateMyProfile = async (req, res) => {
  try {
    const { name, career_goal } = req.body;
    if (!name) {
      return res.status(400).json({ message: 'Name is required.' });
    }

    await updateUserProfile(req.user.id, { name, career_goal });
    const updatedUser = await findUserById(req.user.id);

    return res.json({ message: 'Profile updated.', user: updatedUser });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update profile.' });
  }
};

const editUserById = async (req, res) => {
  try {
    const { name, email, role, career_goal, status } = req.body;
    if (!name || !email) {
      return res.status(400).json({ message: 'Name and email are required.' });
    }

    await updateUserById(req.params.id, { name, email, role, career_goal, status });
    const user = await findUserById(req.params.id);
    return res.json({ message: 'User updated.', user });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update user.' });
  }
};

const removeUserById = async (req, res) => {
  try {
    await deleteUserById(req.params.id);
    return res.json({ message: 'User deleted.' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to delete user.' });
  }
};

module.exports = {
  listUsers,
  getUserById,
  getMyProfile,
  updateMyProfile,
  editUserById,
  removeUserById
};
