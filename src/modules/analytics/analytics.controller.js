const asyncHandler = require('../../shared/asyncHandler');
const { sendSuccess } = require('../../shared/response');
const analyticsService = require('./analytics.service');

const getDashboardOverview = asyncHandler(async (req, res) => {
  const dashboard = await analyticsService.getDashboardOverview(req.user.schoolId);

  return sendSuccess(res, {
    message: 'Analytics dashboard fetched successfully',
    data: dashboard,
  });
});

const getStudentAnalytics = asyncHandler(async (req, res) => {
  const analytics = await analyticsService.getStudentAnalytics(req.params.studentId, req.user.schoolId);

  return sendSuccess(res, {
    message: 'Student analytics fetched successfully',
    data: analytics,
  });
});

module.exports = {
  getDashboardOverview,
  getStudentAnalytics,
};
