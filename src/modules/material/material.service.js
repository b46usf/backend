const { NotFoundError } = require('../../shared/errors');
const materialRepository = require('./material.repository');

const listMaterials = async (filters, schoolId) => materialRepository.findMaterials(filters, schoolId);

const getMaterialById = async (materialId, schoolId) => {
  const material = await materialRepository.findMaterialById(materialId, schoolId);

  if (!material) {
    throw new NotFoundError('Material not found');
  }

  return material;
};

const createMaterial = async (schoolId, payload) => {
  const material = await materialRepository.createMaterial({ ...payload, schoolId });

  if (!material) {
    throw new NotFoundError('Subject not found');
  }

  return material;
};

const updateMaterial = async (materialId, schoolId, payload) => {
  const material = await materialRepository.updateMaterial(materialId, { ...payload, schoolId });

  if (!material) {
    throw new NotFoundError('Material not found');
  }

  return material;
};

const deleteMaterial = async (materialId, schoolId) => {
  const deleted = await materialRepository.deleteMaterial(materialId, schoolId);

  if (!deleted) {
    throw new NotFoundError('Material not found');
  }

  return {
    id: materialId,
    deleted: true,
  };
};

module.exports = {
  createMaterial,
  deleteMaterial,
  getMaterialById,
  listMaterials,
  updateMaterial,
};
