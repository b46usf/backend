const path = require('node:path');

process.chdir(path.resolve(__dirname, '..'));

const { closePool, pool, withTransaction } = require('../src/config/db');
const { hashPassword } = require('../src/utils/hash');
const { encryptText } = require('../src/utils/crypto');

const DEMO_PASSWORD = 'demo12345';
const SCHOOL_YEAR = '2025/2026';
const CLASS_SEED = {
  name: 'xi-c1',
  gradeLevel: 'XI',
  academicYear: SCHOOL_YEAR,
};
const HOMEROOM_TEACHER_CODE = 'T42';

const STUDENT_SEEDS = [
  { nis: '13508', name: 'ANANDHITA SYAKIRA HIDAYAT', gender: 'P' },
  { nis: '13518', name: 'ANISA MULIA', gender: 'P' },
  { nis: '13523', name: 'AQBIEL JUAND DWIRIKA RIZKI RAMADHAN', gender: 'L' },
  { nis: '13528', name: 'ARIES INDRA PRAKOSO', gender: 'L' },
  { nis: '13561', name: "BERNESSA RAHADATUL'AISY VIRBARA", gender: 'P' },
  { nis: '13596', name: 'DHEA ANANDASYAFIRA', gender: 'P' },
  { nis: '13597', name: 'DHEA LUCITA SABRINA SAKHI', gender: 'P' },
  { nis: '13627', name: 'FANDY FITRIYANTO', gender: 'L' },
  { nis: '13637', name: 'FAIRUS CINTA ALIFIU FAHAMSA', gender: 'P' },
  { nis: '13640', name: 'FATIH MUTTAQIN AZKA', gender: 'L' },
  { nis: '13642', name: 'FEBRIAN IMANUEL HETI PRATAMA', gender: 'L' },
  { nis: '13652', name: 'GERALD ARVIN A', gender: 'L' },
  { nis: '13658', name: 'GREVALDIO PUTRA ALEXA EVANO', gender: 'L' },
  { nis: '13659', name: 'HAFIZH KHAIZURAN FAUZI', gender: 'L' },
  { nis: '13660', name: 'HANA AATIKAH JAUZA', gender: 'P' },
  { nis: '13667', name: 'INGGRID NIKITA PRASETYA', gender: 'P' },
  { nis: '13680', name: 'JETHRO ATA ALVAREAN', gender: 'L' },
  { nis: '13683', name: 'JOY ABIMANYU HAPY PUTRA', gender: 'L' },
  { nis: '13684', name: 'KAFKA XAVIER HAZZA PRAMONO', gender: 'L' },
  { nis: '13685', name: 'KANAYA KARIN RUBIAWAN', gender: 'P' },
  { nis: '13686', name: 'KARIN VANESSA KRISDIVA SIBURIAN', gender: 'P' },
  { nis: '13693', name: 'KENZIE HAFIZ SUSANTO', gender: 'L' },
  { nis: '13739', name: 'MONICA DEWI SANTOSO', gender: 'P' },
  { nis: '13718', name: 'MUCHAMMAD FADHIL TORIQ', gender: 'L' },
  { nis: '13742', name: 'MUHAMMAD AKHTAR RAZAAN', gender: 'L' },
  { nis: '13745', name: 'MUHAMMAD BRAHMANA ADI', gender: 'L' },
  { nis: '13748', name: 'MUHAMMAD FADHIL WAFI', gender: 'L' },
  { nis: '13754', name: 'MUHAMMAD IKHSAN AL AKBAR', gender: 'L' },
  { nis: '13758', name: 'MUHAMMAD RIKO SETYA WIRADINATA', gender: 'L' },
  { nis: '13763', name: 'MUTIARA SANIYYAH', gender: 'P' },
  { nis: '13768', name: 'NADHIEF FATHAN ARRAFIF', gender: 'L' },
  { nis: '13778', name: 'NAFISAH DZATIR RAJWA', gender: 'P' },
  { nis: '13824', name: 'RAFASYAH MADANA ARKADIPA', gender: 'L' },
  { nis: '13841', name: 'REZA EMMERALDI ARIANTO', gender: 'L' },
  { nis: '13885', name: 'VELISA KHALILAH NISRINA', gender: 'P' },
  { nis: '13895', name: 'ZAKI RAHMAT FAHREZI', gender: 'L' },
].map((student) => ({
  ...student,
  className: CLASS_SEED.name,
  academicYear: CLASS_SEED.academicYear,
}));

const SUBJECT_SEEDS = [
  { code: 'FIS', name: 'FISIKA' },
  { code: 'MAT', name: 'MATEMATIKA' },
  { code: 'BIG', name: 'BAHASA INGGRIS' },
  { code: 'PJOK', name: 'PENDIDIKAN JASMANI OLAHRAGA KEBUGARAN' },
  { code: 'PKN', name: 'PENDIDIKAN KEWARGANEGARAAN' },
  { code: 'BK', name: 'BIMBINGAN KONSELING' },
  { code: 'EKO', name: 'EKONOMI' },
  { code: 'BIN', name: 'BAHASA INDONESIA' },
  { code: 'SENI', name: 'SENI' },
  { code: 'KIM', name: 'KIMIA' },
  { code: 'PAI', name: 'PENDIDIKAN AGAMA ISLAM' },
  { code: 'BIO', name: 'BIOLOGI' },
  { code: 'SEJ', name: 'SEJARAH' },
  { code: 'ANTRO', name: 'ANTROPOLOGI' },
  { code: 'GEO', name: 'GEOGRAFI' },
  { code: 'PAKr', name: 'PENDIDIKAN AGAMA KRISTEN' },
  { code: 'SOS', name: 'SOSIOLOGI' },
  { code: 'TIK', name: 'INFORMATIKA' },
  { code: 'MAND', name: 'MANDARIN' },
  { code: 'BHR', name: 'BAHARI' },
  { code: 'PAH', name: 'PENDIDIKAN AGAMA HINDU' },
  { code: 'PAK', name: 'PENDIDIKAN AGAMA KATHOLIK' },
  { code: 'BJW', name: 'BAHASA JAWA' },
  { code: 'PKWU', name: 'PENDIDIKAN KEWIRAUSAHAAN' },
];

const subjectNameByCode = new Map(SUBJECT_SEEDS.map((subject) => [subject.code, subject.name]));

const TEACHER_SEEDS = [
  { code: 'K1', name: 'ROSYIDAH ROHMAH, S.Pd', subjectCode: 'FIS' },
  { code: 'G2', name: 'Maharani Gita Kusumawardani, S.Pd', subjectCode: 'MAT' },
  { code: 'E3', name: 'Eva Krisnawati, S.Pd', subjectCode: 'BIG' },
  { code: 'F4', name: 'RAHMAD ARIF, S.Pd', subjectCode: 'PJOK' },
  { code: 'E5', name: 'AGUS PRIJATMOKO, S.Pd, M.M', subjectCode: 'BIG' },
  { code: 'G6', name: 'YANU INDRIYATI, M.Pd', subjectCode: 'MAT' },
  { code: 'B7', name: 'Dra. RIMA RAHAYU, M.M', subjectCode: 'PKN' },
  { code: 'U8', name: 'IWAN DILIANTO, S.Psi', subjectCode: 'BK' },
  { code: 'G9', name: 'IDHA HARIANI, S.Pd', subjectCode: 'MAT' },
  { code: 'U10', name: 'ERMIYANTUN, S.Pd', subjectCode: 'BK' },
  { code: 'K11', name: 'Dra. NURCAHYATI', subjectCode: 'EKO' },
  { code: 'U12', name: 'DARMO, S.Pd', subjectCode: 'BK' },
  { code: 'C13', name: 'YULIANTI, S.Pd', subjectCode: 'BIN' },
  { code: 'M14', name: 'IKA APRILIA NINDYASARI. A., S.Pd', subjectCode: 'SENI' },
  { code: 'U15', name: 'DIAN AYU A., S.Psi', subjectCode: 'BK' },
  { code: 'J16', name: 'SRI SULASTRI YULIANA, S.Pd', subjectCode: 'KIM' },
  { code: 'A17', name: 'MUCHAMMAD FARUQ, S.Pd.I', subjectCode: 'PAI' },
  { code: 'I18', name: 'SUPRAPTI, S.Pd', subjectCode: 'BIO' },
  { code: 'A19', name: 'YUSWANTO PURNOMO, S.Pd.I', subjectCode: 'PAI' },
  { code: 'I20', name: 'FATIMATUS ZAHROH, S.Pd,M.M', subjectCode: 'BIO' },
  { code: 'F21', name: 'ROIS NURIL ALAM ZEIN, S.Pd', subjectCode: 'PJOK' },
  { code: 'D22', name: 'DENNY RATNASARI, S.Pd', subjectCode: 'SEJ' },
  { code: 'P22', name: 'DENNY RATNASARI, S.Pd', subjectCode: 'ANTRO' },
  { code: 'L23', name: 'Dra. MARIA ULFAH', subjectCode: 'GEO' },
  { code: 'B24', name: 'RETNO DWI KARTIKA.L., S.Pd', subjectCode: 'PKN' },
  { code: 'C25', name: 'KRISTIN KURNIA WATI, S.Pd', subjectCode: 'BIN' },
  { code: 'A26', name: 'JENNI HARJANTI, S.Pd Kr', subjectCode: 'PAKr' },
  { code: 'K27', name: 'SITI KHOTIJAH, S.Pd', subjectCode: 'EKO' },
  { code: 'K28', name: 'IDAHLYA MUGIRAHAYU, S.Pd', subjectCode: 'EKO' },
  { code: 'E29', name: 'SITI KHUMAIROH SARAGIH, S.S', subjectCode: 'BIG' },
  { code: 'N30', name: 'EKA RIZKI RAHMAWATI, S.Sos, M.Sosio', subjectCode: 'SOS' },
  { code: 'T31', name: 'INTAN  AKMALIA, S.Pd', subjectCode: 'TIK' },
  { code: 'Q31', name: 'INTAN  AKMALIA, S.Pd', subjectCode: 'MAND' },
  { code: 'G32', name: 'ROSITA DWI DIAHWARI, S.Pd', subjectCode: 'MAT' },
  { code: 'I33', name: 'DINDA TRIANA, S.Pd', subjectCode: 'BIO' },
  { code: 'O33', name: 'DINDA TRIANA, S.Pd', subjectCode: 'BHR' },
  { code: 'A34', name: 'I WAYAN S, S.PdH', subjectCode: 'PAH' },
  { code: 'A35', name: 'DHUHROTUL KHOIRIYAH, S.Pd', subjectCode: 'PAI' },
  { code: 'B35', name: 'DHUHROTUL KHOIRIYAH, S.Pd', subjectCode: 'PKN' },
  { code: 'A36', name: 'YOSEPH LIDI, S.FIL', subjectCode: 'PAK' },
  { code: 'R37', name: 'ROSA RAMADHAN, S.Pd', subjectCode: 'BJW' },
  { code: 'F38', name: 'ENGGAR SUSTIADI PRADANA, S.Pd', subjectCode: 'PJOK' },
  { code: 'A39', name: 'ANGELICA MAYLANI PUTRI, S.Pd', subjectCode: 'PAI' },
  { code: 'M40', name: 'GUNTUR AJIE PANGESTU, S.Pd', subjectCode: 'SENI' },
  { code: 'H41', name: 'INDAH PUTRI MAULIDYA SARI, S.Pd', subjectCode: 'FIS' },
  { code: 'T42', name: 'BAGUS FAROUKTIAWAN, S.Kom', subjectCode: 'TIK' },
  { code: 'E43', name: 'DWI NOVIAN AGUSTIN, S.PD', subjectCode: 'BIG' },
  { code: 'J44', name: 'NANDA TRY HASTUTI,S.Pd', subjectCode: 'KIM' },
  { code: 'J45', name: 'NUR LAILIL APRILIA, S.Pd', subjectCode: 'KIM' },
  { code: 'S45', name: 'NUR LAILIL APRILIA, S.Pd', subjectCode: 'PKWU' },
  { code: 'H46', name: 'DHELLA ROCHMATUL.M,S.Pd', subjectCode: 'FIS' },
  { code: 'G47', name: 'ELLSA NATASHA.B, M.Pd', subjectCode: 'MAT' },
  { code: 'G48', name: 'LAURA WIDYA P., S.Pd', subjectCode: 'MAT' },
  { code: 'L49', name: 'FRISCA DANI AURORA.U,S.Pd', subjectCode: 'GEO' },
  { code: 'D50', name: 'SINDY DWI JAYANTI,M.Pd.Gr', subjectCode: 'SEJ' },
  { code: 'N51', name: 'M. YUSUF FAIZAL AUFA,S.Sos', subjectCode: 'SOS' },
  { code: 'T51', name: 'M. YUSUF FAIZAL AUFA,S.Sos', subjectCode: 'TIK' },
  { code: 'I52', name: 'ARLYNDA WIDYA APSARI, S.Pd', subjectCode: 'BIO' },
  { code: 'M53', name: 'MIFTAHUL JANNAH, S.SN', subjectCode: 'SENI' },
  { code: 'S53', name: 'MIFTAHUL JANNAH, S.SN', subjectCode: 'PKWU' },
  { code: 'O54', name: 'DIAN INDRI PRATIWI, S.Kel', subjectCode: 'BHR' },
  { code: 'E55', name: 'MOHAMMAD ASIKIN', subjectCode: 'BIG' },
  { code: 'C56', name: 'OTY MEIGAN, S.Pd', subjectCode: 'BIN' },
  { code: 'G57', name: 'NESA AYU DINA, M.Pd', subjectCode: 'MAT' },
  { code: 'F58', name: 'BIMANTARA YUNANDI P., S.Pd', subjectCode: 'PJOK' },
  { code: 'C59', name: 'CYNTIA PUTRI, S.Pd', subjectCode: 'BIN' },
  { code: 'H60', name: 'MUHAMMAD ZAINAL ARIFIN, S.Pd', subjectCode: 'FIS' },
  { code: 'D61', name: 'ACHMAD FIRMANDA DWIPUTRA, S.Pd', subjectCode: 'SEJ' },
  { code: 'L62', name: 'Karana Yankumara, S.pd', subjectCode: 'GEO' },
  { code: 'B62', name: 'Karana Yankumara, S.pd', subjectCode: 'PKN' },
  { code: 'D63', name: 'LATIFAH HANUN, S.Pd', subjectCode: 'SEJ' },
];

const CLASS_SCHEDULE_SEEDS = [
  { day: 'Senin', teacherCode: 'H46', subjectCode: 'FIS', hours: 2 },
  { day: 'Senin', teacherCode: 'B7', subjectCode: 'PKN', hours: 2 },
  { day: 'Senin', teacherCode: 'G6', subjectCode: 'MAT', hours: 2 },
  { day: 'Senin', teacherCode: 'E5', subjectCode: 'BIG', hours: 2 },
  { day: 'Senin', teacherCode: 'F58', subjectCode: 'PJOK', hours: 1 },
  { day: 'Senin', teacherCode: 'U12', subjectCode: 'BK', hours: 1 },
  { day: 'Selasa', teacherCode: 'T42', subjectCode: 'TIK', hours: 2 },
  { day: 'Selasa', teacherCode: 'G6', subjectCode: 'MAT', hours: 2 },
  { day: 'Selasa', teacherCode: 'G47', subjectCode: 'MAT', hours: 2 },
  { day: 'Selasa', teacherCode: 'C56', subjectCode: 'BIN', hours: 2 },
  { day: 'Selasa', teacherCode: 'D63', subjectCode: 'SEJ', hours: 2 },
  { day: 'Rabu', teacherCode: 'T42', subjectCode: 'TIK', hours: 3 },
  { day: 'Rabu', teacherCode: 'O33', subjectCode: 'BHR', hours: 1 },
  { day: 'Rabu', teacherCode: 'S53', subjectCode: 'PKWU', hours: 2 },
  { day: 'Rabu', teacherCode: 'J16', subjectCode: 'KIM', hours: 1 },
  { day: 'Rabu', teacherCode: 'H46', subjectCode: 'FIS', hours: 3 },
  { day: 'Kamis', teacherCode: 'A17', subjectCode: 'PAI', hours: 3 },
  { day: 'Kamis', teacherCode: 'R37', subjectCode: 'BJW', hours: 1 },
  { day: 'Kamis', teacherCode: 'F58', subjectCode: 'PJOK', hours: 2 },
  { day: 'Kamis', teacherCode: 'J16', subjectCode: 'KIM', hours: 2 },
  { day: 'Kamis', teacherCode: 'C56', subjectCode: 'BIN', hours: 2 },
  { day: 'Jumat', teacherCode: 'M14', subjectCode: 'SENI', hours: 2 },
  { day: 'Jumat', teacherCode: 'J16', subjectCode: 'KIM', hours: 2 },
  { day: 'Jumat', teacherCode: 'G47', subjectCode: 'MAT', hours: 3 },
];

const TEACHER_CLASS_SEEDS = [
  ...new Map(
    CLASS_SCHEDULE_SEEDS.map(({ teacherCode, subjectCode }) => [
      `${teacherCode}:${subjectCode}`,
      { teacherCode, subjectCode },
    ]),
  ).values(),
];

const resetOrder = [
  'student_badges',
  'badges',
  'activity_logs',
  'ai_predictions',
  'student_features',
  'ai_recommendations',
  'learning_progress',
  'answers',
  'quiz_attempts',
  'questions',
  'quizzes',
  'materials',
  'subjects',
  'teacher_classes',
  'students',
  'classes',
  'teachers',
  'users',
  'subscriptions',
  'schools',
  'roles',
];

const columnList = (payload) => Object.keys(payload).map((column) => `\`${column}\``).join(', ');
const placeholders = (payload) => Object.keys(payload).map(() => '?').join(', ');

const daysAgo = (days, hour = 8, minute = 0) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(hour, minute, 0, 0);
  return date;
};

const daysFromNow = (days, hour = 23, minute = 59) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(hour, minute, 0, 0);
  return date;
};

const studentKey = (nis) => `nis${nis}`;

const teacherKey = (code) => `teacher${code}`;

const getInitials = (name) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

const getFirstName = (name) => name.split(/\s+/).filter(Boolean)[0] || name;

const getStudentEmail = (student, index) =>
  index === 0 ? 'student@edusense.ai' : `student.${student.nis}@edusense.ai`;

const getTeacherEmail = (teacher) =>
  teacher.code === HOMEROOM_TEACHER_CODE ? 'teacher@edusense.ai' : `teacher.${teacher.code.toLowerCase()}@edusense.ai`;

const buildStudentProfile = (index) => {
  const levelCycle = ['intermediate', 'basic', 'advanced', 'basic', 'intermediate', 'advanced'];
  const riskCycle = ['safe', 'warning', 'safe', 'danger', 'warning', 'safe', 'safe', 'warning'];
  const scoreCycle = [428, 196, 612, 82, 244, 538, 356, 164];
  const streakCycle = [12, 3, 18, 0, 5, 9, 7, 2, 14, 4];

  return {
    current_level: levelCycle[index % levelCycle.length],
    risk_status: riskCycle[index % riskCycle.length],
    total_score: scoreCycle[index % scoreCycle.length] + Math.floor(index / scoreCycle.length) * 23,
    streak_days: streakCycle[index % streakCycle.length],
  };
};

const levelFromScore = (score) => {
  if (score >= 85) {
    return 'advanced';
  }

  if (score >= 65) {
    return 'intermediate';
  }

  return 'basic';
};

const insertRow = async (connection, table, payload) => {
  const sql = `INSERT INTO \`${table}\` (${columnList(payload)}) VALUES (${placeholders(payload)})`;
  const [result] = await connection.execute(sql, Object.values(payload));
  return result.insertId;
};

const resetDatabase = async () => {
  const connection = await pool.getConnection();

  try {
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');

    for (const table of resetOrder) {
      await connection.query(`TRUNCATE TABLE \`${table}\``);
    }

    await connection.query('SET FOREIGN_KEY_CHECKS = 1');
  } catch (error) {
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');
    throw error;
  } finally {
    connection.release();
  }
};

const pickWrongAnswer = (question) => {
  if (question.question_type === 'essay') {
    return 'Saya masih perlu mempelajari konsep ini lebih lengkap.';
  }

  const options = [question.option_a, question.option_b, question.option_c, question.option_d].filter(Boolean);
  return options.find((option) => String(option) !== String(question.correct_answer)) || '';
};

const buildAnswerRows = (questions, correctCount) =>
  questions.map((question, index) => {
    const isCorrect = index < correctCount;
    const confidence = isCorrect ? (question.question_type === 'essay' ? 88 : 100) : 28;

    return {
      question_id: question.id,
      student_answer: isCorrect ? question.correct_answer : pickWrongAnswer(question),
      is_correct: isCorrect,
      score: isCorrect ? Number(question.point) : 0,
      confidence_score: confidence,
      ai_feedback: isCorrect
        ? 'Jawaban sudah tepat dan menunjukkan pemahaman konsep.'
        : 'Jawaban belum tepat. Ulangi materi terkait lalu coba latihan penguatan.',
    };
  });

const seed = async () => {
  await resetDatabase();

  await withTransaction(async (connection) => {
    const roles = {};

    for (const roleName of ['admin', 'teacher', 'student']) {
      roles[roleName] = await insertRow(connection, 'roles', { name: roleName });
    }

    const schoolId = await insertRow(connection, 'schools', {
      name: 'SMA Nusantara Demo',
      code: 'SMA-NUSA-DEMO',
      email: 'operator@smanusantara.demo',
      phone: '+62-21-555-0100',
      address: 'Jl. Pendidikan No. 1',
      city: 'Jakarta',
      province: 'DKI Jakarta',
      country: 'Indonesia',
      postal_code: '10110',
      website_url: 'https://edusense.example',
      status: 'active',
    });

    await insertRow(connection, 'subscriptions', {
      school_id: schoolId,
      plan_name: 'EduSense Demo Suite',
      plan_code: 'DEMO-SUITE',
      status: 'active',
      billing_cycle: 'semesterly',
      max_students: 1000,
      max_teachers: 80,
      starts_at: daysAgo(15),
      ends_at: daysFromNow(165),
      cancelled_at: null,
    });

    const passwordHash = await hashPassword(encryptText(DEMO_PASSWORD));
    const createUser = async ({ role, name, email, avatar }) =>
      insertRow(connection, 'users', {
        school_id: schoolId,
        role_id: roles[role],
        name,
        email: encryptText(email),
        password: passwordHash,
        avatar,
        status: 'active',
      });

    const users = {
      admin: await createUser({ role: 'admin', name: 'Admin Sekolah', email: 'admin@edusense.ai', avatar: 'AS' }),
    };

    for (const teacher of TEACHER_SEEDS) {
      users[teacherKey(teacher.code)] = await createUser({
        role: 'teacher',
        name: teacher.name,
        email: getTeacherEmail(teacher),
        avatar: getInitials(teacher.name),
      });
    }

    for (const [index, student] of STUDENT_SEEDS.entries()) {
      users[studentKey(student.nis)] = await createUser({
        role: 'student',
        name: student.name,
        email: getStudentEmail(student, index),
        avatar: getInitials(student.name),
      });
    }

    const teachers = {};

    for (const teacher of TEACHER_SEEDS) {
      teachers[teacher.code] = await insertRow(connection, 'teachers', {
        school_id: schoolId,
        user_id: users[teacherKey(teacher.code)],
        employee_number: teacher.code,
        position: 'teacher',
        specialization: subjectNameByCode.get(teacher.subjectCode) || teacher.subjectCode,
      });
    }

    const classes = {
      xiC1: await insertRow(connection, 'classes', {
        school_id: schoolId,
        homeroom_teacher_id: teachers[HOMEROOM_TEACHER_CODE],
        name: CLASS_SEED.name,
        grade_level: CLASS_SEED.gradeLevel,
        academic_year: CLASS_SEED.academicYear,
      }),
    };

    const students = {};
    const studentProfiles = {};

    for (const [index, student] of STUDENT_SEEDS.entries()) {
      const key = studentKey(student.nis);
      const profile = buildStudentProfile(index);
      studentProfiles[key] = profile;
      students[key] = await insertRow(connection, 'students', {
        school_id: schoolId,
        user_id: users[key],
        class_id: classes.xiC1,
        student_number: student.nis,
        ...profile,
      });
    }

    const subjects = {};

    for (const subject of SUBJECT_SEEDS) {
      subjects[subject.code] = await insertRow(connection, 'subjects', {
        school_id: schoolId,
        name: subject.name,
        code: subject.code,
        description: `${subject.name} untuk kelas ${CLASS_SEED.name}.`,
      });
    }

    for (const { teacherCode, subjectCode } of TEACHER_CLASS_SEEDS) {
      await insertRow(connection, 'teacher_classes', {
        school_id: schoolId,
        teacher_id: teachers[teacherCode],
        class_id: classes.xiC1,
        subject_id: subjects[subjectCode],
        assignment_type: 'subject_teacher',
      });
    }

    const materialSeed = [
      ['mathBasic', subjects.MAT, 'Konsep Fungsi Linear', 'Memahami bentuk y = ax + b, nilai awal, dan laju perubahan.', 'basic', 15],
      ['mathMid', subjects.MAT, 'Gradien dan Grafik', 'Menganalisis kemiringan garis dari persamaan dan grafik.', 'intermediate', 20],
      ['mathAdv', subjects.MAT, 'Analisis Soal Cerita Linear', 'Menerjemahkan konteks sehari-hari menjadi model linear.', 'advanced', 25],
      ['physicsBasic', subjects.FIS, 'Gerak Lurus Beraturan', 'Konsep jarak, waktu, kecepatan, dan grafik sederhana.', 'basic', 18],
      ['physicsMid', subjects.FIS, 'Hukum Newton I', 'Inersia, resultan gaya, dan contoh gaya seimbang.', 'intermediate', 22],
      ['physicsAdv', subjects.FIS, 'Energi dan Usaha', 'Hubungan usaha, perubahan energi, dan efisiensi.', 'advanced', 28],
      ['biologyBasic', subjects.BIO, 'Struktur Sel', 'Organel sel dan fungsi dasarnya dalam kehidupan.', 'basic', 16],
      ['biologyMid', subjects.BIO, 'Sistem Pencernaan', 'Organ pencernaan, enzim, dan alur proses makanan.', 'intermediate', 21],
      ['biologyAdv', subjects.BIO, 'Ekosistem dan Rantai Makanan', 'Interaksi makhluk hidup, energi, dan keseimbangan ekosistem.', 'advanced', 24],
      ['englishBasic', subjects.BIG, 'Descriptive Text', 'Mengenali struktur dan ciri kebahasaan descriptive text.', 'basic', 14],
      ['englishMid', subjects.BIG, 'Simple Past Tense', 'Menggunakan bentuk lampau untuk menceritakan peristiwa.', 'intermediate', 19],
      ['englishAdv', subjects.BIG, 'Analytical Exposition', 'Menyusun argumen, thesis, dan reiteration secara runtut.', 'advanced', 26],
    ];
    const materials = {};

    for (const [key, subject_id, title, content, level, estimated_minutes] of materialSeed) {
      materials[key] = await insertRow(connection, 'materials', {
        subject_id,
        title,
        content,
        level,
        media_url: null,
        estimated_minutes,
      });
    }

    const quizzes = {
      diagnostic: await insertRow(connection, 'quizzes', {
        subject_id: subjects.MAT,
        material_id: materials.mathBasic,
        title: 'Tes Diagnostik AI - Fungsi Linear',
        quiz_type: 'diagnostic',
        level: 'basic',
        duration_minutes: 20,
      }),
      mathPractice: await insertRow(connection, 'quizzes', {
        subject_id: subjects.MAT,
        material_id: materials.mathMid,
        title: 'Kuis Adaptif - Gradien dan Grafik',
        quiz_type: 'practice',
        level: 'intermediate',
        duration_minutes: 15,
      }),
      physicsPractice: await insertRow(connection, 'quizzes', {
        subject_id: subjects.FIS,
        material_id: materials.physicsBasic,
        title: 'Latihan Cepat - Gerak Lurus',
        quiz_type: 'practice',
        level: 'basic',
        duration_minutes: 12,
      }),
      englishFinal: await insertRow(connection, 'quizzes', {
        subject_id: subjects.BIG,
        material_id: materials.englishMid,
        title: 'Final Mini - Simple Past',
        quiz_type: 'final',
        level: 'intermediate',
        duration_minutes: 18,
      }),
      biologyPractice: await insertRow(connection, 'quizzes', {
        subject_id: subjects.BIO,
        material_id: materials.biologyBasic,
        title: 'Latihan Struktur Sel',
        quiz_type: 'practice',
        level: 'basic',
        duration_minutes: 10,
      }),
    };

    const questionPayloads = {
      diagnostic: [
        ['Tentukan nilai x dari persamaan 2x + 4 = 12.', 'multiple_choice', '2', '4', '6', '8', '4', null, 10, 'easy'],
        ['Jika f(x) = x + 5, berapa nilai f(3)?', 'multiple_choice', '5', '8', '10', '15', '8', null, 10, 'easy'],
        ['Garis dengan gradien positif cenderung bergerak ke arah mana?', 'multiple_choice', 'Naik', 'Turun', 'Datar', 'Acak', 'Naik', null, 10, 'easy'],
        ['Berapa gradien dari garis y = 3x - 2?', 'multiple_choice', '-2', '2', '3', '5', '3', null, 10, 'medium'],
        ['Pilih bentuk umum yang paling tepat untuk fungsi linear.', 'multiple_choice', 'ax + b', 'ax2 + b', 'a/x', 'x/a', 'ax + b', null, 10, 'medium'],
        ['Jika nilai gradien makin besar, bentuk garis akan terlihat seperti apa?', 'multiple_choice', 'Lebih curam', 'Lebih datar', 'Tidak berubah', 'Melingkar', 'Lebih curam', null, 10, 'medium'],
        ['Harga awal 10.000 naik 2.000 per item. Model yang tepat adalah...', 'multiple_choice', 'y = 2000x + 10000', 'y = 10000x + 2000', 'y = 12000x', 'y = 2000 - 10000x', 'y = 2000x + 10000', null, 10, 'medium'],
        ['Pada persamaan y = 5x + 1, angka 5 menunjukkan apa?', 'multiple_choice', 'Laju perubahan', 'Nilai awal', 'Titik akhir', 'Jumlah data', 'Laju perubahan', null, 10, 'hard'],
        ['Jelaskan langkah utama menyelesaikan soal cerita fungsi linear.', 'essay', null, null, null, null, 'Identifikasi informasi, tentukan variabel, buat model, hitung, dan periksa jawaban.', 'identifikasi informasi, variabel, model, hitung, periksa', 10, 'hard'],
        ['Mengapa hasil perhitungan perlu dicek kembali?', 'essay', null, null, null, null, 'Agar kesalahan dapat ditemukan dan jawaban menjadi lebih akurat.', 'kesalahan, akurat, cek, jawaban', 10, 'hard'],
      ],
      mathPractice: [
        ['Gradien garis y = -2x + 7 adalah...', 'multiple_choice', '-2', '2', '7', '-7', '-2', null, 10, 'easy'],
        ['Jika garis melalui (0, 3) dan (2, 7), gradiennya adalah...', 'multiple_choice', '1', '2', '3', '4', '2', null, 10, 'medium'],
        ['Nilai y pada y = 4x - 1 saat x = 3 adalah...', 'multiple_choice', '9', '10', '11', '12', '11', null, 10, 'medium'],
        ['Jelaskan arti konstanta b pada y = ax + b.', 'essay', null, null, null, null, 'Konstanta b menunjukkan nilai awal atau titik potong sumbu y.', 'nilai awal, titik potong, sumbu y', 10, 'hard'],
      ],
      physicsPractice: [
        ['Rumus kecepatan pada GLB adalah...', 'multiple_choice', 'v = s/t', 'v = t/s', 's = v/t', 't = s x v', 'v = s/t', null, 10, 'easy'],
        ['Benda menempuh 100 m dalam 20 s. Kecepatannya...', 'multiple_choice', '2 m/s', '5 m/s', '10 m/s', '20 m/s', '5 m/s', null, 10, 'easy'],
        ['Grafik jarak-waktu yang lurus menunjukkan...', 'multiple_choice', 'kecepatan tetap', 'massa berubah', 'gaya nol', 'energi hilang', 'kecepatan tetap', null, 10, 'medium'],
        ['Jelaskan ciri utama GLB.', 'essay', null, null, null, null, 'Gerak lurus beraturan memiliki lintasan lurus dan kecepatan tetap.', 'lurus, kecepatan tetap, beraturan', 10, 'medium'],
      ],
      englishFinal: [
        ['Choose the simple past form: She ___ to school yesterday.', 'multiple_choice', 'go', 'goes', 'went', 'gone', 'went', null, 10, 'easy'],
        ['Which word often indicates past time?', 'multiple_choice', 'tomorrow', 'yesterday', 'now', 'soon', 'yesterday', null, 10, 'easy'],
        ['The negative form of "They played" is...', 'multiple_choice', 'They not played', 'They did not play', 'They did not played', 'They do not played', 'They did not play', null, 10, 'medium'],
        ['Write one sentence using simple past tense.', 'essay', null, null, null, null, 'I visited my grandmother last weekend.', 'visited, last, yesterday, went, played', 10, 'medium'],
      ],
      biologyPractice: [
        ['Organel yang mengatur aktivitas sel adalah...', 'multiple_choice', 'nukleus', 'ribosom', 'mitokondria', 'vakuola', 'nukleus', null, 10, 'easy'],
        ['Mitokondria sering disebut sebagai...', 'multiple_choice', 'penghasil energi', 'penyimpan air', 'pengatur gen', 'pelindung sel', 'penghasil energi', null, 10, 'easy'],
        ['Dinding sel banyak ditemukan pada sel...', 'multiple_choice', 'tumbuhan', 'darah', 'otot', 'saraf', 'tumbuhan', null, 10, 'medium'],
        ['Jelaskan fungsi membran sel.', 'essay', null, null, null, null, 'Membran sel mengatur keluar masuknya zat dan melindungi isi sel.', 'mengatur, keluar masuk, zat, melindungi', 10, 'medium'],
      ],
    };
    const questionsByQuiz = {};

    for (const [quizKey, rows] of Object.entries(questionPayloads)) {
      questionsByQuiz[quizKey] = [];

      for (const row of rows) {
        const [
          question_text,
          question_type,
          option_a,
          option_b,
          option_c,
          option_d,
          correct_answer,
          keywords,
          point,
          difficulty,
        ] = row;
        const payload = {
          quiz_id: quizzes[quizKey],
          question_text,
          question_type,
          option_a,
          option_b,
          option_c,
          option_d,
          correct_answer,
          keywords,
          point,
          difficulty,
        };
        const id = await insertRow(connection, 'questions', payload);
        questionsByQuiz[quizKey].push({ id, ...payload });
      }
    }

    const createAttempt = async ({
      studentKey,
      quizKey,
      correctCount,
      score,
      accuracyRate,
      seconds,
      attemptNumber,
      level,
      trend,
      startedAt,
      submittedAt,
    }) => {
      const attemptId = await insertRow(connection, 'quiz_attempts', {
        student_id: students[studentKey],
        quiz_id: quizzes[quizKey],
        score,
        accuracy_rate: accuracyRate,
        time_spent_seconds: seconds,
        attempt_number: attemptNumber,
        ai_level_result: level,
        performance_trend: trend,
        started_at: startedAt,
        submitted_at: submittedAt,
      });

      for (const answer of buildAnswerRows(questionsByQuiz[quizKey], correctCount)) {
        await insertRow(connection, 'answers', {
          attempt_id: attemptId,
          ...answer,
        });
      }

      return attemptId;
    };

    const quizCycle = ['diagnostic', 'mathPractice', 'physicsPractice', 'englishFinal', 'biologyPractice'];
    const scoreCycle = [82, 54, 94, 32, 74, 88, 67, 46];
    const trendCycle = ['improving', 'stable', 'improving', 'declining', 'stable'];
    const attemptIdsByStudent = {};
    const attemptScoresByStudent = {};

    for (const [index, student] of STUDENT_SEEDS.entries()) {
      const key = studentKey(student.nis);
      const quizKey = quizCycle[index % quizCycle.length];
      const questionCount = questionsByQuiz[quizKey].length;
      const score = scoreCycle[index % scoreCycle.length];
      const correctCount = Math.max(1, Math.min(questionCount, Math.round((questionCount * score) / 100)));
      const startedHour = 8 + (index % 8);

      attemptScoresByStudent[key] = score;
      attemptIdsByStudent[key] = await createAttempt({
        studentKey: key,
        quizKey,
        correctCount,
        score,
        accuracyRate: Math.round((correctCount / questionCount) * 100),
        seconds: 620 + index * 31,
        attemptNumber: 1,
        level: levelFromScore(score),
        trend: trendCycle[index % trendCycle.length],
        startedAt: daysAgo((index % 10) + 1, startedHour),
        submittedAt: daysAgo((index % 10) + 1, startedHour, 17),
      });
    }

    for (const [index, student] of STUDENT_SEEDS.entries()) {
      const key = studentKey(student.nis);
      const profile = studentProfiles[key];
      const secondaryStatus = profile.risk_status === 'danger' ? 'not_started' : 'in_progress';
      const progressRows = [
        ['mathBasic', 'completed', 100, 1300 + index * 18, daysAgo((index % 12) + 6)],
        [
          'mathMid',
          profile.current_level === 'basic' ? secondaryStatus : 'completed',
          profile.current_level === 'basic' ? 35 + (index % 25) : 100,
          720 + index * 21,
          profile.current_level === 'basic' ? null : daysAgo((index % 8) + 2),
        ],
        [
          index % 3 === 0 ? 'physicsBasic' : index % 3 === 1 ? 'englishBasic' : 'mathAdv',
          profile.current_level === 'advanced' ? 'completed' : 'in_progress',
          profile.current_level === 'advanced' ? 100 : 42 + (index % 36),
          560 + index * 16,
          profile.current_level === 'advanced' ? daysAgo((index % 5) + 1) : null,
        ],
      ];

      for (const [materialKey, status, progress_percent, time_spent_seconds, completed_at] of progressRows) {
        await insertRow(connection, 'learning_progress', {
          student_id: students[key],
          material_id: materials[materialKey],
          status,
          progress_percent,
          time_spent_seconds,
          completed_at,
        });
      }
    }

    for (const [index, student] of STUDENT_SEEDS.entries()) {
      const key = studentKey(student.nis);
      const profile = studentProfiles[key];
      const firstName = getFirstName(student.name);
      const recommendation =
        profile.risk_status === 'danger'
          ? ['mathBasic', 'remedial', `${firstName} perlu penguatan konsep dasar dan pendampingan guru minggu ini.`, 'high']
          : profile.risk_status === 'warning'
            ? ['mathMid', 'review', `${firstName} perlu review latihan bertahap agar progres lebih stabil.`, 'medium']
            : profile.current_level === 'advanced'
              ? ['mathAdv', 'challenge', `${firstName} siap mendapat tantangan soal cerita level lanjutan.`, 'low']
              : ['physicsBasic', 'next_material', `${firstName} dapat melanjutkan materi lintas konsep dengan ritme normal.`, 'medium'];

      await insertRow(connection, 'ai_recommendations', {
        student_id: students[key],
        material_id: materials[recommendation[0]],
        recommendation_type: recommendation[1],
        reason: recommendation[2],
        priority: recommendation[3],
        status: index % 9 === 0 ? 'done' : 'pending',
      });
    }

    for (const [index, student] of STUDENT_SEEDS.entries()) {
      const key = studentKey(student.nis);
      const score = attemptScoresByStudent[key];
      const profile = studentProfiles[key];
      const consistency = Math.min(98, 48 + profile.streak_days * 3 + (index % 8));
      const engagement = Math.min(96, 52 + profile.streak_days * 2 + (score >= 75 ? 12 : 0));

      await insertRow(connection, 'student_features', {
        student_id: students[key],
        learning_speed: Number((0.65 + (score / 100) * 0.9).toFixed(2)),
        accuracy_rate: score,
        consistency_score: consistency,
        engagement_score: engagement,
        retry_rate: Math.max(4, 34 - Math.round(score / 4)),
        last_calculated_at: daysAgo(0, 7),
      });
    }

    for (const [index, student] of STUDENT_SEEDS.entries()) {
      const key = studentKey(student.nis);
      const profile = studentProfiles[key];
      const score = attemptScoresByStudent[key];
      const riskPrediction =
        profile.risk_status === 'danger' ? 'high' : profile.risk_status === 'warning' ? 'medium' : 'low';

      await insertRow(connection, 'ai_predictions', {
        student_id: students[key],
        predicted_level: levelFromScore(score),
        risk_prediction: riskPrediction,
        confidence: Math.min(97, Math.max(68, score + 6)),
        model_version: 'demo-v1.0',
        prediction_reason: `${getFirstName(student.name)} berada pada level ${levelFromScore(score)} dengan status risiko ${riskPrediction}.`,
        created_at: daysAgo(0, 7, 30),
      });
    }

    const badges = {
      starter: await insertRow(connection, 'badges', {
        school_id: schoolId,
        name: 'Pemula AI',
        description: 'Menyelesaikan aktivitas belajar pertama di EduSense AI.',
        icon: 'sparkles',
        requirement: 'Login dan mulai satu materi.',
      }),
      streak: await insertRow(connection, 'badges', {
        school_id: schoolId,
        name: 'Runtun 7 Hari',
        description: 'Aktif belajar minimal tujuh hari berturut-turut.',
        icon: 'flame',
        requirement: 'Streak belajar minimal 7 hari.',
      }),
      quiz: await insertRow(connection, 'badges', {
        school_id: schoolId,
        name: 'Jago Kuis',
        description: 'Meraih akurasi minimal 80% pada kuis adaptif.',
        icon: 'target',
        requirement: 'Accuracy rate minimal 80%.',
      }),
      mastery: await insertRow(connection, 'badges', {
        school_id: schoolId,
        name: 'Mastery Badge',
        description: 'Mencapai level advanced dengan akurasi tinggi.',
        icon: 'award',
        requirement: 'Level advanced dan akurasi tinggi.',
      }),
      diagnostic: await insertRow(connection, 'badges', {
        school_id: schoolId,
        name: 'Diagnostic Finisher',
        description: 'Menyelesaikan tes diagnostik AI.',
        icon: 'check-circle',
        requirement: 'Submit tes diagnostik.',
      }),
    };

    const addStudentBadge = async (key, badgeId, earnedAt) =>
      insertRow(connection, 'student_badges', {
        school_id: schoolId,
        student_id: students[key],
        badge_id: badgeId,
        earned_at: earnedAt,
      });

    for (const [index, student] of STUDENT_SEEDS.entries()) {
      const key = studentKey(student.nis);
      const profile = studentProfiles[key];
      const score = attemptScoresByStudent[key];

      await addStudentBadge(key, badges.starter, daysAgo((index % 12) + 3));

      if (profile.streak_days >= 7) {
        await addStudentBadge(key, badges.streak, daysAgo((index % 5) + 1));
      }

      if (score >= 80) {
        await addStudentBadge(key, badges.quiz, daysAgo((index % 4) + 1));
      }

      if (profile.current_level === 'advanced') {
        await addStudentBadge(key, badges.mastery, daysAgo((index % 6) + 1));
      }

      if (index % quizCycle.length === 0) {
        await addStudentBadge(key, badges.diagnostic, daysAgo((index % 7) + 1));
      }
    }

    for (const [index, student] of STUDENT_SEEDS.entries()) {
      const key = studentKey(student.nis);
      const firstName = getFirstName(student.name);
      const score = attemptScoresByStudent[key];
      const activityRows = [
        ['login', `${firstName} masuk ke dashboard siswa.`, { role: 'student', nis: student.nis }, daysAgo(0, 7 + (index % 8), 15)],
        [
          'submit_quiz',
          `${firstName} mengirim aktivitas kuis demo.`,
          { attempt_id: attemptIdsByStudent[key], score },
          daysAgo((index % 10) + 1, 8 + (index % 8), 20),
        ],
      ];

      if (index % 4 === 0) {
        activityRows.push([
          'view_material',
          `${firstName} membuka materi Analisis Soal Cerita Linear.`,
          { material_id: materials.mathAdv },
          daysAgo(0, 9 + (index % 6)),
        ]);
      }

      for (const [activity_type, description, metadata, created_at] of activityRows) {
        await insertRow(connection, 'activity_logs', {
          student_id: students[key],
          activity_type,
          description,
          metadata: JSON.stringify(metadata),
          created_at,
        });
      }
    }
  });
};

seed()
  .then(() => {
    console.log('Demo seed completed.');
    console.log('Demo accounts:');
    console.log(`- admin@edusense.ai / ${DEMO_PASSWORD}`);
    console.log(`- teacher@edusense.ai / ${DEMO_PASSWORD} (${TEACHER_SEEDS.find((teacher) => teacher.code === HOMEROOM_TEACHER_CODE).name})`);
    console.log(`- student@edusense.ai / ${DEMO_PASSWORD} (${STUDENT_SEEDS[0].name})`);
    console.log(`Seeded ${STUDENT_SEEDS.length} students into class ${CLASS_SEED.name} (${CLASS_SEED.academicYear}).`);
    console.log(`Seeded ${TEACHER_SEEDS.length} teacher rows, ${SUBJECT_SEEDS.length} subjects, and ${TEACHER_CLASS_SEEDS.length} class teaching assignments.`);
  })
  .catch((error) => {
    console.error('Demo seed failed.');
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closePool();
  });
