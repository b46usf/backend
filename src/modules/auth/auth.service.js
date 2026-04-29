const { OAuth2Client } = require('google-auth-library');
const env = require('../../config/env');
const { DEFAULT_SCHOOL_ID, ROLES, USER_STATUSES } = require('../../config/constants');
const { withTransaction } = require('../../config/db');
const { comparePassword, hashPassword } = require('../../utils/hash');
const { signAccessToken } = require('../../utils/jwt');
const { decryptText, encryptText, encryptTextVariants } = require('../../utils/crypto');
const { BadRequestError, ConflictError, NotFoundError, UnauthorizedError } = require('../../shared/errors');
const authRepository = require('./auth.repository');

const googleClient = new OAuth2Client(env.GOOGLE_CLIENT_ID || undefined);

const sanitizeAuthUser = (user) => ({
  id: user.id,
  school_id: user.school_id,
  role_id: user.role_id,
  role: user.role_name,
  name: user.name,
  email: decryptText(user.email),
  avatar: user.avatar,
  status: user.status,
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
    if (!payload.classId) {
      throw new BadRequestError('classId is required for student registration');
    }

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
    const token = signAccessToken(user);

    return {
      user: sanitizeAuthUser(user),
      token: user.status === USER_STATUSES.ACTIVE ? token : null,
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
    throw new UnauthorizedError('Your account is inactive');
  }

  return {
    user: sanitizeAuthUser(user),
    token: signAccessToken(user),
  };
};

const verifyGoogleIdToken = async (idToken) => {
  if (env.GOOGLE_CLIENT_ID) {
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: env.GOOGLE_CLIENT_ID,
    });

    return ticket.getPayload();
  }

  if (env.NODE_ENV === 'production') {
    throw new BadRequestError('GOOGLE_CLIENT_ID is required for Google OAuth registration');
  }

  const [, payload] = idToken.split('.');

  if (!payload) {
    throw new BadRequestError('Invalid Google idToken');
  }

  return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
};

const registerWithGoogle = async ({
  idToken,
  role,
  classId,
  studentNumber,
  employeeNumber,
  position,
  specialization,
}) => {
  if (![ROLES.STUDENT, ROLES.TEACHER].includes(role)) {
    throw new BadRequestError('Google registration only supports student and teacher roles');
  }

  const googleProfile = await verifyGoogleIdToken(idToken);
  const email = googleProfile.email;

  if (!email || googleProfile.email_verified === false) {
    throw new BadRequestError('Google account email must be verified');
  }

  return withTransaction(async (connection) => {
    const schoolId = DEFAULT_SCHOOL_ID;
    const existingUser = await authRepository.findUserByEmail(email, connection);

    if (existingUser) {
      throw new ConflictError('Email is already registered');
    }

    const roleRecord = await authRepository.findRoleByName(role, connection);

    if (!roleRecord) {
      throw new BadRequestError(`Role ${role} is not available in database`);
    }

    const createdUser = await authRepository.createUser(
      {
        schoolId,
        roleId: roleRecord.id,
        name: googleProfile.name || email,
        email: encryptText(email),
        password: await hashPassword(encryptText(`${googleProfile.sub}:${email}`)),
        avatar: googleProfile.picture,
        status: USER_STATUSES.INACTIVE,
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

    return {
      user: sanitizeAuthUser(user),
      verification_status: 'pending_admin_verification',
    };
  });
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
  registerWithGoogle,
  verifyUserByAdmin,
};
