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

-- Demo seed snapshot.
-- Login accounts:
--   admin@edusense.ai / demo12345
--   teacher@edusense.ai / demo12345
--   student@edusense.ai / demo12345
-- User emails and password below are encrypted/hashed for the default backend .env.
-- Run `npm run db:seed` from backend to regenerate richer demo data with the active .env values.

SET @demo_password_hash = '$2b$10$ltaXjGC7.iYY1j1bOn5ig.WljBrSixN/B.N8sYI3IwDZXPT343aiy';

INSERT INTO roles (name)
VALUES ('admin'), ('teacher'), ('student');

SET @admin_role_id = (SELECT id FROM roles WHERE name = 'admin');
SET @teacher_role_id = (SELECT id FROM roles WHERE name = 'teacher');
SET @student_role_id = (SELECT id FROM roles WHERE name = 'student');

INSERT INTO schools
  (name, code, email, phone, address, city, province, country, postal_code, website_url, status)
VALUES
  (
    'SMA Nusantara Demo',
    'SMA-NUSA-DEMO',
    'operator@smanusantara.demo',
    '+62-21-555-0100',
    'Jl. Pendidikan No. 1',
    'Jakarta',
    'DKI Jakarta',
    'Indonesia',
    '10110',
    'https://edusense.example',
    'active'
  );

SET @default_school_id = LAST_INSERT_ID();

INSERT INTO subscriptions
  (school_id, plan_name, plan_code, status, billing_cycle, max_students, max_teachers, starts_at, ends_at)
VALUES
  (
    @default_school_id,
    'EduSense Demo Suite',
    'DEMO-SUITE',
    'active',
    'semesterly',
    1000,
    80,
    DATE_SUB(NOW(), INTERVAL 15 DAY),
    DATE_ADD(NOW(), INTERVAL 165 DAY)
  );

INSERT INTO users (school_id, role_id, name, email, password, avatar, status)
VALUES
  (@default_school_id, @admin_role_id, 'Admin Sekolah', 'enc:v1:BNRzxOwTZVOQxLKMBskkW+s5KqBBFu3fDIKbAHngxfo=', @demo_password_hash, 'AS', 'active'),
  (@default_school_id, @teacher_role_id, 'Bu Rani Wijaya', 'enc:v1:ei0rv0ot+8gPo7uhuowQP8yXg0QNFKnVLj+y0ZRIL6M=', @demo_password_hash, 'RW', 'active'),
  (@default_school_id, @teacher_role_id, 'Pak Bima Santoso', 'enc:v1:rx+aEIYDv2S2kfFr4flpTyIKfhRa6A9rzchKTE4s7ec=', @demo_password_hash, 'BS', 'active'),
  (@default_school_id, @student_role_id, 'Alya Prameswari', 'enc:v1:peU79TdKBFk3lxZ4J5eKIwNywbgmEPLei5WJ69DQNy0=', @demo_password_hash, 'AP', 'active'),
  (@default_school_id, @student_role_id, 'Raka Putra', 'enc:v1:yfCRkvnrUjzD5XSV5/b/oH8hzmuCh4AQv/R7+CwYBzI=', @demo_password_hash, 'RP', 'active'),
  (@default_school_id, @student_role_id, 'Nadia Zahra', 'enc:v1:5V+udU25ZRvzFC24YicOvq9NRfUcwSssiw2Ged7Mwak=', @demo_password_hash, 'NZ', 'active');

SET @admin_user_id = (SELECT id FROM users WHERE name = 'Admin Sekolah' AND school_id = @default_school_id);
SET @rani_user_id = (SELECT id FROM users WHERE name = 'Bu Rani Wijaya' AND school_id = @default_school_id);
SET @bima_user_id = (SELECT id FROM users WHERE name = 'Pak Bima Santoso' AND school_id = @default_school_id);
SET @alya_user_id = (SELECT id FROM users WHERE name = 'Alya Prameswari' AND school_id = @default_school_id);
SET @raka_user_id = (SELECT id FROM users WHERE name = 'Raka Putra' AND school_id = @default_school_id);
SET @nadia_user_id = (SELECT id FROM users WHERE name = 'Nadia Zahra' AND school_id = @default_school_id);

INSERT INTO teachers (school_id, user_id, employee_number, position, specialization)
VALUES
  (@default_school_id, @rani_user_id, 'NIP-DEMO-001', 'teacher', 'Matematika'),
  (@default_school_id, @bima_user_id, 'NIP-DEMO-002', 'teacher', 'Fisika');

SET @rani_teacher_id = (SELECT id FROM teachers WHERE user_id = @rani_user_id);
SET @bima_teacher_id = (SELECT id FROM teachers WHERE user_id = @bima_user_id);

INSERT INTO classes (school_id, homeroom_teacher_id, name, grade_level, academic_year)
VALUES
  (@default_school_id, @rani_teacher_id, 'XI IPA 2', 'XI', '2025/2026'),
  (@default_school_id, @bima_teacher_id, 'XI IPA 1', 'XI', '2025/2026');

SET @xi_ipa_2_id = (SELECT id FROM classes WHERE school_id = @default_school_id AND name = 'XI IPA 2');
SET @xi_ipa_1_id = (SELECT id FROM classes WHERE school_id = @default_school_id AND name = 'XI IPA 1');

INSERT INTO students
  (school_id, user_id, class_id, student_number, current_level, risk_status, total_score, streak_days)
VALUES
  (@default_school_id, @alya_user_id, @xi_ipa_2_id, 'SIS-DEMO-001', 'intermediate', 'safe', 428, 12),
  (@default_school_id, @raka_user_id, @xi_ipa_2_id, 'SIS-DEMO-002', 'basic', 'warning', 196, 3),
  (@default_school_id, @nadia_user_id, @xi_ipa_1_id, 'SIS-DEMO-003', 'advanced', 'safe', 612, 18);

SET @alya_student_id = (SELECT id FROM students WHERE user_id = @alya_user_id);
SET @raka_student_id = (SELECT id FROM students WHERE user_id = @raka_user_id);
SET @nadia_student_id = (SELECT id FROM students WHERE user_id = @nadia_user_id);

INSERT INTO subjects (school_id, name, code, description)
VALUES
  (@default_school_id, 'Matematika', 'MTK-WJB', 'Fungsi linear, persamaan, gradien, dan pemecahan masalah.'),
  (@default_school_id, 'Fisika', 'FSK', 'Gerak, gaya, energi, dan eksperimen dasar.'),
  (@default_school_id, 'Bahasa Inggris', 'BIG', 'Reading, grammar, writing, dan analytical exposition.');

SET @math_subject_id = (SELECT id FROM subjects WHERE school_id = @default_school_id AND code = 'MTK-WJB');
SET @physics_subject_id = (SELECT id FROM subjects WHERE school_id = @default_school_id AND code = 'FSK');
SET @english_subject_id = (SELECT id FROM subjects WHERE school_id = @default_school_id AND code = 'BIG');

INSERT INTO teacher_classes (school_id, teacher_id, class_id, subject_id, assignment_type)
VALUES
  (@default_school_id, @rani_teacher_id, @xi_ipa_2_id, @math_subject_id, 'subject_teacher'),
  (@default_school_id, @rani_teacher_id, @xi_ipa_1_id, @math_subject_id, 'subject_teacher'),
  (@default_school_id, @bima_teacher_id, @xi_ipa_2_id, @physics_subject_id, 'subject_teacher');

INSERT INTO materials (subject_id, title, content, level, estimated_minutes)
VALUES
  (@math_subject_id, 'Konsep Fungsi Linear', 'Memahami bentuk y = ax + b, nilai awal, dan laju perubahan.', 'basic', 15),
  (@math_subject_id, 'Gradien dan Grafik', 'Menganalisis kemiringan garis dari persamaan dan grafik.', 'intermediate', 20),
  (@math_subject_id, 'Analisis Soal Cerita Linear', 'Menerjemahkan konteks sehari-hari menjadi model linear.', 'advanced', 25),
  (@physics_subject_id, 'Gerak Lurus Beraturan', 'Konsep jarak, waktu, kecepatan, dan grafik sederhana.', 'basic', 18),
  (@english_subject_id, 'Simple Past Tense', 'Menggunakan bentuk lampau untuk menceritakan peristiwa.', 'intermediate', 19);

SET @math_basic_material_id = (SELECT id FROM materials WHERE subject_id = @math_subject_id AND title = 'Konsep Fungsi Linear');
SET @math_mid_material_id = (SELECT id FROM materials WHERE subject_id = @math_subject_id AND title = 'Gradien dan Grafik');
SET @math_adv_material_id = (SELECT id FROM materials WHERE subject_id = @math_subject_id AND title = 'Analisis Soal Cerita Linear');
SET @physics_basic_material_id = (SELECT id FROM materials WHERE subject_id = @physics_subject_id AND title = 'Gerak Lurus Beraturan');
SET @english_mid_material_id = (SELECT id FROM materials WHERE subject_id = @english_subject_id AND title = 'Simple Past Tense');

INSERT INTO quizzes (subject_id, material_id, title, quiz_type, level, duration_minutes)
VALUES
  (@math_subject_id, @math_basic_material_id, 'Tes Diagnostik AI - Fungsi Linear', 'diagnostic', 'basic', 20),
  (@math_subject_id, @math_mid_material_id, 'Kuis Adaptif - Gradien dan Grafik', 'practice', 'intermediate', 15),
  (@physics_subject_id, @physics_basic_material_id, 'Latihan Cepat - Gerak Lurus', 'practice', 'basic', 12),
  (@english_subject_id, @english_mid_material_id, 'Final Mini - Simple Past', 'final', 'intermediate', 18);

SET @diagnostic_quiz_id = (SELECT id FROM quizzes WHERE title = 'Tes Diagnostik AI - Fungsi Linear');
SET @math_practice_quiz_id = (SELECT id FROM quizzes WHERE title = 'Kuis Adaptif - Gradien dan Grafik');
SET @physics_quiz_id = (SELECT id FROM quizzes WHERE title = 'Latihan Cepat - Gerak Lurus');
SET @english_quiz_id = (SELECT id FROM quizzes WHERE title = 'Final Mini - Simple Past');

INSERT INTO questions
  (quiz_id, question_text, question_type, option_a, option_b, option_c, option_d, correct_answer, keywords, point, difficulty)
VALUES
  (@diagnostic_quiz_id, 'Tentukan nilai x dari persamaan 2x + 4 = 12.', 'multiple_choice', '2', '4', '6', '8', '4', NULL, 10, 'easy'),
  (@diagnostic_quiz_id, 'Jika f(x) = x + 5, berapa nilai f(3)?', 'multiple_choice', '5', '8', '10', '15', '8', NULL, 10, 'easy'),
  (@diagnostic_quiz_id, 'Berapa gradien dari garis y = 3x - 2?', 'multiple_choice', '-2', '2', '3', '5', '3', NULL, 10, 'medium'),
  (@diagnostic_quiz_id, 'Jelaskan langkah utama menyelesaikan soal cerita fungsi linear.', 'essay', NULL, NULL, NULL, NULL, 'Identifikasi informasi, tentukan variabel, buat model, hitung, dan periksa jawaban.', 'identifikasi informasi, variabel, model, hitung, periksa', 10, 'hard'),
  (@math_practice_quiz_id, 'Gradien garis y = -2x + 7 adalah...', 'multiple_choice', '-2', '2', '7', '-7', '-2', NULL, 10, 'easy'),
  (@math_practice_quiz_id, 'Jika garis melalui (0, 3) dan (2, 7), gradiennya adalah...', 'multiple_choice', '1', '2', '3', '4', '2', NULL, 10, 'medium'),
  (@math_practice_quiz_id, 'Jelaskan arti konstanta b pada y = ax + b.', 'essay', NULL, NULL, NULL, NULL, 'Konstanta b menunjukkan nilai awal atau titik potong sumbu y.', 'nilai awal, titik potong, sumbu y', 10, 'hard'),
  (@physics_quiz_id, 'Rumus kecepatan pada GLB adalah...', 'multiple_choice', 'v = s/t', 'v = t/s', 's = v/t', 't = s x v', 'v = s/t', NULL, 10, 'easy'),
  (@physics_quiz_id, 'Benda menempuh 100 m dalam 20 s. Kecepatannya...', 'multiple_choice', '2 m/s', '5 m/s', '10 m/s', '20 m/s', '5 m/s', NULL, 10, 'easy'),
  (@english_quiz_id, 'Choose the simple past form: She ___ to school yesterday.', 'multiple_choice', 'go', 'goes', 'went', 'gone', 'went', NULL, 10, 'easy');

SET @diag_q1_id = (SELECT id FROM questions WHERE quiz_id = @diagnostic_quiz_id AND question_text LIKE 'Tentukan nilai x%');
SET @diag_q2_id = (SELECT id FROM questions WHERE quiz_id = @diagnostic_quiz_id AND question_text LIKE 'Jika f(x)%');
SET @diag_q3_id = (SELECT id FROM questions WHERE quiz_id = @diagnostic_quiz_id AND question_text LIKE 'Berapa gradien%');
SET @diag_q4_id = (SELECT id FROM questions WHERE quiz_id = @diagnostic_quiz_id AND question_type = 'essay');
SET @math_q1_id = (SELECT id FROM questions WHERE quiz_id = @math_practice_quiz_id AND question_text LIKE 'Gradien garis%');
SET @math_q2_id = (SELECT id FROM questions WHERE quiz_id = @math_practice_quiz_id AND question_text LIKE 'Jika garis%');
SET @math_q3_id = (SELECT id FROM questions WHERE quiz_id = @math_practice_quiz_id AND question_type = 'essay');
SET @physics_q1_id = (SELECT id FROM questions WHERE quiz_id = @physics_quiz_id AND question_text LIKE 'Rumus kecepatan%');
SET @physics_q2_id = (SELECT id FROM questions WHERE quiz_id = @physics_quiz_id AND question_text LIKE 'Benda menempuh%');

INSERT INTO quiz_attempts
  (student_id, quiz_id, score, accuracy_rate, time_spent_seconds, attempt_number, ai_level_result, performance_trend, started_at, submitted_at)
VALUES
  (@alya_student_id, @diagnostic_quiz_id, 80, 75, 940, 1, 'intermediate', 'improving', DATE_SUB(NOW(), INTERVAL 7 DAY), DATE_SUB(NOW(), INTERVAL 7 DAY)),
  (@alya_student_id, @math_practice_quiz_id, 92, 100, 780, 1, 'advanced', 'improving', DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
  (@raka_student_id, @diagnostic_quiz_id, 50, 50, 1220, 1, 'basic', 'stable', DATE_SUB(NOW(), INTERVAL 3 DAY), DATE_SUB(NOW(), INTERVAL 3 DAY)),
  (@nadia_student_id, @math_practice_quiz_id, 96, 100, 640, 1, 'advanced', 'improving', DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY));

SET @alya_diag_attempt_id = (SELECT id FROM quiz_attempts WHERE student_id = @alya_student_id AND quiz_id = @diagnostic_quiz_id LIMIT 1);
SET @alya_math_attempt_id = (SELECT id FROM quiz_attempts WHERE student_id = @alya_student_id AND quiz_id = @math_practice_quiz_id LIMIT 1);
SET @raka_diag_attempt_id = (SELECT id FROM quiz_attempts WHERE student_id = @raka_student_id AND quiz_id = @diagnostic_quiz_id LIMIT 1);
SET @nadia_math_attempt_id = (SELECT id FROM quiz_attempts WHERE student_id = @nadia_student_id AND quiz_id = @math_practice_quiz_id LIMIT 1);

INSERT INTO answers
  (attempt_id, question_id, student_answer, is_correct, score, confidence_score, ai_feedback)
VALUES
  (@alya_diag_attempt_id, @diag_q1_id, '4', TRUE, 10, 100, 'Jawaban sudah tepat dan menunjukkan pemahaman konsep.'),
  (@alya_diag_attempt_id, @diag_q2_id, '8', TRUE, 10, 100, 'Jawaban sudah tepat dan menunjukkan pemahaman konsep.'),
  (@alya_diag_attempt_id, @diag_q3_id, '3', TRUE, 10, 100, 'Jawaban sudah tepat dan menunjukkan pemahaman konsep.'),
  (@alya_diag_attempt_id, @diag_q4_id, 'Identifikasi informasi, tentukan variabel, buat model, hitung, dan cek jawaban.', TRUE, 8, 82, 'Jawaban essay menunjukkan pemahaman yang kuat.'),
  (@alya_math_attempt_id, @math_q1_id, '-2', TRUE, 10, 100, 'Jawaban benar.'),
  (@alya_math_attempt_id, @math_q2_id, '2', TRUE, 10, 100, 'Jawaban benar.'),
  (@alya_math_attempt_id, @math_q3_id, 'Konstanta b adalah nilai awal dan titik potong sumbu y.', TRUE, 9, 90, 'Jawaban essay sangat sesuai.'),
  (@raka_diag_attempt_id, @diag_q1_id, '4', TRUE, 10, 100, 'Jawaban benar.'),
  (@raka_diag_attempt_id, @diag_q2_id, '10', FALSE, 0, 0, 'Jawaban belum tepat. Pelajari kembali konsep terkait.'),
  (@raka_diag_attempt_id, @diag_q3_id, '2', FALSE, 0, 0, 'Jawaban belum tepat. Pelajari kembali konsep terkait.'),
  (@raka_diag_attempt_id, @diag_q4_id, 'Saya masih perlu memahami soal cerita.', FALSE, 2, 28, 'Jawaban essay masih perlu dilengkapi.'),
  (@nadia_math_attempt_id, @math_q1_id, '-2', TRUE, 10, 100, 'Jawaban benar.'),
  (@nadia_math_attempt_id, @math_q2_id, '2', TRUE, 10, 100, 'Jawaban benar.'),
  (@nadia_math_attempt_id, @math_q3_id, 'Konstanta b menunjukkan nilai awal atau titik potong sumbu y.', TRUE, 10, 96, 'Jawaban essay sangat sesuai.');

INSERT INTO learning_progress
  (student_id, material_id, status, progress_percent, time_spent_seconds, completed_at)
VALUES
  (@alya_student_id, @math_basic_material_id, 'completed', 100, 1800, DATE_SUB(NOW(), INTERVAL 8 DAY)),
  (@alya_student_id, @math_mid_material_id, 'completed', 100, 2100, DATE_SUB(NOW(), INTERVAL 2 DAY)),
  (@alya_student_id, @math_adv_material_id, 'in_progress', 64, 920, NULL),
  (@raka_student_id, @math_basic_material_id, 'in_progress', 45, 1160, NULL),
  (@raka_student_id, @math_mid_material_id, 'not_started', 0, 0, NULL),
  (@nadia_student_id, @math_basic_material_id, 'completed', 100, 1500, DATE_SUB(NOW(), INTERVAL 10 DAY)),
  (@nadia_student_id, @math_mid_material_id, 'completed', 100, 1600, DATE_SUB(NOW(), INTERVAL 5 DAY)),
  (@nadia_student_id, @math_adv_material_id, 'completed', 100, 1900, DATE_SUB(NOW(), INTERVAL 1 DAY));

INSERT INTO ai_recommendations
  (student_id, material_id, recommendation_type, reason, priority, status)
VALUES
  (@alya_student_id, @math_adv_material_id, 'challenge', 'Alya sudah stabil di konsep gradien. Lanjutkan soal cerita level lanjutan.', 'low', 'pending'),
  (@raka_student_id, @math_basic_material_id, 'remedial', 'Akurasi dasar masih 50%. Ulangi persamaan sederhana dan latihan bertahap.', 'high', 'pending'),
  (@nadia_student_id, @physics_basic_material_id, 'challenge', 'Performa tinggi. Beri tantangan lintas konsep untuk menjaga momentum.', 'low', 'pending');

INSERT INTO student_features
  (student_id, learning_speed, accuracy_rate, consistency_score, engagement_score, retry_rate)
VALUES
  (@alya_student_id, 1.34, 86, 91, 88, 8),
  (@raka_student_id, 0.82, 58, 64, 59, 24),
  (@nadia_student_id, 1.52, 94, 96, 92, 4);

INSERT INTO ai_predictions
  (student_id, predicted_level, risk_prediction, confidence, model_version, prediction_reason)
VALUES
  (@alya_student_id, 'advanced', 'low', 91, 'demo-v1.0', 'Akurasi tinggi dan streak konsisten selama 12 hari.'),
  (@raka_student_id, 'basic', 'medium', 74, 'demo-v1.0', 'Butuh remedial konsep dasar dan pemantauan progres mingguan.'),
  (@nadia_student_id, 'advanced', 'low', 95, 'demo-v1.0', 'Performa stabil di level lanjutan.');

INSERT INTO activity_logs
  (student_id, activity_type, description, metadata, created_at)
VALUES
  (@alya_student_id, 'login', 'Alya masuk ke dashboard siswa.', JSON_OBJECT('role', 'student'), DATE_SUB(NOW(), INTERVAL 6 HOUR)),
  (@alya_student_id, 'submit_quiz', 'Mengirim kuis adaptif Gradien dan Grafik.', JSON_OBJECT('attempt_id', @alya_math_attempt_id, 'score', 92), DATE_SUB(NOW(), INTERVAL 1 DAY)),
  (@raka_student_id, 'submit_quiz', 'Mengirim tes diagnostik AI.', JSON_OBJECT('attempt_id', @raka_diag_attempt_id, 'score', 50), DATE_SUB(NOW(), INTERVAL 3 DAY)),
  (@nadia_student_id, 'view_material', 'Membuka materi Analisis Soal Cerita Linear.', JSON_OBJECT('material_id', @math_adv_material_id), DATE_SUB(NOW(), INTERVAL 2 DAY));

INSERT INTO badges (school_id, name, description, icon, requirement)
VALUES
  (@default_school_id, 'Pemula AI', 'Menyelesaikan aktivitas belajar pertama di EduSense AI.', 'sparkles', 'Login dan mulai satu materi.'),
  (@default_school_id, 'Runtun 7 Hari', 'Aktif belajar minimal tujuh hari berturut-turut.', 'flame', 'Streak belajar minimal 7 hari.'),
  (@default_school_id, 'Jago Kuis', 'Meraih akurasi minimal 80% pada kuis adaptif.', 'target', 'Accuracy rate minimal 80%.'),
  (@default_school_id, 'Mastery Badge', 'Mencapai level advanced dengan akurasi tinggi.', 'award', 'Level advanced dan akurasi tinggi.'),
  (@default_school_id, 'Diagnostic Finisher', 'Menyelesaikan tes diagnostik AI.', 'check-circle', 'Submit tes diagnostik.');

SET @starter_badge_id = (SELECT id FROM badges WHERE school_id = @default_school_id AND name = 'Pemula AI');
SET @streak_badge_id = (SELECT id FROM badges WHERE school_id = @default_school_id AND name = 'Runtun 7 Hari');
SET @quiz_badge_id = (SELECT id FROM badges WHERE school_id = @default_school_id AND name = 'Jago Kuis');
SET @mastery_badge_id = (SELECT id FROM badges WHERE school_id = @default_school_id AND name = 'Mastery Badge');
SET @diagnostic_badge_id = (SELECT id FROM badges WHERE school_id = @default_school_id AND name = 'Diagnostic Finisher');

INSERT INTO student_badges (school_id, student_id, badge_id, earned_at)
VALUES
  (@default_school_id, @alya_student_id, @starter_badge_id, DATE_SUB(NOW(), INTERVAL 9 DAY)),
  (@default_school_id, @alya_student_id, @streak_badge_id, DATE_SUB(NOW(), INTERVAL 3 DAY)),
  (@default_school_id, @alya_student_id, @quiz_badge_id, DATE_SUB(NOW(), INTERVAL 1 DAY)),
  (@default_school_id, @alya_student_id, @diagnostic_badge_id, DATE_SUB(NOW(), INTERVAL 7 DAY)),
  (@default_school_id, @raka_student_id, @starter_badge_id, DATE_SUB(NOW(), INTERVAL 3 DAY)),
  (@default_school_id, @raka_student_id, @diagnostic_badge_id, DATE_SUB(NOW(), INTERVAL 3 DAY)),
  (@default_school_id, @nadia_student_id, @starter_badge_id, DATE_SUB(NOW(), INTERVAL 15 DAY)),
  (@default_school_id, @nadia_student_id, @streak_badge_id, DATE_SUB(NOW(), INTERVAL 8 DAY)),
  (@default_school_id, @nadia_student_id, @mastery_badge_id, DATE_SUB(NOW(), INTERVAL 2 DAY));
