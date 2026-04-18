const { getAllCareerPaths, getRoadmapByCareerPathId } = require('../models/careerPathModel');
const { getUserPreferenceNames } = require('../models/preferenceModel');
const { getRecommendedCourses } = require('../models/courseModel');
const { findUserById } = require('../models/userModel');

const normalizeCsv = (value) => {
  if (!value) return [];
  // Career requirements are stored as CSV strings in seed data.
  return value
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
};

const groupRoadmapByLevel = (roadmapRows) => {
  return roadmapRows.reduce(
    (acc, row) => {
      acc[row.level].push({
        title: row.step_title,
        description: row.step_description,
        order: row.step_order
      });
      return acc;
    },
    { Beginner: [], Intermediate: [], Advanced: [] }
  );
};

const buildRecommendationsForUser = async (userId) => {
  const user = await findUserById(userId);
  const prefs = await getUserPreferenceNames(userId);
  const careerPaths = await getAllCareerPaths();

  const normalizedSkills = prefs.skills.map((s) => s.toLowerCase());
  const normalizedInterests = prefs.interests.map((i) => i.toLowerCase());
  const goalText = (user?.career_goal || '').toLowerCase();

  const scored = careerPaths.map((path) => {
    // Weighted matching between selected inputs and role requirements.
    const requiredSkills = normalizeCsv(path.required_skills);
    const requiredInterests = normalizeCsv(path.required_interests);

    const matchedSkills = requiredSkills.filter((skill) => normalizedSkills.includes(skill));
    const matchedInterests = requiredInterests.filter((interest) => normalizedInterests.includes(interest));

    let score = matchedSkills.length * 2 + matchedInterests.length * 2;

    if (goalText && path.title.toLowerCase().includes(goalText)) {
      score += 3;
    }

    return {
      careerPath: path,
      score,
      matchedSkills,
      matchedInterests
    };
  });

  const topRecommendations = scored
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  if (topRecommendations.length === 0 && careerPaths.length > 0) {
    topRecommendations.push({
      careerPath: careerPaths[0],
      score: 1,
      matchedSkills: [],
      matchedInterests: []
    });
  }

  const withRoadmaps = await Promise.all(
    topRecommendations.map(async (item) => {
      const roadmap = await getRoadmapByCareerPathId(item.careerPath.id);
      return {
        id: item.careerPath.id,
        title: item.careerPath.title,
        description: item.careerPath.description,
        score: item.score,
        matchedSkills: item.matchedSkills,
        matchedInterests: item.matchedInterests,
        roadmap: groupRoadmapByLevel(roadmap)
      };
    })
  );

  // Get recommended courses
  let advice = null;
  let recommendedCourses = [];
  const topScore = withRoadmaps.length > 0 ? withRoadmaps[0].score : 0;

  // If no strong career recommendations, suggest courses
  if (topScore < 2 || withRoadmaps.length === 0) {
    recommendedCourses = await getRecommendedCourses(prefs.skills, prefs.interests);
    advice = `Your current skill and interest profile doesn't have a strong match with available career paths. We recommend taking some courses to build expertise and expand your options. Consider the courses below to develop key skills for your career goals.`;
  } else {
    // Even if there are good recommendations, suggest courses for skill development
    recommendedCourses = await getRecommendedCourses(prefs.skills, prefs.interests);
    advice = 'To strengthen your profile for recommended careers, consider taking courses in the areas below.';
  }

  return {
    user: {
      id: user?.id,
      name: user?.name,
      careerGoal: user?.career_goal
    },
    selectedSkills: prefs.skills,
    selectedInterests: prefs.interests,
    recommendations: withRoadmaps,
    advice,
    suggestedCourses: recommendedCourses
  };
};

module.exports = { buildRecommendationsForUser };
