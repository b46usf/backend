const { Router } = require('express');
const { z } = require('zod');
const { LEVELS, PROGRESS_STATUSES, RISK_STATUSES, ROLES } = require('../../config/constants');
const { authenticate } = require('../../middlewares/auth.middleware');
const { authorize } = require('../../middlewares/role.middleware');
const { validate } = require('../../middlewares/validation.middleware');
const { paginationQueryShape } = require('../../shared/pagination');
const studentController = require('./student.controller');

const router = Router();

const querySchema = {
  query: z.object({
    ...paginationQueryShape,
    classId: z.coerce.number().int().positive().optional(),
    level: z.enum(Object.values(LEVELS)).optional(),
    riskStatus: z.enum(Object.values(RISK_STATUSES)).optional(),
  }),
};

const paginationSchema = {
  query: z.object(paginationQueryShape),
};

const paramsSchema = {
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
};

const materialParamsSchema = {
  params: z.object({
    materialId: z.coerce.number().int().positive(),
  }),
};

const progressSchema = {
  body: z.object({
    status: z.enum(Object.values(PROGRESS_STATUSES)),
    progressPercent: z.coerce.number().min(0).max(100),
    timeSpentSeconds: z.coerce.number().int().min(0).default(0),
  }),
};

router.use(authenticate);
router.get('/me/dashboard', authorize(ROLES.STUDENT), studentController.getMyDashboard);
router.get('/me/recommendations', authorize(ROLES.STUDENT), validate(paginationSchema), studentController.getMyRecommendations);
router.get('/me/progress', authorize(ROLES.STUDENT), validate(paginationSchema), studentController.getMyProgress);
router.put(
  '/me/materials/:materialId/progress',
  authorize(ROLES.STUDENT),
  validate({ ...materialParamsSchema, ...progressSchema }),
  studentController.updateMyMaterialProgress,
);
router.get('/me/badges', authorize(ROLES.STUDENT), validate(paginationSchema), studentController.getMyBadges);
router.get('/', authorize(ROLES.ADMIN, ROLES.TEACHER), validate(querySchema), studentController.listStudents);
router.get('/:id', authorize(ROLES.ADMIN, ROLES.TEACHER), validate(paramsSchema), studentController.getStudentById);

module.exports = router;
