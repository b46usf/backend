const { pool } = require('../../config/db');

const findTeachers = async (schoolId, executor = pool) => {
  const [rows] = await executor.execute(
    `
      SELECT
        t.id,
        t.school_id,
        t.user_id,
        t.employee_number,
        t.position,
        t.specialization,
        t.created_at,
        u.name,
        u.email,
        u.avatar,
        u.status
      FROM teachers t
      INNER JOIN users u ON u.id = t.user_id AND u.school_id = t.school_id
      WHERE t.school_id = ?
      ORDER BY u.name ASC
    `,
    [schoolId],
  );

  return rows;
};

const findTeacherById = async (teacherId, schoolId, executor = pool) => {
  const [rows] = await executor.execute(
    `
      SELECT
        t.id,
        t.school_id,
        t.user_id,
        t.employee_number,
        t.position,
        t.specialization,
        t.created_at,
        u.name,
        u.email,
        u.avatar,
        u.status
      FROM teachers t
      INNER JOIN users u ON u.id = t.user_id AND u.school_id = t.school_id
      WHERE t.id = ? AND t.school_id = ?
      LIMIT 1
    `,
    [teacherId, schoolId],
  );

  return rows[0] || null;
};

const findTeacherClasses = async (teacherId, schoolId, executor = pool) => {
  const [rows] = await executor.execute(
    `
      SELECT
        tc.id,
        tc.school_id,
        c.id AS class_id,
        c.name,
        c.grade_level,
        c.academic_year,
        sub.id AS subject_id,
        sub.name AS subject_name,
        sub.code AS subject_code,
        tc.assignment_type
      FROM teacher_classes tc
      INNER JOIN classes c ON c.id = tc.class_id AND c.school_id = tc.school_id
      INNER JOIN subjects sub ON sub.id = tc.subject_id AND sub.school_id = tc.school_id
      WHERE tc.teacher_id = ? AND tc.school_id = ?
      ORDER BY c.name ASC, sub.name ASC
    `,
    [teacherId, schoolId],
  );

  return rows;
};

const findTeacherByUserId = async (userId, schoolId, executor = pool) => {
  const [rows] = await executor.execute('SELECT id FROM teachers WHERE user_id = ? AND school_id = ? LIMIT 1', [
    userId,
    schoolId,
  ]);
  return rows[0] || null;
};

const findClassDashboard = async (teacherId, schoolId, executor = pool) => {
  const [rows] = await executor.execute(
    `
      SELECT
        c.id AS class_id,
        c.school_id,
        c.name AS class_name,
        c.grade_level,
        COUNT(DISTINCT s.id) AS total_students,
        COUNT(DISTINCT CASE WHEN s.risk_status = 'safe' THEN s.id END) AS safe_students,
        COUNT(DISTINCT CASE WHEN s.risk_status = 'warning' THEN s.id END) AS warning_students,
        COUNT(DISTINCT CASE WHEN s.risk_status = 'danger' THEN s.id END) AS danger_students,
        AVG(s.total_score) AS average_total_score
      FROM teacher_classes tc
      INNER JOIN classes c ON c.id = tc.class_id AND c.school_id = tc.school_id
      LEFT JOIN students s ON s.class_id = c.id AND s.school_id = c.school_id
      WHERE tc.teacher_id = ? AND tc.school_id = ?
      GROUP BY c.id, c.school_id, c.name, c.grade_level
      ORDER BY c.name ASC
    `,
    [teacherId, schoolId],
  );

  return rows;
};

const findStudentsNeedingIntervention = async (teacherId, schoolId, executor = pool) => {
  const [rows] = await executor.execute(
    `
      SELECT DISTINCT
        s.id,
        s.school_id,
        u.name,
        s.class_id,
        c.name AS class_name,
        s.current_level,
        s.risk_status,
        s.total_score,
        s.streak_days
      FROM teacher_classes tc
      INNER JOIN students s ON s.class_id = tc.class_id AND s.school_id = tc.school_id
      INNER JOIN users u ON u.id = s.user_id AND u.school_id = s.school_id
      INNER JOIN classes c ON c.id = s.class_id AND c.school_id = s.school_id
      WHERE tc.teacher_id = ? AND tc.school_id = ? AND s.risk_status IN ('warning', 'danger')
      ORDER BY
        CASE s.risk_status WHEN 'danger' THEN 1 ELSE 2 END,
        s.total_score ASC
    `,
    [teacherId, schoolId],
  );

  return rows;
};

const findStudentInterventionDetail = async (teacherId, schoolId, studentId, executor = pool) => {
  const [rows] = await executor.execute(
    `
      SELECT
        s.id,
        s.school_id,
        u.name,
        s.class_id,
        c.name AS class_name,
        s.current_level,
        s.risk_status,
        s.total_score,
        s.streak_days,
        AVG(qa.score) AS average_score,
        AVG(qa.accuracy_rate) AS average_accuracy,
        AVG(lp.progress_percent) AS average_progress
      FROM teacher_classes tc
      INNER JOIN students s ON s.class_id = tc.class_id AND s.school_id = tc.school_id
      INNER JOIN users u ON u.id = s.user_id AND u.school_id = s.school_id
      INNER JOIN classes c ON c.id = s.class_id AND c.school_id = s.school_id
      LEFT JOIN quiz_attempts qa ON qa.student_id = s.id
      LEFT JOIN learning_progress lp ON lp.student_id = s.id
      WHERE tc.teacher_id = ? AND tc.school_id = ? AND s.id = ?
      GROUP BY s.id, s.school_id, u.name, s.class_id, c.name, s.current_level, s.risk_status, s.total_score, s.streak_days
      LIMIT 1
    `,
    [teacherId, schoolId, studentId],
  );

  return rows[0] || null;
};

const createStudentInterventionLog = async (payload, executor = pool) => {
  const [result] = await executor.execute(
    `
      INSERT INTO activity_logs (student_id, activity_type, description, metadata)
      SELECT s.id, 'view_material', ?, JSON_OBJECT('teacher_id', ?, 'source', 'teacher_intervention')
      FROM students s
      WHERE s.id = ? AND s.school_id = ?
    `,
    [payload.message, payload.teacherId, payload.studentId, payload.schoolId],
  );

  return {
    id: result.insertId,
  };
};

module.exports = {
  createStudentInterventionLog,
  findTeacherById,
  findTeacherByUserId,
  findTeacherClasses,
  findTeachers,
  findClassDashboard,
  findStudentsNeedingIntervention,
  findStudentInterventionDetail,
};
