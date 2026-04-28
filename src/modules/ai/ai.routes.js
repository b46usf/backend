const { Router } = require('express');
const { z } = require('zod');
const { RECOMMENDATION_STATUSES, ROLES } = require('../../config/constants');
const { authenticate } = require('../../middlewares/auth.middleware');
const { authorize } = require('../../middlewares/role.middleware');
const { validate } = require('../../middlewares/validation.middleware');
const aiController = require('./ai.controller');

const router = Router();

const querySchema = {
  query: z.object({
    studentId: z.coerce.number().int().positive().optional(),
    status: z.enum(Object.values(RECOMMENDATION_STATUSES)).optional(),
  }),
};

const riskQuerySchema = {
  query: z.object({
    classId: z.coerce.number().int().positive().optional(),
  }),
};

const studentParamsSchema = {
  params: z.object({
    studentId: z.coerce.number().int().positive(),
  }),
};

const feedbackQuerySchema = {
  query: z.object({
    attemptId: z.coerce.number().int().positive().optional(),
  }),
};

const diagnosticSubmitSchema = {
  body: z.object({
    quizId: z.coerce.number().int().positive(),
    timeSpentSeconds: z.coerce.number().int().min(0).default(0),
    answers: z.array(
      z.object({
        questionId: z.coerce.number().int().positive(),
        answer: z.string().default(''),
      }),
    ).min(1).max(10),
  }),
};

router.use(authenticate);

router.get('/diagnostic', authorize(ROLES.STUDENT), aiController.getDiagnosticScreen);
router.post('/diagnostic/submit', authorize(ROLES.STUDENT), validate(diagnosticSubmitSchema), aiController.submitDiagnostic);
router.get('/learning-path/me', authorize(ROLES.STUDENT), aiController.getMyLearningPath);
router.get('/feedback-card/me', authorize(ROLES.STUDENT), validate(feedbackQuerySchema), aiController.getMyFeedbackCard);
router.get('/performance/me', authorize(ROLES.STUDENT), aiController.getMyPerformanceTrend);

router.get(
  '/students/:studentId/performance',
  authorize(ROLES.ADMIN, ROLES.TEACHER),
  validate(studentParamsSchema),
  aiController.getStudentPerformanceTrend,
);
router.get(
  '/risk-students',
  authorize(ROLES.ADMIN, ROLES.TEACHER),
  validate(riskQuerySchema),
  aiController.getRiskStudentDetection,
);
router.get(
  '/recommendations',
  authorize(ROLES.ADMIN, ROLES.TEACHER),
  validate(querySchema),
  aiController.listRecommendations,
);
router.get(
  '/students/:studentId/overview',
  authorize(ROLES.ADMIN, ROLES.TEACHER),
  validate(studentParamsSchema),
  aiController.getStudentAiOverview,
);

module.exports = router;
