const { pool } = require('../../config/db');

const buildQuizFilters = (filters, schoolId) => {
  const clauses = ['s.school_id = ?'];
  const params = [schoolId];

  if (filters.subjectId) {
    clauses.push('q.subject_id = ?');
    params.push(filters.subjectId);
  }

  if (filters.level) {
    clauses.push('q.level = ?');
    params.push(filters.level);
  }

  if (filters.quizType) {
    clauses.push('q.quiz_type = ?');
    params.push(filters.quizType);
  }

  return {
    whereClause: clauses.length ? `WHERE ${clauses.join(' AND ')}` : '',
    params,
  };
};

const findQuizzes = async (filters = {}, schoolId, executor = pool) => {
  const { whereClause, params } = buildQuizFilters(filters, schoolId);
  const [rows] = await executor.execute(
    `
      SELECT
        q.id,
        q.subject_id,
        s.school_id,
        q.material_id,
        q.title,
        q.quiz_type,
        q.level,
        q.duration_minutes,
        q.created_at,
        s.name AS subject_name,
        m.title AS material_title,
        COUNT(quest.id) AS question_count
      FROM quizzes q
      INNER JOIN subjects s ON s.id = q.subject_id
      LEFT JOIN materials m ON m.id = q.material_id
      LEFT JOIN questions quest ON quest.quiz_id = q.id
      ${whereClause}
      GROUP BY
        q.id,
        q.subject_id,
        s.school_id,
        q.material_id,
        q.title,
        q.quiz_type,
        q.level,
        q.duration_minutes,
        q.created_at,
        s.name,
        m.title
      ORDER BY q.created_at DESC
    `,
    params,
  );

  return rows;
};

const findQuizById = async (quizId, schoolId, executor = pool) => {
  const [rows] = await executor.execute(
    `
      SELECT
        q.id,
        q.subject_id,
        s.school_id,
        q.material_id,
        q.title,
        q.quiz_type,
        q.level,
        q.duration_minutes,
        q.created_at,
        s.name AS subject_name,
        s.code AS subject_code,
        m.title AS material_title,
        COUNT(quest.id) AS question_count
      FROM quizzes q
      INNER JOIN subjects s ON s.id = q.subject_id
      LEFT JOIN materials m ON m.id = q.material_id
      LEFT JOIN questions quest ON quest.quiz_id = q.id
      WHERE q.id = ? AND s.school_id = ?
      GROUP BY
        q.id,
        q.subject_id,
        s.school_id,
        q.material_id,
        q.title,
        q.quiz_type,
        q.level,
        q.duration_minutes,
        q.created_at,
        s.name,
        s.code,
        m.title
      LIMIT 1
    `,
    [quizId, schoolId],
  );

  return rows[0] || null;
};

const findQuizQuestions = async (quizId, executor = pool) => {
  const [rows] = await executor.execute(
    `
      SELECT
        id,
        question_text,
        question_type,
        option_a,
        option_b,
        option_c,
        option_d,
        point,
        difficulty
      FROM questions
      WHERE quiz_id = ?
      ORDER BY id ASC
    `,
    [quizId],
  );

  return rows;
};

const createQuiz = async (payload, executor = pool) => {
  const [result] = await executor.execute(
    `
      INSERT INTO quizzes (subject_id, material_id, title, quiz_type, level, duration_minutes)
      SELECT s.id, m.id, ?, ?, ?, ?
      FROM subjects s
      LEFT JOIN materials m ON m.id = ? AND m.subject_id = s.id
      WHERE s.id = ? AND s.school_id = ?
    `,
    [
      payload.title,
      payload.quizType,
      payload.level,
      payload.durationMinutes,
      payload.materialId || null,
      payload.subjectId,
      payload.schoolId,
    ],
  );

  return result.affectedRows ? { id: result.insertId } : null;
};

const createQuestion = async (payload, executor = pool) => {
  const [result] = await executor.execute(
    `
      INSERT INTO questions
        (quiz_id, question_text, question_type, option_a, option_b, option_c, option_d, correct_answer, keywords, point, difficulty)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      payload.quizId,
      payload.questionText,
      payload.questionType,
      payload.optionA || null,
      payload.optionB || null,
      payload.optionC || null,
      payload.optionD || null,
      payload.correctAnswer || null,
      payload.keywords || null,
      payload.point,
      payload.difficulty,
    ],
  );

  return {
    id: result.insertId,
  };
};

const findQuizQuestionsForScoring = async (quizId, executor = pool) => {
  const [rows] = await executor.execute(
    `
      SELECT
        id,
        quiz_id,
        question_text,
        question_type,
        correct_answer,
        keywords,
        point,
        difficulty
      FROM questions
      WHERE quiz_id = ?
      ORDER BY id ASC
    `,
    [quizId],
  );

  return rows;
};

const findStudentByUserId = async (userId, schoolId, executor = pool) => {
  const [rows] = await executor.execute(
    `
      SELECT id, school_id, current_level, total_score
      FROM students
      WHERE user_id = ? AND school_id = ?
      LIMIT 1
    `,
    [userId, schoolId],
  );

  return rows[0] || null;
};

const findLatestAttemptScore = async (studentId, executor = pool) => {
  const [rows] = await executor.execute(
    `
      SELECT score
      FROM quiz_attempts
      WHERE student_id = ?
      ORDER BY submitted_at DESC, id DESC
      LIMIT 1
    `,
    [studentId],
  );

  return rows[0] || null;
};

const countStudentQuizAttempts = async (studentId, quizId, executor = pool) => {
  const [rows] = await executor.execute(
    'SELECT COUNT(*) AS total FROM quiz_attempts WHERE student_id = ? AND quiz_id = ?',
    [studentId, quizId],
  );

  return Number(rows[0]?.total || 0);
};

const createQuizAttempt = async (payload, executor = pool) => {
  const [result] = await executor.execute(
    `
      INSERT INTO quiz_attempts
        (student_id, quiz_id, score, accuracy_rate, time_spent_seconds, attempt_number, ai_level_result, performance_trend, submitted_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `,
    [
      payload.studentId,
      payload.quizId,
      payload.score,
      payload.accuracyRate,
      payload.timeSpentSeconds,
      payload.attemptNumber,
      payload.aiLevelResult,
      payload.performanceTrend,
    ],
  );

  return {
    id: result.insertId,
  };
};

const createAnswer = async (payload, executor = pool) => {
  await executor.execute(
    `
      INSERT INTO answers
        (attempt_id, question_id, student_answer, is_correct, score, confidence_score, ai_feedback)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
    [
      payload.attemptId,
      payload.questionId,
      payload.studentAnswer,
      payload.isCorrect,
      payload.score,
      payload.confidenceScore,
      payload.aiFeedback,
    ],
  );
};

const updateStudentAfterAttempt = async (payload, executor = pool) => {
  await executor.execute(
    `
      UPDATE students
      SET
        current_level = ?,
        risk_status = ?,
        total_score = total_score + ?,
        streak_days = CASE WHEN ? >= 60 THEN streak_days + 1 ELSE 0 END
      WHERE id = ?
    `,
    [payload.level, payload.riskStatus, payload.earnedPoints, payload.accuracyRate, payload.studentId],
  );
};

const findNextRecommendedMaterial = async (payload, executor = pool) => {
  const [rows] = await executor.execute(
    `
      SELECT m.id, m.title
      FROM materials m
      WHERE m.subject_id = ? AND m.level = ?
      ORDER BY m.created_at DESC
      LIMIT 1
    `,
    [payload.subjectId, payload.level],
  );

  return rows[0] || null;
};

const createRecommendation = async (payload, executor = pool) => {
  await executor.execute(
    `
      INSERT INTO ai_recommendations
        (student_id, material_id, recommendation_type, reason, priority, status)
      VALUES (?, ?, ?, ?, ?, 'pending')
    `,
    [
      payload.studentId,
      payload.materialId || null,
      payload.recommendationType,
      payload.reason,
      payload.priority,
    ],
  );
};

const findBadgeByName = async (name, schoolId, executor = pool) => {
  const [rows] = await executor.execute('SELECT id, name FROM badges WHERE name = ? AND school_id = ? LIMIT 1', [
    name,
    schoolId,
  ]);
  return rows[0] || null;
};

const createBadge = async (payload, executor = pool) => {
  const [result] = await executor.execute(
    'INSERT INTO badges (school_id, name, description, icon, requirement) VALUES (?, ?, ?, ?, ?)',
    [payload.schoolId, payload.name, payload.description, payload.icon || null, payload.requirement],
  );

  return {
    id: result.insertId,
    name: payload.name,
  };
};

const studentHasBadge = async (studentId, schoolId, badgeId, executor = pool) => {
  const [rows] = await executor.execute(
    'SELECT id FROM student_badges WHERE student_id = ? AND school_id = ? AND badge_id = ? LIMIT 1',
    [studentId, schoolId, badgeId],
  );

  return Boolean(rows[0]);
};

const awardBadge = async (studentId, schoolId, badgeId, executor = pool) => {
  await executor.execute('INSERT INTO student_badges (school_id, student_id, badge_id) VALUES (?, ?, ?)', [
    schoolId,
    studentId,
    badgeId,
  ]);
};

module.exports = {
  createQuestion,
  createQuiz,
  findQuizById,
  findQuizQuestions,
  findQuizQuestionsForScoring,
  findQuizzes,
  findStudentByUserId,
  findLatestAttemptScore,
  countStudentQuizAttempts,
  createQuizAttempt,
  createAnswer,
  updateStudentAfterAttempt,
  findNextRecommendedMaterial,
  createRecommendation,
  findBadgeByName,
  createBadge,
  studentHasBadge,
  awardBadge,
};
