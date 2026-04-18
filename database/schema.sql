-- AI Career Compass database schema + sample data
CREATE DATABASE IF NOT EXISTS career_compass;
USE career_compass;

CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(120) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('user', 'admin') DEFAULT 'user',
  career_goal VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS skills (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS interests (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS career_paths (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(120) NOT NULL,
  description TEXT NOT NULL,
  required_skills TEXT,
  required_interests TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS roadmaps (
  id INT PRIMARY KEY AUTO_INCREMENT,
  career_path_id INT NOT NULL,
  level ENUM('Beginner', 'Intermediate', 'Advanced') NOT NULL,
  step_order INT NOT NULL,
  step_title VARCHAR(160) NOT NULL,
  step_description TEXT,
  FOREIGN KEY (career_path_id) REFERENCES career_paths(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS user_skills (
  user_id INT NOT NULL,
  skill_id INT NOT NULL,
  PRIMARY KEY (user_id, skill_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS user_interests (
  user_id INT NOT NULL,
  interest_id INT NOT NULL,
  PRIMARY KEY (user_id, interest_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (interest_id) REFERENCES interests(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS courses (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(160) NOT NULL,
  description TEXT NOT NULL,
  duration VARCHAR(50),
  level ENUM('Beginner', 'Intermediate', 'Advanced') DEFAULT 'Beginner',
  skills_covered TEXT,
  interests_covered TEXT,
  provider VARCHAR(100),
  url VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed skills
INSERT INTO skills (name) VALUES
  ('Python'),
  ('Communication'),
  ('Data Analysis'),
  ('JavaScript'),
  ('SQL'),
  ('Machine Learning'),
  ('UI/UX Design')
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- Seed interests
INSERT INTO interests (name) VALUES
  ('AI'),
  ('Sports Analytics'),
  ('Web Development'),
  ('Product Management'),
  ('Data Visualization')
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- Seed career paths
INSERT INTO career_paths (title, description, required_skills, required_interests) VALUES
  ('Data Scientist', 'Analyze data, build predictive models, and create data-driven insights.', 'Python,Data Analysis,SQL,Machine Learning', 'AI,Data Visualization'),
  ('Web Developer', 'Build responsive web applications using modern frontend and backend tools.', 'JavaScript,Communication,SQL', 'Web Development,Product Management'),
  ('Sports Analyst', 'Use statistical techniques and dashboards to evaluate athlete and team performance.', 'Python,Data Analysis,Communication,SQL', 'Sports Analytics,Data Visualization'),
  ('Product Manager', 'Define product strategy, roadmaps, and lead cross-functional teams to deliver impactful solutions.', 'Communication,SQL,Data Analysis', 'Product Management,Web Development'),
  ('UI/UX Designer', 'Design intuitive user interfaces and experiences using design principles and user research.', 'UI/UX Design,Communication', 'Product Management,Web Development'),
  ('DevOps Engineer', 'Automate infrastructure, manage deployments, and ensure system reliability and scalability.', 'Python,SQL,Communication', 'Web Development'),
  ('Mobile Developer', 'Build native and cross-platform mobile applications for iOS and Android platforms.', 'JavaScript,Communication', 'Web Development,Product Management'),
  ('Full Stack Developer', 'Develop complete web solutions from frontend interfaces to backend services and databases.', 'JavaScript,Python,SQL,Communication', 'Web Development,Product Management'),
  ('Cloud Architect', 'Design and manage cloud infrastructure solutions for scalability and cost efficiency.', 'Python,SQL,Communication', 'Web Development'),
  ('Business Analyst', 'Gather requirements, analyze processes, and deliver data-driven business insights.', 'SQL,Data Analysis,Communication', 'Product Management,Data Visualization')
ON DUPLICATE KEY UPDATE title = VALUES(title);

-- Seed roadmap steps
INSERT INTO roadmaps (career_path_id, level, step_order, step_title, step_description) VALUES
  (1, 'Beginner', 1, 'Learn Python Fundamentals', 'Master syntax, functions, and data structures.'),
  (1, 'Beginner', 2, 'Statistics Basics', 'Understand probability, distributions, and hypothesis testing.'),
  (1, 'Intermediate', 1, 'Data Wrangling with Pandas', 'Prepare and transform real datasets.'),
  (1, 'Intermediate', 2, 'Machine Learning Models', 'Train and evaluate supervised models.'),
  (1, 'Advanced', 1, 'MLOps and Deployment', 'Deploy ML APIs and monitor model performance.'),
  (2, 'Beginner', 1, 'HTML, CSS, JavaScript Core', 'Build static websites and understand browser basics.'),
  (2, 'Intermediate', 1, 'React and API Integration', 'Create dynamic SPA features and connect REST APIs.'),
  (2, 'Intermediate', 2, 'Backend with Node.js', 'Build and secure server-side endpoints.'),
  (2, 'Advanced', 1, 'System Design and Scaling', 'Improve performance, caching, and deployment strategies.'),
  (3, 'Beginner', 1, 'Sports Data Fundamentals', 'Explore sports datasets and key performance metrics.'),
  (3, 'Intermediate', 1, 'Predictive Analytics', 'Model outcomes and player performance trends.'),
  (3, 'Intermediate', 2, 'Dashboarding', 'Build visual insights using BI tools or web charts.'),
  (3, 'Advanced', 1, 'Decision Support Workflows', 'Deliver insights to coaching and operations teams.'),
  (4, 'Beginner', 1, 'Product Management Fundamentals', 'Learn core PM concepts, frameworks, and methodologies.'),
  (4, 'Beginner', 2, 'User Research and Discovery', 'Conduct user interviews and validate product ideas.'),
  (4, 'Intermediate', 1, 'Product Strategy and Vision', 'Define roadmaps and prioritize features effectively.'),
  (4, 'Intermediate', 2, 'Data-Driven Decision Making', 'Use Analytics to inform product decisions.'),
  (4, 'Advanced', 1, 'Executive Leadership Skills', 'Lead teams and communicate product vision to stakeholders.'),
  (5, 'Beginner', 1, 'Design Fundamentals', 'Learn color theory, typography, and visual hierarchy.'),
  (5, 'Beginner', 2, 'Wireframing and Prototyping', 'Create mockups and low-fidelity prototypes.'),
  (5, 'Intermediate', 1, 'User Experience Research', 'Conduct usability tests and gather user feedback.'),
  (5, 'Intermediate', 2, 'UI Design Tools Mastery', 'Master Figma, Sketch, or Adobe XD.'),
  (5, 'Advanced', 1, 'Advanced Interaction Design', 'Design complex animations and micro-interactions.'),
  (6, 'Beginner', 1, 'Linux and Server Fundamentals', 'Learn command line, file systems, and basic networking.'),
  (6, 'Beginner', 2, 'Containerization Basics', 'Understand Docker concepts and container deployment.'),
  (6, 'Intermediate', 1, 'CI/CD Pipelines and Automation', 'Set up automated testing and deployment workflows.'),
  (6, 'Intermediate', 2, 'Infrastructure as Code', 'Manage infrastructure using tools like Terraform.'),
  (6, 'Advanced', 1, 'Cloud Platforms and Scaling', 'Design and manage Kubernetes clusters and cloud services.'),
  (7, 'Beginner', 1, 'Mobile Development Basics', 'Choose platform (iOS or Android) and learn fundamentals.'),
  (7, 'Beginner', 2, 'UI Design for Mobile', 'Master responsive design and mobile UX patterns.'),
  (7, 'Intermediate', 1, 'API Integration and Networking', 'Connect mobile apps to backend services.'),
  (7, 'Intermediate', 2, 'Native Features and Performance', 'Optimize app performance and access device sensors.'),
  (7, 'Advanced', 1, 'App Store Deployment', 'Publish and manage mobile applications on app stores.'),
  (8, 'Beginner', 1, 'Frontend Fundamentals', 'Master HTML, CSS, and JavaScript core concepts.'),
  (8, 'Beginner', 2, 'Backend Basics', 'Learn server-side programming and databases.'),
  (8, 'Intermediate', 1, 'Full Stack Project Development', 'Build complete applications with frontend and backend.'),
  (8, 'Intermediate', 2, 'Database Design and Optimization', 'Design scalable databases and write efficient queries.'),
  (8, 'Advanced', 1, 'System Design and Architecture', 'Design large-scale full stack systems.'),
  (9, 'Beginner', 1, 'Cloud Computing Fundamentals', 'Learn concepts of AWS, Azure, or GCP platforms.'),
  (9, 'Beginner', 2, 'Virtual Machines and Networking', 'Set up VMs, networks, and security groups.'),
  (9, 'Intermediate', 1, 'Database and Storage Services', 'Deploy and manage cloud databases and storage.'),
  (9, 'Intermediate', 2, 'Disaster Recovery and HA', 'Design highly available and fault-tolerant systems.'),
  (9, 'Advanced', 1, 'Enterprise Cloud Solutions', 'Architect enterprise-grade cloud infrastructure.'),
  (10, 'Beginner', 1, 'Business Analysis Fundamentals', 'Learn BA methodology and documentation practices.'),
  (10, 'Beginner', 2, 'Requirements Gathering', 'Conduct interviews and document business requirements.'),
  (10, 'Intermediate', 1, 'Process Analysis and Optimization', 'Map business processes and identify improvements.'),
  (10, 'Intermediate', 2, 'Data Analysis for Business', 'Extract insights from business data and metrics.'),
  (10, 'Advanced', 1, 'Strategic Business Consulting', 'Provide high-level recommendations for business transformation.')
ON DUPLICATE KEY UPDATE step_title = VALUES(step_title);

-- Seed courses for skill development
INSERT INTO courses (title, description, duration, level, skills_covered, interests_covered, provider, url) VALUES
  ('Python for Data Analysis', 'Learn Python programming focused on data manipulation and analysis using pandas and numpy.', '4 weeks', 'Beginner', 'Python,Data Analysis', 'AI,Data Visualization', 'Coursera', 'https://coursera.org/python-data'),
  ('Introduction to Machine Learning', 'Understand ML fundamentals, algorithms, and real-world applications with hands-on projects.', '6 weeks', 'Intermediate', 'Python,Machine Learning,Data Analysis', 'AI', 'Udacity', 'https://udacity.com/ml-intro'),
  ('Web Development Bootcamp', 'Master HTML, CSS, JavaScript and build full-stack web applications with modern frameworks.', '12 weeks', 'Beginner', 'JavaScript', 'Web Development', 'Udemy', 'https://udemy.com/web-dev-bootcamp'),
  ('Advanced React.js Development', 'Deep dive into React hooks, state management, and performance optimization.', '8 weeks', 'Intermediate', 'JavaScript', 'Web Development,Product Management', 'Frontend Masters', 'https://frontendmasters.com/react'),
  ('SQL Database Design and Optimization', 'Learn SQL query optimization, indexing, and database design best practices.', '4 weeks', 'Intermediate', 'SQL', 'Data Visualization', 'DataCamp', 'https://datacamp.com/sql-optimization'),
  ('Communication Skills for Tech Professionals', 'Enhance presentation, writing, and interpersonal communication in technical environments.', '2 weeks', 'Beginner', 'Communication', 'Product Management', 'LinkedIn Learning', 'https://linkedin.com/learning/tech-communication'),
  ('Sports Analytics and Performance Metrics', 'Learn statistical analysis techniques for sports data and performance evaluation.', '6 weeks', 'Intermediate', 'Python,Data Analysis,Communication', 'Sports Analytics', 'Coursera', 'https://coursera.org/sports-analytics'),
  ('Data Visualization with Tableau', 'Create compelling dashboards and visualizations using Tableau for data insights.', '3 weeks', 'Beginner', 'Data Visualization', 'Data Visualization', 'Udemy', 'https://udemy.com/tableau-visualization'),
  ('Statistics for Data Science', 'Master statistical concepts essential for data science and machine learning projects.', '5 weeks', 'Intermediate', 'Python,Data Analysis', 'AI', 'MIT OpenCourseWare', 'https://mit.edu/stats-ds'),
  ('Node.js Backend Development', 'Build scalable server-side applications with Node.js, Express, and databases.', '8 weeks', 'Intermediate', 'JavaScript,SQL', 'Web Development', 'Pluralsight', 'https://pluralsight.com/node-backend'),
  ('Product Management Essentials', 'Master product strategy, roadmapping, and agile methodologies for product leaders.', '4 weeks', 'Beginner', 'Communication', 'Product Management', 'Reforge', 'https://reforge.com/pm-101'),
  ('Introduction to Product Management', 'Learn user-centric product management, prioritization, and cross-functional collaboration.', '6 weeks', 'Intermediate', 'Communication,Data Analysis', 'Product Management', 'Maven Analytics', 'https://maven.com/intro-pm'),
  ('UI/UX Design Principles', 'Master design fundamentals including color theory, typography, and visual hierarchy.', '4 weeks', 'Beginner', 'UI/UX Design,Communication', 'Web Development', 'Interaction Design Foundation', 'https://ixdf.org/ux-design'),
  ('Figma for UI Design', 'Learn Figma from basics to advanced prototyping and design systems.', '3 weeks', 'Beginner', 'UI/UX Design', 'Web Development,Product Management', 'Udemy', 'https://udemy.com/figma-design'),
  ('User Research and Usability Testing', 'Conduct effective user research, interviews, and usability tests to validate designs.', '3 weeks', 'Intermediate', 'UI/UX Design,Communication', 'Product Management', 'Nielsen Norman Group', 'https://nngroup.com/ux-research'),
  ('Docker and Container Mastery', 'Learn containerization with Docker for streamlined development and deployment.', '4 weeks', 'Beginner', 'Python', 'Web Development', 'Linux Academy', 'https://linux-academy.com/docker'),
  ('CI/CD with GitHub Actions', 'Automate deployment workflows using GitHub Actions for continuous integration and deployment.', '3 weeks', 'Intermediate', 'Python,JavaScript', 'Web Development', 'A Cloud Guru', 'https://acloud.guru/cicd-github'),
  ('Kubernetes for DevOps', 'Master container orchestration with Kubernetes for scalable deployments.', '6 weeks', 'Advanced', 'Python', 'Web Development', 'Linux Foundation', 'https://linuxfoundation.org/kubernetes'),
  ('iOS App Development with Swift', 'Build iOS applications using Swift and Xcode for iPhone and iPad.', '8 weeks', 'Intermediate', 'JavaScript,Communication', 'Web Development', 'Apple Developer Academy', 'https://developer.apple.com/swift'),
  ('Android App Development', 'Create Android applications using Kotlin and Android Studio.', '8 weeks', 'Intermediate', 'JavaScript,Communication', 'Web Development', 'Google Codelabs', 'https://codelabs.developers.google.com/android'),
  ('Vue.js Full Stack Development', 'Learn full stack development with Vue.js for frontend and Node.js for backend.', '10 weeks', 'Intermediate', 'JavaScript,SQL', 'Web Development,Product Management', 'VueSchool', 'https://vueschool.io'),
  ('AWS Solutions Architect', 'Design and deploy scalable AWS infrastructure for enterprise applications.', '6 weeks', 'Intermediate', 'SQL,Communication', 'Web Development', 'A Cloud Guru', 'https://acloud.guru/aws-architect'),
  ('Google Cloud Platform Fundamentals', 'Learn GCP services including Compute, Storage, and Big Data solutions.', '4 weeks', 'Beginner', 'Python,SQL', 'AI', 'Google Cloud Skills Boost', 'https://google.qwiklabs.com'),
  ('Business Analysis Fundamentals', 'Learn BA techniques for requirements gathering, process analysis, and stakeholder management.', '4 weeks', 'Beginner', 'Communication,SQL', 'Product Management', 'IIBA', 'https://iiba.org/ba-fundamentals'),
  ('Advanced SQL for Analytics', 'Master complex SQL queries, window functions, and analytics for data-driven insights.', '5 weeks', 'Advanced', 'SQL,Data Analysis', 'Data Visualization', 'DataCamp', 'https://datacamp.com/advanced-sql')
ON DUPLICATE KEY UPDATE title = VALUES(title);

-- ========================================
-- RESUME MATCH ANALYSIS FEATURE TABLES
-- ========================================

CREATE TABLE IF NOT EXISTS resumes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  file_path VARCHAR(255) NOT NULL,
  extracted_text LONGTEXT,
  extracted_skills JSON,
  education JSON,
  experience_summary TEXT,
  score INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS jobs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(150) NOT NULL,
  company_name VARCHAR(150) NOT NULL,
  recruiter_id INT NOT NULL,
  skills_required TEXT,
  job_type ENUM('Internship', 'Full-Time') DEFAULT 'Internship',
  description TEXT,
  location VARCHAR(150),
  status ENUM('active', 'closed', 'filled') DEFAULT 'active',
  posted_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (recruiter_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS applications (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  job_id INT NOT NULL,
  match_score INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_application (user_id, job_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
);

ALTER TABLE courses ADD COLUMN IF NOT EXISTS skill_name VARCHAR(100) NULL;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS course_name VARCHAR(200) NULL;

CREATE TABLE IF NOT EXISTS certifications (
  id INT PRIMARY KEY AUTO_INCREMENT,
  skill_name VARCHAR(100) NOT NULL,
  certification_name VARCHAR(200) NOT NULL,
  provider VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO courses (title, description, duration, level, skills_covered, interests_covered, provider, url, skill_name, course_name) VALUES
('SQL for Beginners', 'Foundational SQL training for analytics careers', '4 weeks', 'Beginner', 'SQL', 'Data Visualization', 'Coursera', 'https://coursera.org/sql-for-beginners', 'SQL', 'SQL for Beginners'),
('Power BI Dashboard Mastery', 'Learn dashboard design and DAX fundamentals', '3 weeks', 'Beginner', 'Power BI,Data Analysis', 'Data Visualization', 'Udemy', 'https://udemy.com/power-bi-dashboard-mastery', 'Power BI', 'Power BI Dashboard Mastery'),
('Statistics for Data Science', 'Probability, hypothesis testing, and practical stats', '5 weeks', 'Intermediate', 'Statistics,Data Analysis', 'AI', 'edX', 'https://edx.org/statistics-for-data-science', 'Statistics', 'Statistics for Data Science')
ON DUPLICATE KEY UPDATE course_name = VALUES(course_name), skill_name = VALUES(skill_name);

INSERT INTO certifications (skill_name, certification_name, provider) VALUES
('SQL', 'Google Data Analytics', 'Google'),
('Power BI', 'Microsoft PL-300', 'Microsoft'),
('Statistics', 'IBM Data Science Professional Certificate', 'IBM')
ON DUPLICATE KEY UPDATE provider = VALUES(provider);
