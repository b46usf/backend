const gamificationRepository = require('./gamification.repository');

const getLeaderboard = async (schoolId, limit) => gamificationRepository.findLeaderboard(schoolId, limit);

const getStudentBadges = async (studentId, schoolId) => {
  const badges = await gamificationRepository.findStudentBadges(studentId, schoolId);

  return {
    total_badges: badges.length,
    badges,
  };
};

module.exports = {
  getLeaderboard,
  getStudentBadges,
};
