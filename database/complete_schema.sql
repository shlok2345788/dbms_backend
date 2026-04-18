-- ========================================
-- AI CAREER COMPASS - COMPLETE DATABASE SCHEMA
-- ========================================

CREATE DATABASE IF NOT EXISTS ai_career_compass;
USE ai_career_compass;

-- ========================================
-- USERS TABLE (Both Job Seekers & Recruiters)
-- ========================================

CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(120) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  phone VARCHAR(15),
  role ENUM('job_seeker', 'recruiter') NOT NULL,
  status ENUM('student', 'internship', 'job_seeker', 'confused') DEFAULT 'student',
  career_goal VARCHAR(255),
  profile_pic VARCHAR(255),
  bio TEXT,
  location VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ========================================
-- RECRUITER COMPANY INFO
-- ========================================

CREATE TABLE recruiter_companies (
  id INT PRIMARY KEY AUTO_INCREMENT,
  recruiter_id INT NOT NULL UNIQUE,
  company_name VARCHAR(150) NOT NULL,
  company_email VARCHAR(120),
  company_phone VARCHAR(15),
  website VARCHAR(255),
  industry VARCHAR(100),
  company_logo VARCHAR(255),
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (recruiter_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ========================================
-- SKILLS TABLE
-- ========================================

CREATE TABLE skills (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) UNIQUE NOT NULL,
  category ENUM('technical', 'non_technical', 'soft_skill') DEFAULT 'technical',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- USER SKILLS (Many-to-Many)
-- ========================================

CREATE TABLE user_skills (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  skill_id INT NOT NULL,
  proficiency ENUM('beginner', 'intermediate', 'advanced', 'expert') DEFAULT 'beginner',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_user_skill (user_id, skill_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE
);

-- ========================================
-- INTERESTS TABLE
-- ========================================

CREATE TABLE interests (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- USER INTERESTS (Many-to-Many)
-- ========================================

CREATE TABLE user_interests (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  interest_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_user_interest (user_id, interest_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (interest_id) REFERENCES interests(id) ON DELETE CASCADE
);

-- ========================================
-- CAREER PATHS TABLE
-- ========================================

CREATE TABLE career_paths (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(120) NOT NULL,
  description TEXT NOT NULL,
  required_skills TEXT,
  required_interests TEXT,
  salary_range VARCHAR(50),
  job_outlook VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ========================================
-- ROADMAP STEPS (Learning Path)
-- ========================================

CREATE TABLE roadmap_steps (
  id INT PRIMARY KEY AUTO_INCREMENT,
  career_path_id INT NOT NULL,
  level ENUM('Beginner', 'Intermediate', 'Advanced') NOT NULL,
  step_order INT NOT NULL,
  step_title VARCHAR(160) NOT NULL,
  step_description TEXT,
  estimated_duration VARCHAR(50),
  resources TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (career_path_id) REFERENCES career_paths(id) ON DELETE CASCADE
);

-- ========================================
-- COURSES TABLE
-- ========================================

CREATE TABLE courses (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(160) NOT NULL,
  description TEXT NOT NULL,
  duration VARCHAR(50),
  level ENUM('Beginner', 'Intermediate', 'Advanced') DEFAULT 'Beginner',
  skills_covered TEXT,
  interests_covered TEXT,
  provider VARCHAR(100),
  url VARCHAR(255),
  cost DECIMAL(10, 2),
  ratings DECIMAL(3, 2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- CERTIFICATIONS TABLE
-- ========================================

CREATE TABLE certifications (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(160) NOT NULL,
  provider VARCHAR(100) NOT NULL,
  description TEXT,
  skills_required TEXT,
  duration VARCHAR(50),
  cost DECIMAL(10, 2),
  url VARCHAR(255),
  industry_value ENUM('high', 'medium', 'low') DEFAULT 'high',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- JOBS TABLE (Posted by Recruiters)
-- ========================================

CREATE TABLE jobs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(150) NOT NULL,
  company_name VARCHAR(150) NOT NULL,
  recruiter_id INT NOT NULL,
  description TEXT NOT NULL,
  skills_required TEXT,
  location VARCHAR(150),
  job_type ENUM('Internship', 'Full-Time', 'Part-Time', 'Contract') DEFAULT 'Full-Time',
  salary_min INT,
  salary_max INT,
  experience_years INT DEFAULT 0,
  posted_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status ENUM('active', 'closed', 'filled') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (recruiter_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_status (status),
  INDEX idx_recruiter (recruiter_id)
);

-- ========================================
-- JOB APPLICATIONS TABLE
-- ========================================

CREATE TABLE job_applications (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  job_id INT NOT NULL,
  match_percentage INT,
  cover_letter TEXT,
  resume_url VARCHAR(255),
  status ENUM('applied', 'shortlisted', 'rejected', 'interview', 'offered') DEFAULT 'applied',
  applied_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_application (user_id, job_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
  INDEX idx_status (status),
  INDEX idx_user (user_id)
);

-- ========================================
-- USER RECOMMENDATIONS TABLE
-- ========================================

CREATE TABLE user_recommendations (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  career_path_id INT NOT NULL,
  match_percentage INT,
  recommended_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_recommendation (user_id, career_path_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (career_path_id) REFERENCES career_paths(id) ON DELETE CASCADE
);

-- ========================================
-- USER PREFERENCES TABLE
-- ========================================

CREATE TABLE user_preferences (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL UNIQUE,
  career_goal VARCHAR(255),
  preferred_location VARCHAR(150),
  preferred_job_type VARCHAR(50),
  expected_salary_min INT,
  expected_salary_max INT,
  open_to_relocation BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ========================================
-- RESUMES TABLE
-- ========================================

CREATE TABLE resumes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  extracted_text LONGTEXT,
  score INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ========================================
-- USER CERTIFICATIONS TABLE
-- ========================================

CREATE TABLE user_certifications (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  certification_name VARCHAR(160) NOT NULL,
  provider VARCHAR(100),
  issued_at DATE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ========================================
-- USER PROJECTS TABLE
-- ========================================

CREATE TABLE user_projects (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  project_title VARCHAR(160) NOT NULL,
  project_description TEXT,
  project_url VARCHAR(255),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ========================================
-- REVIEW & FEEDBACK TABLE
-- ========================================

CREATE TABLE reviews (
  id INT PRIMARY KEY AUTO_INCREMENT,
  recruiter_id INT NOT NULL,
  candidate_id INT NOT NULL,
  rating INT CHECK (rating >= 1 AND rating <= 5),
  feedback TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (recruiter_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (candidate_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ========================================
-- SEED DATA
-- ========================================

-- Insert Skills
INSERT INTO skills (name, category) VALUES
('Python', 'technical'),
('JavaScript', 'technical'),
('SQL', 'technical'),
('React', 'technical'),
('Node.js', 'technical'),
('HTML/CSS', 'technical'),
('Data Analysis', 'technical'),
('Machine Learning', 'technical'),
('AWS', 'technical'),
('Docker', 'technical'),
('Communication', 'soft_skill'),
('Problem Solving', 'soft_skill'),
('Leadership', 'soft_skill'),
('Team Work', 'soft_skill'),
('Project Management', 'soft_skill');

-- Insert Interests
INSERT INTO interests (name, description) VALUES
('Web Development', 'Building web applications and websites'),
('Data Science', 'Analyzing and interpreting data'),
('AI & Machine Learning', 'Artificial intelligence and ML models'),
('Cloud Computing', 'Cloud infrastructure and services'),
('Mobile Development', 'Building mobile applications'),
('Cybersecurity', 'Network and information security'),
('Project Management', 'Leading and managing projects'),
('Product Management', 'Managing product development'),
('UI/UX Design', 'User interface and experience design');

-- Insert Career Paths
INSERT INTO career_paths (title, description, required_skills, required_interests, salary_range, job_outlook) VALUES
('Web Developer', 'Build responsive web applications', 'JavaScript,React,Node.js,HTML/CSS', 'Web Development', '₹5-15 LPA', 'High Growth'),
('Data Scientist', 'Analyze data and build ML models', 'Python,Data Analysis,SQL,Machine Learning', 'Data Science,AI', '₹8-20 LPA', 'Very High Growth'),
('Full Stack Developer', 'Frontend and backend development', 'JavaScript,React,Node.js,SQL', 'Web Development', '₹6-18 LPA', 'High Growth'),
('DevOps Engineer', 'Manage cloud infrastructure', 'Docker,AWS,Python,Shell', 'Cloud Computing', '₹7-20 LPA', 'Very High Growth'),
('Product Manager', 'Lead product strategy', 'Project Management,Communication,Problem Solving', 'Product Management', '₹10-25 LPA', 'High Growth'),
('UI/UX Designer', 'Design user interfaces', 'Communication,Problem Solving,Team Work', 'UI/UX Design', '₹4-12 LPA', 'High Growth');

-- Insert Roadmap Steps
INSERT INTO roadmap_steps (career_path_id, level, step_order, step_title, step_description, estimated_duration) VALUES
(1, 'Beginner', 1, 'Learn HTML & CSS', 'Master the fundamentals of web design', '2-3 weeks'),
(1, 'Beginner', 2, 'JavaScript Basics', 'Learn JavaScript fundamentals and DOM manipulation', '3-4 weeks'),
(1, 'Intermediate', 1, 'React.js Mastery', 'Deep dive into React components and state management', '4-6 weeks'),
(1, 'Advanced', 1, 'Backend with Node.js', 'Build server-side applications with Express', '4-6 weeks');

-- Insert Courses
INSERT INTO courses (title, description, duration, level, skills_covered, provider, url, cost) VALUES
('Web Development Bootcamp', 'Complete web development course', '12 weeks', 'Beginner', 'HTML,CSS,JavaScript,React', 'Udemy', 'https://udemy.com/web-dev', 499.99),
('Python for Data Science', 'Learn Python for data analysis', '8 weeks', 'Beginner', 'Python,Data Analysis', 'Coursera', 'https://coursera.org/ds', 0),
('AWS Fundamentals', 'Cloud computing with AWS', '6 weeks', 'Intermediate', 'AWS,Cloud Computing', 'Cloud Academy', 'https://cloudacademy.com', 299.99);

-- Insert Users (Job Seekers)
INSERT INTO users (name, email, password, phone, role, status, location) VALUES
('John Doe', 'john@example.com', '$2a$10$YourHashedPasswordHere', '9876543210', 'job_seeker', 'internship', 'Mumbai'),
('Jane Smith', 'jane@example.com', '$2a$10$YourHashedPasswordHere', '9876543211', 'job_seeker', 'job_seeker', 'Bangalore'),
('Rahul Kumar', 'rahul@example.com', '$2a$10$YourHashedPasswordHere', '9876543212', 'job_seeker', 'student', 'Delhi');

-- Insert Recruiters
INSERT INTO users (name, email, password, phone, role, location) VALUES
('Priya Sharma', 'priya@company.com', '$2a$10$YourHashedPasswordHere', '9123456789', 'recruiter', 'Mumbai'),
('Amit Patel', 'amit@techcorp.com', '$2a$10$YourHashedPasswordHere', '9123456790', 'recruiter', 'Bangalore');

-- Insert Company Info
INSERT INTO recruiter_companies (recruiter_id, company_name, company_email, website, industry, description) VALUES
(4, 'TechCorp India', 'hr@techcorp.com', 'https://techcorp.com', 'IT & Software', 'Leading software development company'),
(5, 'DataSoft Solutions', 'careers@datasoft.com', 'https://datasoft.com', 'Data Science', 'AI and Machine Learning solutions');

-- Insert Jobs
INSERT INTO jobs (title, company_name, recruiter_id, description, skills_required, location, job_type, salary_min, salary_max, experience_years) VALUES
('Web Developer Intern', 'TechCorp India', 4, 'Build web applications using React', 'JavaScript,React,HTML/CSS', 'Mumbai', 'Internship', 0, 300000, 0),
('Junior Data Scientist', 'DataSoft Solutions', 5, 'Analyze data and build ML models', 'Python,SQL,Data Analysis,Machine Learning', 'Bangalore', 'Full-Time', 600000, 1200000, 1),
('Full Stack Developer', 'TechCorp India', 4, 'Build end-to-end web applications', 'JavaScript,React,Node.js,SQL', 'Remote', 'Full-Time', 800000, 1500000, 2),
('DevOps Engineer', 'DataSoft Solutions', 5, 'Manage cloud infrastructure', 'Docker,AWS,Python', 'Bangalore', 'Full-Time', 1000000, 2000000, 3);

-- Insert User Certifications
INSERT INTO user_certifications (user_id, certification_name, provider, issued_at) VALUES
(1, 'Google Data Analytics Professional Certificate', 'Google', '2024-10-10'),
(2, 'IBM Data Science Professional Certificate', 'IBM', '2024-11-12');

-- Insert User Projects
INSERT INTO user_projects (user_id, project_title, project_description, project_url) VALUES
(1, 'Retail Sales Forecasting', 'Forecast monthly sales with gradient boosting models', 'https://github.com/john/retail-forecasting'),
(2, 'Portfolio Job Board', 'Build and deploy a full-stack job board application', 'https://github.com/jane/job-board');

-- Create Indexes for Performance
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_created ON users(created_at);
CREATE INDEX idx_jobs_company ON jobs(company_name);
CREATE INDEX idx_applications_job ON job_applications(job_id);
CREATE INDEX idx_user_skills_user ON user_skills(user_id);
CREATE INDEX idx_user_interests_user ON user_interests(user_id);

-- ========================================
-- RESUME SKILL GAP FEATURE EXTENSIONS
-- ========================================

-- Keep backward compatibility while supporting structured resume analytics fields.
ALTER TABLE resumes ADD COLUMN IF NOT EXISTS file_path VARCHAR(255) NULL;
ALTER TABLE resumes ADD COLUMN IF NOT EXISTS extracted_skills JSON NULL;
ALTER TABLE resumes ADD COLUMN IF NOT EXISTS education JSON NULL;
ALTER TABLE resumes ADD COLUMN IF NOT EXISTS experience_summary TEXT NULL;
ALTER TABLE resumes ADD COLUMN IF NOT EXISTS file_type VARCHAR(20) NULL;

-- Add explicit skill-oriented columns required by the resume-course recommendation feature.
ALTER TABLE courses ADD COLUMN IF NOT EXISTS skill_name VARCHAR(100) NULL;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS course_name VARCHAR(200) NULL;

ALTER TABLE certifications ADD COLUMN IF NOT EXISTS skill_name VARCHAR(100) NULL;
ALTER TABLE certifications ADD COLUMN IF NOT EXISTS certification_name VARCHAR(200) NULL;

-- Compatibility view for requested applications shape: (id, user_id, job_id, match_score)
CREATE OR REPLACE VIEW applications AS
SELECT
  id,
  user_id,
  job_id,
  match_percentage AS match_score,
  applied_date
FROM job_applications;

-- Skill-focused course dataset for missing-skill guidance.
INSERT INTO courses (
  title,
  description,
  duration,
  level,
  skills_covered,
  provider,
  url,
  cost,
  skill_name,
  course_name
) VALUES
('SQL for Beginners', 'Learn SQL from scratch with practical query exercises.', '4 weeks', 'Beginner', 'SQL', 'Coursera', 'https://coursera.org/sql-for-beginners', 0, 'SQL', 'SQL for Beginners'),
('Power BI Dashboard Mastery', 'Create production-ready dashboards and visual storytelling.', '3 weeks', 'Beginner', 'Power BI,Data Analysis', 'Udemy', 'https://udemy.com/power-bi-dashboard-mastery', 699, 'Power BI', 'Power BI Dashboard Mastery'),
('Statistics for Data Science', 'Core statistical concepts for analytics and ML.', '5 weeks', 'Intermediate', 'Statistics,Data Analysis', 'edX', 'https://edx.org/statistics-for-data-science', 0, 'Statistics', 'Statistics for Data Science'),
('Python for Data Analytics', 'Python fundamentals focused on analysis and data wrangling.', '6 weeks', 'Beginner', 'Python,Data Analysis', 'Coursera', 'https://coursera.org/python-data-analytics', 0, 'Python', 'Python for Data Analytics'),
('Excel to SQL Transition', 'Bridge spreadsheet analytics to SQL-driven workflows.', '2 weeks', 'Beginner', 'SQL,Excel', 'DataCamp', 'https://datacamp.com/excel-to-sql', 0, 'SQL', 'Excel to SQL Transition')
ON DUPLICATE KEY UPDATE
  course_name = VALUES(course_name),
  skill_name = VALUES(skill_name),
  provider = VALUES(provider);

INSERT INTO certifications (
  title,
  provider,
  description,
  skills_required,
  duration,
  cost,
  url,
  industry_value,
  skill_name,
  certification_name
) VALUES
('Google Data Analytics Professional Certificate', 'Google', 'Job-ready analytics certification covering SQL, spreadsheets, and BI.', 'SQL,Power BI,Statistics', '6 months', 0, 'https://coursera.org/professional-certificates/google-data-analytics', 'high', 'SQL', 'Google Data Analytics'),
('Microsoft Power BI Data Analyst Associate', 'Microsoft', 'Certification for Power BI data modeling, dashboards, and deployment.', 'Power BI,Data Analysis', '2 months', 4800, 'https://learn.microsoft.com/credentials/certifications/power-bi-data-analyst-associate/', 'high', 'Power BI', 'Microsoft PL-300'),
('IBM Data Science Professional Certificate', 'IBM', 'Foundational data science credential with statistics and Python.', 'Statistics,Python,Data Analysis', '5 months', 0, 'https://coursera.org/professional-certificates/ibm-data-science', 'high', 'Statistics', 'IBM Data Science Professional Certificate')
ON DUPLICATE KEY UPDATE
  certification_name = VALUES(certification_name),
  skill_name = VALUES(skill_name),
  provider = VALUES(provider);
