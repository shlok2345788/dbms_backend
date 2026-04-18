const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const { pool } = require('../config/db');

const normalizeList = (csv = '') =>
  csv
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

const toLowerSet = (items = []) => new Set(items.map((item) => item.toLowerCase()));

const DOC_EXTENSIONS = new Set(['.pdf', '.doc', '.docx']);
const columnCache = new Map();

const normalizeSkillToken = (value = '') => value.toLowerCase().trim();

const uniqueByCaseInsensitive = (items = []) => {
  const seen = new Set();
  const output = [];
  for (const item of items) {
    const key = normalizeSkillToken(item);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    output.push(item.trim());
  }
  return output;
};

const parseSkillsField = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return uniqueByCaseInsensitive(value);

  const raw = String(value).trim();
  if (!raw) return [];

  try {
    if (raw.startsWith('[')) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return uniqueByCaseInsensitive(parsed.map((item) => String(item)));
    }
  } catch (error) {
    // Ignore malformed JSON and use CSV parsing.
  }

  return uniqueByCaseInsensitive(normalizeList(raw));
};

const getTableColumns = async (tableName) => {
  if (columnCache.has(tableName)) {
    return columnCache.get(tableName);
  }

  const [rows] = await pool.query(`SHOW COLUMNS FROM ${tableName}`);
  const fields = new Set(rows.map((row) => row.Field));
  columnCache.set(tableName, fields);
  return fields;
};

const extractEducation = (text = '') => {
  const lineItems = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const educationPattern = /(b\.?tech|bachelor|master|m\.?tech|mba|phd|diploma|be|bsc|msc|university|college)/i;
  return lineItems.filter((line) => educationPattern.test(line)).slice(0, 5);
};

const extractExperienceSummary = (text = '') => {
  const lowered = text.toLowerCase();
  const yearsMatch = lowered.match(/(\d{1,2})\+?\s+years?\s+(of\s+)?experience/);
  if (yearsMatch) {
    return `${yearsMatch[1]}+ years of experience`;
  }

  const experiencePattern = /(experience|internship|worked at|employment|project)/i;
  const candidate = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find((line) => experiencePattern.test(line));

  return candidate || 'Not clearly specified';
};

const extractTextFromResume = async (file) => {
  const extension = path.extname(file.originalname || '').toLowerCase();

  if (extension === '.pdf') {
    const parsed = await pdfParse(file.buffer);
    return parsed.text || '';
  }

  if (extension === '.docx') {
    const result = await mammoth.extractRawText({ buffer: file.buffer });
    return result.value || '';
  }

  // Legacy .doc support (best effort): extract printable text from binary.
  const raw = file.buffer.toString('utf8');
  return raw.replace(/[^\x09\x0A\x0D\x20-\x7E]/g, ' ');
};

const getResumeSkillsForUser = async (userId) => {
  const [resumeRows] = await pool.query(
    'SELECT id, extracted_skills, extracted_text, created_at FROM resumes WHERE user_id = ? ORDER BY created_at DESC LIMIT 1',
    [userId]
  );

  if (!resumeRows.length) {
    return [];
  }

  const row = resumeRows[0];
  const storedSkills = parseSkillsField(row.extracted_skills);
  if (storedSkills.length) {
    return storedSkills;
  }

  const [skills] = await pool.query('SELECT name FROM skills');
  const resumeText = String(row.extracted_text || '').toLowerCase();
  return skills
    .map((item) => item.name)
    .filter((name) => resumeText.includes(String(name).toLowerCase()));
};

const getRecommendationBundlesForSkills = async (missingSkills = []) => {
  const recommendations = [];

  for (const skill of missingSkills) {
    const skillLike = `%${skill.toLowerCase()}%`;

    const [courseRows] = await pool.query(
      `SELECT
          id,
          COALESCE(course_name, title) AS course_name,
          provider,
          COALESCE(skill_name, skills_covered) AS skill_name,
          url,
          duration,
          level
        FROM courses
        WHERE LOWER(COALESCE(skill_name, skills_covered, '')) LIKE ?
        ORDER BY id DESC
        LIMIT 3`,
      [skillLike]
    );

    const [certRows] = await pool.query(
      `SELECT
          id,
          COALESCE(certification_name, title) AS certification_name,
          provider,
          COALESCE(skill_name, skills_required) AS skill_name,
          url
        FROM certifications
        WHERE LOWER(COALESCE(skill_name, skills_required, '')) LIKE ?
        ORDER BY id DESC
        LIMIT 2`,
      [skillLike]
    ).catch(() => [[]]);

    const projectIdeasBySkill = {
      sql: ['Build a normalized employee database with advanced SQL reports'],
      'power bi': ['Create a sales KPI dashboard with drill-down filters'],
      statistics: ['Run A/B test analysis and visualize confidence intervals'],
      python: ['Build an ETL script for CSV-to-database pipelines'],
      react: ['Develop a career tracking dashboard with charts and routing'],
      'node.js': ['Create an API with auth, validation, and pagination']
    };

    const projectIdeas = projectIdeasBySkill[skill.toLowerCase()] || [
      `Build a mini project that demonstrates ${skill} in a real-world scenario`
    ];

    recommendations.push({
      skill,
      courses: courseRows,
      certifications: certRows,
      projects: projectIdeas
    });
  }

  return recommendations;
};

const analyzeMatch = async (userId, jobId) => {
  const [jobRows] = await pool.query(
    'SELECT id, title, skills_required, job_type, company_name FROM jobs WHERE id = ?',
    [jobId]
  );

  if (!jobRows.length) {
    return { error: { status: 404, message: 'Job not found.' } };
  }

  const job = jobRows[0];
  const requiredSkills = uniqueByCaseInsensitive(normalizeList(job.skills_required || ''));

  const resumeSkills = await getResumeSkillsForUser(userId);
  if (!resumeSkills.length) {
    return { error: { status: 400, message: 'Please upload a resume before running analysis.' } };
  }

  const resumeSkillSet = toLowerSet(resumeSkills);
  const matchingSkills = requiredSkills.filter((skill) => resumeSkillSet.has(skill.toLowerCase()));
  const missingSkills = requiredSkills.filter((skill) => !resumeSkillSet.has(skill.toLowerCase()));
  const matchPercentage = requiredSkills.length
    ? Math.round((matchingSkills.length / requiredSkills.length) * 100)
    : 0;

  const missingRanked = missingSkills.map((skill, index) => ({
    skill,
    importance: Math.max(1, requiredSkills.length - index)
  }));

  const recommendations = await getRecommendationBundlesForSkills(missingSkills);

  await pool.query(
    `INSERT INTO job_applications (user_id, job_id, match_percentage, cover_letter, resume_url)
     VALUES (?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE match_percentage = VALUES(match_percentage), updated_date = CURRENT_TIMESTAMP`,
    [userId, jobId, matchPercentage, 'Auto-generated via resume match analyzer', null]
  ).catch(() => {});

  const needsImprovement = matchPercentage < 70 || missingSkills.length > 0;
  const motivationalMessage = needsImprovement
    ? `You are ${matchPercentage}% match for this role. Improve ${Math.min(missingSkills.length, 2)} more skills to get closer to interview readiness.`
    : 'Great match! Your resume aligns strongly with this role.';

  return {
    data: {
      job,
      resumeSkills,
      requiredSkills,
      matchingSkills,
      missingSkills,
      missingRanked,
      matchPercentage,
      recommendations,
      needsImprovement,
      motivationalMessage,
      fastestLearningPath: missingSkills.slice(0, 3)
    }
  };
};

exports.getJobReadinessScore = async (req, res) => {
  try {
    const userId = req.user.id;

    const [skillRows] = await pool.query('SELECT COUNT(*) AS total FROM user_skills WHERE user_id = ?', [userId]);
    const [certRows] = await pool.query('SELECT COUNT(*) AS total FROM user_certifications WHERE user_id = ?', [userId]).catch(() => [[{ total: 0 }]]);
    const [projectRows] = await pool.query('SELECT COUNT(*) AS total FROM user_projects WHERE user_id = ?', [userId]).catch(() => [[{ total: 0 }]]);

    const skillScore = Math.min(50, skillRows[0].total * 10);
    const certScore = Math.min(30, certRows[0].total * 10);
    const projectScore = Math.min(20, projectRows[0].total * 10);

    const score = Math.min(100, skillScore + certScore + projectScore);
    let level = 'Beginner';
    if (score >= 70) level = 'Job Ready';
    else if (score >= 40) level = 'Intermediate';

    const notifications = [];
    if (score < 70) {
      notifications.push(`You are ${score}% match for job readiness. Improve certifications and projects to cross 70%.`);
    }

    return res.json({
      score,
      level,
      factors: {
        skills: skillRows[0].total,
        certifications: certRows[0].total,
        projects: projectRows[0].total
      },
      notifications
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to calculate job readiness score.' });
  }
};

exports.getSkillGapForJob = async (req, res) => {
  try {
    const userId = req.user.id;
    const { jobId } = req.params;

    const [jobRows] = await pool.query('SELECT id, title, skills_required FROM jobs WHERE id = ?', [jobId]);
    if (!jobRows.length) {
      return res.status(404).json({ message: 'Job not found.' });
    }

    const [skillRows] = await pool.query(
      `SELECT s.name FROM user_skills us
       JOIN skills s ON s.id = us.skill_id
       WHERE us.user_id = ?`,
      [userId]
    );

    const jobSkills = normalizeList(jobRows[0].skills_required || '');
    const userSkills = skillRows.map((row) => row.name);
    const userSkillSet = toLowerSet(userSkills);

    const matchingSkills = jobSkills.filter((skill) => userSkillSet.has(skill.toLowerCase()));
    const missingSkills = jobSkills.filter((skill) => !userSkillSet.has(skill.toLowerCase()));

    let suggestedCourses = [];
    if (missingSkills.length) {
      const likeParts = missingSkills.map(() => 'LOWER(skills_covered) LIKE ?').join(' OR ');
      const params = missingSkills.map((skill) => `%${skill.toLowerCase()}%`);
      const [courses] = await pool.query(
        `SELECT id, title, provider, level, url FROM courses
         WHERE ${likeParts}
         ORDER BY level, id
         LIMIT 8`,
        params
      );
      suggestedCourses = courses;
    }

    const matchPercentage = jobSkills.length ? Math.round((matchingSkills.length / jobSkills.length) * 100) : 0;

    return res.json({
      job: jobRows[0],
      matchingSkills,
      missingSkills,
      matchPercentage,
      suggestedCourses
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to analyze skill gap.' });
  }
};

exports.getMiniProjects = async (req, res) => {
  try {
    const career = (req.query.career || 'general').toLowerCase();

    const projectMap = {
      'data scientist': [
        'Build a sales forecasting model with Python and XGBoost',
        'Create an end-to-end churn prediction pipeline',
        'Design a dashboard for model monitoring metrics'
      ],
      'web developer': [
        'Develop an e-commerce platform with cart and checkout',
        'Create a job board application with filters and auth',
        'Build a real-time chat app with WebSocket support'
      ],
      'ui/ux designer': [
        'Redesign a fintech onboarding flow with usability tests',
        'Create a design system with reusable components',
        'Prototype a mobile-first booking experience in Figma'
      ]
    };

    const projects = projectMap[career] || [
      'Create a portfolio website with project case studies',
      'Build a task management app with analytics',
      'Launch a niche community platform MVP'
    ];

    return res.json({ career, projects });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to generate mini projects.' });
  }
};

exports.getMockInterviewQuestions = async (req, res) => {
  try {
    const career = (req.query.career || 'general').toLowerCase();
    const bank = {
      'data scientist': [
        'Explain bias-variance tradeoff with a practical example.',
        'How would you evaluate an imbalanced classification model?',
        'Describe a production issue you might face in ML deployment.'
      ],
      'web developer': [
        'How does the virtual DOM improve rendering performance?',
        'Explain JWT authentication flow in a full-stack app.',
        'What strategy do you use for API error handling on frontend and backend?'
      ],
      'ui/ux designer': [
        'How do you choose between qualitative and quantitative research?',
        'Walk through your process from wireframe to high-fidelity prototype.',
        'How do you measure UX impact after release?'
      ]
    };

    return res.json({
      career,
      durationSeconds: 300,
      questions: bank[career] || [
        'Tell us about a challenging project and how you solved it.',
        'What are your strengths for this role?',
        'How do you learn new tools quickly?'
      ]
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to generate interview questions.' });
  }
};

exports.submitMockInterviewFeedback = async (req, res) => {
  try {
    const { answers = [] } = req.body;
    const answered = Array.isArray(answers) ? answers.filter((item) => String(item || '').trim()).length : 0;
    const score = Math.min(100, answered * 30 + 10);

    const feedback = [];
    if (score < 50) feedback.push('Add clearer structure using Situation, Action, Result format.');
    if (score < 75) feedback.push('Use role-specific keywords and quantify outcomes in each answer.');
    if (score >= 75) feedback.push('Good clarity. Improve conciseness and include stronger business impact metrics.');

    return res.json({ score, feedback });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to evaluate mock interview.' });
  }
};

exports.uploadResumeAndAnalyze = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Resume file is required.' });
    }

    const extension = path.extname(req.file.originalname || '').toLowerCase();
    if (!DOC_EXTENSIONS.has(extension)) {
      return res.status(400).json({ message: 'Only PDF, DOC, and DOCX resumes are supported.' });
    }

    const parsedText = await extractTextFromResume(req.file);
    const loweredText = parsedText.toLowerCase();

    const [skills] = await pool.query('SELECT id, name FROM skills ORDER BY id');
    const matchedSkills = skills.filter((skill) => loweredText.includes(skill.name.toLowerCase()));

    const keywordScore = Math.min(70, matchedSkills.length * 12);
    const lengthScore = Math.min(30, Math.floor((loweredText.length / 1500) * 30));
    const resumeScore = Math.min(100, keywordScore + lengthScore);

    const education = extractEducation(parsedText);
    const experience = extractExperienceSummary(parsedText);
    const extractedSkillNames = matchedSkills.map((skill) => skill.name);

    const uploadDir = path.join(__dirname, '../../uploads/resumes');
    await fs.promises.mkdir(uploadDir, { recursive: true });
    const fileName = `${Date.now()}-${req.user.id}-${req.file.originalname.replace(/\s+/g, '_')}`;
    const fullPath = path.join(uploadDir, fileName);
    await fs.promises.writeFile(fullPath, req.file.buffer);

    try {
      const columns = await getTableColumns('resumes');
      const insertColumns = [];
      const placeholders = [];
      const values = [];

      if (columns.has('user_id')) {
        insertColumns.push('user_id');
        placeholders.push('?');
        values.push(req.user.id);
      }
      if (columns.has('file_name')) {
        insertColumns.push('file_name');
        placeholders.push('?');
        values.push(req.file.originalname);
      }
      if (columns.has('file_path')) {
        insertColumns.push('file_path');
        placeholders.push('?');
        values.push(fullPath);
      }
      if (columns.has('extracted_text')) {
        insertColumns.push('extracted_text');
        placeholders.push('?');
        values.push(parsedText);
      }
      if (columns.has('extracted_skills')) {
        insertColumns.push('extracted_skills');
        placeholders.push('?');
        values.push(JSON.stringify(extractedSkillNames));
      }
      if (columns.has('education')) {
        insertColumns.push('education');
        placeholders.push('?');
        values.push(JSON.stringify(education));
      }
      if (columns.has('experience_summary')) {
        insertColumns.push('experience_summary');
        placeholders.push('?');
        values.push(experience);
      }
      if (columns.has('score')) {
        insertColumns.push('score');
        placeholders.push('?');
        values.push(resumeScore);
      }

      if (insertColumns.length) {
        await pool.query(
          `INSERT INTO resumes (${insertColumns.join(', ')}) VALUES (${placeholders.join(', ')})`,
          values
        );
      }
    } catch (dbError) {
      // Table shape may vary across schema versions.
    }

    const missingCore = skills
      .filter((skill) => !loweredText.includes(skill.name.toLowerCase()))
      .slice(0, 6)
      .map((skill) => skill.name);

    return res.json({
      filePath: fullPath,
      resumeScore,
      extractedSkills: extractedSkillNames,
      education,
      experience,
      suggestions: [
        'Add measurable achievements with metrics in each project.',
        `Include missing high-impact skills: ${missingCore.join(', ') || 'No major gaps detected'}`,
        'Tailor the resume keywords to each target job description.'
      ]
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to analyze resume.' });
  }
};

exports.analyzeResumeForJob = async (req, res) => {
  try {
    const userId = req.user.id;
    const { jobId } = req.params;

    const result = await analyzeMatch(userId, jobId);
    if (result.error) {
      return res.status(result.error.status).json({ message: result.error.message });
    }

    return res.json(result.data);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to analyze resume for the selected job.' });
  }
};

exports.recommendCoursesForUserJob = async (req, res) => {
  try {
    const authenticatedUserId = req.user.id;
    const { userId, jobId } = req.params;

    if (Number(userId) !== Number(authenticatedUserId)) {
      return res.status(403).json({ message: 'You can only request recommendations for your own profile.' });
    }

    const result = await analyzeMatch(authenticatedUserId, jobId);
    if (result.error) {
      return res.status(result.error.status).json({ message: result.error.message });
    }

    return res.json({
      userId: authenticatedUserId,
      jobId: Number(jobId),
      matchPercentage: result.data.matchPercentage,
      missingSkills: result.data.missingSkills,
      recommendations: result.data.recommendations,
      fastestLearningPath: result.data.fastestLearningPath,
      message: result.data.motivationalMessage
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to recommend courses for this job.' });
  }
};
