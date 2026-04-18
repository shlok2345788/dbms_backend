const { pool } = require('../config/db');

const getAllSkills = async () => {
  const [rows] = await pool.query('SELECT * FROM skills ORDER BY name');
  return rows;
};

const createSkill = async (name) => {
  const [result] = await pool.query('INSERT INTO skills (name) VALUES (?)', [name]);
  return result.insertId;
};

const updateSkill = async (id, name) => {
  await pool.query('UPDATE skills SET name = ? WHERE id = ?', [name, id]);
};

const deleteSkill = async (id) => {
  await pool.query('DELETE FROM skills WHERE id = ?', [id]);
};

module.exports = { getAllSkills, createSkill, updateSkill, deleteSkill };
