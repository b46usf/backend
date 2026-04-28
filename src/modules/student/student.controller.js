const asyncHandler = require('../../shared/asyncHandler');
const { sendSuccess } = require('../../shared/response');
const studentService = require('./student.service');

const listStudents = asyncHandler(async (req, res) => {
  const students = await studentService.listStudents(req.query, req.user.schoolId);

  return sendSuccess(res, {
    message: 'Students fetched successfully',
    data: students,
    meta: {
      total: students.length,
    },
  });
});

const getStudentById = asyncHandler(async (req, res) => {
  const student = await studentService.getStudentById(req.params.id, req.user.schoolId);

  return sendSuccess(res, {
    message: 'Student detail fetched successfully',
    data: student,
  });
});

const getMyDashboard = asyncHandler(async (req, res) => {
  const dashboard = await studentService.getStudentDashboard(req.user.id, req.user.schoolId);

  return sendSuccess(res, {
    message: 'Student dashboard fetched successfully',
    data: dashboard,
  });
});

const getMyRecommendations = asyncHandler(async (req, res) => {
  const recommendations = await studentService.getMyRecommendations(req.user.id, req.user.schoolId);

  return sendSuccess(res, {
    message: 'Student recommendations fetched successfully',
    data: recommendations,
    meta: {
      total: recommendations.length,
    },
  });
});

const getMyProgress = asyncHandler(async (req, res) => {
  const progress = await studentService.getMyProgress(req.user.id, req.user.schoolId);

  return sendSuccess(res, {
    message: 'Student progress fetched successfully',
    data: progress,
    meta: {
      total: progress.length,
    },
  });
});

const updateMyMaterialProgress = asyncHandler(async (req, res) => {
  const progress = await studentService.updateMyMaterialProgress(
    req.user.id,
    req.user.schoolId,
    req.params.materialId,
    req.body,
  );

  return sendSuccess(res, {
    message: 'Learning progress saved successfully',
    data: progress,
  });
});

const getMyBadges = asyncHandler(async (req, res) => {
  const badges = await studentService.getMyBadges(req.user.id, req.user.schoolId);

  return sendSuccess(res, {
    message: 'Student badges fetched successfully',
    data: badges,
    meta: {
      total: badges.length,
    },
  });
});

module.exports = {
  getMyBadges,
  getMyDashboard,
  getMyProgress,
  getMyRecommendations,
  getStudentById,
  listStudents,
  updateMyMaterialProgress,
};
