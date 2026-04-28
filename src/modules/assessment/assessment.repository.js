const { pool } = require('../../config/db');

const buildAttemptFilters = (filters, schoolId) => {
  const clauses = ['s.school_id = ?'];
  const params = [schoolId];

  if (filters.studentId) {
    clauses.push('qa.student_id = ?');
    params.push(filters.studentId);
  }

  if (filters.quizId) {
    clauses.push('qa.quiz_id = ?');
    params.push(filters.quizId);
  }

  return {
    whereClause: clauses.length ? `WHERE ${clauses.join(' AND ')}` : '',
    params,
  };
};

const findAttempts = async (filters = {}, schoolId, executor = pool) => {
  const { whereClause, params } = buildAttemptFilters(filters, schoolId);
  const [rows] = await executor.execute(
    `
      SELECT
        qa.id,
        qa.student_id,
        qa.quiz_id,
        qa.score,
        qa.accuracy_rate,
        qa.time_spent_seconds,
        qa.attempt_number,
        qa.ai_level_result,
        qa.performance_trend,
        qa.started_at,
        qa.submitted_at,
        q.title AS quiz_title,
        u.name AS student_name
      FROM quiz_attempts qa
      INNER JOIN quizzes q ON q.id = qa.quiz_id
      INNER JOIN students s ON s.id = qa.student_id
      INNER JOIN users u ON u.id = s.user_id AND u.school_id = s.school_id
      ${whereClause}
      ORDER BY qa.started_at DESC
    `,
    params,
  );

  return rows;
};

const findStudentAttemptSummary = async (studentId, schoolId, executor = pool) => {
  const [rows] = await executor.execute(
    `
      SELECT
        COUNT(*) AS total_attempts,
        AVG(score) AS average_score,
        AVG(accuracy_rate) AS average_accuracy,
        MAX(score) AS best_score
      FROM quiz_attempts qa
      INNER JOIN students s ON s.id = qa.student_id
      WHERE qa.student_id = ? AND s.school_id = ?
    `,
    [studentId, schoolId],
  );

  return rows[0];
};

const findStudentLatestScores = async (studentId, schoolId, executor = pool) => {
  const [rows] = await executor.execute(
    `
      SELECT score, accuracy_rate
      FROM quiz_attempts qa
      INNER JOIN students s ON s.id = qa.student_id
      WHERE qa.student_id = ? AND s.school_id = ?
      ORDER BY qa.submitted_at DESC, qa.id DESC
      LIMIT 2
    `,
    [studentId, schoolId],
  );

  return rows;
};

module.exports = {
  findAttempts,
  findStudentAttemptSummary,
  findStudentLatestScores,
};
