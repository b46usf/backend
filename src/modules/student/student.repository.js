const { pool } = require('../../config/db');

const buildStudentFilters = (filters, schoolId) => {
  const clauses = ['s.school_id = ?'];
  const params = [schoolId];

  if (filters.classId) {
    clauses.push('s.class_id = ?');
    params.push(filters.classId);
  }

  if (filters.level) {
    clauses.push('s.current_level = ?');
    params.push(filters.level);
  }

  if (filters.riskStatus) {
    clauses.push('s.risk_status = ?');
    params.push(filters.riskStatus);
  }

  return {
    whereClause: clauses.length ? `WHERE ${clauses.join(' AND ')}` : '',
    params,
  };
};

const findStudents = async (filters = {}, schoolId, executor = pool) => {
  const { whereClause, params } = buildStudentFilters(filters, schoolId);
  const [rows] = await executor.execute(
    `
      SELECT
        s.id,
        s.school_id,
        s.user_id,
        s.class_id,
        s.student_number,
        s.current_level,
        s.risk_status,
        s.total_score,
        s.streak_days,
        u.name,
        u.email,
        u.avatar,
        c.name AS class_name,
        c.grade_level,
        c.academic_year
      FROM students s
      INNER JOIN users u ON u.id = s.user_id AND u.school_id = s.school_id
      INNER JOIN classes c ON c.id = s.class_id AND c.school_id = s.school_id
      ${whereClause}
      ORDER BY u.name ASC
    `,
    params,
  );

  return rows;
};

const findStudentById = async (studentId, schoolId, executor = pool) => {
  const [rows] = await executor.execute(
    `
      SELECT
        s.id,
        s.school_id,
        s.user_id,
        s.class_id,
        s.student_number,
        s.current_level,
        s.risk_status,
        s.total_score,
        s.streak_days,
        s.created_at,
        u.name,
        u.email,
        u.avatar,
        c.name AS class_name,
        c.grade_level,
        c.academic_year
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

const findStudentByUserId = async (userId, schoolId, executor = pool) => {
  const [rows] = await executor.execute(
    `
      SELECT
        s.id,
        s.school_id,
        s.user_id,
        s.class_id,
        s.student_number,
        s.current_level,
        s.risk_status,
        s.total_score,
        s.streak_days,
        s.created_at,
        u.name,
        u.email,
        u.avatar,
        c.name AS class_name,
        c.grade_level,
        c.academic_year
      FROM students s
      INNER JOIN users u ON u.id = s.user_id AND u.school_id = s.school_id
      INNER JOIN classes c ON c.id = s.class_id AND c.school_id = s.school_id
      WHERE s.user_id = ? AND s.school_id = ?
      LIMIT 1
    `,
    [userId, schoolId],
  );

  return rows[0] || null;
};

const findStudentProgressSummary = async (studentId, schoolId, executor = pool) => {
  const [rows] = await executor.execute(
    `
      SELECT
        COUNT(*) AS total_materials,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed_materials,
        AVG(progress_percent) AS average_progress_percent,
        SUM(time_spent_seconds) AS total_time_spent_seconds
      FROM learning_progress lp
      INNER JOIN students s ON s.id = lp.student_id
      WHERE lp.student_id = ? AND s.school_id = ?
    `,
    [studentId, schoolId],
  );

  return rows[0];
};

const findRecentAttempts = async (studentId, schoolId, executor = pool) => {
  const [rows] = await executor.execute(
    `
      SELECT
        qa.id,
        qa.score,
        qa.accuracy_rate,
        qa.ai_level_result,
        qa.performance_trend,
        qa.submitted_at,
        q.title AS quiz_title
      FROM quiz_attempts qa
      INNER JOIN students s ON s.id = qa.student_id
      INNER JOIN quizzes q ON q.id = qa.quiz_id
      WHERE qa.student_id = ? AND s.school_id = ?
      ORDER BY qa.submitted_at DESC, qa.id DESC
      LIMIT 5
    `,
    [studentId, schoolId],
  );

  return rows;
};

const findStudentRecommendations = async (studentId, schoolId, executor = pool) => {
  const [rows] = await executor.execute(
    `
      SELECT
        ar.id,
        ar.material_id,
        ar.recommendation_type,
        ar.reason,
        ar.priority,
        ar.status,
        ar.created_at,
        m.title AS material_title,
        m.level AS material_level,
        m.estimated_minutes,
        s.name AS subject_name
      FROM ai_recommendations ar
      INNER JOIN students st ON st.id = ar.student_id
      LEFT JOIN materials m ON m.id = ar.material_id
      LEFT JOIN subjects s ON s.id = m.subject_id
      WHERE ar.student_id = ?
        AND st.school_id = ?
        AND ar.status = 'pending'
        AND (ar.material_id IS NULL OR s.school_id = st.school_id)
      ORDER BY
        CASE ar.priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END,
        ar.created_at DESC
      LIMIT 10
    `,
    [studentId, schoolId],
  );

  return rows;
};

const findStudentProgress = async (studentId, schoolId, executor = pool) => {
  const [rows] = await executor.execute(
    `
      SELECT
        lp.id,
        lp.material_id,
        lp.status,
        lp.progress_percent,
        lp.time_spent_seconds,
        lp.completed_at,
        lp.updated_at,
        m.title AS material_title,
        m.level,
        s.name AS subject_name
      FROM learning_progress lp
      INNER JOIN students st ON st.id = lp.student_id
      INNER JOIN materials m ON m.id = lp.material_id
      INNER JOIN subjects s ON s.id = m.subject_id
      WHERE lp.student_id = ? AND st.school_id = ? AND s.school_id = st.school_id
      ORDER BY lp.updated_at DESC
    `,
    [studentId, schoolId],
  );

  return rows;
};

const upsertLearningProgress = async (payload, executor = pool) => {
  const [result] = await executor.execute(
    `
      INSERT INTO learning_progress
        (student_id, material_id, status, progress_percent, time_spent_seconds, completed_at)
      SELECT ?, m.id, ?, ?, ?, ?
      FROM materials m
      INNER JOIN subjects s ON s.id = m.subject_id
      WHERE m.id = ? AND s.school_id = ?
      ON DUPLICATE KEY UPDATE
        status = VALUES(status),
        progress_percent = VALUES(progress_percent),
        time_spent_seconds = time_spent_seconds + VALUES(time_spent_seconds),
        completed_at = VALUES(completed_at)
    `,
    [
      payload.studentId,
      payload.status,
      payload.progressPercent,
      payload.timeSpentSeconds || 0,
      payload.status === 'completed' ? new Date() : null,
      payload.materialId,
      payload.schoolId,
    ],
  );

  return result.affectedRows > 0;
};

const findStudentBadges = async (studentId, schoolId, executor = pool) => {
  const [rows] = await executor.execute(
    `
      SELECT
        b.id,
        b.name,
        b.description,
        b.icon,
        b.requirement,
        sb.earned_at
      FROM student_badges sb
      INNER JOIN badges b ON b.id = sb.badge_id AND b.school_id = sb.school_id
      WHERE sb.student_id = ? AND sb.school_id = ?
      ORDER BY sb.earned_at DESC
    `,
    [studentId, schoolId],
  );

  return rows;
};

module.exports = {
  findRecentAttempts,
  findStudentById,
  findStudentByUserId,
  findStudentBadges,
  findStudentProgressSummary,
  findStudentProgress,
  findStudentRecommendations,
  findStudents,
  upsertLearningProgress,
};
