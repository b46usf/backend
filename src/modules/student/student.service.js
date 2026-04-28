const { NotFoundError } = require('../../shared/errors');
const { decryptText } = require('../../utils/crypto');
const studentRepository = require('./student.repository');

const normalizeStudent = (student) => (student ? { ...student, email: decryptText(student.email) } : student);

const listStudents = async (filters, schoolId) => {
  const students = await studentRepository.findStudents(filters, schoolId);
  return students.map(normalizeStudent);
};

const getStudentById = async (studentId, schoolId) => {
  const student = await studentRepository.findStudentById(studentId, schoolId);

  if (!student) {
    throw new NotFoundError('Student not found');
  }

  const [progress, recentAttempts] = await Promise.all([
    studentRepository.findStudentProgressSummary(studentId, schoolId),
    studentRepository.findRecentAttempts(studentId, schoolId),
  ]);

  return {
    ...normalizeStudent(student),
    progress_summary: {
      total_materials: Number(progress?.total_materials || 0),
      completed_materials: Number(progress?.completed_materials || 0),
      average_progress_percent: Number(Number(progress?.average_progress_percent || 0).toFixed(2)),
      total_time_spent_seconds: Number(progress?.total_time_spent_seconds || 0),
    },
    recent_attempts: recentAttempts,
  };
};

const getCurrentStudent = async (userId, schoolId) => {
  const student = await studentRepository.findStudentByUserId(userId, schoolId);

  if (!student) {
    throw new NotFoundError('Student profile not found');
  }

  return normalizeStudent(student);
};

const getStudentDashboard = async (userId, schoolId) => {
  const student = await getCurrentStudent(userId, schoolId);
  const [progress, recentAttempts, recommendations, badges] = await Promise.all([
    studentRepository.findStudentProgressSummary(student.id, schoolId),
    studentRepository.findRecentAttempts(student.id, schoolId),
    studentRepository.findStudentRecommendations(student.id, schoolId),
    studentRepository.findStudentBadges(student.id, schoolId),
  ]);

  return {
    student,
    ai_level: student.current_level,
    risk_status: student.risk_status,
    progress_summary: {
      total_materials: Number(progress?.total_materials || 0),
      completed_materials: Number(progress?.completed_materials || 0),
      average_progress_percent: Number(Number(progress?.average_progress_percent || 0).toFixed(2)),
      total_time_spent_seconds: Number(progress?.total_time_spent_seconds || 0),
    },
    recommendations,
    recent_attempts: recentAttempts,
    badges,
  };
};

const getMyRecommendations = async (userId, schoolId) => {
  const student = await getCurrentStudent(userId, schoolId);
  return studentRepository.findStudentRecommendations(student.id, schoolId);
};

const getMyProgress = async (userId, schoolId) => {
  const student = await getCurrentStudent(userId, schoolId);
  return studentRepository.findStudentProgress(student.id, schoolId);
};

const updateMyMaterialProgress = async (userId, schoolId, materialId, payload) => {
  const student = await getCurrentStudent(userId, schoolId);

  const saved = await studentRepository.upsertLearningProgress({
    studentId: student.id,
    schoolId,
    materialId,
    status: payload.status,
    progressPercent: payload.progressPercent,
    timeSpentSeconds: payload.timeSpentSeconds,
  });

  if (!saved) {
    throw new NotFoundError('Material not found');
  }

  return {
    material_id: materialId,
    status: payload.status,
    progress_percent: payload.progressPercent,
  };
};

const getMyBadges = async (userId, schoolId) => {
  const student = await getCurrentStudent(userId, schoolId);
  return studentRepository.findStudentBadges(student.id, schoolId);
};

module.exports = {
  getStudentById,
  getStudentDashboard,
  getMyBadges,
  getMyProgress,
  getMyRecommendations,
  getCurrentStudent,
  listStudents,
  updateMyMaterialProgress,
};
