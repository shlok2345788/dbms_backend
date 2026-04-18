const { pool } = require('../config/db');

const getAllInterests = async () => {
  const [rows] = await pool.query('SELECT * FROM interests ORDER BY name');
  return rows;
};

module.exports = { getAllInterests };
