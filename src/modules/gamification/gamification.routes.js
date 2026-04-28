const { Router } = require('express');
const { z } = require('zod');
const { authenticate } = require('../../middlewares/auth.middleware');
const { validate } = require('../../middlewares/validation.middleware');
const gamificationController = require('./gamification.controller');

const router = Router();

const leaderboardQuerySchema = {
  query: z.object({
    limit: z.coerce.number().int().positive().max(100).default(10),
  }),
};

const studentParamsSchema = {
  params: z.object({
    studentId: z.coerce.number().int().positive(),
  }),
};

router.use(authenticate);
router.get('/leaderboard', validate(leaderboardQuerySchema), gamificationController.getLeaderboard);
router.get('/students/:studentId/badges', validate(studentParamsSchema), gamificationController.getStudentBadges);

module.exports = router;
