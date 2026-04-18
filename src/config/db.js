const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'ai_career_compass',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true
});

const ensureAuthSchema = async (conn) => {
  await conn.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT PRIMARY KEY AUTO_INCREMENT,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(120) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      role ENUM('job_seeker', 'recruiter') NOT NULL DEFAULT 'job_seeker',
      status ENUM('student', 'internship', 'job_seeker', 'confused') DEFAULT 'student',
      career_goal VARCHAR(255) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await conn.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS status ENUM('student', 'internship', 'job_seeker', 'confused') DEFAULT 'student'");
  await conn.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS career_goal VARCHAR(255) NULL");
};

const testConnection = async () => {
  try {
    const conn = await pool.getConnection();
    await ensureAuthSchema(conn);
    console.log('Connected to MySQL database.');
    conn.release();
  } catch (error) {
    console.error('Database connection failed:', error.message);
  }
};

module.exports = { pool, testConnection };
