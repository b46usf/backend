const { Router } = require('express');
const { z } = require('zod');
const { ROLES } = require('../../config/constants');
const { authenticate } = require('../../middlewares/auth.middleware');
const { authorize } = require('../../middlewares/role.middleware');
const { validate } = require('../../middlewares/validation.middleware');
const teacherController = require('./teacher.controller');

const router = Router();

const paramsSchema = {
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
};

const studentParamsSchema = {
  params: z.object({
    studentId: z.coerce.number().int().positive(),
  }),
};

router.use(authenticate, authorize(ROLES.ADMIN, ROLES.TEACHER));
router.get('/classes/dashboard', teacherController.getClassDashboard);
router.get('/students/:studentId/intervention', validate(studentParamsSchema), teacherController.getStudentIntervention);
router.get('/', teacherController.listTeachers);
router.get('/:id', validate(paramsSchema), teacherController.getTeacherById);

module.exports = router;
