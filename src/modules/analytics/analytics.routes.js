const { Router } = require('express');
const { z } = require('zod');
const { ROLES } = require('../../config/constants');
const { authenticate } = require('../../middlewares/auth.middleware');
const { authorize } = require('../../middlewares/role.middleware');
const { validate } = require('../../middlewares/validation.middleware');
const analyticsController = require('./analytics.controller');

const router = Router();

const studentParamsSchema = {
  params: z.object({
    studentId: z.coerce.number().int().positive(),
  }),
};

router.use(authenticate, authorize(ROLES.ADMIN, ROLES.TEACHER));
router.get('/dashboard', analyticsController.getDashboardOverview);
router.get('/students/:studentId', validate(studentParamsSchema), analyticsController.getStudentAnalytics);

module.exports = router;
