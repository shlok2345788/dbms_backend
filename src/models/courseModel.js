const { pool } = require('../config/db');

const getAllCourses = async () => {
  const [rows] = await pool.query('SELECT * FROM courses ORDER BY level, id');
  return rows;
};

// Get courses that match user skills/interests
const getRecommendedCourses = async (skills = [], interests = []) => {
  try {
    
    // Get all courses first
    const [allCourses] = await pool.query('SELECT * FROM courses');

    if (allCourses.length === 0) return [];

    // Score courses based on skill and interest matches
    const scoredCourses = allCourses.map((course) => {
      let score = 0;
      const skillsCovered = (course.skills_covered || '')
        .split(',')
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean);
      const interestsCovered = (course.interests_covered || '')
        .split(',')
        .map((i) => i.trim().toLowerCase())
        .filter(Boolean);

      const normalizedSkills = skills.map((s) => s.toLowerCase());
      const normalizedInterests = interests.map((i) => i.toLowerCase());

      // Match skills
      skillsCovered.forEach((skill) => {
        if (normalizedSkills.includes(skill)) score += 2;
      });

      // Match interests
      interestsCovered.forEach((interest) => {
        if (normalizedInterests.includes(interest)) score += 2;
      });

      return { ...course, matchScore: score };
    });

    // Sort by score (highest first) and then by level
    const levelOrder = { Beginner: 1, Intermediate: 2, Advanced: 3 };
    const sorted = scoredCourses.sort((a, b) => {
      if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore;
      return levelOrder[a.level] - levelOrder[b.level];
    });

    // Return top 5 courses, or top 5 beginner if no matches
    const topCourses = sorted.slice(0, 5);
    
    if (topCourses.length > 0 && topCourses[0].matchScore > 0) {
      return topCourses.map(({ matchScore, ...rest }) => rest);
    }

    // Fall back to beginner courses if no matches
    const beginnerCourses = allCourses.filter((c) => c.level === 'Beginner').slice(0, 5);
    return beginnerCourses.length > 0 ? beginnerCourses : allCourses.slice(0, 5);
  } catch (error) {
    console.error('Error in getRecommendedCourses:', error);
    const [courses] = await pool.query('SELECT * FROM courses LIMIT 5');
    return courses;
  }
};

module.exports = { getAllCourses, getRecommendedCourses };
