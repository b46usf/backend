const { Router } = require('express');
const { z } = require('zod');
const { ROLES } = require('../../config/constants');
const { authenticate } = require('../../middlewares/auth.middleware');
const { authorize } = require('../../middlewares/role.middleware');
const { validate } = require('../../middlewares/validation.middleware');
const adminController = require('./admin.controller');

const router = Router();

const classBodySchema = {
  body: z.object({
    name: z.string().min(1).max(50),
    homeroomTeacherId: z.coerce.number().int().positive().optional(),
    gradeLevel: z.string().max(20).optional(),
    academicYear: z.string().max(20).optional(),
  }),
};

const subjectBodySchema = {
  body: z.object({
    name: z.string().min(2).max(100),
    code: z.string().max(30).optional(),
    description: z.string().optional(),
  }),
};

router.use(authenticate, authorize(ROLES.ADMIN));
router.get('/classes', adminController.listClasses);
router.post('/classes', validate(classBodySchema), adminController.createClass);
router.get('/subjects', adminController.listSubjects);
router.post('/subjects', validate(subjectBodySchema), adminController.createSubject);

module.exports = router;
