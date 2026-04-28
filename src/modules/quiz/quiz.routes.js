const { Router } = require('express');
const { z } = require('zod');
const { LEVELS, QUIZ_TYPES, ROLES } = require('../../config/constants');
const { authenticate } = require('../../middlewares/auth.middleware');
const { authorize } = require('../../middlewares/role.middleware');
const { validate } = require('../../middlewares/validation.middleware');
const quizController = require('./quiz.controller');

const router = Router();

const querySchema = {
  query: z.object({
    subjectId: z.coerce.number().int().positive().optional(),
    level: z.enum(Object.values(LEVELS)).optional(),
    quizType: z.enum(Object.values(QUIZ_TYPES)).optional(),
  }),
};

const paramsSchema = {
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
};

const submitSchema = {
  body: z.object({
    timeSpentSeconds: z.coerce.number().int().min(0).default(0),
    answers: z.array(
      z.object({
        questionId: z.coerce.number().int().positive(),
        answer: z.string().default(''),
      }),
    ).min(1),
  }),
};

router.use(authenticate);
router.get('/', validate(querySchema), quizController.listQuizzes);
router.get('/:id', validate(paramsSchema), quizController.getQuizById);
router.post('/:id/submit', authorize(ROLES.STUDENT), validate({ ...paramsSchema, ...submitSchema }), quizController.submitQuiz);

module.exports = router;
