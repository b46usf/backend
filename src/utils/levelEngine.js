const { LEVELS, PERFORMANCE_TRENDS } = require('../config/constants');

const resolveLevelFromAccuracy = (accuracyRate) => {
  if (accuracyRate >= 85) {
    return LEVELS.ADVANCED;
  }

  if (accuracyRate >= 60) {
    return LEVELS.INTERMEDIATE;
  }

  return LEVELS.BASIC;
};

const resolvePerformanceTrend = (previousScore, currentScore) => {
  const delta = Number(currentScore) - Number(previousScore);

  if (delta >= 5) {
    return PERFORMANCE_TRENDS.IMPROVING;
  }

  if (delta <= -5) {
    return PERFORMANCE_TRENDS.DECLINING;
  }

  return PERFORMANCE_TRENDS.STABLE;
};

module.exports = {
  resolveLevelFromAccuracy,
  resolvePerformanceTrend,
};
