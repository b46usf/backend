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
-- User emails are plain in this static snapshot so login lookup still works without regenerating encrypted values.
-- The password hash below is for the default backend .env.
-- Run `npm run db:seed` from backend to regenerate richer demo data with the active .env values.

SET @demo_password_hash = '$2b$10$UwMhah30IXjMQh9gdYuXdeyVI25JiyXQTWhq5uzzNfqunVh91qxh.';

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
  (@default_school_id, @admin_role_id, 'Admin Sekolah', 'admin@edusense.ai', @demo_password_hash, 'AS', 'active'),
  (@default_school_id, @teacher_role_id, 'ROSYIDAH ROHMAH, S.Pd', 'teacher.k1@edusense.ai', @demo_password_hash, 'RR', 'active'),
  (@default_school_id, @teacher_role_id, 'Maharani Gita Kusumawardani, S.Pd', 'teacher.g2@edusense.ai', @demo_password_hash, 'MG', 'active'),
  (@default_school_id, @teacher_role_id, 'Eva Krisnawati, S.Pd', 'teacher.e3@edusense.ai', @demo_password_hash, 'EK', 'active'),
  (@default_school_id, @teacher_role_id, 'RAHMAD ARIF, S.Pd', 'teacher.f4@edusense.ai', @demo_password_hash, 'RA', 'active'),
  (@default_school_id, @teacher_role_id, 'AGUS PRIJATMOKO, S.Pd, M.M', 'teacher.e5@edusense.ai', @demo_password_hash, 'AP', 'active'),
  (@default_school_id, @teacher_role_id, 'YANU INDRIYATI, M.Pd', 'teacher.g6@edusense.ai', @demo_password_hash, 'YI', 'active'),
  (@default_school_id, @teacher_role_id, 'Dra. RIMA RAHAYU, M.M', 'teacher.b7@edusense.ai', @demo_password_hash, 'DR', 'active'),
  (@default_school_id, @teacher_role_id, 'IWAN DILIANTO, S.Psi', 'teacher.u8@edusense.ai', @demo_password_hash, 'ID', 'active'),
  (@default_school_id, @teacher_role_id, 'IDHA HARIANI, S.Pd', 'teacher.g9@edusense.ai', @demo_password_hash, 'IH', 'active'),
  (@default_school_id, @teacher_role_id, 'ERMIYANTUN, S.Pd', 'teacher.u10@edusense.ai', @demo_password_hash, 'ES', 'active'),
  (@default_school_id, @teacher_role_id, 'Dra. NURCAHYATI', 'teacher.k11@edusense.ai', @demo_password_hash, 'DN', 'active'),
  (@default_school_id, @teacher_role_id, 'DARMO, S.Pd', 'teacher.u12@edusense.ai', @demo_password_hash, 'DS', 'active'),
  (@default_school_id, @teacher_role_id, 'YULIANTI, S.Pd', 'teacher.c13@edusense.ai', @demo_password_hash, 'YS', 'active'),
  (@default_school_id, @teacher_role_id, 'IKA APRILIA NINDYASARI. A., S.Pd', 'teacher.m14@edusense.ai', @demo_password_hash, 'IA', 'active'),
  (@default_school_id, @teacher_role_id, 'DIAN AYU A., S.Psi', 'teacher.u15@edusense.ai', @demo_password_hash, 'DA', 'active'),
  (@default_school_id, @teacher_role_id, 'SRI SULASTRI YULIANA, S.Pd', 'teacher.j16@edusense.ai', @demo_password_hash, 'SS', 'active'),
  (@default_school_id, @teacher_role_id, 'MUCHAMMAD FARUQ, S.Pd.I', 'teacher.a17@edusense.ai', @demo_password_hash, 'MF', 'active'),
  (@default_school_id, @teacher_role_id, 'SUPRAPTI, S.Pd', 'teacher.i18@edusense.ai', @demo_password_hash, 'SS', 'active'),
  (@default_school_id, @teacher_role_id, 'YUSWANTO PURNOMO, S.Pd.I', 'teacher.a19@edusense.ai', @demo_password_hash, 'YP', 'active'),
  (@default_school_id, @teacher_role_id, 'FATIMATUS ZAHROH, S.Pd,M.M', 'teacher.i20@edusense.ai', @demo_password_hash, 'FZ', 'active'),
  (@default_school_id, @teacher_role_id, 'ROIS NURIL ALAM ZEIN, S.Pd', 'teacher.f21@edusense.ai', @demo_password_hash, 'RN', 'active'),
  (@default_school_id, @teacher_role_id, 'DENNY RATNASARI, S.Pd', 'teacher.d22@edusense.ai', @demo_password_hash, 'DR', 'active'),
  (@default_school_id, @teacher_role_id, 'DENNY RATNASARI, S.Pd', 'teacher.p22@edusense.ai', @demo_password_hash, 'DR', 'active'),
  (@default_school_id, @teacher_role_id, 'Dra. MARIA ULFAH', 'teacher.l23@edusense.ai', @demo_password_hash, 'DM', 'active'),
  (@default_school_id, @teacher_role_id, 'RETNO DWI KARTIKA.L., S.Pd', 'teacher.b24@edusense.ai', @demo_password_hash, 'RD', 'active'),
  (@default_school_id, @teacher_role_id, 'KRISTIN KURNIA WATI, S.Pd', 'teacher.c25@edusense.ai', @demo_password_hash, 'KK', 'active'),
  (@default_school_id, @teacher_role_id, 'JENNI HARJANTI, S.Pd Kr', 'teacher.a26@edusense.ai', @demo_password_hash, 'JH', 'active'),
  (@default_school_id, @teacher_role_id, 'SITI KHOTIJAH, S.Pd', 'teacher.k27@edusense.ai', @demo_password_hash, 'SK', 'active'),
  (@default_school_id, @teacher_role_id, 'IDAHLYA MUGIRAHAYU, S.Pd', 'teacher.k28@edusense.ai', @demo_password_hash, 'IM', 'active'),
  (@default_school_id, @teacher_role_id, 'SITI KHUMAIROH SARAGIH, S.S', 'teacher.e29@edusense.ai', @demo_password_hash, 'SK', 'active'),
  (@default_school_id, @teacher_role_id, 'EKA RIZKI RAHMAWATI, S.Sos, M.Sosio', 'teacher.n30@edusense.ai', @demo_password_hash, 'ER', 'active'),
  (@default_school_id, @teacher_role_id, 'INTAN  AKMALIA, S.Pd', 'teacher.t31@edusense.ai', @demo_password_hash, 'IA', 'active'),
  (@default_school_id, @teacher_role_id, 'INTAN  AKMALIA, S.Pd', 'teacher.q31@edusense.ai', @demo_password_hash, 'IA', 'active'),
  (@default_school_id, @teacher_role_id, 'ROSITA DWI DIAHWARI, S.Pd', 'teacher.g32@edusense.ai', @demo_password_hash, 'RD', 'active'),
  (@default_school_id, @teacher_role_id, 'DINDA TRIANA, S.Pd', 'teacher.i33@edusense.ai', @demo_password_hash, 'DT', 'active'),
  (@default_school_id, @teacher_role_id, 'DINDA TRIANA, S.Pd', 'teacher.o33@edusense.ai', @demo_password_hash, 'DT', 'active'),
  (@default_school_id, @teacher_role_id, 'I WAYAN S, S.PdH', 'teacher.a34@edusense.ai', @demo_password_hash, 'IW', 'active'),
  (@default_school_id, @teacher_role_id, 'DHUHROTUL KHOIRIYAH, S.Pd', 'teacher.a35@edusense.ai', @demo_password_hash, 'DK', 'active'),
  (@default_school_id, @teacher_role_id, 'DHUHROTUL KHOIRIYAH, S.Pd', 'teacher.b35@edusense.ai', @demo_password_hash, 'DK', 'active'),
  (@default_school_id, @teacher_role_id, 'YOSEPH LIDI, S.FIL', 'teacher.a36@edusense.ai', @demo_password_hash, 'YL', 'active'),
  (@default_school_id, @teacher_role_id, 'ROSA RAMADHAN, S.Pd', 'teacher.r37@edusense.ai', @demo_password_hash, 'RR', 'active'),
  (@default_school_id, @teacher_role_id, 'ENGGAR SUSTIADI PRADANA, S.Pd', 'teacher.f38@edusense.ai', @demo_password_hash, 'ES', 'active'),
  (@default_school_id, @teacher_role_id, 'ANGELICA MAYLANI PUTRI, S.Pd', 'teacher.a39@edusense.ai', @demo_password_hash, 'AM', 'active'),
  (@default_school_id, @teacher_role_id, 'GUNTUR AJIE PANGESTU, S.Pd', 'teacher.m40@edusense.ai', @demo_password_hash, 'GA', 'active'),
  (@default_school_id, @teacher_role_id, 'INDAH PUTRI MAULIDYA SARI, S.Pd', 'teacher.h41@edusense.ai', @demo_password_hash, 'IP', 'active'),
  (@default_school_id, @teacher_role_id, 'BAGUS FAROUKTIAWAN, S.Kom', 'teacher@edusense.ai', @demo_password_hash, 'BF', 'active'),
  (@default_school_id, @teacher_role_id, 'DWI NOVIAN AGUSTIN, S.PD', 'teacher.e43@edusense.ai', @demo_password_hash, 'DN', 'active'),
  (@default_school_id, @teacher_role_id, 'NANDA TRY HASTUTI,S.Pd', 'teacher.j44@edusense.ai', @demo_password_hash, 'NT', 'active'),
  (@default_school_id, @teacher_role_id, 'NUR LAILIL APRILIA, S.Pd', 'teacher.j45@edusense.ai', @demo_password_hash, 'NL', 'active'),
  (@default_school_id, @teacher_role_id, 'NUR LAILIL APRILIA, S.Pd', 'teacher.s45@edusense.ai', @demo_password_hash, 'NL', 'active'),
  (@default_school_id, @teacher_role_id, 'DHELLA ROCHMATUL.M,S.Pd', 'teacher.h46@edusense.ai', @demo_password_hash, 'DR', 'active'),
  (@default_school_id, @teacher_role_id, 'ELLSA NATASHA.B, M.Pd', 'teacher.g47@edusense.ai', @demo_password_hash, 'EN', 'active'),
  (@default_school_id, @teacher_role_id, 'LAURA WIDYA P., S.Pd', 'teacher.g48@edusense.ai', @demo_password_hash, 'LW', 'active'),
  (@default_school_id, @teacher_role_id, 'FRISCA DANI AURORA.U,S.Pd', 'teacher.l49@edusense.ai', @demo_password_hash, 'FD', 'active'),
  (@default_school_id, @teacher_role_id, 'SINDY DWI JAYANTI,M.Pd.Gr', 'teacher.d50@edusense.ai', @demo_password_hash, 'SD', 'active'),
  (@default_school_id, @teacher_role_id, 'M. YUSUF FAIZAL AUFA,S.Sos', 'teacher.n51@edusense.ai', @demo_password_hash, 'MY', 'active'),
  (@default_school_id, @teacher_role_id, 'M. YUSUF FAIZAL AUFA,S.Sos', 'teacher.t51@edusense.ai', @demo_password_hash, 'MY', 'active'),
  (@default_school_id, @teacher_role_id, 'ARLYNDA WIDYA APSARI, S.Pd', 'teacher.i52@edusense.ai', @demo_password_hash, 'AW', 'active'),
  (@default_school_id, @teacher_role_id, 'MIFTAHUL JANNAH, S.SN', 'teacher.m53@edusense.ai', @demo_password_hash, 'MJ', 'active'),
  (@default_school_id, @teacher_role_id, 'MIFTAHUL JANNAH, S.SN', 'teacher.s53@edusense.ai', @demo_password_hash, 'MJ', 'active'),
  (@default_school_id, @teacher_role_id, 'DIAN INDRI PRATIWI, S.Kel', 'teacher.o54@edusense.ai', @demo_password_hash, 'DI', 'active'),
  (@default_school_id, @teacher_role_id, 'MOHAMMAD ASIKIN', 'teacher.e55@edusense.ai', @demo_password_hash, 'MA', 'active'),
  (@default_school_id, @teacher_role_id, 'OTY MEIGAN, S.Pd', 'teacher.c56@edusense.ai', @demo_password_hash, 'OM', 'active'),
  (@default_school_id, @teacher_role_id, 'NESA AYU DINA, M.Pd', 'teacher.g57@edusense.ai', @demo_password_hash, 'NA', 'active'),
  (@default_school_id, @teacher_role_id, 'BIMANTARA YUNANDI P., S.Pd', 'teacher.f58@edusense.ai', @demo_password_hash, 'BY', 'active'),
  (@default_school_id, @teacher_role_id, 'CYNTIA PUTRI, S.Pd', 'teacher.c59@edusense.ai', @demo_password_hash, 'CP', 'active'),
  (@default_school_id, @teacher_role_id, 'MUHAMMAD ZAINAL ARIFIN, S.Pd', 'teacher.h60@edusense.ai', @demo_password_hash, 'MZ', 'active'),
  (@default_school_id, @teacher_role_id, 'ACHMAD FIRMANDA DWIPUTRA, S.Pd', 'teacher.d61@edusense.ai', @demo_password_hash, 'AF', 'active'),
  (@default_school_id, @teacher_role_id, 'Karana Yankumara, S.pd', 'teacher.l62@edusense.ai', @demo_password_hash, 'KY', 'active'),
  (@default_school_id, @teacher_role_id, 'Karana Yankumara, S.pd', 'teacher.b62@edusense.ai', @demo_password_hash, 'KY', 'active'),
  (@default_school_id, @teacher_role_id, 'LATIFAH HANUN, S.Pd', 'teacher.d63@edusense.ai', @demo_password_hash, 'LH', 'active'),
  (@default_school_id, @student_role_id, 'ANANDHITA SYAKIRA HIDAYAT', 'student@edusense.ai', @demo_password_hash, 'AS', 'active'),
  (@default_school_id, @student_role_id, 'ANISA MULIA', 'student.13518@edusense.ai', @demo_password_hash, 'AM', 'active'),
  (@default_school_id, @student_role_id, 'AQBIEL JUAND DWIRIKA RIZKI RAMADHAN', 'student.13523@edusense.ai', @demo_password_hash, 'AJ', 'active'),
  (@default_school_id, @student_role_id, 'ARIES INDRA PRAKOSO', 'student.13528@edusense.ai', @demo_password_hash, 'AI', 'active'),
  (@default_school_id, @student_role_id, 'BERNESSA RAHADATUL''AISY VIRBARA', 'student.13561@edusense.ai', @demo_password_hash, 'BR', 'active'),
  (@default_school_id, @student_role_id, 'DHEA ANANDASYAFIRA', 'student.13596@edusense.ai', @demo_password_hash, 'DA', 'active'),
  (@default_school_id, @student_role_id, 'DHEA LUCITA SABRINA SAKHI', 'student.13597@edusense.ai', @demo_password_hash, 'DL', 'active'),
  (@default_school_id, @student_role_id, 'FANDY FITRIYANTO', 'student.13627@edusense.ai', @demo_password_hash, 'FF', 'active'),
  (@default_school_id, @student_role_id, 'FAIRUS CINTA ALIFIU FAHAMSA', 'student.13637@edusense.ai', @demo_password_hash, 'FC', 'active'),
  (@default_school_id, @student_role_id, 'FATIH MUTTAQIN AZKA', 'student.13640@edusense.ai', @demo_password_hash, 'FM', 'active'),
  (@default_school_id, @student_role_id, 'FEBRIAN IMANUEL HETI PRATAMA', 'student.13642@edusense.ai', @demo_password_hash, 'FI', 'active'),
  (@default_school_id, @student_role_id, 'GERALD ARVIN A', 'student.13652@edusense.ai', @demo_password_hash, 'GA', 'active'),
  (@default_school_id, @student_role_id, 'GREVALDIO PUTRA ALEXA EVANO', 'student.13658@edusense.ai', @demo_password_hash, 'GP', 'active'),
  (@default_school_id, @student_role_id, 'HAFIZH KHAIZURAN FAUZI', 'student.13659@edusense.ai', @demo_password_hash, 'HK', 'active'),
  (@default_school_id, @student_role_id, 'HANA AATIKAH JAUZA', 'student.13660@edusense.ai', @demo_password_hash, 'HA', 'active'),
  (@default_school_id, @student_role_id, 'INGGRID NIKITA PRASETYA', 'student.13667@edusense.ai', @demo_password_hash, 'IN', 'active'),
  (@default_school_id, @student_role_id, 'JETHRO ATA ALVAREAN', 'student.13680@edusense.ai', @demo_password_hash, 'JA', 'active'),
  (@default_school_id, @student_role_id, 'JOY ABIMANYU HAPY PUTRA', 'student.13683@edusense.ai', @demo_password_hash, 'JA', 'active'),
  (@default_school_id, @student_role_id, 'KAFKA XAVIER HAZZA PRAMONO', 'student.13684@edusense.ai', @demo_password_hash, 'KX', 'active'),
  (@default_school_id, @student_role_id, 'KANAYA KARIN RUBIAWAN', 'student.13685@edusense.ai', @demo_password_hash, 'KK', 'active'),
  (@default_school_id, @student_role_id, 'KARIN VANESSA KRISDIVA SIBURIAN', 'student.13686@edusense.ai', @demo_password_hash, 'KV', 'active'),
  (@default_school_id, @student_role_id, 'KENZIE HAFIZ SUSANTO', 'student.13693@edusense.ai', @demo_password_hash, 'KH', 'active'),
  (@default_school_id, @student_role_id, 'MONICA DEWI SANTOSO', 'student.13739@edusense.ai', @demo_password_hash, 'MD', 'active'),
  (@default_school_id, @student_role_id, 'MUCHAMMAD FADHIL TORIQ', 'student.13718@edusense.ai', @demo_password_hash, 'MF', 'active'),
  (@default_school_id, @student_role_id, 'MUHAMMAD AKHTAR RAZAAN', 'student.13742@edusense.ai', @demo_password_hash, 'MA', 'active'),
  (@default_school_id, @student_role_id, 'MUHAMMAD BRAHMANA ADI', 'student.13745@edusense.ai', @demo_password_hash, 'MB', 'active'),
  (@default_school_id, @student_role_id, 'MUHAMMAD FADHIL WAFI', 'student.13748@edusense.ai', @demo_password_hash, 'MF', 'active'),
  (@default_school_id, @student_role_id, 'MUHAMMAD IKHSAN AL AKBAR', 'student.13754@edusense.ai', @demo_password_hash, 'MI', 'active'),
  (@default_school_id, @student_role_id, 'MUHAMMAD RIKO SETYA WIRADINATA', 'student.13758@edusense.ai', @demo_password_hash, 'MR', 'active'),
  (@default_school_id, @student_role_id, 'MUTIARA SANIYYAH', 'student.13763@edusense.ai', @demo_password_hash, 'MS', 'active'),
  (@default_school_id, @student_role_id, 'NADHIEF FATHAN ARRAFIF', 'student.13768@edusense.ai', @demo_password_hash, 'NF', 'active'),
  (@default_school_id, @student_role_id, 'NAFISAH DZATIR RAJWA', 'student.13778@edusense.ai', @demo_password_hash, 'ND', 'active'),
  (@default_school_id, @student_role_id, 'RAFASYAH MADANA ARKADIPA', 'student.13824@edusense.ai', @demo_password_hash, 'RM', 'active'),
  (@default_school_id, @student_role_id, 'REZA EMMERALDI ARIANTO', 'student.13841@edusense.ai', @demo_password_hash, 'RE', 'active'),
  (@default_school_id, @student_role_id, 'VELISA KHALILAH NISRINA', 'student.13885@edusense.ai', @demo_password_hash, 'VK', 'active'),
  (@default_school_id, @student_role_id, 'ZAKI RAHMAT FAHREZI', 'student.13895@edusense.ai', @demo_password_hash, 'ZR', 'active');

SET @admin_user_id = (SELECT id FROM users WHERE name = 'Admin Sekolah' AND school_id = @default_school_id);

INSERT INTO teachers (school_id, user_id, employee_number, position, specialization)
SELECT @default_school_id, u.id, 'K1', 'teacher', 'FISIKA' FROM users u WHERE u.email = 'teacher.k1@edusense.ai'
UNION ALL SELECT @default_school_id, u.id, 'G2', 'teacher', 'MATEMATIKA' FROM users u WHERE u.email = 'teacher.g2@edusense.ai'
UNION ALL SELECT @default_school_id, u.id, 'E3', 'teacher', 'BAHASA INGGRIS' FROM users u WHERE u.email = 'teacher.e3@edusense.ai'
UNION ALL SELECT @default_school_id, u.id, 'F4', 'teacher', 'PENDIDIKAN JASMANI OLAHRAGA KEBUGARAN' FROM users u WHERE u.email = 'teacher.f4@edusense.ai'
UNION ALL SELECT @default_school_id, u.id, 'E5', 'teacher', 'BAHASA INGGRIS' FROM users u WHERE u.email = 'teacher.e5@edusense.ai'
UNION ALL SELECT @default_school_id, u.id, 'G6', 'teacher', 'MATEMATIKA' FROM users u WHERE u.email = 'teacher.g6@edusense.ai'
UNION ALL SELECT @default_school_id, u.id, 'B7', 'teacher', 'PENDIDIKAN KEWARGANEGARAAN' FROM users u WHERE u.email = 'teacher.b7@edusense.ai'
UNION ALL SELECT @default_school_id, u.id, 'U8', 'teacher', 'BIMBINGAN KONSELING' FROM users u WHERE u.email = 'teacher.u8@edusense.ai'
UNION ALL SELECT @default_school_id, u.id, 'G9', 'teacher', 'MATEMATIKA' FROM users u WHERE u.email = 'teacher.g9@edusense.ai'
UNION ALL SELECT @default_school_id, u.id, 'U10', 'teacher', 'BIMBINGAN KONSELING' FROM users u WHERE u.email = 'teacher.u10@edusense.ai'
UNION ALL SELECT @default_school_id, u.id, 'K11', 'teacher', 'EKONOMI' FROM users u WHERE u.email = 'teacher.k11@edusense.ai'
UNION ALL SELECT @default_school_id, u.id, 'U12', 'teacher', 'BIMBINGAN KONSELING' FROM users u WHERE u.email = 'teacher.u12@edusense.ai'
UNION ALL SELECT @default_school_id, u.id, 'C13', 'teacher', 'BAHASA INDONESIA' FROM users u WHERE u.email = 'teacher.c13@edusense.ai'
UNION ALL SELECT @default_school_id, u.id, 'M14', 'teacher', 'SENI' FROM users u WHERE u.email = 'teacher.m14@edusense.ai'
UNION ALL SELECT @default_school_id, u.id, 'U15', 'teacher', 'BIMBINGAN KONSELING' FROM users u WHERE u.email = 'teacher.u15@edusense.ai'
UNION ALL SELECT @default_school_id, u.id, 'J16', 'teacher', 'KIMIA' FROM users u WHERE u.email = 'teacher.j16@edusense.ai'
UNION ALL SELECT @default_school_id, u.id, 'A17', 'teacher', 'PENDIDIKAN AGAMA ISLAM' FROM users u WHERE u.email = 'teacher.a17@edusense.ai'
UNION ALL SELECT @default_school_id, u.id, 'I18', 'teacher', 'BIOLOGI' FROM users u WHERE u.email = 'teacher.i18@edusense.ai'
UNION ALL SELECT @default_school_id, u.id, 'A19', 'teacher', 'PENDIDIKAN AGAMA ISLAM' FROM users u WHERE u.email = 'teacher.a19@edusense.ai'
UNION ALL SELECT @default_school_id, u.id, 'I20', 'teacher', 'BIOLOGI' FROM users u WHERE u.email = 'teacher.i20@edusense.ai'
UNION ALL SELECT @default_school_id, u.id, 'F21', 'teacher', 'PENDIDIKAN JASMANI OLAHRAGA KEBUGARAN' FROM users u WHERE u.email = 'teacher.f21@edusense.ai'
UNION ALL SELECT @default_school_id, u.id, 'D22', 'teacher', 'SEJARAH' FROM users u WHERE u.email = 'teacher.d22@edusense.ai'
UNION ALL SELECT @default_school_id, u.id, 'P22', 'teacher', 'ANTROPOLOGI' FROM users u WHERE u.email = 'teacher.p22@edusense.ai'
UNION ALL SELECT @default_school_id, u.id, 'L23', 'teacher', 'GEOGRAFI' FROM users u WHERE u.email = 'teacher.l23@edusense.ai'
UNION ALL SELECT @default_school_id, u.id, 'B24', 'teacher', 'PENDIDIKAN KEWARGANEGARAAN' FROM users u WHERE u.email = 'teacher.b24@edusense.ai'
UNION ALL SELECT @default_school_id, u.id, 'C25', 'teacher', 'BAHASA INDONESIA' FROM users u WHERE u.email = 'teacher.c25@edusense.ai'
UNION ALL SELECT @default_school_id, u.id, 'A26', 'teacher', 'PENDIDIKAN AGAMA KRISTEN' FROM users u WHERE u.email = 'teacher.a26@edusense.ai'
UNION ALL SELECT @default_school_id, u.id, 'K27', 'teacher', 'EKONOMI' FROM users u WHERE u.email = 'teacher.k27@edusense.ai'
UNION ALL SELECT @default_school_id, u.id, 'K28', 'teacher', 'EKONOMI' FROM users u WHERE u.email = 'teacher.k28@edusense.ai'
UNION ALL SELECT @default_school_id, u.id, 'E29', 'teacher', 'BAHASA INGGRIS' FROM users u WHERE u.email = 'teacher.e29@edusense.ai'
UNION ALL SELECT @default_school_id, u.id, 'N30', 'teacher', 'SOSIOLOGI' FROM users u WHERE u.email = 'teacher.n30@edusense.ai'
UNION ALL SELECT @default_school_id, u.id, 'T31', 'teacher', 'INFORMATIKA' FROM users u WHERE u.email = 'teacher.t31@edusense.ai'
UNION ALL SELECT @default_school_id, u.id, 'Q31', 'teacher', 'MANDARIN' FROM users u WHERE u.email = 'teacher.q31@edusense.ai'
UNION ALL SELECT @default_school_id, u.id, 'G32', 'teacher', 'MATEMATIKA' FROM users u WHERE u.email = 'teacher.g32@edusense.ai'
UNION ALL SELECT @default_school_id, u.id, 'I33', 'teacher', 'BIOLOGI' FROM users u WHERE u.email = 'teacher.i33@edusense.ai'
UNION ALL SELECT @default_school_id, u.id, 'O33', 'teacher', 'BAHARI' FROM users u WHERE u.email = 'teacher.o33@edusense.ai'
UNION ALL SELECT @default_school_id, u.id, 'A34', 'teacher', 'PENDIDIKAN AGAMA HINDU' FROM users u WHERE u.email = 'teacher.a34@edusense.ai'
UNION ALL SELECT @default_school_id, u.id, 'A35', 'teacher', 'PENDIDIKAN AGAMA ISLAM' FROM users u WHERE u.email = 'teacher.a35@edusense.ai'
UNION ALL SELECT @default_school_id, u.id, 'B35', 'teacher', 'PENDIDIKAN KEWARGANEGARAAN' FROM users u WHERE u.email = 'teacher.b35@edusense.ai'
UNION ALL SELECT @default_school_id, u.id, 'A36', 'teacher', 'PENDIDIKAN AGAMA KATHOLIK' FROM users u WHERE u.email = 'teacher.a36@edusense.ai'
UNION ALL SELECT @default_school_id, u.id, 'R37', 'teacher', 'BAHASA JAWA' FROM users u WHERE u.email = 'teacher.r37@edusense.ai'
UNION ALL SELECT @default_school_id, u.id, 'F38', 'teacher', 'PENDIDIKAN JASMANI OLAHRAGA KEBUGARAN' FROM users u WHERE u.email = 'teacher.f38@edusense.ai'
UNION ALL SELECT @default_school_id, u.id, 'A39', 'teacher', 'PENDIDIKAN AGAMA ISLAM' FROM users u WHERE u.email = 'teacher.a39@edusense.ai'
UNION ALL SELECT @default_school_id, u.id, 'M40', 'teacher', 'SENI' FROM users u WHERE u.email = 'teacher.m40@edusense.ai'
UNION ALL SELECT @default_school_id, u.id, 'H41', 'teacher', 'FISIKA' FROM users u WHERE u.email = 'teacher.h41@edusense.ai'
UNION ALL SELECT @default_school_id, u.id, 'T42', 'teacher', 'INFORMATIKA' FROM users u WHERE u.email = 'teacher@edusense.ai'
UNION ALL SELECT @default_school_id, u.id, 'E43', 'teacher', 'BAHASA INGGRIS' FROM users u WHERE u.email = 'teacher.e43@edusense.ai'
UNION ALL SELECT @default_school_id, u.id, 'J44', 'teacher', 'KIMIA' FROM users u WHERE u.email = 'teacher.j44@edusense.ai'
UNION ALL SELECT @default_school_id, u.id, 'J45', 'teacher', 'KIMIA' FROM users u WHERE u.email = 'teacher.j45@edusense.ai'
UNION ALL SELECT @default_school_id, u.id, 'S45', 'teacher', 'PENDIDIKAN KEWIRAUSAHAAN' FROM users u WHERE u.email = 'teacher.s45@edusense.ai'
UNION ALL SELECT @default_school_id, u.id, 'H46', 'teacher', 'FISIKA' FROM users u WHERE u.email = 'teacher.h46@edusense.ai'
UNION ALL SELECT @default_school_id, u.id, 'G47', 'teacher', 'MATEMATIKA' FROM users u WHERE u.email = 'teacher.g47@edusense.ai'
UNION ALL SELECT @default_school_id, u.id, 'G48', 'teacher', 'MATEMATIKA' FROM users u WHERE u.email = 'teacher.g48@edusense.ai'
UNION ALL SELECT @default_school_id, u.id, 'L49', 'teacher', 'GEOGRAFI' FROM users u WHERE u.email = 'teacher.l49@edusense.ai'
UNION ALL SELECT @default_school_id, u.id, 'D50', 'teacher', 'SEJARAH' FROM users u WHERE u.email = 'teacher.d50@edusense.ai'
UNION ALL SELECT @default_school_id, u.id, 'N51', 'teacher', 'SOSIOLOGI' FROM users u WHERE u.email = 'teacher.n51@edusense.ai'
UNION ALL SELECT @default_school_id, u.id, 'T51', 'teacher', 'INFORMATIKA' FROM users u WHERE u.email = 'teacher.t51@edusense.ai'
UNION ALL SELECT @default_school_id, u.id, 'I52', 'teacher', 'BIOLOGI' FROM users u WHERE u.email = 'teacher.i52@edusense.ai'
UNION ALL SELECT @default_school_id, u.id, 'M53', 'teacher', 'SENI' FROM users u WHERE u.email = 'teacher.m53@edusense.ai'
UNION ALL SELECT @default_school_id, u.id, 'S53', 'teacher', 'PENDIDIKAN KEWIRAUSAHAAN' FROM users u WHERE u.email = 'teacher.s53@edusense.ai'
UNION ALL SELECT @default_school_id, u.id, 'O54', 'teacher', 'BAHARI' FROM users u WHERE u.email = 'teacher.o54@edusense.ai'
UNION ALL SELECT @default_school_id, u.id, 'E55', 'teacher', 'BAHASA INGGRIS' FROM users u WHERE u.email = 'teacher.e55@edusense.ai'
UNION ALL SELECT @default_school_id, u.id, 'C56', 'teacher', 'BAHASA INDONESIA' FROM users u WHERE u.email = 'teacher.c56@edusense.ai'
UNION ALL SELECT @default_school_id, u.id, 'G57', 'teacher', 'MATEMATIKA' FROM users u WHERE u.email = 'teacher.g57@edusense.ai'
UNION ALL SELECT @default_school_id, u.id, 'F58', 'teacher', 'PENDIDIKAN JASMANI OLAHRAGA KEBUGARAN' FROM users u WHERE u.email = 'teacher.f58@edusense.ai'
UNION ALL SELECT @default_school_id, u.id, 'C59', 'teacher', 'BAHASA INDONESIA' FROM users u WHERE u.email = 'teacher.c59@edusense.ai'
UNION ALL SELECT @default_school_id, u.id, 'H60', 'teacher', 'FISIKA' FROM users u WHERE u.email = 'teacher.h60@edusense.ai'
UNION ALL SELECT @default_school_id, u.id, 'D61', 'teacher', 'SEJARAH' FROM users u WHERE u.email = 'teacher.d61@edusense.ai'
UNION ALL SELECT @default_school_id, u.id, 'L62', 'teacher', 'GEOGRAFI' FROM users u WHERE u.email = 'teacher.l62@edusense.ai'
UNION ALL SELECT @default_school_id, u.id, 'B62', 'teacher', 'PENDIDIKAN KEWARGANEGARAAN' FROM users u WHERE u.email = 'teacher.b62@edusense.ai'
UNION ALL SELECT @default_school_id, u.id, 'D63', 'teacher', 'SEJARAH' FROM users u WHERE u.email = 'teacher.d63@edusense.ai';

INSERT INTO classes (school_id, homeroom_teacher_id, name, grade_level, academic_year)
SELECT @default_school_id, t.id, 'xi-c1', 'XI', '2025/2026'
FROM teachers t
WHERE t.school_id = @default_school_id AND t.employee_number = 'T42';

SET @xi_c1_id = (SELECT id FROM classes WHERE school_id = @default_school_id AND name = 'xi-c1');

INSERT INTO students
  (school_id, user_id, class_id, student_number, current_level, risk_status, total_score, streak_days)
SELECT @default_school_id, u.id, @xi_c1_id, '13508', 'intermediate', 'safe', 428, 12 FROM users u WHERE u.email = 'student@edusense.ai'
UNION ALL SELECT @default_school_id, u.id, @xi_c1_id, '13518', 'basic', 'warning', 196, 3 FROM users u WHERE u.email = 'student.13518@edusense.ai'
UNION ALL SELECT @default_school_id, u.id, @xi_c1_id, '13523', 'advanced', 'safe', 612, 18 FROM users u WHERE u.email = 'student.13523@edusense.ai'
UNION ALL SELECT @default_school_id, u.id, @xi_c1_id, '13528', 'basic', 'danger', 82, 0 FROM users u WHERE u.email = 'student.13528@edusense.ai'
UNION ALL SELECT @default_school_id, u.id, @xi_c1_id, '13561', 'intermediate', 'warning', 244, 5 FROM users u WHERE u.email = 'student.13561@edusense.ai'
UNION ALL SELECT @default_school_id, u.id, @xi_c1_id, '13596', 'advanced', 'safe', 538, 9 FROM users u WHERE u.email = 'student.13596@edusense.ai'
UNION ALL SELECT @default_school_id, u.id, @xi_c1_id, '13597', 'intermediate', 'safe', 356, 7 FROM users u WHERE u.email = 'student.13597@edusense.ai'
UNION ALL SELECT @default_school_id, u.id, @xi_c1_id, '13627', 'basic', 'warning', 164, 2 FROM users u WHERE u.email = 'student.13627@edusense.ai'
UNION ALL SELECT @default_school_id, u.id, @xi_c1_id, '13637', 'advanced', 'safe', 451, 14 FROM users u WHERE u.email = 'student.13637@edusense.ai'
UNION ALL SELECT @default_school_id, u.id, @xi_c1_id, '13640', 'basic', 'warning', 219, 4 FROM users u WHERE u.email = 'student.13640@edusense.ai'
UNION ALL SELECT @default_school_id, u.id, @xi_c1_id, '13642', 'intermediate', 'safe', 635, 12 FROM users u WHERE u.email = 'student.13642@edusense.ai'
UNION ALL SELECT @default_school_id, u.id, @xi_c1_id, '13652', 'advanced', 'danger', 105, 3 FROM users u WHERE u.email = 'student.13652@edusense.ai'
UNION ALL SELECT @default_school_id, u.id, @xi_c1_id, '13658', 'intermediate', 'warning', 267, 18 FROM users u WHERE u.email = 'student.13658@edusense.ai'
UNION ALL SELECT @default_school_id, u.id, @xi_c1_id, '13659', 'basic', 'safe', 561, 0 FROM users u WHERE u.email = 'student.13659@edusense.ai'
UNION ALL SELECT @default_school_id, u.id, @xi_c1_id, '13660', 'advanced', 'safe', 379, 5 FROM users u WHERE u.email = 'student.13660@edusense.ai'
UNION ALL SELECT @default_school_id, u.id, @xi_c1_id, '13667', 'basic', 'warning', 187, 9 FROM users u WHERE u.email = 'student.13667@edusense.ai'
UNION ALL SELECT @default_school_id, u.id, @xi_c1_id, '13680', 'intermediate', 'safe', 474, 7 FROM users u WHERE u.email = 'student.13680@edusense.ai'
UNION ALL SELECT @default_school_id, u.id, @xi_c1_id, '13683', 'advanced', 'warning', 242, 2 FROM users u WHERE u.email = 'student.13683@edusense.ai'
UNION ALL SELECT @default_school_id, u.id, @xi_c1_id, '13684', 'intermediate', 'safe', 658, 14 FROM users u WHERE u.email = 'student.13684@edusense.ai'
UNION ALL SELECT @default_school_id, u.id, @xi_c1_id, '13685', 'basic', 'danger', 128, 4 FROM users u WHERE u.email = 'student.13685@edusense.ai'
UNION ALL SELECT @default_school_id, u.id, @xi_c1_id, '13686', 'advanced', 'warning', 290, 12 FROM users u WHERE u.email = 'student.13686@edusense.ai'
UNION ALL SELECT @default_school_id, u.id, @xi_c1_id, '13693', 'basic', 'safe', 584, 3 FROM users u WHERE u.email = 'student.13693@edusense.ai'
UNION ALL SELECT @default_school_id, u.id, @xi_c1_id, '13739', 'intermediate', 'safe', 402, 18 FROM users u WHERE u.email = 'student.13739@edusense.ai'
UNION ALL SELECT @default_school_id, u.id, @xi_c1_id, '13718', 'advanced', 'warning', 210, 0 FROM users u WHERE u.email = 'student.13718@edusense.ai'
UNION ALL SELECT @default_school_id, u.id, @xi_c1_id, '13742', 'intermediate', 'safe', 497, 5 FROM users u WHERE u.email = 'student.13742@edusense.ai'
UNION ALL SELECT @default_school_id, u.id, @xi_c1_id, '13745', 'basic', 'warning', 265, 9 FROM users u WHERE u.email = 'student.13745@edusense.ai'
UNION ALL SELECT @default_school_id, u.id, @xi_c1_id, '13748', 'advanced', 'safe', 681, 7 FROM users u WHERE u.email = 'student.13748@edusense.ai'
UNION ALL SELECT @default_school_id, u.id, @xi_c1_id, '13754', 'basic', 'danger', 151, 2 FROM users u WHERE u.email = 'student.13754@edusense.ai'
UNION ALL SELECT @default_school_id, u.id, @xi_c1_id, '13758', 'intermediate', 'warning', 313, 14 FROM users u WHERE u.email = 'student.13758@edusense.ai'
UNION ALL SELECT @default_school_id, u.id, @xi_c1_id, '13763', 'advanced', 'safe', 607, 4 FROM users u WHERE u.email = 'student.13763@edusense.ai'
UNION ALL SELECT @default_school_id, u.id, @xi_c1_id, '13768', 'intermediate', 'safe', 425, 12 FROM users u WHERE u.email = 'student.13768@edusense.ai'
UNION ALL SELECT @default_school_id, u.id, @xi_c1_id, '13778', 'basic', 'warning', 233, 3 FROM users u WHERE u.email = 'student.13778@edusense.ai'
UNION ALL SELECT @default_school_id, u.id, @xi_c1_id, '13824', 'advanced', 'safe', 520, 18 FROM users u WHERE u.email = 'student.13824@edusense.ai'
UNION ALL SELECT @default_school_id, u.id, @xi_c1_id, '13841', 'basic', 'warning', 288, 0 FROM users u WHERE u.email = 'student.13841@edusense.ai'
UNION ALL SELECT @default_school_id, u.id, @xi_c1_id, '13885', 'intermediate', 'safe', 704, 5 FROM users u WHERE u.email = 'student.13885@edusense.ai'
UNION ALL SELECT @default_school_id, u.id, @xi_c1_id, '13895', 'advanced', 'danger', 174, 9 FROM users u WHERE u.email = 'student.13895@edusense.ai';

INSERT INTO subjects (school_id, name, code, description)
VALUES
  (@default_school_id, 'FISIKA', 'FIS', 'FISIKA untuk kelas xi-c1.'),
  (@default_school_id, 'MATEMATIKA', 'MAT', 'MATEMATIKA untuk kelas xi-c1.'),
  (@default_school_id, 'BAHASA INGGRIS', 'BIG', 'BAHASA INGGRIS untuk kelas xi-c1.'),
  (@default_school_id, 'PENDIDIKAN JASMANI OLAHRAGA KEBUGARAN', 'PJOK', 'PENDIDIKAN JASMANI OLAHRAGA KEBUGARAN untuk kelas xi-c1.'),
  (@default_school_id, 'PENDIDIKAN KEWARGANEGARAAN', 'PKN', 'PENDIDIKAN KEWARGANEGARAAN untuk kelas xi-c1.'),
  (@default_school_id, 'BIMBINGAN KONSELING', 'BK', 'BIMBINGAN KONSELING untuk kelas xi-c1.'),
  (@default_school_id, 'EKONOMI', 'EKO', 'EKONOMI untuk kelas xi-c1.'),
  (@default_school_id, 'BAHASA INDONESIA', 'BIN', 'BAHASA INDONESIA untuk kelas xi-c1.'),
  (@default_school_id, 'SENI', 'SENI', 'SENI untuk kelas xi-c1.'),
  (@default_school_id, 'KIMIA', 'KIM', 'KIMIA untuk kelas xi-c1.'),
  (@default_school_id, 'PENDIDIKAN AGAMA ISLAM', 'PAI', 'PENDIDIKAN AGAMA ISLAM untuk kelas xi-c1.'),
  (@default_school_id, 'BIOLOGI', 'BIO', 'BIOLOGI untuk kelas xi-c1.'),
  (@default_school_id, 'SEJARAH', 'SEJ', 'SEJARAH untuk kelas xi-c1.'),
  (@default_school_id, 'ANTROPOLOGI', 'ANTRO', 'ANTROPOLOGI untuk kelas xi-c1.'),
  (@default_school_id, 'GEOGRAFI', 'GEO', 'GEOGRAFI untuk kelas xi-c1.'),
  (@default_school_id, 'PENDIDIKAN AGAMA KRISTEN', 'PAKr', 'PENDIDIKAN AGAMA KRISTEN untuk kelas xi-c1.'),
  (@default_school_id, 'SOSIOLOGI', 'SOS', 'SOSIOLOGI untuk kelas xi-c1.'),
  (@default_school_id, 'INFORMATIKA', 'TIK', 'INFORMATIKA untuk kelas xi-c1.'),
  (@default_school_id, 'MANDARIN', 'MAND', 'MANDARIN untuk kelas xi-c1.'),
  (@default_school_id, 'BAHARI', 'BHR', 'BAHARI untuk kelas xi-c1.'),
  (@default_school_id, 'PENDIDIKAN AGAMA HINDU', 'PAH', 'PENDIDIKAN AGAMA HINDU untuk kelas xi-c1.'),
  (@default_school_id, 'PENDIDIKAN AGAMA KATHOLIK', 'PAK', 'PENDIDIKAN AGAMA KATHOLIK untuk kelas xi-c1.'),
  (@default_school_id, 'BAHASA JAWA', 'BJW', 'BAHASA JAWA untuk kelas xi-c1.'),
  (@default_school_id, 'PENDIDIKAN KEWIRAUSAHAAN', 'PKWU', 'PENDIDIKAN KEWIRAUSAHAAN untuk kelas xi-c1.');

SET @math_subject_id = (SELECT id FROM subjects WHERE school_id = @default_school_id AND code = 'MAT');
SET @physics_subject_id = (SELECT id FROM subjects WHERE school_id = @default_school_id AND code = 'FIS');
SET @english_subject_id = (SELECT id FROM subjects WHERE school_id = @default_school_id AND code = 'BIG');

INSERT INTO teacher_classes (school_id, teacher_id, class_id, subject_id, assignment_type)
SELECT @default_school_id, t.id, @xi_c1_id, s.id, 'subject_teacher'
FROM (
  SELECT 'H46' AS teacher_code, 'FIS' AS subject_code
  UNION ALL SELECT 'B7', 'PKN'
  UNION ALL SELECT 'G6', 'MAT'
  UNION ALL SELECT 'E5', 'BIG'
  UNION ALL SELECT 'F58', 'PJOK'
  UNION ALL SELECT 'U12', 'BK'
  UNION ALL SELECT 'T42', 'TIK'
  UNION ALL SELECT 'G47', 'MAT'
  UNION ALL SELECT 'C56', 'BIN'
  UNION ALL SELECT 'D63', 'SEJ'
  UNION ALL SELECT 'O33', 'BHR'
  UNION ALL SELECT 'S53', 'PKWU'
  UNION ALL SELECT 'J16', 'KIM'
  UNION ALL SELECT 'A17', 'PAI'
  UNION ALL SELECT 'R37', 'BJW'
  UNION ALL SELECT 'M14', 'SENI'
) assignments
INNER JOIN teachers t
  ON t.school_id = @default_school_id
 AND t.employee_number = assignments.teacher_code
INNER JOIN subjects s
  ON s.school_id = @default_school_id
 AND s.code = assignments.subject_code;

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

INSERT INTO badges (school_id, name, description, icon, requirement)
VALUES
  (@default_school_id, 'Pemula AI', 'Menyelesaikan aktivitas belajar pertama di EduSense AI.', 'sparkles', 'Login dan mulai satu materi.'),
  (@default_school_id, 'Runtun 7 Hari', 'Aktif belajar minimal tujuh hari berturut-turut.', 'flame', 'Streak belajar minimal 7 hari.'),
  (@default_school_id, 'Jago Kuis', 'Meraih akurasi minimal 80% pada kuis adaptif.', 'target', 'Accuracy rate minimal 80%.'),
  (@default_school_id, 'Mastery Badge', 'Mencapai level advanced dengan akurasi tinggi.', 'award', 'Level advanced dan akurasi tinggi.'),
  (@default_school_id, 'Diagnostic Finisher', 'Menyelesaikan tes diagnostik AI.', 'check-circle', 'Submit tes diagnostik.');
