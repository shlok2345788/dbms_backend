// backend/src/controllers/jobController.js

const { pool } = require('../config/db');

// ========================================
// JOB ENDPOINTS
// ========================================

// Create Job (Recruiter Only)
exports.createJob = async (req, res) => {
  try {
    const recruiterId = req.userId;
    const { title, company_name, description, skills_required, location, job_type, salary_min, salary_max, experience_years } = req.body;

    // Verify recruiter
    const [recruiter] = await pool.query('SELECT role FROM users WHERE id = ?', [recruiterId]);
    if (recruiter.length === 0 || recruiter[0].role !== 'recruiter') {
      return res.status(403).json({ error: 'Only recruiters can post jobs' });
    }

    const [result] = await pool.query(
      'INSERT INTO jobs (title, company_name, recruiter_id, description, skills_required, location, job_type, salary_min, salary_max, experience_years) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [title, company_name, recruiterId, description, skills_required, location, job_type, salary_min, salary_max, experience_years]
    );

    res.status(201).json({
      message: 'Job posted successfully',
      job_id: result.insertId
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get All Jobs (with filters)
exports.getJobs = async (req, res) => {
  try {
    const { title, location, job_type, skills } = req.query;
    let query = 'SELECT * FROM jobs WHERE status = "active"';
    const params = [];

    if (title) {
      query += ' AND title LIKE ?';
      params.push(`%${title}%`);
    }
    if (location) {
      query += ' AND location LIKE ?';
      params.push(`%${location}%`);
    }
    if (job_type) {
      query += ' AND job_type = ?';
      params.push(job_type);
    }

    query += ' ORDER BY posted_date DESC LIMIT 50';

    const [jobs] = await pool.query(query, params);
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get Job by ID
exports.getJobById = async (req, res) => {
  try {
    const { id } = req.params;
    const [jobs] = await pool.query('SELECT * FROM jobs WHERE id = ?', [id]);

    if (jobs.length === 0) {
      return res.status(404).json({ error: 'Job not found' });
    }

    res.json(jobs[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update Job (Recruiter Only)
exports.updateJob = async (req, res) => {
  try {
    const { id } = req.params;
    const recruiterId = req.userId;
    const { title, description, skills_required, location, job_type, salary_min, salary_max } = req.body;

    // Verify ownership
    const [jobs] = await pool.query('SELECT recruiter_id FROM jobs WHERE id = ?', [id]);
    if (jobs.length === 0 || jobs[0].recruiter_id !== recruiterId) {
      return res.status(403).json({ error: 'Not authorized to update this job' });
    }

    await pool.query(
      'UPDATE jobs SET title = ?, description = ?, skills_required = ?, location = ?, job_type = ?, salary_min = ?, salary_max = ? WHERE id = ?',
      [title, description, skills_required, location, job_type, salary_min, salary_max, id]
    );

    res.json({ message: 'Job updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete Job (Recruiter Only)
exports.deleteJob = async (req, res) => {
  try {
    const { id } = req.params;
    const recruiterId = req.userId;

    // Verify ownership
    const [jobs] = await pool.query('SELECT recruiter_id FROM jobs WHERE id = ?', [id]);
    if (jobs.length === 0 || jobs[0].recruiter_id !== recruiterId) {
      return res.status(403).json({ error: 'Not authorized to delete this job' });
    }

    await pool.query('DELETE FROM jobs WHERE id = ?', [id]);

    res.json({ message: 'Job deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get Recruiter's Posted Jobs
exports.getRecruiterJobs = async (req, res) => {
  try {
    const recruiterId = req.userId;
    const [jobs] = await pool.query('SELECT * FROM jobs WHERE recruiter_id = ? ORDER BY posted_date DESC', [recruiterId]);

    res.json(jobs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ========================================
// APPLICATION ENDPOINTS
// ========================================

// Apply for Job (Job Seeker)
exports.applyForJob = async (req, res) => {
  try {
    const userId = req.userId;
    const { job_id } = req.params;
    const { cover_letter, resume_url } = req.body;

    // Check if already applied
    const [existing] = await pool.query('SELECT * FROM job_applications WHERE user_id = ? AND job_id = ?', [userId, job_id]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Already applied for this job' });
    }

    // Calculate match percentage
    const [job] = await pool.query('SELECT skills_required FROM jobs WHERE id = ?', [job_id]);
    const [userSkills] = await pool.query(`
      SELECT s.name FROM user_skills us
      JOIN skills s ON us.skill_id = s.id
      WHERE us.user_id = ?
    `, [userId]);

    const requiredSkills = job[0].skills_required.split(',').map(s => s.trim());
    const userSkillNames = userSkills.map(s => s.name);
    const matchCount = requiredSkills.filter(skill => userSkillNames.includes(skill)).length;
    const matchPercentage = Math.round((matchCount / requiredSkills.length) * 100);

    // Create application
    const [result] = await pool.query(
      'INSERT INTO job_applications (user_id, job_id, match_percentage, cover_letter, resume_url) VALUES (?, ?, ?, ?, ?)',
      [userId, job_id, matchPercentage, cover_letter, resume_url]
    );

    res.status(201).json({
      message: 'Application submitted successfully',
      match_percentage: matchPercentage,
      application_id: result.insertId
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Wrapper for API shape: POST /apply/:jobId
exports.applyForJobByJobId = async (req, res) => {
  req.params.job_id = req.params.jobId;
  return exports.applyForJob(req, res);
};

// Get Applications for Recruiter
exports.getApplications = async (req, res) => {
  try {
    const recruiterId = req.userId;
    const { job_id, status } = req.query;

    let query = `
      SELECT ja.*, u.name, u.email, u.location, j.title
      FROM job_applications ja
      JOIN users u ON ja.user_id = u.id
      JOIN jobs j ON ja.job_id = j.id
      WHERE j.recruiter_id = ?
    `;
    const params = [recruiterId];

    if (job_id) {
      query += ' AND ja.job_id = ?';
      params.push(job_id);
    }
    if (status) {
      query += ' AND ja.status = ?';
      params.push(status);
    }

    query += ' ORDER BY ja.applied_date DESC';

    const [applications] = await pool.query(query, params);
    res.json(applications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update Application Status (Recruiter)
exports.updateApplicationStatus = async (req, res) => {
  try {
    const { application_id } = req.params;
    const { status } = req.body;
    const recruiterId = req.userId;

    // Verify ownership
    const [app] = await pool.query(`
      SELECT ja.* FROM job_applications ja
      JOIN jobs j ON ja.job_id = j.id
      WHERE ja.id = ? AND j.recruiter_id = ?
    `, [application_id, recruiterId]);

    if (app.length === 0) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await pool.query('UPDATE job_applications SET status = ? WHERE id = ?', [status, application_id]);

    res.json({ message: 'Application status updated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get User's Applications
exports.getUserApplications = async (req, res) => {
  try {
    const userId = req.userId;
    const [applications] = await pool.query(`
      SELECT ja.*, j.title, j.company_name, j.location, j.salary_min, j.salary_max
      FROM job_applications ja
      JOIN jobs j ON ja.job_id = j.id
      WHERE ja.user_id = ?
      ORDER BY ja.applied_date DESC
    `, [userId]);

    res.json(applications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get Recommended Jobs (based on skills match)
exports.getRecommendedJobs = async (req, res) => {
  try {
    const userId = req.userId;

    // Get user's skills
    const [userSkillsData] = await pool.query(`
      SELECT s.name FROM user_skills us
      JOIN skills s ON us.skill_id = s.id
      WHERE us.user_id = ?
    `, [userId]);

    if (userSkillsData.length === 0) {
      // If no skills, return popular jobs
      const [jobs] = await pool.query('SELECT * FROM jobs WHERE status = "active" LIMIT 10');
      return res.json(jobs);
    }

    const userSkills = userSkillsData.map(s => s.name);

    // Find jobs that match user skills
    const [jobs] = await pool.query('SELECT * FROM jobs WHERE status = "active" LIMIT 20');

    const recommendedJobs = jobs.map(job => {
      const requiredSkills = job.skills_required.split(',').map(s => s.trim());
      const matchCount = requiredSkills.filter(skill => userSkills.includes(skill)).length;
      const matchPercentage = Math.round((matchCount / requiredSkills.length) * 100);

      return {
        ...job,
        match_percentage: matchPercentage,
        missing_skills: requiredSkills.filter(skill => !userSkills.includes(skill))
      };
    });

    // Sort by match percentage
    recommendedJobs.sort((a, b) => b.match_percentage - a.match_percentage);

    res.json(recommendedJobs.slice(0, 15));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Unified applications endpoint based on role.
exports.listApplicationsByRole = async (req, res) => {
  try {
    const [users] = await pool.query('SELECT role FROM users WHERE id = ?', [req.userId]);
    if (!users.length) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (users[0].role === 'recruiter') {
      return exports.getApplications(req, res);
    }

    return exports.getUserApplications(req, res);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
