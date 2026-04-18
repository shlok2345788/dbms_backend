const bcrypt = require('bcryptjs');
const { createUser, findUserByEmail } = require('../models/userModel');
const { generateToken } = require('../utils/token');

const register = async (req, res) => {
  try {
    const { name, email, password, role = 'job_seeker', status = 'student' } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required.' });
    }

    const existing = await findUserByEmail(email);
    if (existing) {
      return res.status(409).json({ message: 'Email already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const id = await createUser({ name, email, password: hashedPassword, role, status });

    const token = generateToken({ id, email, role });

    return res.status(201).json({
      message: 'User registered successfully.',
      token,
      user: { id, name, email, role, status }
    });
  } catch (error) {
    console.error('Register error:', error.message);
    return res.status(500).json({ message: 'Failed to register user.' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    if (role && user.role !== role) {
      return res.status(403).json({
        message: `This account is registered as ${user.role === 'job_seeker' ? 'Applicant' : 'Job Recruiter'}. Please select the correct role.`
      });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ message: 'Server is missing JWT_SECRET. Set it in Render and redeploy.' });
    }

    const token = generateToken(user);

    return res.json({
      message: 'Login successful.',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        career_goal: user.career_goal
      }
    });
  } catch (error) {
    console.error('Login error:', error.message);
    if (error.message === 'JWT_SECRET is not configured.') {
      return res.status(500).json({ message: 'Server is missing JWT_SECRET. Set it in Render and redeploy.' });
    }
    return res.status(500).json({ message: 'Failed to login.' });
  }
};

module.exports = { register, login };
