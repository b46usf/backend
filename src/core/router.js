const { Router } = require('express');
const { sendSuccess } = require('../shared/response');
const authRoutes = require('../modules/auth/auth.routes');
const adminRoutes = require('../modules/admin/admin.routes');
const studentRoutes = require('../modules/student/student.routes');
const teacherRoutes = require('../modules/teacher/teacher.routes');
const materialRoutes = require('../modules/material/material.routes');
const quizRoutes = require('../modules/quiz/quiz.routes');
const assessmentRoutes = require('../modules/assessment/assessment.routes');
const aiRoutes = require('../modules/ai/ai.routes');
const analyticsRoutes = require('../modules/analytics/analytics.routes');
const gamificationRoutes = require('../modules/gamification/gamification.routes');

const router = Router();

router.get('/', (_req, res) =>
  sendSuccess(res, {
    message: 'EduSense AI API is ready',
    data: {
      version: '1.0.0',
    },
  }),
);

router.use('/auth', authRoutes);
router.use('/admin', adminRoutes);
router.use('/students', studentRoutes);
router.use('/teachers', teacherRoutes);
router.use('/materials', materialRoutes);
router.use('/quizzes', quizRoutes);
router.use('/assessments', assessmentRoutes);
router.use('/ai', aiRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/gamification', gamificationRoutes);

module.exports = router;
