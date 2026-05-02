const { Router } = require('express');
const { z } = require('zod');
const { ROLES, TEACHER_POSITIONS } = require('../../config/constants');
const { authenticate } = require('../../middlewares/auth.middleware');
const { loginRateLimiter } = require('../../middlewares/rateLimit.middleware');
const { authorize } = require('../../middlewares/role.middleware');
const { validate } = require('../../middlewares/validation.middleware');
const authController = require('./auth.controller');

const router = Router();

const registerSchema = {
  body: z.object({
    name: z.string().min(3).max(120),
    email: z.string().email(),
    password: z.string().min(8).max(72),
    role: z.enum([ROLES.TEACHER, ROLES.STUDENT]).default(ROLES.STUDENT),
    avatar: z.string().max(255).optional(),
    classId: z.coerce.number().int().positive().optional(),
    studentNumber: z.string().max(50).optional(),
    employeeNumber: z.string().max(50).optional(),
    position: z.enum(Object.values(TEACHER_POSITIONS)).optional(),
    specialization: z.string().max(100).optional(),
  }),
};

const loginSchema = {
  body: z.object({
    email: z.string().email(),
    password: z.string().min(1),
  }),
};

const userParamsSchema = {
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
};

router.post('/register', validate(registerSchema), authController.register);
router.post('/google/login', authController.googleAuthDisabled);
router.post('/google/register', authController.googleAuthDisabled);
router.post('/login', loginRateLimiter, validate(loginSchema), authController.login);
router.get('/me', authenticate, authController.me);
router.patch(
  '/users/:id/verify',
  authenticate,
  authorize(ROLES.ADMIN),
  validate(userParamsSchema),
  authController.verifyUserByAdmin,
);

module.exports = router;
