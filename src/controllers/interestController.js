const { getAllInterests } = require('../models/interestModel');

const listInterests = async (req, res) => {
  try {
    const rows = await getAllInterests();
    return res.json(rows);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch interests.' });
  }
};

module.exports = { listInterests };
