const asyncHandler = require('../../shared/asyncHandler');
const { paginateList } = require('../../shared/pagination');
const { sendSuccess } = require('../../shared/response');
const materialService = require('./material.service');

const listMaterials = asyncHandler(async (req, res) => {
  const materials = await materialService.listMaterials(req.query, req.user.schoolId);
  const result = paginateList(materials, req.query);

  return sendSuccess(res, {
    message: 'Materials fetched successfully',
    data: result.data,
    meta: result.meta,
  });
});

const getMaterialById = asyncHandler(async (req, res) => {
  const material = await materialService.getMaterialById(req.params.id, req.user.schoolId);

  return sendSuccess(res, {
    message: 'Material detail fetched successfully',
    data: material,
  });
});

const createMaterial = asyncHandler(async (req, res) => {
  const material = await materialService.createMaterial(req.user.schoolId, req.body);

  return sendSuccess(res, {
    statusCode: 201,
    message: 'Material created successfully',
    data: material,
  });
});

const updateMaterial = asyncHandler(async (req, res) => {
  const material = await materialService.updateMaterial(req.params.id, req.user.schoolId, req.body);

  return sendSuccess(res, {
    message: 'Material updated successfully',
    data: material,
  });
});

const deleteMaterial = asyncHandler(async (req, res) => {
  const result = await materialService.deleteMaterial(req.params.id, req.user.schoolId);

  return sendSuccess(res, {
    message: 'Material deleted successfully',
    data: result,
  });
});

module.exports = {
  createMaterial,
  deleteMaterial,
  getMaterialById,
  listMaterials,
  updateMaterial,
};
