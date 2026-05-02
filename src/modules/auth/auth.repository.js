const { pool } = require('../../config/db');
const {
  DEFAULT_SCHOOL_ID,
  LEVELS,
  RISK_STATUSES,
  TEACHER_POSITIONS,
  USER_STATUSES,
} = require('../../config/constants');
const { encryptTextVariants } = require('../../utils/crypto');

const baseUserSelect = `
  SELECT
    u.id,
    u.school_id,
    u.role_id,
    r.name AS role_name,
    u.name,
    u.email,
    u.password,
    u.avatar,
    u.status,
    u.created_at,
    u.updated_at,
    sch.name AS school_name,
    st.id AS student_id,
    st.student_number,
    st.class_id,
    c.name AS class_name,
    c.grade_level,
    c.academic_year,
    t.id AS teacher_id,
    t.employee_number,
    t.position,
    t.specialization
  FROM users u
  INNER JOIN roles r ON r.id = u.role_id
  LEFT JOIN schools sch ON sch.id = u.school_id
  LEFT JOIN students st ON st.user_id = u.id AND st.school_id = u.school_id
  LEFT JOIN classes c ON c.id = st.class_id AND c.school_id = st.school_id
  LEFT JOIN teachers t ON t.user_id = u.id AND t.school_id = u.school_id
`;

const findRoleByName = async (roleName, executor = pool) => {
  const [rows] = await executor.execute('SELECT id, name FROM roles WHERE name = ? LIMIT 1', [roleName]);
  return rows[0] || null;
};

const findFirstClass = async (schoolId, executor = pool) => {
  const [rows] = await executor.execute(
    'SELECT id FROM classes WHERE school_id = ? ORDER BY grade_level ASC, name ASC LIMIT 1',
    [schoolId],
  );

  return rows[0] || null;
};

const findUserByEmail = async (email, executor = pool) => {
  const emailVariants = encryptTextVariants(email);
  const [rows] = await executor.execute(
    `
      ${baseUserSelect}
      WHERE u.email IN (${emailVariants.map(() => '?').join(', ')})
      LIMIT 1
    `,
    emailVariants,
  );

  return rows[0] || null;
};

const findUserById = async (id, executor = pool) => {
  const [rows] = await executor.execute(`${baseUserSelect} WHERE u.id = ? LIMIT 1`, [id]);
  return rows[0] || null;
};

const createUser = async (payload, executor = pool) => {
  const [result] = await executor.execute(
    `
      INSERT INTO users (school_id, role_id, name, email, password, avatar, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
    [
      payload.schoolId || DEFAULT_SCHOOL_ID,
      payload.roleId,
      payload.name,
      payload.email,
      payload.password,
      payload.avatar || null,
      payload.status || USER_STATUSES.ACTIVE,
    ],
  );

  return {
    id: result.insertId,
  };
};

const createStudentProfile = async (payload, executor = pool) => {
  const [result] = await executor.execute(
    `
      INSERT INTO students (school_id, user_id, class_id, student_number, current_level, risk_status)
      VALUES (?, ?, ?, ?, ?, ?)
    `,
    [
      payload.schoolId || DEFAULT_SCHOOL_ID,
      payload.userId,
      payload.classId,
      payload.studentNumber || null,
      payload.currentLevel || LEVELS.BASIC,
      payload.riskStatus || RISK_STATUSES.SAFE,
    ],
  );

  return {
    id: result.insertId,
  };
};

const createTeacherProfile = async (payload, executor = pool) => {
  const [result] = await executor.execute(
    `
      INSERT INTO teachers (school_id, user_id, employee_number, position, specialization)
      VALUES (?, ?, ?, ?, ?)
    `,
    [
      payload.schoolId || DEFAULT_SCHOOL_ID,
      payload.userId,
      payload.employeeNumber || null,
      payload.position || TEACHER_POSITIONS.TEACHER,
      payload.specialization || null,
    ],
  );

  return {
    id: result.insertId,
  };
};

const updateUserStatus = async (userId, status, executor = pool) => {
  await executor.execute('UPDATE users SET status = ? WHERE id = ?', [status, userId]);
  return findUserById(userId, executor);
};

module.exports = {
  createUser,
  createStudentProfile,
  createTeacherProfile,
  findRoleByName,
  findFirstClass,
  findUserByEmail,
  findUserById,
  updateUserStatus,
};
