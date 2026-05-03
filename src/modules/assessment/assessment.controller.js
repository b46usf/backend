const asyncHandler = require('../../shared/asyncHandler');
const { paginateList } = require('../../shared/pagination');
const { sendSuccess } = require('../../shared/response');
const assessmentService = require('./assessment.service');

const listAttempts = asyncHandler(async (req, res) => {
  const attempts = await assessmentService.listAttempts(req.query, req.user.schoolId);
  const result = paginateList(attempts, req.query);

  return sendSuccess(res, {
    message: 'Assessment attempts fetched successfully',
    data: result.data,
    meta: result.meta,
  });
});

const getStudentAssessmentSummary = asyncHandler(async (req, res) => {
  const summary = await assessmentService.getStudentAssessmentSummary(req.params.studentId, req.user.schoolId);

  return sendSuccess(res, {
    message: 'Assessment summary fetched successfully',
    data: summary,
  });
});

module.exports = {
  getStudentAssessmentSummary,
  listAttempts,
};
