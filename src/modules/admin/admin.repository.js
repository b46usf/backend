const { pool } = require('../../config/db');

const findClasses = async (schoolId, executor = pool) => {
  const [rows] = await executor.execute(
    `
      SELECT
        c.id,
        c.school_id,
        c.homeroom_teacher_id,
        c.name,
        c.grade_level,
        c.academic_year,
        c.created_at,
        hu.name AS homeroom_teacher_name,
        COUNT(s.id) AS student_count
      FROM classes c
      LEFT JOIN teachers ht ON ht.id = c.homeroom_teacher_id AND ht.school_id = c.school_id
      LEFT JOIN users hu ON hu.id = ht.user_id
      LEFT JOIN students s ON s.class_id = c.id AND s.school_id = c.school_id
      WHERE c.school_id = ?
      GROUP BY
        c.id,
        c.school_id,
        c.homeroom_teacher_id,
        c.name,
        c.grade_level,
        c.academic_year,
        c.created_at,
        hu.name
      ORDER BY c.grade_level ASC, c.name ASC
    `,
    [schoolId],
  );

  return rows;
};

const createClass = async (payload, executor = pool) => {
  const [result] = await executor.execute(
    `
      INSERT INTO classes (school_id, homeroom_teacher_id, name, grade_level, academic_year)
      VALUES (?, ?, ?, ?, ?)
    `,
    [
      payload.schoolId,
      payload.homeroomTeacherId || null,
      payload.name,
      payload.gradeLevel || null,
      payload.academicYear || null,
    ],
  );

  const [rows] = await executor.execute(
    `
      SELECT
        c.id,
        c.school_id,
        c.homeroom_teacher_id,
        c.name,
        c.grade_level,
        c.academic_year,
        c.created_at
      FROM classes c
      WHERE c.id = ? AND c.school_id = ?
    `,
    [result.insertId, payload.schoolId],
  );

  return rows[0];
};

const findSubjects = async (schoolId, executor = pool) => {
  const [rows] = await executor.execute(
    `
      SELECT
        s.id,
        s.school_id,
        s.name,
        s.code,
        s.description,
        s.created_at,
        COUNT(DISTINCT m.id) AS material_count,
        COUNT(DISTINCT q.id) AS quiz_count
      FROM subjects s
      LEFT JOIN materials m ON m.subject_id = s.id
      LEFT JOIN quizzes q ON q.subject_id = s.id
      WHERE s.school_id = ?
      GROUP BY s.id, s.school_id, s.name, s.code, s.description, s.created_at
      ORDER BY s.name ASC
    `,
    [schoolId],
  );

  return rows;
};

const createSubject = async (payload, executor = pool) => {
  const [result] = await executor.execute(
    `
      INSERT INTO subjects (school_id, name, code, description)
      VALUES (?, ?, ?, ?)
    `,
    [payload.schoolId, payload.name, payload.code || null, payload.description || null],
  );

  const [rows] = await executor.execute(
    'SELECT id, school_id, name, code, description, created_at FROM subjects WHERE id = ? AND school_id = ?',
    [result.insertId, payload.schoolId],
  );

  return rows[0];
};

const findFirstClass = async (schoolId, executor = pool) => {
  const [rows] = await executor.execute(
    'SELECT id FROM classes WHERE school_id = ? ORDER BY grade_level ASC, name ASC LIMIT 1',
    [schoolId],
  );

  return rows[0] || null;
};

const updateUserPassword = async (schoolId, userId, password, executor = pool) => {
  const [result] = await executor.execute(
    'UPDATE users SET password = ? WHERE id = ? AND school_id = ?',
    [password, userId, schoolId],
  );

  return result.affectedRows > 0;
};

module.exports = {
  createClass,
  createSubject,
  findClasses,
  findFirstClass,
  findSubjects,
  updateUserPassword,
};
