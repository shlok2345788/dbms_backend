const { saveUserPreferences } = require('../models/preferenceModel');

const savePreferences = async (req, res) => {
  try {
    const { skillIds = [], interestIds = [], careerGoal = '' } = req.body;

    await saveUserPreferences({
      userId: req.user.id,
      skillIds,
      interestIds,
      careerGoal
    });

    return res.json({ message: 'Preferences saved successfully.' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to save preferences.' });
  }
};

module.exports = { savePreferences };
