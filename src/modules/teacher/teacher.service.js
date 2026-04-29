const { NotFoundError } = require('../../shared/errors');
const teacherRepository = require('./teacher.repository');

const listTeachers = async (schoolId) => teacherRepository.findTeachers(schoolId);

const getTeacherById = async (teacherId, schoolId) => {
  const teacher = await teacherRepository.findTeacherById(teacherId, schoolId);

  if (!teacher) {
    throw new NotFoundError('Teacher not found');
  }

  const classes = await teacherRepository.findTeacherClasses(teacherId, schoolId);

  return {
    ...teacher,
    classes,
  };
};

const getCurrentTeacher = async (userId, schoolId) => {
  const teacher = await teacherRepository.findTeacherByUserId(userId, schoolId);

  if (!teacher) {
    throw new NotFoundError('Teacher profile not found');
  }

  return teacher;
};

const getClassDashboard = async (userId, schoolId) => {
  const teacher = await getCurrentTeacher(userId, schoolId);
  const [classes, interventionQueue] = await Promise.all([
    teacherRepository.findClassDashboard(teacher.id, schoolId),
    teacherRepository.findStudentsNeedingIntervention(teacher.id, schoolId),
  ]);

  return {
    classes: classes.map((item) => ({
      ...item,
      total_students: Number(item.total_students || 0),
      safe_students: Number(item.safe_students || 0),
      warning_students: Number(item.warning_students || 0),
      danger_students: Number(item.danger_students || 0),
      average_total_score: Number(Number(item.average_total_score || 0).toFixed(2)),
    })),
    intervention_queue: interventionQueue,
  };
};

const buildInterventionAdvice = (student) => {
  if (student.risk_status === 'danger') {
    return [
      'Jadwalkan pendampingan singkat 1-on-1.',
      `Berikan materi remedial level ${student.current_level}.`,
      'Minta siswa mengulang kuis latihan setelah belajar ulang.',
    ];
  }

  if (Number(student.average_progress || 0) < 50) {
    return [
      'Pantau penyelesaian materi dan beri target belajar harian.',
      'Kirim materi tambahan yang lebih ringkas.',
      'Cek hambatan belajar sebelum kuis berikutnya.',
    ];
  }

  return [
    'Berikan latihan penguatan pada topik yang sama.',
    'Pantau satu kuis berikutnya untuk memastikan tren membaik.',
  ];
};

const getStudentIntervention = async (userId, schoolId, studentId) => {
  const teacher = await getCurrentTeacher(userId, schoolId);
  const detail = await teacherRepository.findStudentInterventionDetail(teacher.id, schoolId, studentId);

  if (!detail) {
    throw new NotFoundError('Student intervention detail not found');
  }

  return {
    student: {
      ...detail,
      average_score: Number(Number(detail.average_score || 0).toFixed(2)),
      average_accuracy: Number(Number(detail.average_accuracy || 0).toFixed(2)),
      average_progress: Number(Number(detail.average_progress || 0).toFixed(2)),
    },
    ai_intervention_advice: buildInterventionAdvice(detail),
  };
};

const createStudentIntervention = async (userId, schoolId, studentId, payload) => {
  const teacher = await getCurrentTeacher(userId, schoolId);
  const detail = await teacherRepository.findStudentInterventionDetail(teacher.id, schoolId, studentId);

  if (!detail) {
    throw new NotFoundError('Student intervention detail not found');
  }

  const intervention = await teacherRepository.createStudentInterventionLog({
    studentId,
    message: payload.message,
    teacherId: teacher.id,
    schoolId,
  });

  return {
    id: intervention.id,
    student_id: Number(studentId),
    message: payload.message,
    logged: true,
  };
};

module.exports = {
  createStudentIntervention,
  getTeacherById,
  getClassDashboard,
  getStudentIntervention,
  listTeachers,
};
