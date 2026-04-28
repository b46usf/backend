const { resolveLevelFromAccuracy, resolvePerformanceTrend } = require('../../utils/levelEngine');
const assessmentRepository = require('./assessment.repository');

const listAttempts = async (filters, schoolId) => assessmentRepository.findAttempts(filters, schoolId);

const getStudentAssessmentSummary = async (studentId, schoolId) => {
  const [summary, latestScores] = await Promise.all([
    assessmentRepository.findStudentAttemptSummary(studentId, schoolId),
    assessmentRepository.findStudentLatestScores(studentId, schoolId),
  ]);

  const currentAccuracy = Number(summary?.average_accuracy || 0);
  const currentScore = Number(latestScores[0]?.score || 0);
  const previousScore = Number(latestScores[1]?.score || currentScore);

  return {
    total_attempts: Number(summary?.total_attempts || 0),
    average_score: Number(Number(summary?.average_score || 0).toFixed(2)),
    average_accuracy: Number(Number(currentAccuracy).toFixed(2)),
    best_score: Number(Number(summary?.best_score || 0).toFixed(2)),
    suggested_level: resolveLevelFromAccuracy(currentAccuracy),
    performance_trend: resolvePerformanceTrend(previousScore, currentScore),
  };
};

module.exports = {
  getStudentAssessmentSummary,
  listAttempts,
};
