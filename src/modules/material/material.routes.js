const { Router } = require('express');
const { z } = require('zod');
const { LEVELS, ROLES } = require('../../config/constants');
const { authenticate } = require('../../middlewares/auth.middleware');
const { authorize } = require('../../middlewares/role.middleware');
const { validate } = require('../../middlewares/validation.middleware');
const materialController = require('./material.controller');

const router = Router();

const querySchema = {
  query: z.object({
    subjectId: z.coerce.number().int().positive().optional(),
    level: z.enum(Object.values(LEVELS)).optional(),
  }),
};

const paramsSchema = {
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
};

const materialBodySchema = {
  body: z.object({
    subjectId: z.coerce.number().int().positive(),
    title: z.string().min(3).max(150),
    content: z.string().optional(),
    level: z.enum(Object.values(LEVELS)).default(LEVELS.BASIC),
    mediaUrl: z.string().max(255).optional(),
    estimatedMinutes: z.coerce.number().int().positive().default(10),
  }),
};

router.use(authenticate);
router.get('/', validate(querySchema), materialController.listMaterials);
router.post('/', authorize(ROLES.ADMIN, ROLES.TEACHER), validate(materialBodySchema), materialController.createMaterial);
router.get('/:id', validate(paramsSchema), materialController.getMaterialById);
router.put(
  '/:id',
  authorize(ROLES.ADMIN, ROLES.TEACHER),
  validate({ ...paramsSchema, ...materialBodySchema }),
  materialController.updateMaterial,
);
router.delete('/:id', authorize(ROLES.ADMIN, ROLES.TEACHER), validate(paramsSchema), materialController.deleteMaterial);

module.exports = router;
