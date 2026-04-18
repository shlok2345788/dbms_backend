const { getAllSkills, createSkill, updateSkill, deleteSkill } = require('../models/skillModel');

const listSkills = async (req, res) => {
  try {
    const rows = await getAllSkills();
    return res.json(rows);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch skills.' });
  }
};

const addSkill = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: 'Skill name is required.' });

    const id = await createSkill(name);
    return res.status(201).json({ message: 'Skill created.', id });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to create skill.' });
  }
};

const editSkill = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: 'Skill name is required.' });

    await updateSkill(req.params.id, name);
    return res.json({ message: 'Skill updated.' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update skill.' });
  }
};

const removeSkill = async (req, res) => {
  try {
    await deleteSkill(req.params.id);
    return res.json({ message: 'Skill deleted.' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to delete skill.' });
  }
};

module.exports = { listSkills, addSkill, editSkill, removeSkill };
