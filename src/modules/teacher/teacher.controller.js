const asyncHandler = require('../../shared/asyncHandler');
const { sendSuccess } = require('../../shared/response');
const teacherService = require('./teacher.service');

const listTeachers = asyncHandler(async (req, res) => {
  const teachers = await teacherService.listTeachers(req.user.schoolId);

  return sendSuccess(res, {
    message: 'Teachers fetched successfully',
    data: teachers,
    meta: {
      total: teachers.length,
    },
  });
});

const getTeacherById = asyncHandler(async (req, res) => {
  const teacher = await teacherService.getTeacherById(req.params.id, req.user.schoolId);

  return sendSuccess(res, {
    message: 'Teacher detail fetched successfully',
    data: teacher,
  });
});

const getClassDashboard = asyncHandler(async (req, res) => {
  const dashboard = await teacherService.getClassDashboard(req.user.id, req.user.schoolId);

  return sendSuccess(res, {
    message: 'Teacher class dashboard fetched successfully',
    data: dashboard,
  });
});

const getStudentIntervention = asyncHandler(async (req, res) => {
  const intervention = await teacherService.getStudentIntervention(req.user.id, req.user.schoolId, req.params.studentId);

  return sendSuccess(res, {
    message: 'Student intervention advice fetched successfully',
    data: intervention,
  });
});

const createStudentIntervention = asyncHandler(async (req, res) => {
  const intervention = await teacherService.createStudentIntervention(
    req.user.id,
    req.user.schoolId,
    req.params.studentId,
    req.body,
  );

  return sendSuccess(res, {
    statusCode: 201,
    message: 'Student intervention logged successfully',
    data: intervention,
  });
});

module.exports = {
  createStudentIntervention,
  getClassDashboard,
  getStudentIntervention,
  getTeacherById,
  listTeachers,
};
