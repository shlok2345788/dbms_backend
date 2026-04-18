const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'ai_career_compass',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true
});

const testConnection = async () => {
  try {
    const conn = await pool.getConnection();
    console.log('Connected to MySQL database.');
    conn.release();
  } catch (error) {
    console.error('Database connection failed:', error.message);
  }
};

module.exports = { pool, testConnection };
