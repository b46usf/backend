const { NotFoundError } = require('../../shared/errors');
const analyticsRepository = require('./analytics.repository');

const getDashboardOverview = async (schoolId) => {
  const [counts, progress] = await Promise.all([
    analyticsRepository.getDashboardCounts(schoolId),
    analyticsRepository.getProgressOverview(schoolId),
  ]);

  return {
    total_students: Number(counts?.total_students || 0),
    total_teachers: Number(counts?.total_teachers || 0),
    total_materials: Number(counts?.total_materials || 0),
    total_quizzes: Number(counts?.total_quizzes || 0),
    average_quiz_score: Number(Number(counts?.average_quiz_score || 0).toFixed(2)),
    average_progress_percent: Number(Number(progress?.average_progress_percent || 0).toFixed(2)),
    completed_materials: Number(progress?.completed_materials || 0),
    total_progress_records: Number(progress?.total_progress_records || 0),
  };
};

const getStudentAnalytics = async (studentId, schoolId) => {
  const analytics = await analyticsRepository.getStudentAnalytics(studentId, schoolId);

  if (!analytics) {
    throw new NotFoundError('Student analytics not found');
  }

  return {
    ...analytics,
    average_score: Number(Number(analytics.average_score || 0).toFixed(2)),
    average_accuracy: Number(Number(analytics.average_accuracy || 0).toFixed(2)),
    average_progress: Number(Number(analytics.average_progress || 0).toFixed(2)),
    badges_earned: Number(analytics.badges_earned || 0),
  };
};

module.exports = {
  getDashboardOverview,
  getStudentAnalytics,
};
