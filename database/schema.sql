CREATE DATABASE IF NOT EXISTS edusense_ai
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE edusense_ai;

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS activity_logs;
DROP TABLE IF EXISTS student_badges;
DROP TABLE IF EXISTS badges;
DROP TABLE IF EXISTS ai_predictions;
DROP TABLE IF EXISTS student_features;
DROP TABLE IF EXISTS ai_recommendations;
DROP TABLE IF EXISTS learning_progress;
DROP TABLE IF EXISTS answers;
DROP TABLE IF EXISTS quiz_attempts;
DROP TABLE IF EXISTS questions;
DROP TABLE IF EXISTS quizzes;
DROP TABLE IF EXISTS materials;
DROP TABLE IF EXISTS subjects;
DROP TABLE IF EXISTS teacher_classes;
DROP TABLE IF EXISTS students;
DROP TABLE IF EXISTS classes;
DROP TABLE IF EXISTS teachers;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS subscriptions;
DROP TABLE IF EXISTS schools;
DROP TABLE IF EXISTS roles;

SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE roles (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_roles_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE schools (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  code VARCHAR(50) NOT NULL,
  email VARCHAR(500) NULL,
  phone VARCHAR(50) NULL,
  address TEXT NULL,
  city VARCHAR(100) NULL,
  province VARCHAR(100) NULL,
  country VARCHAR(100) NOT NULL DEFAULT 'Indonesia',
  postal_code VARCHAR(20) NULL,
  website_url VARCHAR(255) NULL,
  status ENUM('active','inactive') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_schools_code (code),
  UNIQUE KEY uq_schools_email (email),
  KEY idx_schools_status (status),
  KEY idx_schools_city_province (city, province),
  KEY idx_schools_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE subscriptions (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  school_id INT UNSIGNED NOT NULL,
  plan_name VARCHAR(100) NOT NULL,
  plan_code VARCHAR(50) NOT NULL,
  status ENUM('trial','active','past_due','cancelled','expired') NOT NULL DEFAULT 'trial',
  billing_cycle ENUM('monthly','quarterly','semesterly','yearly') NOT NULL DEFAULT 'monthly',
  max_students INT UNSIGNED NOT NULL DEFAULT 0,
  max_teachers INT UNSIGNED NOT NULL DEFAULT 0,
  starts_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ends_at DATETIME NULL,
  cancelled_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_subscriptions_school_id (school_id),
  KEY idx_subscriptions_status (status),
  KEY idx_subscriptions_plan_code (plan_code),
  KEY idx_subscriptions_period (starts_at, ends_at),
  CONSTRAINT fk_subscriptions_school_id
    FOREIGN KEY (school_id) REFERENCES schools(id)
    ON UPDATE CASCADE
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE users (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  school_id INT UNSIGNED NOT NULL DEFAULT 1,
  role_id INT UNSIGNED NOT NULL,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(500) NOT NULL,
  password VARCHAR(255) NOT NULL,
  avatar VARCHAR(255) NULL,
  status ENUM('active','inactive') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_users_email (email),
  UNIQUE KEY uq_users_id_school (id, school_id),
  KEY idx_users_school_id (school_id),
  KEY idx_users_role_id (role_id),
  KEY idx_users_status (status),
  KEY idx_users_created_at (created_at),
  CONSTRAINT fk_users_school_id
    FOREIGN KEY (school_id) REFERENCES schools(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT fk_users_role_id
    FOREIGN KEY (role_id) REFERENCES roles(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE teachers (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  school_id INT UNSIGNED NOT NULL DEFAULT 1,
  user_id INT UNSIGNED NOT NULL,
  employee_number VARCHAR(50) NULL,
  position ENUM('teacher','vice_principal','principal') NOT NULL DEFAULT 'teacher',
  specialization VARCHAR(100) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_teachers_user_id (user_id),
  UNIQUE KEY uq_teachers_school_employee_number (school_id, employee_number),
  UNIQUE KEY uq_teachers_id_school (id, school_id),
  KEY idx_teachers_user_school (user_id, school_id),
  KEY idx_teachers_school_id (school_id),
  KEY idx_teachers_position (position),
  KEY idx_teachers_specialization (specialization),
  CONSTRAINT fk_teachers_school_id
    FOREIGN KEY (school_id) REFERENCES schools(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT fk_teachers_user_school
    FOREIGN KEY (user_id, school_id) REFERENCES users(id, school_id)
    ON UPDATE CASCADE
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE classes (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  school_id INT UNSIGNED NOT NULL DEFAULT 1,
  homeroom_teacher_id INT UNSIGNED NULL,
  name VARCHAR(50) NOT NULL,
  grade_level VARCHAR(20) NULL,
  academic_year VARCHAR(20) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_classes_school_name_grade_year (school_id, name, grade_level, academic_year),
  UNIQUE KEY uq_classes_homeroom_year (homeroom_teacher_id, academic_year),
  UNIQUE KEY uq_classes_id_school (id, school_id),
  KEY idx_classes_school_id (school_id),
  KEY idx_classes_homeroom_teacher_id (homeroom_teacher_id),
  KEY idx_classes_homeroom_teacher_school (homeroom_teacher_id, school_id),
  KEY idx_classes_grade_level (grade_level),
  KEY idx_classes_academic_year (academic_year),
  CONSTRAINT fk_classes_school_id
    FOREIGN KEY (school_id) REFERENCES schools(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT fk_classes_homeroom_teacher_school
    FOREIGN KEY (homeroom_teacher_id, school_id) REFERENCES teachers(id, school_id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE students (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  school_id INT UNSIGNED NOT NULL DEFAULT 1,
  user_id INT UNSIGNED NOT NULL,
  class_id INT UNSIGNED NOT NULL,
  student_number VARCHAR(50) NULL,
  current_level ENUM('basic','intermediate','advanced') NOT NULL DEFAULT 'basic',
  risk_status ENUM('safe','warning','danger') NOT NULL DEFAULT 'safe',
  total_score DECIMAL(8,2) NOT NULL DEFAULT 0,
  streak_days INT UNSIGNED NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_students_user_id (user_id),
  UNIQUE KEY uq_students_school_student_number (school_id, student_number),
  UNIQUE KEY uq_students_id_school (id, school_id),
  KEY idx_students_user_school (user_id, school_id),
  KEY idx_students_school_id (school_id),
  KEY idx_students_class_id (class_id),
  KEY idx_students_class_school (class_id, school_id),
  KEY idx_students_school_class (school_id, class_id),
  KEY idx_students_current_level (current_level),
  KEY idx_students_risk_status (risk_status),
  KEY idx_students_score_streak (total_score, streak_days),
  CONSTRAINT fk_students_school_id
    FOREIGN KEY (school_id) REFERENCES schools(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT fk_students_user_school
    FOREIGN KEY (user_id, school_id) REFERENCES users(id, school_id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  CONSTRAINT fk_students_class_school
    FOREIGN KEY (class_id, school_id) REFERENCES classes(id, school_id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE subjects (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  school_id INT UNSIGNED NOT NULL DEFAULT 1,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(30) NULL,
  description TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_subjects_school_code (school_id, code),
  UNIQUE KEY uq_subjects_id_school (id, school_id),
  KEY idx_subjects_school_id (school_id),
  KEY idx_subjects_name (name),
  CONSTRAINT fk_subjects_school_id
    FOREIGN KEY (school_id) REFERENCES schools(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE teacher_classes (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  school_id INT UNSIGNED NOT NULL DEFAULT 1,
  teacher_id INT UNSIGNED NOT NULL,
  class_id INT UNSIGNED NOT NULL,
  subject_id INT UNSIGNED NOT NULL,
  assignment_type ENUM('subject_teacher','assistant_teacher') NOT NULL DEFAULT 'subject_teacher',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_teacher_classes_assignment (school_id, teacher_id, class_id, subject_id),
  KEY idx_teacher_classes_school_id (school_id),
  KEY idx_teacher_classes_teacher_school (teacher_id, school_id),
  KEY idx_teacher_classes_class_id (class_id),
  KEY idx_teacher_classes_class_school (class_id, school_id),
  KEY idx_teacher_classes_subject_id (subject_id),
  KEY idx_teacher_classes_subject_school (subject_id, school_id),
  KEY idx_teacher_classes_assignment_type (assignment_type),
  CONSTRAINT fk_teacher_classes_school_id
    FOREIGN KEY (school_id) REFERENCES schools(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT fk_teacher_classes_teacher_school
    FOREIGN KEY (teacher_id, school_id) REFERENCES teachers(id, school_id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  CONSTRAINT fk_teacher_classes_class_school
    FOREIGN KEY (class_id, school_id) REFERENCES classes(id, school_id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  CONSTRAINT fk_teacher_classes_subject_school
    FOREIGN KEY (subject_id, school_id) REFERENCES subjects(id, school_id)
    ON UPDATE CASCADE
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE materials (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  subject_id INT UNSIGNED NOT NULL,
  title VARCHAR(150) NOT NULL,
  content LONGTEXT NULL,
  level ENUM('basic','intermediate','advanced') NOT NULL DEFAULT 'basic',
  media_url VARCHAR(255) NULL,
  estimated_minutes INT UNSIGNED NOT NULL DEFAULT 10,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_materials_subject_id (subject_id),
  UNIQUE KEY uq_materials_id_subject (id, subject_id),
  KEY idx_materials_level (level),
  KEY idx_materials_subject_level (subject_id, level),
  KEY idx_materials_created_at (created_at),
  CONSTRAINT fk_materials_subject_id
    FOREIGN KEY (subject_id) REFERENCES subjects(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE quizzes (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  subject_id INT UNSIGNED NOT NULL,
  material_id INT UNSIGNED NULL,
  title VARCHAR(150) NOT NULL,
  quiz_type ENUM('diagnostic','practice','final') NOT NULL DEFAULT 'practice',
  level ENUM('basic','intermediate','advanced') NOT NULL DEFAULT 'basic',
  duration_minutes INT UNSIGNED NOT NULL DEFAULT 15,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_quizzes_subject_id (subject_id),
  KEY idx_quizzes_material_id (material_id),
  KEY idx_quizzes_material_subject (material_id, subject_id),
  KEY idx_quizzes_quiz_type (quiz_type),
  KEY idx_quizzes_level (level),
  KEY idx_quizzes_subject_level_type (subject_id, level, quiz_type),
  KEY idx_quizzes_created_at (created_at),
  CONSTRAINT fk_quizzes_subject_id
    FOREIGN KEY (subject_id) REFERENCES subjects(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT fk_quizzes_material_subject
    FOREIGN KEY (material_id, subject_id) REFERENCES materials(id, subject_id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE questions (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  quiz_id INT UNSIGNED NOT NULL,
  question_text TEXT NOT NULL,
  question_type ENUM('multiple_choice','essay') NOT NULL DEFAULT 'multiple_choice',
  option_a TEXT NULL,
  option_b TEXT NULL,
  option_c TEXT NULL,
  option_d TEXT NULL,
  correct_answer TEXT NULL,
  keywords TEXT NULL,
  point DECIMAL(8,2) NOT NULL DEFAULT 10,
  difficulty ENUM('easy','medium','hard') NOT NULL DEFAULT 'easy',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_questions_quiz_id (quiz_id),
  KEY idx_questions_quiz_order (quiz_id, id),
  KEY idx_questions_type (question_type),
  KEY idx_questions_difficulty (difficulty),
  CONSTRAINT fk_questions_quiz_id
    FOREIGN KEY (quiz_id) REFERENCES quizzes(id)
    ON UPDATE CASCADE
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE quiz_attempts (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  student_id INT UNSIGNED NOT NULL,
  quiz_id INT UNSIGNED NOT NULL,
  score DECIMAL(8,2) NOT NULL DEFAULT 0,
  accuracy_rate DECIMAL(5,2) NOT NULL DEFAULT 0,
  time_spent_seconds INT UNSIGNED NOT NULL DEFAULT 0,
  attempt_number INT UNSIGNED NOT NULL DEFAULT 1,
  ai_level_result ENUM('basic','intermediate','advanced') NULL,
  performance_trend ENUM('improving','stable','declining') NOT NULL DEFAULT 'stable',
  started_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  submitted_at DATETIME NULL,
  KEY idx_quiz_attempts_student_id (student_id),
  KEY idx_quiz_attempts_quiz_id (quiz_id),
  KEY idx_quiz_attempts_student_quiz (student_id, quiz_id),
  KEY idx_quiz_attempts_student_submitted (student_id, submitted_at, id),
  KEY idx_quiz_attempts_started_at (started_at),
  CONSTRAINT fk_quiz_attempts_student_id
    FOREIGN KEY (student_id) REFERENCES students(id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  CONSTRAINT fk_quiz_attempts_quiz_id
    FOREIGN KEY (quiz_id) REFERENCES quizzes(id)
    ON UPDATE CASCADE
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE answers (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  attempt_id INT UNSIGNED NOT NULL,
  question_id INT UNSIGNED NOT NULL,
  student_answer TEXT NULL,
  is_correct BOOLEAN NOT NULL DEFAULT FALSE,
  score DECIMAL(8,2) NOT NULL DEFAULT 0,
  confidence_score DECIMAL(5,2) NOT NULL DEFAULT 0,
  ai_feedback TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_answers_attempt_question (attempt_id, question_id),
  KEY idx_answers_question_id (question_id),
  KEY idx_answers_is_correct (is_correct),
  CONSTRAINT fk_answers_attempt_id
    FOREIGN KEY (attempt_id) REFERENCES quiz_attempts(id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  CONSTRAINT fk_answers_question_id
    FOREIGN KEY (question_id) REFERENCES questions(id)
    ON UPDATE CASCADE
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE learning_progress (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  student_id INT UNSIGNED NOT NULL,
  material_id INT UNSIGNED NOT NULL,
  status ENUM('not_started','in_progress','completed') NOT NULL DEFAULT 'not_started',
  progress_percent DECIMAL(5,2) NOT NULL DEFAULT 0,
  time_spent_seconds INT UNSIGNED NOT NULL DEFAULT 0,
  completed_at DATETIME NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_learning_progress_student_material (student_id, material_id),
  KEY idx_learning_progress_material_id (material_id),
  KEY idx_learning_progress_student_status (student_id, status),
  KEY idx_learning_progress_updated_at (updated_at),
  CONSTRAINT fk_learning_progress_student_id
    FOREIGN KEY (student_id) REFERENCES students(id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  CONSTRAINT fk_learning_progress_material_id
    FOREIGN KEY (material_id) REFERENCES materials(id)
    ON UPDATE CASCADE
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE ai_recommendations (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  student_id INT UNSIGNED NOT NULL,
  material_id INT UNSIGNED NULL,
  recommendation_type ENUM('review','next_material','remedial','challenge') NOT NULL DEFAULT 'next_material',
  reason TEXT NULL,
  priority ENUM('low','medium','high') NOT NULL DEFAULT 'medium',
  status ENUM('pending','done','ignored') NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_ai_recommendations_student_id (student_id),
  KEY idx_ai_recommendations_material_id (material_id),
  KEY idx_ai_recommendations_status (status),
  KEY idx_ai_recommendations_priority (priority),
  KEY idx_ai_recommendations_student_status_priority (student_id, status, priority),
  KEY idx_ai_recommendations_created_at (created_at),
  CONSTRAINT fk_ai_recommendations_student_id
    FOREIGN KEY (student_id) REFERENCES students(id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  CONSTRAINT fk_ai_recommendations_material_id
    FOREIGN KEY (material_id) REFERENCES materials(id)
    ON UPDATE CASCADE
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE student_features (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  student_id INT UNSIGNED NOT NULL,
  learning_speed DECIMAL(8,2) NOT NULL DEFAULT 0,
  accuracy_rate DECIMAL(5,2) NOT NULL DEFAULT 0,
  consistency_score DECIMAL(5,2) NOT NULL DEFAULT 0,
  engagement_score DECIMAL(5,2) NOT NULL DEFAULT 0,
  retry_rate DECIMAL(5,2) NOT NULL DEFAULT 0,
  last_calculated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_student_features_student_id (student_id),
  KEY idx_student_features_last_calculated_at (last_calculated_at),
  CONSTRAINT fk_student_features_student_id
    FOREIGN KEY (student_id) REFERENCES students(id)
    ON UPDATE CASCADE
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE ai_predictions (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  student_id INT UNSIGNED NOT NULL,
  predicted_level ENUM('basic','intermediate','advanced') NULL,
  risk_prediction ENUM('low','medium','high') NULL,
  confidence DECIMAL(5,2) NOT NULL DEFAULT 0,
  model_version VARCHAR(50) NOT NULL DEFAULT 'v1.0',
  prediction_reason TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_ai_predictions_student_id (student_id),
  KEY idx_ai_predictions_student_created_at (student_id, created_at),
  KEY idx_ai_predictions_predicted_level (predicted_level),
  KEY idx_ai_predictions_risk_prediction (risk_prediction),
  KEY idx_ai_predictions_model_version (model_version),
  CONSTRAINT fk_ai_predictions_student_id
    FOREIGN KEY (student_id) REFERENCES students(id)
    ON UPDATE CASCADE
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE activity_logs (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  student_id INT UNSIGNED NOT NULL,
  activity_type ENUM('login','view_material','start_quiz','submit_quiz','earn_badge') NOT NULL,
  description TEXT NULL,
  metadata JSON NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_activity_logs_student_id (student_id),
  KEY idx_activity_logs_activity_type (activity_type),
  KEY idx_activity_logs_student_type_created (student_id, activity_type, created_at),
  KEY idx_activity_logs_created_at (created_at),
  CONSTRAINT fk_activity_logs_student_id
    FOREIGN KEY (student_id) REFERENCES students(id)
    ON UPDATE CASCADE
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE badges (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  school_id INT UNSIGNED NOT NULL DEFAULT 1,
  name VARCHAR(100) NOT NULL,
  description TEXT NULL,
  icon VARCHAR(255) NULL,
  requirement TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_badges_school_name (school_id, name),
  UNIQUE KEY uq_badges_id_school (id, school_id),
  KEY idx_badges_school_id (school_id),
  KEY idx_badges_created_at (created_at),
  CONSTRAINT fk_badges_school_id
    FOREIGN KEY (school_id) REFERENCES schools(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE student_badges (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  school_id INT UNSIGNED NOT NULL DEFAULT 1,
  student_id INT UNSIGNED NOT NULL,
  badge_id INT UNSIGNED NOT NULL,
  earned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_student_badges_student_badge (school_id, student_id, badge_id),
  KEY idx_student_badges_school_id (school_id),
  KEY idx_student_badges_student_school (student_id, school_id),
  KEY idx_student_badges_badge_id (badge_id),
  KEY idx_student_badges_badge_school (badge_id, school_id),
  KEY idx_student_badges_student_earned (student_id, earned_at),
  CONSTRAINT fk_student_badges_student_school
    FOREIGN KEY (student_id, school_id) REFERENCES students(id, school_id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  CONSTRAINT fk_student_badges_badge_school
    FOREIGN KEY (badge_id, school_id) REFERENCES badges(id, school_id)
    ON UPDATE CASCADE
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO roles (name)
VALUES ('admin'), ('teacher'), ('student');

INSERT INTO schools (name, code, email, phone, address, city, province, country, postal_code, website_url)
VALUES (
  'EduSense Demo School',
  'EDS-DEMO',
  'admin@edusense.example',
  '+62-21-555-0100',
  'Jl. Pendidikan No. 1',
  'Jakarta',
  'DKI Jakarta',
  'Indonesia',
  '10110',
  'https://edusense.example'
);

SET @default_school_id = LAST_INSERT_ID();

INSERT INTO subscriptions
  (school_id, plan_name, plan_code, status, billing_cycle, max_students, max_teachers, starts_at, ends_at)
VALUES
  (@default_school_id, 'Starter Trial', 'STARTER-TRIAL', 'trial', 'monthly', 500, 50, CURRENT_TIMESTAMP, DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 30 DAY));

INSERT INTO subjects (school_id, name, code, description)
VALUES (@default_school_id, 'Basic Mathematics', 'MATH-BASIC', 'Initial adaptive learning materials and diagnostic assessments.');

SET @math_subject_id = LAST_INSERT_ID();

INSERT INTO materials (subject_id, title, content, level, estimated_minutes)
VALUES
  (@math_subject_id, 'Material 1 - Number Concepts', 'Introduction to numbers, basic operations, and place value understanding.', 'basic', 15),
  (@math_subject_id, 'Material 2 - Operations and Patterns', 'Practice with arithmetic operations, simple patterns, and core concept application.', 'intermediate', 20),
  (@math_subject_id, 'Material 3 - Problem Analysis', 'Step-by-step strategies for solving word problems and analyzing solutions.', 'advanced', 25);

INSERT INTO quizzes (subject_id, title, quiz_type, level, duration_minutes)
VALUES (@math_subject_id, 'AI Diagnostic Test - Basic Mathematics', 'diagnostic', 'basic', 20);

SET @diagnostic_quiz_id = LAST_INSERT_ID();

INSERT INTO questions
  (quiz_id, question_text, question_type, option_a, option_b, option_c, option_d, correct_answer, keywords, point, difficulty)
VALUES
  (@diagnostic_quiz_id, 'What is the result of 8 + 7?', 'multiple_choice', '13', '14', '15', '16', '15', NULL, 10, 'easy'),
  (@diagnostic_quiz_id, 'What is the result of 24 - 9?', 'multiple_choice', '13', '14', '15', '16', '15', NULL, 10, 'easy'),
  (@diagnostic_quiz_id, 'What is the result of 6 x 4?', 'multiple_choice', '20', '22', '24', '26', '24', NULL, 10, 'easy'),
  (@diagnostic_quiz_id, 'What is the result of 36 / 6?', 'multiple_choice', '4', '5', '6', '7', '6', NULL, 10, 'easy'),
  (@diagnostic_quiz_id, 'What is the next number in the pattern 2, 4, 8, 16?', 'multiple_choice', '18', '24', '32', '64', '32', NULL, 10, 'medium'),
  (@diagnostic_quiz_id, 'What is 3/4 in decimal form?', 'multiple_choice', '0.25', '0.5', '0.75', '1.25', '0.75', NULL, 10, 'medium'),
  (@diagnostic_quiz_id, 'If 5 pencils cost 10,000, what is the cost of 1 pencil?', 'multiple_choice', '1,000', '2,000', '2,500', '5,000', '2,000', NULL, 10, 'medium'),
  (@diagnostic_quiz_id, 'A class has 30 students. If 40% are girls, how many girls are there?', 'multiple_choice', '10', '12', '14', '16', '12', NULL, 10, 'medium'),
  (@diagnostic_quiz_id, 'Briefly explain the steps for solving a mathematics word problem.', 'essay', NULL, NULL, NULL, NULL, 'Identify information, choose the operation, calculate, and check the answer.', 'identify information, operation, calculate, check answer', 10, 'hard'),
  (@diagnostic_quiz_id, 'Why is it important to check calculation results?', 'essay', NULL, NULL, NULL, NULL, 'To find mistakes and make the answer more accurate.', 'mistake, accurate, check, answer', 10, 'hard');

INSERT INTO badges (school_id, name, description, icon, requirement)
VALUES
  (@default_school_id, 'Mastery Badge', 'Awarded when a student reaches advanced-level mastery.', 'mastery', 'Advanced level with high accuracy'),
  (@default_school_id, 'Diagnostic Finisher', 'Awarded when a student completes the AI diagnostic test.', 'diagnostic', 'Complete the diagnostic test');
