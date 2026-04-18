const { pool } = require('../config/db');

const getAllCareerPaths = async () => {
  const [rows] = await pool.query('SELECT * FROM career_paths ORDER BY title');
  return rows;
};

const getCareerPathById = async (id) => {
  const [rows] = await pool.query('SELECT * FROM career_paths WHERE id = ?', [id]);
  return rows[0];
};

const createCareerPath = async (payload) => {
  const { title, description, required_skills, required_interests } = payload;
  const [result] = await pool.query(
    'INSERT INTO career_paths (title, description, required_skills, required_interests) VALUES (?, ?, ?, ?)',
    [title, description, required_skills, required_interests]
  );
  return result.insertId;
};

const updateCareerPath = async (id, payload) => {
  const { title, description, required_skills, required_interests } = payload;
  await pool.query(
    'UPDATE career_paths SET title = ?, description = ?, required_skills = ?, required_interests = ? WHERE id = ?',
    [title, description, required_skills, required_interests, id]
  );
};

const deleteCareerPath = async (id) => {
  await pool.query('DELETE FROM career_paths WHERE id = ?', [id]);
};

const getRoadmapByCareerPathId = async (careerPathId) => {
  const [rows] = await pool.query(
    'SELECT id, level, step_order, step_title, step_description FROM roadmaps WHERE career_path_id = ? ORDER BY FIELD(level, "Beginner", "Intermediate", "Advanced"), step_order',
    [careerPathId]
  );
  return rows;
};

module.exports = {
  getAllCareerPaths,
  getCareerPathById,
  createCareerPath,
  updateCareerPath,
  deleteCareerPath,
  getRoadmapByCareerPathId
};
