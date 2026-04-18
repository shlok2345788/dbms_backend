const { pool } = require('../config/db');

const createUser = async ({ name, email, password, role = 'job_seeker', status = 'student' }) => {
  const [result] = await pool.query(
    'INSERT INTO users (name, email, password, role, status) VALUES (?, ?, ?, ?, ?)',
    [name, email, password, role, status]
  );
  return result.insertId;
};

const findUserByEmail = async (email) => {
  const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
  return rows[0];
};

const findUserById = async (id) => {
  const [rows] = await pool.query('SELECT id, name, email, role, status, career_goal, created_at FROM users WHERE id = ?', [id]);
  return rows[0];
};

const getAllUsers = async () => {
  const [rows] = await pool.query('SELECT id, name, email, role, status, career_goal, created_at FROM users ORDER BY id');
  return rows;
};

const updateUserById = async (id, payload) => {
  const { name, email, role, career_goal, status } = payload;
  await pool.query(
    'UPDATE users SET name = ?, email = ?, role = ?, status = ?, career_goal = ? WHERE id = ?',
    [name, email, role || 'job_seeker', status || 'student', career_goal || null, id]
  );
};

const deleteUserById = async (id) => {
  await pool.query('DELETE FROM users WHERE id = ?', [id]);
};

const updateUserProfile = async (id, { name, career_goal }) => {
  await pool.query('UPDATE users SET name = ?, career_goal = ? WHERE id = ?', [name, career_goal || null, id]);
};

module.exports = {
  createUser,
  findUserByEmail,
  findUserById,
  updateUserProfile,
  getAllUsers,
  updateUserById,
  deleteUserById
};
