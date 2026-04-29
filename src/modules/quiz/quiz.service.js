const { BadRequestError, NotFoundError } = require('../../shared/errors');
const { withTransaction } = require('../../config/db');
const { LEVELS } = require('../../config/constants');
const { calculateQuizScore } = require('../../utils/scoring');
const { resolveLevelFromAccuracy, resolvePerformanceTrend } = require('../../utils/levelEngine');
const { scoreAnswer } = require('../../utils/answerScoring');
const quizRepository = require('./quiz.repository');

const listQuizzes = async (filters, schoolId) => quizRepository.findQuizzes(filters, schoolId);

const getQuizById = async (quizId, schoolId) => {
  const quiz = await quizRepository.findQuizById(quizId, schoolId);

  if (!quiz) {
    throw new NotFoundError('Quiz not found');
  }

  const questions = await quizRepository.findQuizQuestions(quizId);

  return {
    ...quiz,
    questions,
  };
};

const createQuiz = async (schoolId, payload) =>
  withTransaction(async (connection) => {
    const quiz = await quizRepository.createQuiz({ ...payload, schoolId }, connection);

    if (!quiz) {
      throw new NotFoundError('Subject not found');
    }

    for (const question of payload.questions) {
      if (question.questionType === 'multiple_choice' && !question.correctAnswer) {
        throw new BadRequestError('correctAnswer is required for multiple choice questions');
      }

      await quizRepository.createQuestion(
        {
          quizId: quiz.id,
          questionText: question.questionText,
          questionType: question.questionType,
          optionA: question.optionA,
          optionB: question.optionB,
          optionC: question.optionC,
          optionD: question.optionD,
          correctAnswer: question.correctAnswer,
          keywords: question.keywords,
          point: question.point,
          difficulty: question.difficulty,
        },
        connection,
      );
    }

    const createdQuiz = await quizRepository.findQuizById(quiz.id, schoolId, connection);
    const questions = await quizRepository.findQuizQuestions(quiz.id, connection);

    return {
      ...createdQuiz,
      questions,
    };
  });

const resolveRiskStatus = (accuracyRate) => {
  if (accuracyRate < 50) {
    return 'danger';
  }

  if (accuracyRate < 70) {
    return 'warning';
  }

  return 'safe';
};

const buildFeedback = (question, score, confidenceScore) => {
  if (question.question_type === 'multiple_choice') {
    return score > 0 ? 'Jawaban benar.' : 'Jawaban belum tepat. Pelajari kembali materi terkait.';
  }

  if (confidenceScore >= 80) {
    return 'Jawaban essay sangat sesuai dengan kata kunci dan konteks.';
  }

  if (confidenceScore >= 60) {
    return 'Jawaban essay cukup sesuai, tetapi masih bisa dilengkapi.';
  }

  return 'Jawaban essay perlu diperbaiki dengan kata kunci dan penjelasan yang lebih relevan.';
};

const getBadgeRule = (level, accuracyRate) => {
  if (level === LEVELS.ADVANCED && accuracyRate >= 85) {
    return {
      name: 'Advanced Learner',
      description: 'Mencapai level advanced dari hasil kuis adaptif.',
      requirement: 'Accuracy rate minimal 85%',
    };
  }

  if (accuracyRate >= 70) {
    return {
      name: 'Consistent Learner',
      description: 'Menunjukkan pemahaman yang konsisten dalam kuis.',
      requirement: 'Accuracy rate minimal 70%',
    };
  }

  return null;
};

const ensureBadge = async (studentId, schoolId, badgeRule, connection) => {
  if (!badgeRule) {
    return null;
  }

  const badge = (await quizRepository.findBadgeByName(badgeRule.name, schoolId, connection)) ||
    (await quizRepository.createBadge({ ...badgeRule, schoolId }, connection));

  if (await quizRepository.studentHasBadge(studentId, schoolId, badge.id, connection)) {
    return null;
  }

  await quizRepository.awardBadge(studentId, schoolId, badge.id, connection);
  return badge;
};

const submitQuiz = async (userId, schoolId, quizId, payload) =>
  withTransaction(async (connection) => {
    const student = await quizRepository.findStudentByUserId(userId, schoolId, connection);
    const quiz = await quizRepository.findQuizById(quizId, schoolId, connection);
    const questions = await quizRepository.findQuizQuestionsForScoring(quizId, connection);

    if (!student) {
      throw new NotFoundError('Student profile not found');
    }

    if (!quiz) {
      throw new NotFoundError('Quiz not found');
    }

    const answerMap = new Map(payload.answers.map((answer) => [Number(answer.questionId), answer.answer]));
    const scoredAnswers = questions.map((question) => {
      const studentAnswer = answerMap.get(Number(question.id)) || '';
      const result = scoreAnswer(question, studentAnswer, buildFeedback);

      return {
        question_id: question.id,
        question_text: question.question_text,
        question_type: question.question_type,
        student_answer: studentAnswer,
        point: Number(question.point || 0),
        ...result,
      };
    });
    const scoreSummary = calculateQuizScore(scoredAnswers);
    const scorePercent = scoreSummary.totalPoints
      ? Number(((scoreSummary.earnedPoints / scoreSummary.totalPoints) * 100).toFixed(2))
      : 0;
    const level = resolveLevelFromAccuracy(scoreSummary.accuracyRate);
    const riskStatus = resolveRiskStatus(scoreSummary.accuracyRate);
    const previousAttempt = await quizRepository.findLatestAttemptScore(student.id, connection);
    const performanceTrend = resolvePerformanceTrend(previousAttempt?.score || scorePercent, scorePercent);
    const attemptCount = await quizRepository.countStudentQuizAttempts(student.id, quizId, connection);
    const attempt = await quizRepository.createQuizAttempt(
      {
        studentId: student.id,
        quizId,
        score: scorePercent,
        accuracyRate: scoreSummary.accuracyRate,
        timeSpentSeconds: payload.timeSpentSeconds,
        attemptNumber: attemptCount + 1,
        aiLevelResult: level,
        performanceTrend,
      },
      connection,
    );

    for (const answer of scoredAnswers) {
      await quizRepository.createAnswer(
        {
          attemptId: attempt.id,
          questionId: answer.question_id,
          studentAnswer: answer.student_answer,
          isCorrect: answer.is_correct,
          score: answer.score,
          confidenceScore: answer.confidence_score,
          aiFeedback: answer.ai_feedback,
        },
        connection,
      );
    }

    await quizRepository.updateStudentAfterAttempt(
      {
        studentId: student.id,
        level,
        riskStatus,
        earnedPoints: scoreSummary.earnedPoints,
        accuracyRate: scoreSummary.accuracyRate,
      },
      connection,
    );

    const recommendedMaterial = await quizRepository.findNextRecommendedMaterial(
      {
        subjectId: quiz.subject_id,
        level,
      },
      connection,
    );

    await quizRepository.createRecommendation(
      {
        studentId: student.id,
        materialId: recommendedMaterial?.id,
        recommendationType: level === LEVELS.BASIC ? 'remedial' : 'next_material',
        reason: `AI menilai akurasi ${scoreSummary.accuracyRate}% dan menyarankan jalur level ${level}.`,
        priority: riskStatus === 'danger' ? 'high' : riskStatus === 'warning' ? 'medium' : 'low',
      },
      connection,
    );

    const awardedBadge = await ensureBadge(student.id, schoolId, getBadgeRule(level, scoreSummary.accuracyRate), connection);

    return {
      attempt_id: attempt.id,
      quiz_id: quizId,
      score: scorePercent,
      earned_points: scoreSummary.earnedPoints,
      total_points: scoreSummary.totalPoints,
      accuracy_rate: scoreSummary.accuracyRate,
      confidence_score: Number(
        (
          scoredAnswers.reduce((sum, answer) => sum + answer.confidence_score, 0) / (scoredAnswers.length || 1)
        ).toFixed(2),
      ),
      ai_level_result: level,
      risk_status: riskStatus,
      performance_trend: performanceTrend,
      next_learning_path: recommendedMaterial
        ? {
            material_id: recommendedMaterial.id,
            title: recommendedMaterial.title,
            level,
          }
        : null,
      awarded_badge: awardedBadge,
      feedback: scoredAnswers,
    };
  });

module.exports = {
  createQuiz,
  getQuizById,
  listQuizzes,
  submitQuiz,
};
