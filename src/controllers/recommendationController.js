const { pool } = require('../config/db');
const { buildRecommendationsForUser } = require('../services/recommendationService');

const normalizeCsv = (value = '') =>
  value
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);

// Set user skills
exports.setUserSkills = async (req, res) => {
  try {
    const { skillIds } = req.body; // Array of skill IDs
    const userId = req.user.id;

    if (!Array.isArray(skillIds) || skillIds.length === 0) {
      return res.status(400).json({ message: 'skillIds must be a non-empty array' });
    }

    // Clear existing skills
    await pool.query('DELETE FROM user_skills WHERE user_id = ?', [userId]);

    // Insert new skills
    for (const skillId of skillIds) {
      await pool.query('INSERT INTO user_skills (user_id, skill_id) VALUES (?, ?)', [userId, skillId]);
    }

    res.json({ message: 'Skills updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error setting skills', error: error.message });
  }
};

// Set user interests
exports.setUserInterests = async (req, res) => {
  try {
    const { interestIds } = req.body; // Array of interest IDs
    const userId = req.user.id;

    if (!Array.isArray(interestIds) || interestIds.length === 0) {
      return res.status(400).json({ message: 'interestIds must be a non-empty array' });
    }

    // Clear existing interests
    await pool.query('DELETE FROM user_interests WHERE user_id = ?', [userId]);

    // Insert new interests
    for (const interestId of interestIds) {
      await pool.query('INSERT INTO user_interests (user_id, interest_id) VALUES (?, ?)', [userId, interestId]);
    }

    res.json({ message: 'Interests updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error setting interests', error: error.message });
  }
};

// Get career recommendations
exports.getCareerRecommendations = async (req, res) => {
  try {
    const userId = req.user.id;

    const [userSkillsResult] = await pool.query(
      `SELECT GROUP_CONCAT(s.name) as skill_names
       FROM user_skills us
       JOIN skills s ON s.id = us.skill_id
       WHERE us.user_id = ?`,
      [userId]
    );

    const [userInterestsResult] = await pool.query(
      `SELECT GROUP_CONCAT(i.name) as interest_names
       FROM user_interests ui
       JOIN interests i ON i.id = ui.interest_id
       WHERE ui.user_id = ?`,
      [userId]
    );

    const userSkills = userSkillsResult[0]?.skill_names ? normalizeCsv(userSkillsResult[0].skill_names) : [];
    const userInterests = userInterestsResult[0]?.interest_names ? normalizeCsv(userInterestsResult[0].interest_names) : [];

    const [careerPaths] = await pool.query('SELECT * FROM career_paths');

    // Calculate match for each career path
    const recommendedCareers = careerPaths
      .map(career => {
        const requiredSkills = normalizeCsv(career.required_skills || '');
        const requiredInterests = normalizeCsv(career.required_interests || '');

        const skillMatch = requiredSkills.filter(skill => userSkills.includes(skill)).length;
        const skillPercentage = requiredSkills.length > 0 ? (skillMatch / requiredSkills.length) * 50 : 0;

        const interestMatch = requiredInterests.filter(interest => userInterests.includes(interest)).length;
        const interestPercentage = requiredInterests.length > 0 ? (interestMatch / requiredInterests.length) * 50 : 0;

        const matchPercentage = Math.round(skillPercentage + interestPercentage);

        return { ...career, matchPercentage };
      })
      .sort((a, b) => b.matchPercentage - a.matchPercentage)
      .slice(0, 5);

    // Store recommendations
    for (const career of recommendedCareers) {
      await pool.query(
        'INSERT IGNORE INTO user_recommendations (user_id, career_path_id, match_percentage) VALUES (?, ?, ?)',
        [userId, career.id, career.matchPercentage]
      );
    }

    res.json(recommendedCareers);
  } catch (error) {
    res.status(500).json({ message: 'Error getting recommendations', error: error.message });
  }
};

// Get course recommendations
exports.getCourseRecommendations = async (req, res) => {
  try {
    const [courses] = await pool.query('SELECT * FROM courses ORDER BY id DESC LIMIT 10');
    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: 'Error getting course recommendations', error: error.message });
  }
};

// Get certification recommendations
exports.getCertificationRecommendations = async (req, res) => {
  try {
    const [certifications] = await pool.query('SELECT * FROM certifications ORDER BY id DESC LIMIT 10');
    res.json(certifications);
  } catch (error) {
    res.json([]);
  }
};

// Set user preferences
exports.setUserPreferences = async (req, res) => {
  try {
    const userId = req.user.id;
    const { careerGoal, preferredLocation, preferredJobType, expectedSalaryMin, expectedSalaryMax } = req.body;

    const [existingPrefs] = await pool.query('SELECT * FROM user_preferences WHERE user_id = ?', [userId]);

    if (existingPrefs.length > 0) {
      await pool.query(
        'UPDATE user_preferences SET career_goal = ?, preferred_location = ?, preferred_job_type = ?, expected_salary_min = ?, expected_salary_max = ? WHERE user_id = ?',
        [careerGoal || null, preferredLocation || null, preferredJobType || null, expectedSalaryMin || null, expectedSalaryMax || null, userId]
      );
    } else {
      await pool.query(
        'INSERT INTO user_preferences (user_id, career_goal, preferred_location, preferred_job_type, expected_salary_min, expected_salary_max) VALUES (?, ?, ?, ?, ?, ?)',
        [userId, careerGoal || null, preferredLocation || null, preferredJobType || null, expectedSalaryMin || null, expectedSalaryMax || null]
      );
    }

    res.json({ message: 'Preferences updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error setting preferences', error: error.message });
  }
};

// Get user dashboard
exports.getUserDashboard = async (req, res) => {
  try {
    const userId = req.user.id;

    const [userResult] = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);
    const user = userResult[0];

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const [skills] = await pool.query(
      `SELECT s.* FROM skills s 
       JOIN user_skills us ON s.id = us.skill_id 
       WHERE us.user_id = ?`,
      [userId]
    );

    const [interests] = await pool.query(
      `SELECT i.* FROM interests i 
       JOIN user_interests ui ON i.id = ui.interest_id 
       WHERE ui.user_id = ?`,
      [userId]
    );

    const [recommendations] = await pool.query(
      `SELECT cp.*, ur.match_percentage 
       FROM user_recommendations ur
       JOIN career_paths cp ON ur.career_path_id = cp.id
       WHERE ur.user_id = ?
       ORDER BY ur.match_percentage DESC
       LIMIT 3`,
      [userId]
    );

    const [appCountResult] = await pool.query(
      'SELECT COUNT(*) as total_applications FROM job_applications WHERE user_id = ?',
      [userId]
    );

    const [preferencesResult] = await pool.query(
      'SELECT * FROM user_preferences WHERE user_id = ?',
      [userId]
    );

    res.json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      skills,
      interests,
      recommendations,
      totalApplications: appCountResult[0].total_applications,
      preferences: preferencesResult[0] || null
    });
  } catch (error) {
    res.status(500).json({ message: 'Error getting dashboard', error: error.message });
  }
};

// Get my recommendations (legacy endpoint)
exports.getMyRecommendations = async (req, res) => {
  try {
    const result = await buildRecommendationsForUser(req.user.id);
    return res.json(result);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to generate recommendations.' });
  }
};

