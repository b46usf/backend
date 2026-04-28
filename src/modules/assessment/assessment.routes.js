const { Router } = require('express');
const { z } = require('zod');
const { ROLES } = require('../../config/constants');
const { authenticate } = require('../../middlewares/auth.middleware');
const { authorize } = require('../../middlewares/role.middleware');
const { validate } = require('../../middlewares/validation.middleware');
const assessmentController = require('./assessment.controller');

const router = Router();

const querySchema = {
  query: z.object({
    studentId: z.coerce.number().int().positive().optional(),
    quizId: z.coerce.number().int().positive().optional(),
  }),
};

const studentParamsSchema = {
  params: z.object({
    studentId: z.coerce.number().int().positive(),
  }),
};

router.use(authenticate, authorize(ROLES.ADMIN, ROLES.TEACHER));
router.get('/attempts', validate(querySchema), assessmentController.listAttempts);
router.get('/students/:studentId/summary', validate(studentParamsSchema), assessmentController.getStudentAssessmentSummary);

module.exports = router;
