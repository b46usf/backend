const { pool } = require('../../config/db');

const buildMaterialFilters = (filters, schoolId) => {
  const clauses = ['s.school_id = ?'];
  const params = [schoolId];

  if (filters.subjectId) {
    clauses.push('m.subject_id = ?');
    params.push(filters.subjectId);
  }

  if (filters.level) {
    clauses.push('m.level = ?');
    params.push(filters.level);
  }

  return {
    whereClause: clauses.length ? `WHERE ${clauses.join(' AND ')}` : '',
    params,
  };
};

const findMaterials = async (filters = {}, schoolId, executor = pool) => {
  const { whereClause, params } = buildMaterialFilters(filters, schoolId);
  const [rows] = await executor.execute(
    `
      SELECT
        m.id,
        m.subject_id,
        s.school_id,
        m.title,
        m.level,
        m.media_url,
        m.estimated_minutes,
        m.created_at,
        s.name AS subject_name,
        s.code AS subject_code
      FROM materials m
      INNER JOIN subjects s ON s.id = m.subject_id
      ${whereClause}
      ORDER BY m.created_at DESC
    `,
    params,
  );

  return rows;
};

const findMaterialById = async (materialId, schoolId, executor = pool) => {
  const [rows] = await executor.execute(
    `
      SELECT
        m.id,
        m.subject_id,
        s.school_id,
        m.title,
        m.content,
        m.level,
        m.media_url,
        m.estimated_minutes,
        m.created_at,
        s.name AS subject_name,
        s.code AS subject_code,
        s.description AS subject_description
      FROM materials m
      INNER JOIN subjects s ON s.id = m.subject_id
      WHERE m.id = ? AND s.school_id = ?
      LIMIT 1
    `,
    [materialId, schoolId],
  );

  return rows[0] || null;
};

const createMaterial = async (payload, executor = pool) => {
  const [result] = await executor.execute(
    `
      INSERT INTO materials (subject_id, title, content, level, media_url, estimated_minutes)
      SELECT id, ?, ?, ?, ?, ?
      FROM subjects
      WHERE id = ? AND school_id = ?
    `,
    [
      payload.title,
      payload.content || null,
      payload.level,
      payload.mediaUrl || null,
      payload.estimatedMinutes,
      payload.subjectId,
      payload.schoolId,
    ],
  );

  return result.affectedRows ? findMaterialById(result.insertId, payload.schoolId, executor) : null;
};

const updateMaterial = async (materialId, payload, executor = pool) => {
  await executor.execute(
    `
      UPDATE materials m
      INNER JOIN subjects current_subject ON current_subject.id = m.subject_id
      INNER JOIN subjects next_subject ON next_subject.id = ? AND next_subject.school_id = current_subject.school_id
      SET
        m.subject_id = next_subject.id,
        m.title = ?,
        m.content = ?,
        m.level = ?,
        m.media_url = ?,
        m.estimated_minutes = ?
      WHERE m.id = ? AND current_subject.school_id = ?
    `,
    [
      payload.subjectId,
      payload.title,
      payload.content || null,
      payload.level,
      payload.mediaUrl || null,
      payload.estimatedMinutes,
      materialId,
      payload.schoolId,
    ],
  );

  return findMaterialById(materialId, payload.schoolId, executor);
};

const deleteMaterial = async (materialId, schoolId, executor = pool) => {
  const [result] = await executor.execute(
    `
      DELETE m
      FROM materials m
      INNER JOIN subjects s ON s.id = m.subject_id
      WHERE m.id = ? AND s.school_id = ?
    `,
    [materialId, schoolId],
  );
  return result.affectedRows > 0;
};

module.exports = {
  createMaterial,
  deleteMaterial,
  findMaterialById,
  findMaterials,
  updateMaterial,
};
