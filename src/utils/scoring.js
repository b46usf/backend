const calculateAccuracyRate = (correctAnswers, totalQuestions) => {
  if (!totalQuestions) {
    return 0;
  }

  return Number(((correctAnswers / totalQuestions) * 100).toFixed(2));
};

const calculateQuizScore = (answers = []) => {
  const totalPoints = answers.reduce((sum, answer) => sum + Number(answer.point || 0), 0);
  const earnedPoints = answers.reduce((sum, answer) => sum + Number(answer.score || 0), 0);
  const correctAnswers = answers.filter((answer) => answer.is_correct).length;

  return {
    totalPoints: Number(totalPoints.toFixed(2)),
    earnedPoints: Number(earnedPoints.toFixed(2)),
    accuracyRate: calculateAccuracyRate(correctAnswers, answers.length),
  };
};

module.exports = {
  calculateAccuracyRate,
  calculateQuizScore,
};
