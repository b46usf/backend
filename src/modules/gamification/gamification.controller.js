const asyncHandler = require('../../shared/asyncHandler');
const { sendSuccess } = require('../../shared/response');
const gamificationService = require('./gamification.service');

const getLeaderboard = asyncHandler(async (req, res) => {
  const leaderboard = await gamificationService.getLeaderboard(req.user.schoolId, req.query.limit);

  return sendSuccess(res, {
    message: 'Leaderboard fetched successfully',
    data: leaderboard,
    meta: {
      total: leaderboard.length,
    },
  });
});

const getStudentBadges = asyncHandler(async (req, res) => {
  const badges = await gamificationService.getStudentBadges(req.params.studentId, req.user.schoolId);

  return sendSuccess(res, {
    message: 'Student badges fetched successfully',
    data: badges,
  });
});

module.exports = {
  getLeaderboard,
  getStudentBadges,
};
