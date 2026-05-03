const asyncHandler = require('../../shared/asyncHandler');
const { paginateList } = require('../../shared/pagination');
const { sendSuccess } = require('../../shared/response');
const studentService = require('./student.service');

const listStudents = asyncHandler(async (req, res) => {
  const students = await studentService.listStudents(req.query, req.user.schoolId);
  const result = paginateList(students, req.query);

  return sendSuccess(res, {
    message: 'Students fetched successfully',
    data: result.data,
    meta: result.meta,
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
  const result = paginateList(recommendations, req.query);

  return sendSuccess(res, {
    message: 'Student recommendations fetched successfully',
    data: result.data,
    meta: result.meta,
  });
});

const getMyProgress = asyncHandler(async (req, res) => {
  const progress = await studentService.getMyProgress(req.user.id, req.user.schoolId);
  const result = paginateList(progress, req.query);

  return sendSuccess(res, {
    message: 'Student progress fetched successfully',
    data: result.data,
    meta: result.meta,
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
  const result = paginateList(badges, req.query);

  return sendSuccess(res, {
    message: 'Student badges fetched successfully',
    data: result.data,
    meta: result.meta,
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
