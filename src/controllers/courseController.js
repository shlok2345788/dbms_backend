const { getAllCourses, getRecommendedCourses } = require('../models/courseModel');

const listCourses = async (req, res) => {
  try {
    const rows = await getAllCourses();
    return res.json(rows);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch courses.' });
  }
};

module.exports = { listCourses };
