const {
  getAllCareerPaths,
  getCareerPathById,
  createCareerPath,
  updateCareerPath,
  deleteCareerPath,
  getRoadmapByCareerPathId
} = require('../models/careerPathModel');

const listCareerPaths = async (req, res) => {
  try {
    const rows = await getAllCareerPaths();
    return res.json(rows);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch career paths.' });
  }
};

const getCareerPath = async (req, res) => {
  try {
    const row = await getCareerPathById(req.params.id);
    if (!row) return res.status(404).json({ message: 'Career path not found.' });

    const roadmap = await getRoadmapByCareerPathId(req.params.id);
    return res.json({ ...row, roadmap });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch career path.' });
  }
};

const addCareerPath = async (req, res) => {
  try {
    const { title, description, required_skills, required_interests } = req.body;
    if (!title || !description) {
      return res.status(400).json({ message: 'Title and description are required.' });
    }

    const id = await createCareerPath({ title, description, required_skills, required_interests });
    return res.status(201).json({ message: 'Career path created.', id });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to create career path.' });
  }
};

const editCareerPath = async (req, res) => {
  try {
    const { title, description, required_skills, required_interests } = req.body;
    if (!title || !description) {
      return res.status(400).json({ message: 'Title and description are required.' });
    }

    await updateCareerPath(req.params.id, { title, description, required_skills, required_interests });
    return res.json({ message: 'Career path updated.' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update career path.' });
  }
};

const removeCareerPath = async (req, res) => {
  try {
    await deleteCareerPath(req.params.id);
    return res.json({ message: 'Career path deleted.' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to delete career path.' });
  }
};

module.exports = {
  listCareerPaths,
  getCareerPath,
  addCareerPath,
  editCareerPath,
  removeCareerPath
};
