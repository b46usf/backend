const { pool } = require('../../config/db');

const buildRecommendationFilters = (filters, schoolId) => {
  const clauses = ['s.school_id = ?'];
  const params = [schoolId];

  if (filters.studentId) {
    clauses.push('ar.student_id = ?');
    params.push(filters.studentId);
  }

  if (filters.status) {
    clauses.push('ar.status = ?');
    params.push(filters.status);
  }

  return {
    whereClause: clauses.length ? `WHERE ${clauses.join(' AND ')}` : '',
    params,
  };
};

const findRecommendations = async (filters = {}, schoolId, executor = pool) => {
  const { whereClause, params } = buildRecommendationFilters(filters, schoolId);
  const [rows] = await executor.execute(
    `
      SELECT
        ar.id,
        s.school_id,
        ar.student_id,
        ar.material_id,
        ar.recommendation_type,
        ar.reason,
        ar.priority,
        ar.status,
        ar.created_at,
        u.name AS student_name,
        m.title AS material_title
      FROM ai_recommendations ar
      INNER JOIN students s ON s.id = ar.student_id
      INNER JOIN users u ON u.id = s.user_id AND u.school_id = s.school_id
      LEFT JOIN materials m ON m.id = ar.material_id
      ${whereClause}
      ORDER BY ar.created_at DESC
    `,
    params,
  );

  return rows;
};

const findStudentRecommendationSummary = async (studentId, schoolId, executor = pool) => {
  const [rows] = await executor.execute(
    `
      SELECT
        COUNT(*) AS total_recommendations,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending_recommendations,
        SUM(CASE WHEN priority = 'high' THEN 1 ELSE 0 END) AS high_priority_recommendations
      FROM ai_recommendations ar
      INNER JOIN students s ON s.id = ar.student_id
      WHERE ar.student_id = ? AND s.school_id = ?
    `,
    [studentId, schoolId],
  );

  return rows[0];
};

const findStudentByUserId = async (userId, schoolId, executor = pool) => {
  const [rows] = await executor.execute(
    `
      SELECT
        s.id,
        s.school_id,
        s.user_id,
        s.class_id,
        s.current_level,
        s.risk_status,
        s.total_score,
        s.streak_days,
        u.name,
        u.email
      FROM students s
      INNER JOIN users u ON u.id = s.user_id AND u.school_id = s.school_id
      WHERE s.user_id = ? AND s.school_id = ?
      LIMIT 1
    `,
    [userId, schoolId],
  );

  return rows[0] || null;
};

const findStudentById = async (studentId, schoolId, executor = pool) => {
  const [rows] = await executor.execute(
    `
      SELECT
        s.id,
        s.school_id,
        s.user_id,
        s.class_id,
        s.current_level,
        s.risk_status,
        s.total_score,
        s.streak_days,
        u.name,
        u.email,
        c.name AS class_name
      FROM students s
      INNER JOIN users u ON u.id = s.user_id AND u.school_id = s.school_id
      INNER JOIN classes c ON c.id = s.class_id AND c.school_id = s.school_id
      WHERE s.id = ? AND s.school_id = ?
      LIMIT 1
    `,
    [studentId, schoolId],
  );

  return rows[0] || null;
};

const findDiagnosticQuiz = async (level, schoolId, executor = pool) => {
  const [rows] = await executor.execute(
    `
      SELECT
        q.id,
        q.subject_id,
        s.school_id,
        q.title,
        q.level,
        q.duration_minutes,
        COUNT(quest.id) AS question_count
      FROM quizzes q
      INNER JOIN subjects s ON s.id = q.subject_id
      INNER JOIN questions quest ON quest.quiz_id = q.id
      WHERE q.quiz_type = 'diagnostic' AND s.school_id = ?
      GROUP BY q.id, q.subject_id, s.school_id, q.title, q.level, q.duration_minutes
      ORDER BY
        CASE q.level
          WHEN ? THEN 0
          WHEN 'basic' THEN 1
          WHEN 'intermediate' THEN 2
          WHEN 'advanced' THEN 3
          ELSE 4
        END,
        question_count DESC,
        q.created_at DESC
      LIMIT 1
    `,
    [schoolId, level],
  );

  return rows[0] || null;
};

const findDiagnosticQuestions = async (quizId, limit = 10, executor = pool) => {
  const [rows] = await executor.execute(
    `
      SELECT
        id,
        quiz_id,
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
      ORDER BY
        FIELD(difficulty, 'easy', 'medium', 'hard'),
        id ASC
      LIMIT ?
    `,
    [quizId, limit],
  );

  return rows;
};

const findQuestionsForScoring = async (quizId, questionIds, schoolId, executor = pool) => {
  if (!questionIds.length) {
    return [];
  }

  const placeholders = questionIds.map(() => '?').join(', ');
  const [rows] = await executor.execute(
    `
      SELECT
        q.id,
        q.quiz_id,
        q.question_text,
        q.question_type,
        q.correct_answer,
        q.keywords,
        q.point,
        q.difficulty
      FROM questions q
      INNER JOIN quizzes quiz ON quiz.id = q.quiz_id
      INNER JOIN subjects s ON s.id = quiz.subject_id
      WHERE q.quiz_id = ? AND q.id IN (${placeholders}) AND s.school_id = ?
      ORDER BY q.id ASC
    `,
    [quizId, ...questionIds, schoolId],
  );

  return rows;
};

const countStudentQuizAttempts = async (studentId, quizId, executor = pool) => {
  const [rows] = await executor.execute(
    'SELECT COUNT(*) AS total FROM quiz_attempts WHERE student_id = ? AND quiz_id = ?',
    [studentId, quizId],
  );

  return Number(rows[0]?.total || 0);
};

const findLatestAttempt = async (studentId, executor = pool) => {
  const [rows] = await executor.execute(
    `
      SELECT
        id,
        score,
        accuracy_rate,
        ai_level_result,
        performance_trend,
        submitted_at
      FROM quiz_attempts
      WHERE student_id = ?
      ORDER BY submitted_at DESC, id DESC
      LIMIT 1
    `,
    [studentId],
  );

  return rows[0] || null;
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

  return { id: result.insertId };
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

const updateStudentAiStatus = async (payload, executor = pool) => {
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

const findLearningPathMaterials = async (level, schoolId, executor = pool) => {
  const [rows] = await executor.execute(
    `
      SELECT
        m.id,
        m.subject_id,
        s.school_id,
        m.title,
        m.level,
        m.estimated_minutes,
        s.name AS subject_name
      FROM materials m
      INNER JOIN subjects s ON s.id = m.subject_id
      WHERE s.school_id = ? AND m.level IN ('basic', 'intermediate', 'advanced')
      ORDER BY
        CASE m.level WHEN ? THEN 0 ELSE 1 END,
        FIELD(m.level, 'basic', 'intermediate', 'advanced'),
        m.created_at ASC
      LIMIT 6
    `,
    [schoolId, level],
  );

  return rows;
};

const findStudentProgressMap = async (studentId, executor = pool) => {
  const [rows] = await executor.execute(
    `
      SELECT material_id, status, progress_percent
      FROM learning_progress
      WHERE student_id = ?
    `,
    [studentId],
  );

  return new Map(rows.map((row) => [Number(row.material_id), row]));
};

const findLatestFeedbackAttempt = async (studentId, attemptId, executor = pool) => {
  const params = [studentId];
  const attemptFilter = attemptId ? 'AND qa.id = ?' : '';

  if (attemptId) {
    params.push(attemptId);
  }

  const [rows] = await executor.execute(
    `
      SELECT
        qa.id,
        qa.quiz_id,
        qa.score,
        qa.accuracy_rate,
        qa.ai_level_result,
        qa.performance_trend,
        qa.time_spent_seconds,
        qa.submitted_at,
        q.title AS quiz_title,
        q.level AS quiz_level
      FROM quiz_attempts qa
      INNER JOIN quizzes q ON q.id = qa.quiz_id
      WHERE qa.student_id = ? ${attemptFilter}
      ORDER BY qa.submitted_at DESC, qa.id DESC
      LIMIT 1
    `,
    params,
  );

  return rows[0] || null;
};

const findAttemptAnswerInsights = async (attemptId, executor = pool) => {
  const [rows] = await executor.execute(
    `
      SELECT
        ans.question_id,
        ans.is_correct,
        ans.score,
        ans.confidence_score,
        ans.ai_feedback,
        q.difficulty,
        q.question_type
      FROM answers ans
      INNER JOIN questions q ON q.id = ans.question_id
      WHERE ans.attempt_id = ?
      ORDER BY ans.id ASC
    `,
    [attemptId],
  );

  return rows;
};

const findRecommendedMaterialForStudent = async (studentId, level, schoolId, executor = pool) => {
  const [rows] = await executor.execute(
    `
      SELECT
        ar.material_id,
        ar.reason,
        m.title AS material_title
      FROM ai_recommendations ar
      LEFT JOIN materials m ON m.id = ar.material_id
      INNER JOIN students s ON s.id = ar.student_id
      LEFT JOIN subjects ms ON ms.id = m.subject_id
      WHERE ar.student_id = ?
        AND s.school_id = ?
        AND ar.status = 'pending'
        AND (ar.material_id IS NULL OR ms.school_id = s.school_id)
      ORDER BY FIELD(ar.priority, 'high', 'medium', 'low'), ar.created_at DESC
      LIMIT 1
    `,
    [studentId, schoolId],
  );

  if (rows[0]) {
    return rows[0];
  }

  const [fallbackRows] = await executor.execute(
    `
      SELECT id AS material_id, title AS material_title
      FROM materials m
      INNER JOIN subjects s ON s.id = m.subject_id
      WHERE m.level = ? AND s.school_id = ?
      ORDER BY m.created_at DESC
      LIMIT 1
    `,
    [level, schoolId],
  );

  return fallbackRows[0] || null;
};

const getPerformanceTrend = async (studentId, executor = pool) => {
  const [summaryRows] = await executor.execute(
    `
      SELECT
        AVG(score) AS average_score,
        AVG(accuracy_rate) AS average_accuracy,
        AVG(time_spent_seconds) AS average_time_spent_seconds,
        COUNT(*) AS attempt_count,
        SUM(CASE WHEN performance_trend = 'improving' THEN 1 ELSE 0 END) AS improving_count,
        SUM(CASE WHEN submitted_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 ELSE 0 END) AS recent_attempt_count
      FROM quiz_attempts
      WHERE student_id = ?
    `,
    [studentId],
  );

  const [progressRows] = await executor.execute(
    `
      SELECT
        AVG(progress_percent) AS average_progress,
        SUM(time_spent_seconds) AS total_learning_time,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed_materials
      FROM learning_progress
      WHERE student_id = ?
    `,
    [studentId],
  );

  const [seriesRows] = await executor.execute(
    `
      SELECT
        id,
        score,
        accuracy_rate,
        time_spent_seconds,
        performance_trend,
        submitted_at
      FROM quiz_attempts
      WHERE student_id = ?
      ORDER BY submitted_at DESC, id DESC
      LIMIT 10
    `,
    [studentId],
  );

  return {
    summary: summaryRows[0] || {},
    progress: progressRows[0] || {},
    series: seriesRows.reverse(),
  };
};

const findRiskStudents = async (filters = {}, schoolId, executor = pool) => {
  const clauses = ['s.school_id = ?'];
  const params = [schoolId];

  if (filters.classId) {
    clauses.push('s.class_id = ?');
    params.push(filters.classId);
  }

  const whereClause = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const [rows] = await executor.execute(
    `
      SELECT
        s.id,
        s.class_id,
        s.current_level,
        s.risk_status,
        s.total_score,
        s.streak_days,
        u.name,
        c.name AS class_name,
        AVG(qa.score) AS average_score,
        AVG(qa.accuracy_rate) AS average_accuracy,
        AVG(qa.time_spent_seconds) AS average_time_spent_seconds,
        COUNT(DISTINCT qa.id) AS attempt_count,
        MAX(qa.submitted_at) AS last_attempt_at,
        AVG(lp.progress_percent) AS average_progress
      FROM students s
      INNER JOIN users u ON u.id = s.user_id AND u.school_id = s.school_id
      INNER JOIN classes c ON c.id = s.class_id AND c.school_id = s.school_id
      LEFT JOIN quiz_attempts qa ON qa.student_id = s.id
      LEFT JOIN learning_progress lp ON lp.student_id = s.id
      ${whereClause}
      GROUP BY s.id, s.school_id, s.class_id, s.current_level, s.risk_status, s.total_score, s.streak_days, c.name, u.name
      ORDER BY FIELD(s.risk_status, 'danger', 'warning', 'safe'), average_score ASC, u.name ASC
    `,
    params,
  );

  return rows;
};

module.exports = {
  countStudentQuizAttempts,
  createAnswer,
  createQuizAttempt,
  findRecommendations,
  findDiagnosticQuestions,
  findDiagnosticQuiz,
  findLatestAttempt,
  findLatestFeedbackAttempt,
  findLearningPathMaterials,
  findQuestionsForScoring,
  findRecommendedMaterialForStudent,
  findRiskStudents,
  findStudentById,
  findStudentByUserId,
  findStudentProgressMap,
  findStudentRecommendationSummary,
  findAttemptAnswerInsights,
  getPerformanceTrend,
  updateStudentAiStatus,
};
