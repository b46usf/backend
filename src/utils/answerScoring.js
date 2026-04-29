const { calculateJaccardSimilarity, normalizeText } = require('./similarity');

const defaultBuildFeedback = (question, score, confidenceScore) => {
  if (question.question_type === 'multiple_choice') {
    return score > 0 ? 'Jawaban benar.' : 'Jawaban belum tepat.';
  }

  if (confidenceScore >= 80) {
    return 'Jawaban essay menunjukkan pemahaman yang kuat.';
  }

  if (confidenceScore >= 60) {
    return 'Jawaban essay cukup sesuai, tetapi masih bisa dilengkapi.';
  }

  return 'Jawaban essay perlu diperbaiki dengan kata kunci yang lebih relevan.';
};

const scoreMultipleChoice = (question, studentAnswer, buildFeedback = defaultBuildFeedback) => {
  const isCorrect = normalizeText(studentAnswer) === normalizeText(question.correct_answer);
  const score = isCorrect ? Number(question.point || 0) : 0;
  const confidenceScore = isCorrect ? 100 : 0;

  return {
    is_correct: isCorrect,
    score,
    confidence_score: confidenceScore,
    matched_keywords: [],
    ai_feedback: buildFeedback(question, score, confidenceScore),
  };
};

const scoreEssay = (question, studentAnswer, buildFeedback = defaultBuildFeedback) => {
  const keywordText = question.keywords || question.correct_answer || '';
  const keywords = keywordText
    .split(',')
    .map((keyword) => normalizeText(keyword))
    .filter(Boolean);
  const normalizedAnswer = normalizeText(studentAnswer);
  const matchedKeywords = keywords.filter((keyword) => normalizedAnswer.includes(keyword));
  const keywordScore = keywords.length ? (matchedKeywords.length / keywords.length) * 100 : 0;
  const similarityScore = calculateJaccardSimilarity(studentAnswer, question.correct_answer || question.keywords || '');
  const confidenceScore = Number(((keywordScore * 0.6) + (similarityScore * 0.4)).toFixed(2));
  const score = Number(((Number(question.point || 0) * confidenceScore) / 100).toFixed(2));

  return {
    is_correct: confidenceScore >= 70,
    score,
    confidence_score: confidenceScore,
    matched_keywords: matchedKeywords,
    ai_feedback: buildFeedback(question, score, confidenceScore),
  };
};

const scoreAnswer = (question, studentAnswer, buildFeedback = defaultBuildFeedback) =>
  question.question_type === 'multiple_choice'
    ? scoreMultipleChoice(question, studentAnswer, buildFeedback)
    : scoreEssay(question, studentAnswer, buildFeedback);

module.exports = {
  scoreAnswer,
  scoreEssay,
  scoreMultipleChoice,
};
