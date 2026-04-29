const path = require('node:path');

process.chdir(path.resolve(__dirname, '..'));

const { closePool, pool, withTransaction } = require('../src/config/db');
const { hashPassword } = require('../src/utils/hash');
const { encryptText } = require('../src/utils/crypto');

const DEMO_PASSWORD = 'demo12345';
const SCHOOL_YEAR = '2025/2026';

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
      teacherRani: await createUser({ role: 'teacher', name: 'Bu Rani Wijaya', email: 'teacher@edusense.ai', avatar: 'RW' }),
      teacherBima: await createUser({ role: 'teacher', name: 'Pak Bima Santoso', email: 'teacher2@edusense.ai', avatar: 'BS' }),
      alya: await createUser({ role: 'student', name: 'Alya Prameswari', email: 'student@edusense.ai', avatar: 'AP' }),
      raka: await createUser({ role: 'student', name: 'Raka Putra', email: 'raka@edusense.ai', avatar: 'RP' }),
      nadia: await createUser({ role: 'student', name: 'Nadia Zahra', email: 'nadia@edusense.ai', avatar: 'NZ' }),
      dimas: await createUser({ role: 'student', name: 'Dimas Akbar', email: 'dimas@edusense.ai', avatar: 'DA' }),
      siti: await createUser({ role: 'student', name: 'Siti Aulia', email: 'siti@edusense.ai', avatar: 'SA' }),
    };

    const teachers = {
      rani: await insertRow(connection, 'teachers', {
        school_id: schoolId,
        user_id: users.teacherRani,
        employee_number: 'NIP-DEMO-001',
        position: 'teacher',
        specialization: 'Matematika',
      }),
      bima: await insertRow(connection, 'teachers', {
        school_id: schoolId,
        user_id: users.teacherBima,
        employee_number: 'NIP-DEMO-002',
        position: 'teacher',
        specialization: 'Fisika',
      }),
    };

    const classes = {
      xiIpa2: await insertRow(connection, 'classes', {
        school_id: schoolId,
        homeroom_teacher_id: teachers.rani,
        name: 'XI IPA 2',
        grade_level: 'XI',
        academic_year: SCHOOL_YEAR,
      }),
      xiIpa1: await insertRow(connection, 'classes', {
        school_id: schoolId,
        homeroom_teacher_id: teachers.bima,
        name: 'XI IPA 1',
        grade_level: 'XI',
        academic_year: SCHOOL_YEAR,
      }),
      xIps1: await insertRow(connection, 'classes', {
        school_id: schoolId,
        homeroom_teacher_id: null,
        name: 'X IPS 1',
        grade_level: 'X',
        academic_year: SCHOOL_YEAR,
      }),
    };

    const students = {
      alya: await insertRow(connection, 'students', {
        school_id: schoolId,
        user_id: users.alya,
        class_id: classes.xiIpa2,
        student_number: 'SIS-DEMO-001',
        current_level: 'intermediate',
        risk_status: 'safe',
        total_score: 428,
        streak_days: 12,
      }),
      raka: await insertRow(connection, 'students', {
        school_id: schoolId,
        user_id: users.raka,
        class_id: classes.xiIpa2,
        student_number: 'SIS-DEMO-002',
        current_level: 'basic',
        risk_status: 'warning',
        total_score: 196,
        streak_days: 3,
      }),
      nadia: await insertRow(connection, 'students', {
        school_id: schoolId,
        user_id: users.nadia,
        class_id: classes.xiIpa1,
        student_number: 'SIS-DEMO-003',
        current_level: 'advanced',
        risk_status: 'safe',
        total_score: 612,
        streak_days: 18,
      }),
      dimas: await insertRow(connection, 'students', {
        school_id: schoolId,
        user_id: users.dimas,
        class_id: classes.xiIpa2,
        student_number: 'SIS-DEMO-004',
        current_level: 'basic',
        risk_status: 'danger',
        total_score: 82,
        streak_days: 0,
      }),
      siti: await insertRow(connection, 'students', {
        school_id: schoolId,
        user_id: users.siti,
        class_id: classes.xIps1,
        student_number: 'SIS-DEMO-005',
        current_level: 'intermediate',
        risk_status: 'warning',
        total_score: 244,
        streak_days: 5,
      }),
    };

    const subjects = {
      math: await insertRow(connection, 'subjects', {
        school_id: schoolId,
        name: 'Matematika',
        code: 'MTK-WJB',
        description: 'Fungsi linear, persamaan, gradien, dan pemecahan masalah.',
      }),
      physics: await insertRow(connection, 'subjects', {
        school_id: schoolId,
        name: 'Fisika',
        code: 'FSK',
        description: 'Gerak, gaya, energi, dan eksperimen dasar.',
      }),
      biology: await insertRow(connection, 'subjects', {
        school_id: schoolId,
        name: 'Biologi',
        code: 'BIO',
        description: 'Sel, sistem tubuh, ekosistem, dan literasi sains.',
      }),
      english: await insertRow(connection, 'subjects', {
        school_id: schoolId,
        name: 'Bahasa Inggris',
        code: 'BIG',
        description: 'Reading, grammar, writing, dan analytical exposition.',
      }),
    };

    const teacherClassRows = [
      [teachers.rani, classes.xiIpa2, subjects.math, 'subject_teacher'],
      [teachers.rani, classes.xiIpa1, subjects.math, 'subject_teacher'],
      [teachers.rani, classes.xIps1, subjects.math, 'assistant_teacher'],
      [teachers.bima, classes.xiIpa2, subjects.physics, 'subject_teacher'],
      [teachers.bima, classes.xiIpa1, subjects.physics, 'subject_teacher'],
      [teachers.bima, classes.xIps1, subjects.biology, 'assistant_teacher'],
    ];

    for (const [teacher_id, class_id, subject_id, assignment_type] of teacherClassRows) {
      await insertRow(connection, 'teacher_classes', {
        school_id: schoolId,
        teacher_id,
        class_id,
        subject_id,
        assignment_type,
      });
    }

    const materialSeed = [
      ['mathBasic', subjects.math, 'Konsep Fungsi Linear', 'Memahami bentuk y = ax + b, nilai awal, dan laju perubahan.', 'basic', 15],
      ['mathMid', subjects.math, 'Gradien dan Grafik', 'Menganalisis kemiringan garis dari persamaan dan grafik.', 'intermediate', 20],
      ['mathAdv', subjects.math, 'Analisis Soal Cerita Linear', 'Menerjemahkan konteks sehari-hari menjadi model linear.', 'advanced', 25],
      ['physicsBasic', subjects.physics, 'Gerak Lurus Beraturan', 'Konsep jarak, waktu, kecepatan, dan grafik sederhana.', 'basic', 18],
      ['physicsMid', subjects.physics, 'Hukum Newton I', 'Inersia, resultan gaya, dan contoh gaya seimbang.', 'intermediate', 22],
      ['physicsAdv', subjects.physics, 'Energi dan Usaha', 'Hubungan usaha, perubahan energi, dan efisiensi.', 'advanced', 28],
      ['biologyBasic', subjects.biology, 'Struktur Sel', 'Organel sel dan fungsi dasarnya dalam kehidupan.', 'basic', 16],
      ['biologyMid', subjects.biology, 'Sistem Pencernaan', 'Organ pencernaan, enzim, dan alur proses makanan.', 'intermediate', 21],
      ['biologyAdv', subjects.biology, 'Ekosistem dan Rantai Makanan', 'Interaksi makhluk hidup, energi, dan keseimbangan ekosistem.', 'advanced', 24],
      ['englishBasic', subjects.english, 'Descriptive Text', 'Mengenali struktur dan ciri kebahasaan descriptive text.', 'basic', 14],
      ['englishMid', subjects.english, 'Simple Past Tense', 'Menggunakan bentuk lampau untuk menceritakan peristiwa.', 'intermediate', 19],
      ['englishAdv', subjects.english, 'Analytical Exposition', 'Menyusun argumen, thesis, dan reiteration secara runtut.', 'advanced', 26],
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
        subject_id: subjects.math,
        material_id: materials.mathBasic,
        title: 'Tes Diagnostik AI - Fungsi Linear',
        quiz_type: 'diagnostic',
        level: 'basic',
        duration_minutes: 20,
      }),
      mathPractice: await insertRow(connection, 'quizzes', {
        subject_id: subjects.math,
        material_id: materials.mathMid,
        title: 'Kuis Adaptif - Gradien dan Grafik',
        quiz_type: 'practice',
        level: 'intermediate',
        duration_minutes: 15,
      }),
      physicsPractice: await insertRow(connection, 'quizzes', {
        subject_id: subjects.physics,
        material_id: materials.physicsBasic,
        title: 'Latihan Cepat - Gerak Lurus',
        quiz_type: 'practice',
        level: 'basic',
        duration_minutes: 12,
      }),
      englishFinal: await insertRow(connection, 'quizzes', {
        subject_id: subjects.english,
        material_id: materials.englishMid,
        title: 'Final Mini - Simple Past',
        quiz_type: 'final',
        level: 'intermediate',
        duration_minutes: 18,
      }),
      biologyPractice: await insertRow(connection, 'quizzes', {
        subject_id: subjects.biology,
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

    const attempts = {
      alyaDiagnostic: await createAttempt({
        studentKey: 'alya',
        quizKey: 'diagnostic',
        correctCount: 8,
        score: 82,
        accuracyRate: 80,
        seconds: 940,
        attemptNumber: 1,
        level: 'intermediate',
        trend: 'improving',
        startedAt: daysAgo(7, 9),
        submittedAt: daysAgo(7, 9, 18),
      }),
      alyaPractice: await createAttempt({
        studentKey: 'alya',
        quizKey: 'mathPractice',
        correctCount: 4,
        score: 92,
        accuracyRate: 100,
        seconds: 780,
        attemptNumber: 1,
        level: 'advanced',
        trend: 'improving',
        startedAt: daysAgo(1, 15),
        submittedAt: daysAgo(1, 15, 13),
      }),
      rakaDiagnostic: await createAttempt({
        studentKey: 'raka',
        quizKey: 'diagnostic',
        correctCount: 5,
        score: 50,
        accuracyRate: 50,
        seconds: 1220,
        attemptNumber: 1,
        level: 'basic',
        trend: 'stable',
        startedAt: daysAgo(3, 10),
        submittedAt: daysAgo(3, 10, 24),
      }),
      nadiaMath: await createAttempt({
        studentKey: 'nadia',
        quizKey: 'mathPractice',
        correctCount: 4,
        score: 96,
        accuracyRate: 100,
        seconds: 640,
        attemptNumber: 1,
        level: 'advanced',
        trend: 'improving',
        startedAt: daysAgo(2, 11),
        submittedAt: daysAgo(2, 11, 10),
      }),
      dimasPhysics: await createAttempt({
        studentKey: 'dimas',
        quizKey: 'physicsPractice',
        correctCount: 1,
        score: 25,
        accuracyRate: 25,
        seconds: 980,
        attemptNumber: 1,
        level: 'basic',
        trend: 'declining',
        startedAt: daysAgo(1, 8),
        submittedAt: daysAgo(1, 8, 16),
      }),
      sitiEnglish: await createAttempt({
        studentKey: 'siti',
        quizKey: 'englishFinal',
        correctCount: 3,
        score: 75,
        accuracyRate: 75,
        seconds: 850,
        attemptNumber: 1,
        level: 'intermediate',
        trend: 'stable',
        startedAt: daysAgo(4, 13),
        submittedAt: daysAgo(4, 13, 14),
      }),
    };

    const progressRows = [
      ['alya', 'mathBasic', 'completed', 100, 1800, daysAgo(8)],
      ['alya', 'mathMid', 'completed', 100, 2100, daysAgo(2)],
      ['alya', 'mathAdv', 'in_progress', 64, 920, null],
      ['raka', 'mathBasic', 'in_progress', 45, 1160, null],
      ['raka', 'mathMid', 'not_started', 0, 0, null],
      ['nadia', 'mathBasic', 'completed', 100, 1500, daysAgo(10)],
      ['nadia', 'mathMid', 'completed', 100, 1600, daysAgo(5)],
      ['nadia', 'mathAdv', 'completed', 100, 1900, daysAgo(1)],
      ['dimas', 'physicsBasic', 'in_progress', 28, 780, null],
      ['siti', 'englishBasic', 'completed', 100, 1200, daysAgo(6)],
      ['siti', 'englishMid', 'in_progress', 58, 860, null],
    ];

    for (const [studentKey, materialKey, status, progress_percent, time_spent_seconds, completed_at] of progressRows) {
      await insertRow(connection, 'learning_progress', {
        student_id: students[studentKey],
        material_id: materials[materialKey],
        status,
        progress_percent,
        time_spent_seconds,
        completed_at,
      });
    }

    const recommendationRows = [
      ['alya', 'mathAdv', 'challenge', 'Alya sudah stabil di konsep gradien. Lanjutkan soal cerita level lanjutan.', 'low', 'pending'],
      ['raka', 'mathBasic', 'remedial', 'Akurasi dasar masih 50%. Ulangi persamaan sederhana dan latihan bertahap.', 'high', 'pending'],
      ['nadia', 'physicsAdv', 'challenge', 'Performa tinggi. Beri tantangan lintas konsep untuk menjaga momentum.', 'low', 'pending'],
      ['dimas', 'physicsBasic', 'remedial', 'Nilai GLB rendah dan trend menurun. Butuh pendampingan guru.', 'high', 'pending'],
      ['siti', 'englishMid', 'review', 'Perlu memperkuat pola kalimat simple past sebelum final berikutnya.', 'medium', 'pending'],
      ['alya', 'mathMid', 'review', 'Review singkat selesai setelah kuis adaptif terakhir.', 'low', 'done'],
    ];

    for (const [studentKey, materialKey, recommendation_type, reason, priority, status] of recommendationRows) {
      await insertRow(connection, 'ai_recommendations', {
        student_id: students[studentKey],
        material_id: materialKey ? materials[materialKey] : null,
        recommendation_type,
        reason,
        priority,
        status,
      });
    }

    const featureRows = [
      ['alya', 1.34, 86, 91, 88, 8],
      ['raka', 0.82, 58, 64, 59, 24],
      ['nadia', 1.52, 94, 96, 92, 4],
      ['dimas', 0.61, 42, 38, 44, 33],
      ['siti', 0.98, 70, 73, 68, 16],
    ];

    for (const [studentKey, learning_speed, accuracy_rate, consistency_score, engagement_score, retry_rate] of featureRows) {
      await insertRow(connection, 'student_features', {
        student_id: students[studentKey],
        learning_speed,
        accuracy_rate,
        consistency_score,
        engagement_score,
        retry_rate,
        last_calculated_at: daysAgo(0, 7),
      });
    }

    const predictionRows = [
      ['alya', 'advanced', 'low', 91, 'Akurasi tinggi dan streak konsisten selama 12 hari.'],
      ['raka', 'basic', 'medium', 74, 'Butuh remedial konsep dasar dan pemantauan progres mingguan.'],
      ['nadia', 'advanced', 'low', 95, 'Performa stabil di level lanjutan.'],
      ['dimas', 'basic', 'high', 88, 'Skor rendah, engagement turun, dan percobaan terakhir menurun.'],
      ['siti', 'intermediate', 'medium', 79, 'Kemajuan cukup baik tetapi konsistensi jawaban grammar perlu diperkuat.'],
    ];

    for (const [studentKey, predicted_level, risk_prediction, confidence, prediction_reason] of predictionRows) {
      await insertRow(connection, 'ai_predictions', {
        student_id: students[studentKey],
        predicted_level,
        risk_prediction,
        confidence,
        model_version: 'demo-v1.0',
        prediction_reason,
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

    const studentBadgeRows = [
      ['alya', badges.starter, daysAgo(9)],
      ['alya', badges.streak, daysAgo(3)],
      ['alya', badges.quiz, daysAgo(1)],
      ['alya', badges.diagnostic, daysAgo(7)],
      ['raka', badges.starter, daysAgo(3)],
      ['raka', badges.diagnostic, daysAgo(3)],
      ['nadia', badges.starter, daysAgo(15)],
      ['nadia', badges.streak, daysAgo(8)],
      ['nadia', badges.mastery, daysAgo(2)],
      ['dimas', badges.starter, daysAgo(2)],
      ['siti', badges.starter, daysAgo(7)],
    ];

    for (const [studentKey, badge_id, earned_at] of studentBadgeRows) {
      await insertRow(connection, 'student_badges', {
        school_id: schoolId,
        student_id: students[studentKey],
        badge_id,
        earned_at,
      });
    }

    const activityRows = [
      ['alya', 'login', 'Alya masuk ke dashboard siswa.', { role: 'student' }, daysAgo(0, 7, 45)],
      ['alya', 'view_material', 'Membuka materi Analisis Soal Cerita Linear.', { material_id: materials.mathAdv }, daysAgo(0, 8)],
      ['alya', 'submit_quiz', 'Mengirim kuis adaptif Gradien dan Grafik.', { attempt_id: attempts.alyaPractice, score: 92 }, daysAgo(1, 15, 13)],
      ['alya', 'earn_badge', 'Mendapat lencana Jago Kuis.', { badge_id: badges.quiz }, daysAgo(1, 15, 14)],
      ['raka', 'submit_quiz', 'Mengirim tes diagnostik AI.', { attempt_id: attempts.rakaDiagnostic, score: 50 }, daysAgo(3, 10, 24)],
      ['nadia', 'earn_badge', 'Mendapat Mastery Badge.', { badge_id: badges.mastery }, daysAgo(2, 11, 11)],
      ['dimas', 'start_quiz', 'Memulai latihan Gerak Lurus.', { quiz_id: quizzes.physicsPractice }, daysAgo(1, 8)],
      ['siti', 'view_material', 'Membuka materi Simple Past Tense.', { material_id: materials.englishMid }, daysAgo(4, 12)],
    ];

    for (const [studentKey, activity_type, description, metadata, created_at] of activityRows) {
      await insertRow(connection, 'activity_logs', {
        student_id: students[studentKey],
        activity_type,
        description,
        metadata: JSON.stringify(metadata),
        created_at,
      });
    }
  });
};

seed()
  .then(() => {
    console.log('Demo seed completed.');
    console.log('Demo accounts:');
    console.log(`- admin@edusense.ai / ${DEMO_PASSWORD}`);
    console.log(`- teacher@edusense.ai / ${DEMO_PASSWORD}`);
    console.log(`- student@edusense.ai / ${DEMO_PASSWORD}`);
  })
  .catch((error) => {
    console.error('Demo seed failed.');
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closePool();
  });
