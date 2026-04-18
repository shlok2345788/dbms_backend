const { pool } = require('../config/db');

const saveUserPreferences = async ({ userId, skillIds, interestIds, careerGoal }) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    await connection.query('UPDATE users SET career_goal = ? WHERE id = ?', [careerGoal || null, userId]);

    await connection.query('DELETE FROM user_skills WHERE user_id = ?', [userId]);
    await connection.query('DELETE FROM user_interests WHERE user_id = ?', [userId]);

    if (Array.isArray(skillIds) && skillIds.length > 0) {
      const skillValues = skillIds.map((id) => [userId, id]);
      await connection.query('INSERT INTO user_skills (user_id, skill_id) VALUES ?', [skillValues]);
    }

    if (Array.isArray(interestIds) && interestIds.length > 0) {
      const interestValues = interestIds.map((id) => [userId, id]);
      await connection.query('INSERT INTO user_interests (user_id, interest_id) VALUES ?', [interestValues]);
    }

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

const getUserPreferenceNames = async (userId) => {
  const [skills] = await pool.query(
    'SELECT s.name FROM user_skills us INNER JOIN skills s ON us.skill_id = s.id WHERE us.user_id = ?',
    [userId]
  );

  const [interests] = await pool.query(
    'SELECT i.name FROM user_interests ui INNER JOIN interests i ON ui.interest_id = i.id WHERE ui.user_id = ?',
    [userId]
  );

  return {
    skills: skills.map((row) => row.name),
    interests: interests.map((row) => row.name)
  };
};

module.exports = { saveUserPreferences, getUserPreferenceNames };
