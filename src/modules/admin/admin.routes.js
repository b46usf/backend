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

const importUsersSchema = {
  body: z.object({
    users: z.array(
      z.object({
        name: z.string().min(3).max(120),
        email: z.string().email(),
        password: z.string().min(8).max(72),
        role: z.enum([ROLES.TEACHER, ROLES.STUDENT]).default(ROLES.STUDENT),
        classId: z.coerce.number().int().positive().optional(),
        studentNumber: z.string().max(50).optional(),
        employeeNumber: z.string().max(50).optional(),
        specialization: z.string().max(100).optional(),
      }),
    ).min(1).max(100),
  }),
};

const passwordBodySchema = {
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
  body: z.object({
    password: z.string().min(8).max(72),
  }),
};

router.use(authenticate, authorize(ROLES.ADMIN));
router.get('/classes', adminController.listClasses);
router.post('/classes', validate(classBodySchema), adminController.createClass);
router.get('/subjects', adminController.listSubjects);
router.post('/subjects', validate(subjectBodySchema), adminController.createSubject);
router.post('/users/import', validate(importUsersSchema), adminController.importUsers);
router.patch('/users/:id/password', validate(passwordBodySchema), adminController.resetUserPassword);

module.exports = router;
