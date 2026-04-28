const { pool } = require('../../config/db');

const getDashboardCounts = async (schoolId, executor = pool) => {
  const [rows] = await executor.execute(
    `
      SELECT
        (SELECT COUNT(*) FROM students WHERE school_id = ?) AS total_students,
        (SELECT COUNT(*) FROM teachers WHERE school_id = ?) AS total_teachers,
        (
          SELECT COUNT(*)
          FROM materials m
          INNER JOIN subjects s ON s.id = m.subject_id
          WHERE s.school_id = ?
        ) AS total_materials,
        (
          SELECT COUNT(*)
          FROM quizzes q
          INNER JOIN subjects s ON s.id = q.subject_id
          WHERE s.school_id = ?
        ) AS total_quizzes,
        (
          SELECT AVG(qa.score)
          FROM quiz_attempts qa
          INNER JOIN students s ON s.id = qa.student_id
          WHERE s.school_id = ?
        ) AS average_quiz_score
    `,
    [schoolId, schoolId, schoolId, schoolId, schoolId],
  );

  return rows[0];
};

const getProgressOverview = async (schoolId, executor = pool) => {
  const [rows] = await executor.execute(
    `
      SELECT
        COUNT(*) AS total_progress_records,
        AVG(progress_percent) AS average_progress_percent,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed_materials
      FROM learning_progress lp
      INNER JOIN students s ON s.id = lp.student_id
      WHERE s.school_id = ?
    `,
    [schoolId],
  );

  return rows[0];
};

const getStudentAnalytics = async (studentId, schoolId, executor = pool) => {
  const [rows] = await executor.execute(
    `
      SELECT
        s.id,
        u.name,
        s.current_level,
        s.risk_status,
        s.total_score,
        s.streak_days,
        AVG(qa.score) AS average_score,
        AVG(qa.accuracy_rate) AS average_accuracy,
        AVG(lp.progress_percent) AS average_progress,
        COUNT(DISTINCT sb.badge_id) AS badges_earned
      FROM students s
      INNER JOIN users u ON u.id = s.user_id AND u.school_id = s.school_id
      LEFT JOIN quiz_attempts qa ON qa.student_id = s.id
      LEFT JOIN learning_progress lp ON lp.student_id = s.id
      LEFT JOIN student_badges sb ON sb.student_id = s.id AND sb.school_id = s.school_id
      WHERE s.id = ? AND s.school_id = ?
      GROUP BY s.id, u.name, s.current_level, s.risk_status, s.total_score, s.streak_days
      LIMIT 1
    `,
    [studentId, schoolId],
  );

  return rows[0] || null;
};

module.exports = {
  getDashboardCounts,
  getProgressOverview,
  getStudentAnalytics,
};
