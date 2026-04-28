const asyncHandler = require('../../shared/asyncHandler');
const { sendSuccess } = require('../../shared/response');
const quizService = require('./quiz.service');

const listQuizzes = asyncHandler(async (req, res) => {
  const quizzes = await quizService.listQuizzes(req.query, req.user.schoolId);

  return sendSuccess(res, {
    message: 'Quizzes fetched successfully',
    data: quizzes,
    meta: {
      total: quizzes.length,
    },
  });
});

const getQuizById = asyncHandler(async (req, res) => {
  const quiz = await quizService.getQuizById(req.params.id, req.user.schoolId);

  return sendSuccess(res, {
    message: 'Quiz detail fetched successfully',
    data: quiz,
  });
});

const submitQuiz = asyncHandler(async (req, res) => {
  const result = await quizService.submitQuiz(req.user.id, req.user.schoolId, req.params.id, req.body);

  return sendSuccess(res, {
    message: 'Quiz submitted and assessed successfully',
    data: result,
  });
});

module.exports = {
  getQuizById,
  listQuizzes,
  submitQuiz,
};
