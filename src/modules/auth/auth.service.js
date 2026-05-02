const { DEFAULT_SCHOOL_ID, ROLES, USER_STATUSES } = require('../../config/constants');
const { withTransaction } = require('../../config/db');
const { comparePassword, hashPassword } = require('../../utils/hash');
const { signAccessToken } = require('../../utils/jwt');
const { decryptText, encryptText, encryptTextVariants } = require('../../utils/crypto');
const { BadRequestError, ConflictError, NotFoundError, UnauthorizedError } = require('../../shared/errors');
const authRepository = require('./auth.repository');

const sanitizeAuthUser = (user) => ({
  id: user.id,
  school_id: user.school_id,
  school_name: user.school_name,
  role_id: user.role_id,
  role: user.role_name,
  name: user.name,
  email: decryptText(user.email),
  avatar: user.avatar,
  status: user.status,
  student_id: user.student_id,
  student_number: user.student_number,
  class_id: user.class_id,
  class_name: user.class_name,
  grade_level: user.grade_level,
  academic_year: user.academic_year,
  teacher_id: user.teacher_id,
  employee_number: user.employee_number,
  position: user.position,
  specialization: user.specialization,
  created_at: user.created_at,
  updated_at: user.updated_at,
});

const getInitialStatusForRole = () => USER_STATUSES.INACTIVE;

const resolveStudentClassId = async (schoolId, classId, connection) => {
  if (classId) {
    return classId;
  }

  const firstClass = await authRepository.findFirstClass(schoolId, connection);

  if (!firstClass) {
    throw new BadRequestError('At least one class is required before student registration');
  }

  return firstClass.id;
};

const createRoleProfile = async (role, userId, payload, connection) => {
  if (role === ROLES.STUDENT) {
    await authRepository.createStudentProfile(
      {
        userId,
        schoolId: payload.schoolId,
        classId: await resolveStudentClassId(payload.schoolId, payload.classId, connection),
        studentNumber: payload.studentNumber,
      },
      connection,
    );
  }

  if (role === ROLES.TEACHER) {
    await authRepository.createTeacherProfile(
      {
        userId,
        schoolId: payload.schoolId,
        employeeNumber: payload.employeeNumber,
        position: payload.position,
        specialization: payload.specialization,
      },
      connection,
    );
  }
};

const register = async ({
  name,
  email,
  password,
  role,
  avatar,
  classId,
  studentNumber,
  employeeNumber,
  position,
  specialization,
}) =>
  withTransaction(async (connection) => {
    const schoolId = DEFAULT_SCHOOL_ID;
    const existingUser = await authRepository.findUserByEmail(email, connection);

    if (existingUser) {
      throw new ConflictError('Email is already registered');
    }

    const roleRecord = await authRepository.findRoleByName(role, connection);

    if (!roleRecord) {
      throw new BadRequestError(`Role ${role} is not available in database`);
    }

    const hashedPassword = await hashPassword(encryptText(password));
    const createdUser = await authRepository.createUser(
      {
        schoolId,
        roleId: roleRecord.id,
        name,
        email: encryptText(email),
        password: hashedPassword,
        avatar,
        status: getInitialStatusForRole(role),
      },
      connection,
    );

    await createRoleProfile(
      role,
      createdUser.id,
      { schoolId, classId, studentNumber, employeeNumber, position, specialization },
      connection,
    );

    const user = await authRepository.findUserById(createdUser.id, connection);
    const token = user.status === USER_STATUSES.ACTIVE ? signAccessToken(user) : null;

    return {
      user: sanitizeAuthUser(user),
      token,
      verification_status: user.status === USER_STATUSES.ACTIVE ? 'active' : 'pending_admin_confirmation',
    };
  });

const login = async ({ email, password }) => {
  const user = await authRepository.findUserByEmail(email);

  if (!user) {
    throw new UnauthorizedError('Invalid email or password');
  }

  const passwordCandidates = encryptTextVariants(password);
  const passwordMatches = (
    await Promise.all(passwordCandidates.map((candidate) => comparePassword(candidate, user.password)))
  ).some(Boolean);

  if (!passwordMatches) {
    throw new UnauthorizedError('Invalid email or password');
  }

  if (user.status !== USER_STATUSES.ACTIVE) {
    throw new UnauthorizedError('Akun belum dikonfirmasi admin. Silakan tunggu admin konfirmasi dalam 24 jam.');
  }

  return {
    user: sanitizeAuthUser(user),
    token: signAccessToken(user),
  };
};

const verifyUserByAdmin = async (userId) => {
  const user = await authRepository.updateUserStatus(userId, USER_STATUSES.ACTIVE);

  if (!user) {
    throw new NotFoundError('User not found');
  }

  return sanitizeAuthUser(user);
};

const getProfile = async (userId) => {
  const user = await authRepository.findUserById(userId);

  if (!user) {
    throw new NotFoundError('User profile not found');
  }

  return sanitizeAuthUser(user);
};

module.exports = {
  getProfile,
  login,
  register,
  verifyUserByAdmin,
};
