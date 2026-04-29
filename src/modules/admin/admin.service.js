const { ROLES, TEACHER_POSITIONS, USER_STATUSES } = require('../../config/constants');
const { withTransaction } = require('../../config/db');
const { BadRequestError, NotFoundError } = require('../../shared/errors');
const { encryptText } = require('../../utils/crypto');
const { hashPassword } = require('../../utils/hash');
const authRepository = require('../auth/auth.repository');
const adminRepository = require('./admin.repository');

const listClasses = (schoolId) => adminRepository.findClasses(schoolId);

const createClass = (schoolId, payload) => adminRepository.createClass({ ...payload, schoolId });

const listSubjects = (schoolId) => adminRepository.findSubjects(schoolId);

const createSubject = (schoolId, payload) => adminRepository.createSubject({ ...payload, schoolId });

const resolveImportClassId = async (schoolId, payload, connection) => {
  if (payload.classId) {
    return payload.classId;
  }

  const firstClass = await adminRepository.findFirstClass(schoolId, connection);

  if (!firstClass) {
    throw new BadRequestError('At least one class is required before importing students');
  }

  return firstClass.id;
};

const importUsers = (schoolId, users) =>
  withTransaction(async (connection) => {
    const created = [];
    const skipped = [];

    for (const item of users) {
      const existingUser = await authRepository.findUserByEmail(item.email, connection);

      if (existingUser) {
        skipped.push({ email: item.email, reason: 'Email is already registered' });
        continue;
      }

      const roleRecord = await authRepository.findRoleByName(item.role, connection);

      if (!roleRecord) {
        throw new BadRequestError(`Role ${item.role} is not available in database`);
      }

      const createdUser = await authRepository.createUser(
        {
          schoolId,
          roleId: roleRecord.id,
          name: item.name,
          email: encryptText(item.email),
          password: await hashPassword(encryptText(item.password)),
          avatar: item.name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase(),
          status: USER_STATUSES.ACTIVE,
        },
        connection,
      );

      if (item.role === ROLES.STUDENT) {
        await authRepository.createStudentProfile(
          {
            schoolId,
            userId: createdUser.id,
            classId: await resolveImportClassId(schoolId, item, connection),
            studentNumber: item.studentNumber || `IMP-${createdUser.id}`,
          },
          connection,
        );
      }

      if (item.role === ROLES.TEACHER) {
        await authRepository.createTeacherProfile(
          {
            schoolId,
            userId: createdUser.id,
            employeeNumber: item.employeeNumber || `IMP-T-${createdUser.id}`,
            position: TEACHER_POSITIONS.TEACHER,
            specialization: item.specialization || 'Imported Teacher',
          },
          connection,
        );
      }

      created.push({
        id: createdUser.id,
        email: item.email,
        role: item.role,
      });
    }

    return {
      created,
      skipped,
      created_count: created.length,
      skipped_count: skipped.length,
    };
  });

const resetUserPassword = async (schoolId, userId, password) => {
  const hashedPassword = await hashPassword(encryptText(password));
  const updated = await adminRepository.updateUserPassword(schoolId, userId, hashedPassword);

  if (!updated) {
    throw new NotFoundError('User not found');
  }

  return {
    id: Number(userId),
    password_reset: true,
  };
};

module.exports = {
  createClass,
  createSubject,
  importUsers,
  listClasses,
  listSubjects,
  resetUserPassword,
};
