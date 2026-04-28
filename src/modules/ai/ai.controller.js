const asyncHandler = require('../../shared/asyncHandler');
const { sendSuccess } = require('../../shared/response');
const aiService = require('./ai.service');

const listRecommendations = asyncHandler(async (req, res) => {
  const recommendations = await aiService.listRecommendations(req.query, req.user.schoolId);

  return sendSuccess(res, {
    message: 'AI recommendations fetched successfully',
    data: recommendations,
    meta: {
      total: recommendations.length,
    },
  });
});

const getStudentAiOverview = asyncHandler(async (req, res) => {
  const overview = await aiService.getStudentAiOverview(req.params.studentId, req.user.schoolId);

  return sendSuccess(res, {
    message: 'AI overview fetched successfully',
    data: overview,
  });
});

const getDiagnosticScreen = asyncHandler(async (req, res) => {
  const diagnostic = await aiService.getDiagnosticScreen(req.user.id, req.user.schoolId);

  return sendSuccess(res, {
    message: 'AI diagnostic screen fetched successfully',
    data: diagnostic,
  });
});

const submitDiagnostic = asyncHandler(async (req, res) => {
  const result = await aiService.submitDiagnostic(req.user.id, req.user.schoolId, req.body);

  return sendSuccess(res, {
    message: 'AI diagnostic submitted successfully',
    data: result,
  });
});

const getMyLearningPath = asyncHandler(async (req, res) => {
  const path = await aiService.getPersonalizedLearningPath(req.user.id, req.user.schoolId);

  return sendSuccess(res, {
    message: 'Personalized learning path fetched successfully',
    data: path,
  });
});

const getMyFeedbackCard = asyncHandler(async (req, res) => {
  const feedback = await aiService.getFeedbackCard(req.user.id, req.user.schoolId, req.query.attemptId);

  return sendSuccess(res, {
    message: 'AI feedback card fetched successfully',
    data: feedback,
  });
});

const getMyPerformanceTrend = asyncHandler(async (req, res) => {
  const dashboard = await aiService.getMyPerformanceTrendDashboard(req.user.id, req.user.schoolId);

  return sendSuccess(res, {
    message: 'Performance trend dashboard fetched successfully',
    data: dashboard,
  });
});

const getStudentPerformanceTrend = asyncHandler(async (req, res) => {
  const dashboard = await aiService.getPerformanceTrendDashboard(req.params.studentId, req.user.schoolId);

  return sendSuccess(res, {
    message: 'Student performance trend dashboard fetched successfully',
    data: dashboard,
  });
});

const getRiskStudentDetection = asyncHandler(async (req, res) => {
  const students = await aiService.getRiskStudentDetection(req.query, req.user.schoolId);

  return sendSuccess(res, {
    message: 'Risk student detection fetched successfully',
    data: students,
    meta: {
      total: students.length,
    },
  });
});

module.exports = {
  getDiagnosticScreen,
  getMyFeedbackCard,
  getMyLearningPath,
  getMyPerformanceTrend,
  getRiskStudentDetection,
  getStudentAiOverview,
  getStudentPerformanceTrend,
  listRecommendations,
  submitDiagnostic,
};
