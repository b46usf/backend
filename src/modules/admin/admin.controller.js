const asyncHandler = require('../../shared/asyncHandler');
const { sendSuccess } = require('../../shared/response');
const adminService = require('./admin.service');

const listClasses = asyncHandler(async (req, res) => {
  const classes = await adminService.listClasses(req.user.schoolId);

  return sendSuccess(res, {
    message: 'Classes fetched successfully',
    data: classes,
    meta: {
      total: classes.length,
    },
  });
});

const createClass = asyncHandler(async (req, res) => {
  const createdClass = await adminService.createClass(req.user.schoolId, req.body);

  return sendSuccess(res, {
    statusCode: 201,
    message: 'Class created successfully',
    data: createdClass,
  });
});

const listSubjects = asyncHandler(async (req, res) => {
  const subjects = await adminService.listSubjects(req.user.schoolId);

  return sendSuccess(res, {
    message: 'Subjects fetched successfully',
    data: subjects,
    meta: {
      total: subjects.length,
    },
  });
});

const createSubject = asyncHandler(async (req, res) => {
  const subject = await adminService.createSubject(req.user.schoolId, req.body);

  return sendSuccess(res, {
    statusCode: 201,
    message: 'Subject created successfully',
    data: subject,
  });
});

const importUsers = asyncHandler(async (req, res) => {
  const result = await adminService.importUsers(req.user.schoolId, req.body.users);

  return sendSuccess(res, {
    statusCode: 201,
    message: 'Users imported successfully',
    data: result,
  });
});

const resetUserPassword = asyncHandler(async (req, res) => {
  const result = await adminService.resetUserPassword(req.user.schoolId, req.params.id, req.body.password);

  return sendSuccess(res, {
    message: 'User password reset successfully',
    data: result,
  });
});

module.exports = {
  createClass,
  createSubject,
  importUsers,
  listClasses,
  listSubjects,
  resetUserPassword,
};
