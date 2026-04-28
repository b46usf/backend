const { LEVELS } = require('../../config/constants');
const { withTransaction } = require('../../config/db');
const { BadRequestError, NotFoundError } = require('../../shared/errors');
const { calculateQuizScore } = require('../../utils/scoring');
const { resolveLevelFromAccuracy, resolvePerformanceTrend } = require('../../utils/levelEngine');
const { calculateJaccardSimilarity, normalizeText } = require('../../utils/similarity');
const aiRepository = require('./ai.repository');

const listRecommendations = async (filters, schoolId) => aiRepository.findRecommendations(filters, schoolId);

const getStudentAiOverview = async (studentId, schoolId) => {
  const [summary, recommendations] = await Promise.all([
    aiRepository.findStudentRecommendationSummary(studentId, schoolId),
    aiRepository.findRecommendations({ studentId }, schoolId),
  ]);

  return {
    total_recommendations: Number(summary?.total_recommendations || 0),
    pending_recommendations: Number(summary?.pending_recommendations || 0),
    high_priority_recommendations: Number(summary?.high_priority_recommendations || 0),
    items: recommendations,
  };
};

const resolveRiskStatus = ({ accuracyRate, averageScore = accuracyRate, attemptCount = 1 }) => {
  if (accuracyRate < 50 || averageScore < 50 || attemptCount === 0) {
    return 'danger';
  }

  if (accuracyRate < 70 || averageScore < 70) {
    return 'warning';
  }

  return 'safe';
};

const toRiskCategory = (riskStatus) => {
  if (riskStatus === 'danger') {
    return {
      code: 'red',
      label: 'Merah',
      status: 'Perlu Intervensi',
    };
  }

  if (riskStatus === 'warning') {
    return {
      code: 'yellow',
      label: 'Kuning',
      status: 'Perlu Dipantau',
    };
  }

  return {
    code: 'green',
    label: 'Hijau',
    status: 'Aman',
  };
};

const buildAnswerFeedback = (question, score, confidenceScore) => {
  if (question.question_type === 'multiple_choice') {
    return score > 0 ? 'Jawaban benar.' : 'Jawaban belum tepat. Pelajari kembali konsep terkait.';
  }

  if (confidenceScore >= 80) {
    return 'Jawaban essay menunjukkan pemahaman yang kuat.';
  }

  if (confidenceScore >= 60) {
    return 'Jawaban essay cukup baik, tetapi alasan dan kata kunci masih bisa diperkuat.';
  }

  return 'Jawaban essay masih perlu dilengkapi dengan konsep utama dan contoh yang relevan.';
};

const scoreMultipleChoice = (question, studentAnswer) => {
  const isCorrect = normalizeText(studentAnswer) === normalizeText(question.correct_answer);
  const score = isCorrect ? Number(question.point || 0) : 0;

  return {
    is_correct: isCorrect,
    score,
    confidence_score: isCorrect ? 100 : 0,
    ai_feedback: buildAnswerFeedback(question, score, isCorrect ? 100 : 0),
  };
};

const scoreEssay = (question, studentAnswer) => {
  const keywordText = question.keywords || question.correct_answer || '';
  const keywords = keywordText
    .split(',')
    .map((keyword) => normalizeText(keyword))
    .filter(Boolean);
  const normalizedAnswer = normalizeText(studentAnswer);
  const matchedKeywords = keywords.filter((keyword) => normalizedAnswer.includes(keyword)).length;
  const keywordScore = keywords.length ? (matchedKeywords / keywords.length) * 100 : 0;
  const similarityScore = calculateJaccardSimilarity(studentAnswer, question.correct_answer || question.keywords || '');
  const confidenceScore = Number(((keywordScore * 0.6) + (similarityScore * 0.4)).toFixed(2));
  const score = Number(((Number(question.point || 0) * confidenceScore) / 100).toFixed(2));

  return {
    is_correct: confidenceScore >= 70,
    score,
    confidence_score: confidenceScore,
    ai_feedback: buildAnswerFeedback(question, score, confidenceScore),
  };
};

const scoreAnswer = (question, studentAnswer) =>
  question.question_type === 'multiple_choice'
    ? scoreMultipleChoice(question, studentAnswer)
    : scoreEssay(question, studentAnswer);

const getCurrentStudent = async (userId, schoolId, executor) => {
  const student = await aiRepository.findStudentByUserId(userId, schoolId, executor);

  if (!student) {
    throw new NotFoundError('Student profile not found');
  }

  return student;
};

const getDiagnosticScreen = async (userId, schoolId) => {
  const student = await getCurrentStudent(userId, schoolId);
  const quiz = await aiRepository.findDiagnosticQuiz(student.current_level, schoolId);

  if (!quiz) {
    throw new NotFoundError('Diagnostic quiz is not available');
  }

  const questions = await aiRepository.findDiagnosticQuestions(quiz.id, 10);

  return {
    title: 'Tes Diagnostik AI',
    purpose: 'Mengukur kemampuan awal siswa dan menentukan level awal.',
    quiz: {
      id: quiz.id,
      title: quiz.title,
      level: quiz.level,
      duration_minutes: quiz.duration_minutes,
    },
    adaptive_rules: {
      question_count: questions.length,
      target_count: 10,
      estimated_result: ['basic', 'intermediate', 'advanced'],
    },
    student_estimate: {
      current_level: student.current_level,
      risk_status: student.risk_status,
    },
    questions,
  };
};

const submitDiagnostic = async (userId, schoolId, payload) =>
  withTransaction(async (connection) => {
    const student = await getCurrentStudent(userId, schoolId, connection);
    const questionIds = payload.answers.map((answer) => Number(answer.questionId));
    const questions = await aiRepository.findQuestionsForScoring(payload.quizId, questionIds, schoolId, connection);

    if (!questions.length) {
      throw new BadRequestError('Diagnostic answers do not match available questions');
    }

    const answerMap = new Map(payload.answers.map((answer) => [Number(answer.questionId), answer.answer || '']));
    const scoredAnswers = questions.map((question) => {
      const studentAnswer = answerMap.get(Number(question.id)) || '';

      return {
        question_id: question.id,
        question_text: question.question_text,
        question_type: question.question_type,
        difficulty: question.difficulty,
        student_answer: studentAnswer,
        point: Number(question.point || 0),
        ...scoreAnswer(question, studentAnswer),
      };
    });
    const scoreSummary = calculateQuizScore(scoredAnswers);
    const scorePercent = scoreSummary.totalPoints
      ? Number(((scoreSummary.earnedPoints / scoreSummary.totalPoints) * 100).toFixed(2))
      : 0;
    const level = resolveLevelFromAccuracy(scoreSummary.accuracyRate);
    const riskStatus = resolveRiskStatus({ accuracyRate: scoreSummary.accuracyRate, averageScore: scorePercent });
    const previousAttempt = await aiRepository.findLatestAttempt(student.id, connection);
    const performanceTrend = resolvePerformanceTrend(previousAttempt?.score || scorePercent, scorePercent);
    const attemptCount = await aiRepository.countStudentQuizAttempts(student.id, payload.quizId, connection);
    const attempt = await aiRepository.createQuizAttempt(
      {
        studentId: student.id,
        quizId: payload.quizId,
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
      await aiRepository.createAnswer(
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

    await aiRepository.updateStudentAiStatus(
      {
        studentId: student.id,
        level,
        riskStatus,
        earnedPoints: scoreSummary.earnedPoints,
        accuracyRate: scoreSummary.accuracyRate,
      },
      connection,
    );

    return {
      attempt_id: attempt.id,
      score: scorePercent,
      accuracy_rate: scoreSummary.accuracyRate,
      estimated_ability: scorePercent,
      initial_level: level,
      risk_status: riskStatus,
      risk_category: toRiskCategory(riskStatus),
      performance_trend: performanceTrend,
      feedback: scoredAnswers,
    };
  });

const getPersonalizedLearningPath = async (userId, schoolId) => {
  const student = await getCurrentStudent(userId, schoolId);
  const [materials, progressMap] = await Promise.all([
    aiRepository.findLearningPathMaterials(student.current_level, schoolId),
    aiRepository.findStudentProgressMap(student.id),
  ]);
  const materialNodes = materials.slice(0, 3).map((material, index) => {
    const progress = progressMap.get(Number(material.id));

    return {
      id: `material-${material.id}`,
      type: index === 0 ? 'core_material' : 'advanced_material',
      label: index === 0 ? 'Materi Dasar' : index === 1 ? 'Materi Lanjutan' : 'Challenge Material',
      title: material.title,
      material_id: material.id,
      subject_name: material.subject_name,
      level: material.level,
      status: progress?.status || 'not_started',
      progress_percent: Number(progress?.progress_percent || 0),
    };
  });
  const nodes = [
    { id: 'start', type: 'start', label: 'Start', status: 'completed' },
    materialNodes[0] || { id: 'material-basic', type: 'core_material', label: 'Materi Dasar', status: 'locked' },
    { id: 'practice-1', type: 'practice', label: 'Latihan 1', status: student.total_score > 0 ? 'available' : 'locked' },
    { id: 'adaptive-quiz', type: 'adaptive_quiz', label: 'Kuis Adaptif', status: 'available' },
    materialNodes[1] || { id: 'material-next', type: 'advanced_material', label: 'Materi Lanjutan', status: 'locked' },
    { id: 'challenge', type: 'challenge', label: 'Challenge', status: student.current_level === LEVELS.ADVANCED ? 'available' : 'locked' },
    { id: 'mastery-badge', type: 'badge', label: 'Mastery Badge', status: student.current_level === LEVELS.ADVANCED ? 'available' : 'locked' },
  ];

  return {
    student_id: student.id,
    current_level: student.current_level,
    map_style: 'game_map',
    path: nodes.map((node, index) => ({
      order: index + 1,
      ...node,
      next: nodes[index + 1]?.id || null,
    })),
  };
};

const buildInsight = ({ score, level, trend, weakAreas }) => {
  const strength = score >= 80 ? 'Kamu kuat di konsep dasar' : 'Pemahaman dasar sudah mulai terbentuk';
  const weakness = weakAreas.length
    ? `tetapi masih lemah pada ${weakAreas.join(', ')}`
    : 'dan belum ada kelemahan dominan dari percobaan ini';

  return `${strength}, ${weakness}. Level saat ini ${level} dengan trend ${trend}.`;
};

const getFeedbackCard = async (userId, schoolId, attemptId) => {
  const student = await getCurrentStudent(userId, schoolId);
  const attempt = await aiRepository.findLatestFeedbackAttempt(student.id, attemptId);

  if (!attempt) {
    throw new NotFoundError('Quiz attempt feedback not found');
  }

  const answers = await aiRepository.findAttemptAnswerInsights(attempt.id);
  const weakAreas = [...new Set(
    answers
      .filter((answer) => !answer.is_correct || Number(answer.confidence_score || 0) < 70)
      .map((answer) => answer.difficulty === 'hard' ? 'soal analisis' : answer.question_type === 'essay' ? 'jawaban essay' : 'konsep dasar'),
  )];
  const recommendation = await aiRepository.findRecommendedMaterialForStudent(
    student.id,
    attempt.ai_level_result || student.current_level,
    schoolId,
  );

  return {
    attempt_id: attempt.id,
    quiz_id: attempt.quiz_id,
    quiz_title: attempt.quiz_title,
    score: Number(attempt.score || 0),
    level: attempt.ai_level_result || student.current_level,
    trend: attempt.performance_trend,
    accuracy_rate: Number(attempt.accuracy_rate || 0),
    ai_insight: buildInsight({
      score: Number(attempt.score || 0),
      level: attempt.ai_level_result || student.current_level,
      trend: attempt.performance_trend,
      weakAreas,
    }),
    recommendation: recommendation
      ? `Pelajari ulang ${recommendation.material_title} dan kerjakan latihan penguatan.`
      : 'Kerjakan latihan penguatan sesuai level saat ini.',
    weak_areas: weakAreas,
    answers,
  };
};

const calculateConsistency = (series) => {
  if (series.length < 2) {
    return series.length ? 80 : 0;
  }

  const scores = series.map((item) => Number(item.score || 0));
  const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;
  const variance = scores.reduce((sum, score) => sum + ((score - average) ** 2), 0) / scores.length;
  const standardDeviation = Math.sqrt(variance);

  return Number(Math.max(0, 100 - standardDeviation).toFixed(2));
};

const getPerformanceTrendDashboard = async (studentId, schoolId) => {
  const student = await aiRepository.findStudentById(studentId, schoolId);

  if (!student) {
    throw new NotFoundError('Student profile not found');
  }

  const trend = await aiRepository.getPerformanceTrend(studentId);
  const attemptCount = Number(trend.summary.attempt_count || 0);
  const consistency = calculateConsistency(trend.series);
  const engagement = Number(
    Math.min(
      100,
      (Number(trend.progress.average_progress || 0) * 0.5) +
        (Number(trend.summary.recent_attempt_count || 0) * 10) +
        (Number(trend.progress.completed_materials || 0) * 5),
    ).toFixed(2),
  );

  return {
    student: {
      id: student.id,
      name: student.name,
      class_name: student.class_name,
      current_level: student.current_level,
      risk_status: student.risk_status,
    },
    metrics: {
      average_score: Number(Number(trend.summary.average_score || 0).toFixed(2)),
      accuracy: Number(Number(trend.summary.average_accuracy || 0).toFixed(2)),
      average_time_spent_seconds: Number(Number(trend.summary.average_time_spent_seconds || 0).toFixed(2)),
      attempt_count: attemptCount,
      consistency,
      engagement,
    },
    trend_series: trend.series,
  };
};

const getMyPerformanceTrendDashboard = async (userId, schoolId) => {
  const student = await getCurrentStudent(userId, schoolId);
  return getPerformanceTrendDashboard(student.id, schoolId);
};

const getRiskStudentDetection = async (filters, schoolId) => {
  const students = await aiRepository.findRiskStudents(filters, schoolId);

  return students.map((student) => {
    const averageScore = Number(student.average_score || 0);
    const averageAccuracy = Number(student.average_accuracy || 0);
    const attemptCount = Number(student.attempt_count || 0);
    const computedRisk = resolveRiskStatus({
      accuracyRate: averageAccuracy,
      averageScore,
      attemptCount,
    });
    const riskStatus = student.risk_status === 'danger' || computedRisk === 'danger'
      ? 'danger'
      : student.risk_status === 'warning' || computedRisk === 'warning'
        ? 'warning'
        : 'safe';

    return {
      student_id: student.id,
      name: student.name,
      class_id: student.class_id,
      class_name: student.class_name,
      current_level: student.current_level,
      risk_status: riskStatus,
      risk_category: toRiskCategory(riskStatus),
      metrics: {
        average_score: Number(averageScore.toFixed(2)),
        accuracy: Number(averageAccuracy.toFixed(2)),
        average_time_spent_seconds: Number(Number(student.average_time_spent_seconds || 0).toFixed(2)),
        attempt_count: attemptCount,
        average_progress: Number(Number(student.average_progress || 0).toFixed(2)),
      },
      decision_support:
        riskStatus === 'danger'
          ? 'Perlu intervensi guru dan remedial terarah.'
          : riskStatus === 'warning'
            ? 'Pantau progres dan beri latihan penguatan.'
            : 'Aman, lanjutkan jalur belajar personal.',
    };
  });
};

module.exports = {
  getDiagnosticScreen,
  getFeedbackCard,
  getMyPerformanceTrendDashboard,
  getPerformanceTrendDashboard,
  getPersonalizedLearningPath,
  getRiskStudentDetection,
  getStudentAiOverview,
  listRecommendations,
  submitDiagnostic,
};
