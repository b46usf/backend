const env = require('./env');

const apiPrefix = env.API_PREFIX;

const successResponse = (description, dataSchema, withMeta = false) => ({
  description,
  content: {
    'application/json': {
      schema: {
        allOf: [
          { $ref: '#/components/schemas/SuccessResponse' },
          {
            type: 'object',
            properties: {
              data: env.API_RESPONSE_ENCRYPTION_ENABLED
                ? {
                    type: 'string',
                    nullable: true,
                    example: 'enc:json:v1:QmFzZTY0Q2lwaGVyVGV4dA==',
                  }
                : dataSchema,
              ...(withMeta
                ? {
                    meta: {
                      ...(env.API_RESPONSE_ENCRYPTION_ENABLED
                        ? {
                            type: 'string',
                            example: 'enc:json:v1:QmFzZTY0Q2lwaGVyVGV4dA==',
                          }
                        : { $ref: '#/components/schemas/ListMeta' }),
                    },
                  }
                : {}),
            },
          },
        ],
      },
    },
  },
});

const errorResponse = (description) => ({
  description,
  content: {
    'application/json': {
      schema: {
        $ref: '#/components/schemas/ErrorResponse',
      },
    },
  },
});

const bearerAuth = [{ bearerAuth: [] }];

const idParam = (name, description) => ({
  name,
  in: 'path',
  required: true,
  description,
  schema: {
    type: 'integer',
    minimum: 1,
  },
});

const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'EduSense AI API',
    version: '1.0.0',
    description: 'Dokumentasi API untuk backend EduSense AI.',
  },
  servers: [
    {
      url: apiPrefix,
      description: 'Current API prefix',
    },
  ],
  tags: [
    { name: 'Umum - Health & Auth', description: 'Status service, registrasi, login, dan profil user aktif.' },
    { name: 'A. Siswa - Belajar & Progress', description: 'Belajar materi, melihat dashboard/progress, dan rekomendasi belajar.' },
    { name: 'A. Siswa - Kuis & Badge', description: 'Mengerjakan kuis, melihat leaderboard, dan badge.' },
    { name: 'A. Siswa - AI Personalization', description: 'Tes diagnostik AI, learning path personal, feedback card, dan trend performa siswa.' },
    { name: 'B. Guru - Kelas & Assessment', description: 'Performa kelas, hasil assessment otomatis, dan intervensi siswa.' },
    { name: 'B. Guru - Materi', description: 'Membuat dan mengelola materi pembelajaran.' },
    { name: 'B. Guru - AI Decision Support', description: 'Memantau siswa berisiko dan rekomendasi AI untuk pendampingan.' },
    { name: 'C. Admin Sekolah - Akun', description: 'Manajemen akun dan verifikasi user.' },
    { name: 'C. Admin Sekolah - Master Data', description: 'Manajemen kelas dan mata pelajaran.' },
    { name: 'C. Admin Sekolah - Data Guru/Siswa', description: 'Data guru, siswa, dan dashboard sekolah.' },
  ],
  paths: {
    '/health': {
      get: {
        tags: ['Umum - Health & Auth'],
        summary: 'Cek status service',
        servers: [{ url: '/' }],
        responses: {
          200: successResponse('Service healthy', {
            type: 'object',
            properties: {
              name: { type: 'string', example: env.APP_NAME },
              environment: { type: 'string', example: env.NODE_ENV },
            },
          }),
        },
      },
    },
    '/': {
      get: {
        tags: ['Umum - Health & Auth'],
        summary: 'Cek root API',
        responses: {
          200: successResponse('API ready', {
            type: 'object',
            properties: {
              version: { type: 'string', example: '1.0.0' },
            },
          }),
        },
      },
    },
    '/auth/register': {
      post: {
        tags: ['Umum - Health & Auth'],
        summary: 'Registrasi user baru',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/RegisterRequest' },
            },
          },
        },
        responses: {
          201: successResponse('User registered successfully', { $ref: '#/components/schemas/AuthPayload' }),
          400: errorResponse('Request tidak valid'),
          409: errorResponse('Email sudah terdaftar'),
        },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Umum - Health & Auth'],
        summary: 'Login user',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/LoginRequest' },
            },
          },
        },
        responses: {
          200: successResponse('Login successful', { $ref: '#/components/schemas/AuthPayload' }),
          400: errorResponse('Request tidak valid'),
          401: errorResponse('Email atau password salah'),
        },
      },
    },
    '/auth/google/register': {
      post: {
        tags: ['Umum - Health & Auth'],
        summary: 'Registrasi siswa/guru via Google OAuth',
        description: 'Kirim Google idToken. Akun siswa/guru dibuat inactive dan harus diverifikasi admin.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['idToken', 'role'],
                properties: {
                  idToken: { type: 'string' },
                  role: { type: 'string', enum: ['student', 'teacher'] },
                  classId: { type: 'integer', description: 'Wajib untuk role student' },
                  studentNumber: { type: 'string' },
                  employeeNumber: { type: 'string' },
                  position: { type: 'string', enum: ['teacher', 'vice_principal', 'principal'] },
                  specialization: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          201: successResponse('Google registration submitted for admin verification', {
            type: 'object',
            properties: {
              user: { $ref: '#/components/schemas/User' },
              verification_status: { type: 'string', example: 'pending_admin_verification' },
            },
          }),
          400: errorResponse('Request tidak valid'),
          409: errorResponse('Email sudah terdaftar'),
        },
      },
    },
    '/auth/me': {
      get: {
        tags: ['Umum - Health & Auth'],
        summary: 'Ambil profil user aktif',
        security: bearerAuth,
        responses: {
          200: successResponse('Profile fetched successfully', { $ref: '#/components/schemas/User' }),
          401: errorResponse('Token tidak valid atau tidak dikirim'),
          404: errorResponse('Profil tidak ditemukan'),
        },
      },
    },
    '/auth/users/{id}/verify': {
      patch: {
        tags: ['C. Admin Sekolah - Akun'],
        summary: 'Verifikasi user oleh admin',
        security: bearerAuth,
        parameters: [idParam('id', 'ID user')],
        responses: {
          200: successResponse('User verified successfully', { $ref: '#/components/schemas/User' }),
          401: errorResponse('Token tidak valid atau tidak dikirim'),
          403: errorResponse('Hanya admin yang boleh verifikasi'),
          404: errorResponse('User tidak ditemukan'),
        },
      },
    },
    '/admin/classes': {
      get: {
        tags: ['C. Admin Sekolah - Master Data'],
        summary: 'List kelas sekolah',
        security: bearerAuth,
        responses: {
          200: successResponse('Classes fetched successfully', {
            type: 'array',
            items: { type: 'object' },
          }, true),
          401: errorResponse('Token tidak valid atau tidak dikirim'),
          403: errorResponse('Hanya admin sekolah yang boleh akses'),
        },
      },
      post: {
        tags: ['C. Admin Sekolah - Master Data'],
        summary: 'Buat kelas baru',
        security: bearerAuth,
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name'],
                properties: {
                  name: { type: 'string', example: '7A' },
                  homeroomTeacherId: { type: 'integer', example: 3 },
                  gradeLevel: { type: 'string', example: '7' },
                  academicYear: { type: 'string', example: '2025/2026' },
                },
              },
            },
          },
        },
        responses: {
          201: successResponse('Class created successfully', { type: 'object' }),
          400: errorResponse('Request tidak valid'),
          403: errorResponse('Hanya admin sekolah yang boleh akses'),
        },
      },
    },
    '/admin/subjects': {
      get: {
        tags: ['C. Admin Sekolah - Master Data'],
        summary: 'List mata pelajaran',
        security: bearerAuth,
        responses: {
          200: successResponse('Subjects fetched successfully', {
            type: 'array',
            items: { type: 'object' },
          }, true),
          401: errorResponse('Token tidak valid atau tidak dikirim'),
          403: errorResponse('Hanya admin sekolah yang boleh akses'),
        },
      },
      post: {
        tags: ['C. Admin Sekolah - Master Data'],
        summary: 'Buat mata pelajaran baru',
        security: bearerAuth,
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name'],
                properties: {
                  name: { type: 'string', example: 'Matematika' },
                  code: { type: 'string', example: 'MTK' },
                  description: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          201: successResponse('Subject created successfully', { type: 'object' }),
          400: errorResponse('Request tidak valid'),
          403: errorResponse('Hanya admin sekolah yang boleh akses'),
        },
      },
    },
    '/students': {
      get: {
        tags: ['C. Admin Sekolah - Data Guru/Siswa'],
        summary: 'List siswa',
        security: bearerAuth,
        parameters: [
          { $ref: '#/components/parameters/ClassIdQuery' },
          { $ref: '#/components/parameters/LevelQuery' },
          { $ref: '#/components/parameters/RiskStatusQuery' },
        ],
        responses: {
          200: successResponse('Students fetched successfully', {
            type: 'array',
            items: { $ref: '#/components/schemas/Student' },
          }, true),
          401: errorResponse('Token tidak valid atau tidak dikirim'),
        },
      },
    },
    '/students/me/dashboard': {
      get: {
        tags: ['A. Siswa - Belajar & Progress'],
        summary: 'Dashboard adaptive learning siswa',
        security: bearerAuth,
        responses: {
          200: successResponse('Student dashboard fetched successfully', {
            type: 'object',
            properties: {
              student: { $ref: '#/components/schemas/StudentDetail' },
              ai_level: { $ref: '#/components/schemas/LearningLevel' },
              risk_status: { $ref: '#/components/schemas/RiskStatus' },
              progress_summary: { $ref: '#/components/schemas/ProgressSummary' },
              recommendations: { type: 'array', items: { type: 'object' } },
              recent_attempts: { type: 'array', items: { $ref: '#/components/schemas/RecentAttempt' } },
              badges: { type: 'array', items: { $ref: '#/components/schemas/Badge' } },
            },
          }),
          401: errorResponse('Token tidak valid atau tidak dikirim'),
          403: errorResponse('Hanya siswa yang boleh akses'),
        },
      },
    },
    '/students/me/recommendations': {
      get: {
        tags: ['A. Siswa - Belajar & Progress'],
        summary: 'Rekomendasi AI untuk siswa aktif',
        security: bearerAuth,
        responses: {
          200: successResponse('Student recommendations fetched successfully', {
            type: 'array',
            items: { type: 'object' },
          }, true),
          401: errorResponse('Token tidak valid atau tidak dikirim'),
        },
      },
    },
    '/students/me/progress': {
      get: {
        tags: ['A. Siswa - Belajar & Progress'],
        summary: 'Progress belajar siswa aktif',
        security: bearerAuth,
        responses: {
          200: successResponse('Student progress fetched successfully', {
            type: 'array',
            items: { type: 'object' },
          }, true),
          401: errorResponse('Token tidak valid atau tidak dikirim'),
        },
      },
    },
    '/students/me/materials/{materialId}/progress': {
      put: {
        tags: ['A. Siswa - Belajar & Progress'],
        summary: 'Simpan progress belajar materi',
        security: bearerAuth,
        parameters: [idParam('materialId', 'ID materi')],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['status', 'progressPercent'],
                properties: {
                  status: { type: 'string', enum: ['not_started', 'in_progress', 'completed'] },
                  progressPercent: { type: 'number', minimum: 0, maximum: 100 },
                  timeSpentSeconds: { type: 'integer', minimum: 0, default: 0 },
                },
              },
            },
          },
        },
        responses: {
          200: successResponse('Learning progress saved successfully', { type: 'object' }),
          401: errorResponse('Token tidak valid atau tidak dikirim'),
        },
      },
    },
    '/students/me/badges': {
      get: {
        tags: ['A. Siswa - Belajar & Progress'],
        summary: 'Badge siswa aktif',
        security: bearerAuth,
        responses: {
          200: successResponse('Student badges fetched successfully', {
            type: 'array',
            items: { $ref: '#/components/schemas/Badge' },
          }, true),
          401: errorResponse('Token tidak valid atau tidak dikirim'),
        },
      },
    },
    '/students/{id}': {
      get: {
        tags: ['C. Admin Sekolah - Data Guru/Siswa'],
        summary: 'Detail siswa',
        security: bearerAuth,
        parameters: [idParam('id', 'ID siswa')],
        responses: {
          200: successResponse('Student detail fetched successfully', { $ref: '#/components/schemas/StudentDetail' }),
          401: errorResponse('Token tidak valid atau tidak dikirim'),
          404: errorResponse('Siswa tidak ditemukan'),
        },
      },
    },
    '/teachers': {
      get: {
        tags: ['B. Guru - Kelas & Assessment'],
        summary: 'List guru',
        description: 'Memerlukan role admin atau teacher.',
        security: bearerAuth,
        responses: {
          200: successResponse('Teachers fetched successfully', {
            type: 'array',
            items: { $ref: '#/components/schemas/Teacher' },
          }, true),
          401: errorResponse('Token tidak valid atau tidak dikirim'),
          403: errorResponse('Role tidak diizinkan'),
        },
      },
    },
    '/teachers/classes/dashboard': {
      get: {
        tags: ['B. Guru - Kelas & Assessment'],
        summary: 'Dashboard kelas guru',
        description: 'Memuat ringkasan kelas dan antrean siswa yang perlu intervensi.',
        security: bearerAuth,
        responses: {
          200: successResponse('Teacher class dashboard fetched successfully', {
            type: 'object',
            properties: {
              classes: { type: 'array', items: { type: 'object' } },
              intervention_queue: { type: 'array', items: { type: 'object' } },
            },
          }),
          401: errorResponse('Token tidak valid atau tidak dikirim'),
          403: errorResponse('Role tidak diizinkan'),
        },
      },
    },
    '/teachers/students/{studentId}/intervention': {
      get: {
        tags: ['B. Guru - Kelas & Assessment'],
        summary: 'Saran intervensi AI untuk siswa',
        security: bearerAuth,
        parameters: [idParam('studentId', 'ID siswa')],
        responses: {
          200: successResponse('Student intervention advice fetched successfully', {
            type: 'object',
            properties: {
              student: { type: 'object' },
              ai_intervention_advice: { type: 'array', items: { type: 'string' } },
            },
          }),
          401: errorResponse('Token tidak valid atau tidak dikirim'),
          403: errorResponse('Role tidak diizinkan'),
          404: errorResponse('Siswa tidak ditemukan di kelas guru'),
        },
      },
    },
    '/teachers/{id}': {
      get: {
        tags: ['B. Guru - Kelas & Assessment'],
        summary: 'Detail guru',
        description: 'Memerlukan role admin atau teacher.',
        security: bearerAuth,
        parameters: [idParam('id', 'ID guru')],
        responses: {
          200: successResponse('Teacher detail fetched successfully', { $ref: '#/components/schemas/TeacherDetail' }),
          401: errorResponse('Token tidak valid atau tidak dikirim'),
          403: errorResponse('Role tidak diizinkan'),
          404: errorResponse('Guru tidak ditemukan'),
        },
      },
    },
    '/materials': {
      get: {
        tags: ['A. Siswa - Belajar & Progress'],
        summary: 'List materi',
        security: bearerAuth,
        parameters: [
          { $ref: '#/components/parameters/SubjectIdQuery' },
          { $ref: '#/components/parameters/LevelQuery' },
        ],
        responses: {
          200: successResponse('Materials fetched successfully', {
            type: 'array',
            items: { $ref: '#/components/schemas/Material' },
          }, true),
          401: errorResponse('Token tidak valid atau tidak dikirim'),
        },
      },
      post: {
        tags: ['B. Guru - Materi'],
        summary: 'Buat materi pembelajaran',
        description: 'Memerlukan role admin atau teacher.',
        security: bearerAuth,
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/MaterialRequest' },
            },
          },
        },
        responses: {
          201: successResponse('Material created successfully', { $ref: '#/components/schemas/MaterialDetail' }),
          400: errorResponse('Request tidak valid'),
          403: errorResponse('Role tidak diizinkan'),
        },
      },
    },
    '/materials/{id}': {
      get: {
        tags: ['A. Siswa - Belajar & Progress'],
        summary: 'Detail materi',
        security: bearerAuth,
        parameters: [idParam('id', 'ID materi')],
        responses: {
          200: successResponse('Material detail fetched successfully', { $ref: '#/components/schemas/MaterialDetail' }),
          401: errorResponse('Token tidak valid atau tidak dikirim'),
          404: errorResponse('Materi tidak ditemukan'),
        },
      },
      put: {
        tags: ['B. Guru - Materi'],
        summary: 'Update materi pembelajaran',
        description: 'Memerlukan role admin atau teacher.',
        security: bearerAuth,
        parameters: [idParam('id', 'ID materi')],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/MaterialRequest' },
            },
          },
        },
        responses: {
          200: successResponse('Material updated successfully', { $ref: '#/components/schemas/MaterialDetail' }),
          400: errorResponse('Request tidak valid'),
          403: errorResponse('Role tidak diizinkan'),
          404: errorResponse('Materi tidak ditemukan'),
        },
      },
      delete: {
        tags: ['B. Guru - Materi'],
        summary: 'Hapus materi pembelajaran',
        description: 'Memerlukan role admin atau teacher.',
        security: bearerAuth,
        parameters: [idParam('id', 'ID materi')],
        responses: {
          200: successResponse('Material deleted successfully', { type: 'object' }),
          403: errorResponse('Role tidak diizinkan'),
          404: errorResponse('Materi tidak ditemukan'),
        },
      },
    },
    '/quizzes': {
      get: {
        tags: ['A. Siswa - Kuis & Badge'],
        summary: 'List kuis',
        security: bearerAuth,
        parameters: [
          { $ref: '#/components/parameters/SubjectIdQuery' },
          { $ref: '#/components/parameters/LevelQuery' },
          { $ref: '#/components/parameters/QuizTypeQuery' },
        ],
        responses: {
          200: successResponse('Quizzes fetched successfully', {
            type: 'array',
            items: { $ref: '#/components/schemas/Quiz' },
          }, true),
          401: errorResponse('Token tidak valid atau tidak dikirim'),
        },
      },
    },
    '/quizzes/{id}': {
      get: {
        tags: ['A. Siswa - Kuis & Badge'],
        summary: 'Detail kuis beserta pertanyaan',
        security: bearerAuth,
        parameters: [idParam('id', 'ID kuis')],
        responses: {
          200: successResponse('Quiz detail fetched successfully', { $ref: '#/components/schemas/QuizDetail' }),
          401: errorResponse('Token tidak valid atau tidak dikirim'),
          404: errorResponse('Kuis tidak ditemukan'),
        },
      },
    },
    '/quizzes/{id}/submit': {
      post: {
        tags: ['A. Siswa - Kuis & Badge'],
        summary: 'Submit jawaban kuis dan jalankan automated assessment',
        description: 'Pilihan ganda dinilai exact match. Essay dinilai dari keyword dan similarity scoring.',
        security: bearerAuth,
        parameters: [idParam('id', 'ID kuis')],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['answers'],
                properties: {
                  timeSpentSeconds: { type: 'integer', minimum: 0, default: 0 },
                  answers: {
                    type: 'array',
                    items: {
                      type: 'object',
                      required: ['questionId'],
                      properties: {
                        questionId: { type: 'integer' },
                        answer: { type: 'string' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        responses: {
          200: successResponse('Quiz submitted and assessed successfully', {
            type: 'object',
            properties: {
              attempt_id: { type: 'integer' },
              score: { type: 'number' },
              accuracy_rate: { type: 'number' },
              confidence_score: { type: 'number' },
              ai_level_result: { $ref: '#/components/schemas/LearningLevel' },
              risk_status: { $ref: '#/components/schemas/RiskStatus' },
              next_learning_path: { type: 'object', nullable: true },
              awarded_badge: { type: 'object', nullable: true },
              feedback: { type: 'array', items: { type: 'object' } },
            },
          }),
          401: errorResponse('Token tidak valid atau tidak dikirim'),
          403: errorResponse('Hanya siswa yang boleh submit kuis'),
          404: errorResponse('Kuis atau profil siswa tidak ditemukan'),
        },
      },
    },
    '/assessments/attempts': {
      get: {
        tags: ['B. Guru - Kelas & Assessment'],
        summary: 'List percobaan kuis',
        security: bearerAuth,
        parameters: [
          { $ref: '#/components/parameters/StudentIdQuery' },
          { $ref: '#/components/parameters/QuizIdQuery' },
        ],
        responses: {
          200: successResponse('Assessment attempts fetched successfully', {
            type: 'array',
            items: { $ref: '#/components/schemas/AssessmentAttempt' },
          }, true),
          401: errorResponse('Token tidak valid atau tidak dikirim'),
        },
      },
    },
    '/assessments/students/{studentId}/summary': {
      get: {
        tags: ['B. Guru - Kelas & Assessment'],
        summary: 'Ringkasan asesmen siswa',
        security: bearerAuth,
        parameters: [idParam('studentId', 'ID siswa')],
        responses: {
          200: successResponse('Assessment summary fetched successfully', { $ref: '#/components/schemas/AssessmentSummary' }),
          401: errorResponse('Token tidak valid atau tidak dikirim'),
          404: errorResponse('Siswa tidak ditemukan'),
        },
      },
    },
    '/ai/diagnostic': {
      get: {
        tags: ['A. Siswa - AI Personalization'],
        summary: 'AI Diagnostic Screen',
        description: 'Halaman awal setelah login untuk mengukur kemampuan awal siswa dan menyiapkan 10 soal adaptif.',
        security: bearerAuth,
        responses: {
          200: successResponse('AI diagnostic screen fetched successfully', { type: 'object' }),
          401: errorResponse('Token tidak valid atau tidak dikirim'),
          403: errorResponse('Hanya siswa yang boleh akses'),
        },
      },
    },
    '/ai/diagnostic/submit': {
      post: {
        tags: ['A. Siswa - AI Personalization'],
        summary: 'Submit Tes Diagnostik AI',
        description: 'Menghasilkan estimasi kemampuan dan level awal: Basic, Intermediate, atau Advanced.',
        security: bearerAuth,
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['quizId', 'answers'],
                properties: {
                  quizId: { type: 'integer' },
                  timeSpentSeconds: { type: 'integer', default: 0 },
                  answers: {
                    type: 'array',
                    minItems: 1,
                    maxItems: 10,
                    items: {
                      type: 'object',
                      required: ['questionId'],
                      properties: {
                        questionId: { type: 'integer' },
                        answer: { type: 'string' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        responses: {
          200: successResponse('AI diagnostic submitted successfully', { type: 'object' }),
          400: errorResponse('Request tidak valid'),
          403: errorResponse('Hanya siswa yang boleh submit'),
        },
      },
    },
    '/ai/learning-path/me': {
      get: {
        tags: ['A. Siswa - AI Personalization'],
        summary: 'Personalized Learning Path',
        description: 'Menghasilkan game map: Start -> Materi Dasar -> Latihan 1 -> Kuis Adaptif -> Materi Lanjutan -> Challenge -> Mastery Badge.',
        security: bearerAuth,
        responses: {
          200: successResponse('Personalized learning path fetched successfully', { type: 'object' }),
          403: errorResponse('Hanya siswa yang boleh akses'),
        },
      },
    },
    '/ai/feedback-card/me': {
      get: {
        tags: ['A. Siswa - AI Personalization'],
        summary: 'AI Feedback Card',
        description: 'Menampilkan skor, level, trend, AI insight, dan rekomendasi setelah kuis.',
        security: bearerAuth,
        parameters: [
          {
            name: 'attemptId',
            in: 'query',
            required: false,
            schema: { type: 'integer', minimum: 1 },
          },
        ],
        responses: {
          200: successResponse('AI feedback card fetched successfully', { type: 'object' }),
          403: errorResponse('Hanya siswa yang boleh akses'),
          404: errorResponse('Feedback tidak ditemukan'),
        },
      },
    },
    '/ai/performance/me': {
      get: {
        tags: ['A. Siswa - AI Personalization'],
        summary: 'Performance Trend Dashboard siswa',
        security: bearerAuth,
        responses: {
          200: successResponse('Performance trend dashboard fetched successfully', { type: 'object' }),
          403: errorResponse('Hanya siswa yang boleh akses'),
        },
      },
    },
    '/ai/students/{studentId}/performance': {
      get: {
        tags: ['B. Guru - Kelas & Assessment'],
        summary: 'Performance Trend Dashboard siswa untuk guru',
        description: 'Metric: nilai rata-rata, akurasi, waktu pengerjaan, jumlah percobaan, konsistensi, engagement.',
        security: bearerAuth,
        parameters: [idParam('studentId', 'ID siswa')],
        responses: {
          200: successResponse('Student performance trend dashboard fetched successfully', { type: 'object' }),
          403: errorResponse('Role tidak diizinkan'),
          404: errorResponse('Siswa tidak ditemukan'),
        },
      },
    },
    '/ai/risk-students': {
      get: {
        tags: ['B. Guru - AI Decision Support'],
        summary: 'Risk Student Detection',
        description: 'Kategori Hijau=Aman, Kuning=Perlu Dipantau, Merah=Perlu Intervensi.',
        security: bearerAuth,
        parameters: [{ $ref: '#/components/parameters/ClassIdQuery' }],
        responses: {
          200: successResponse('Risk student detection fetched successfully', {
            type: 'array',
            items: { type: 'object' },
          }, true),
          403: errorResponse('Role tidak diizinkan'),
        },
      },
    },
    '/ai/recommendations': {
      get: {
        tags: ['B. Guru - AI Decision Support'],
        summary: 'List rekomendasi AI',
        description: 'Memerlukan role admin atau teacher.',
        security: bearerAuth,
        parameters: [
          { $ref: '#/components/parameters/StudentIdQuery' },
          { $ref: '#/components/parameters/RecommendationStatusQuery' },
        ],
        responses: {
          200: successResponse('AI recommendations fetched successfully', {
            type: 'array',
            items: { $ref: '#/components/schemas/AiRecommendation' },
          }, true),
          401: errorResponse('Token tidak valid atau tidak dikirim'),
          403: errorResponse('Role tidak diizinkan'),
        },
      },
    },
    '/ai/students/{studentId}/overview': {
      get: {
        tags: ['B. Guru - AI Decision Support'],
        summary: 'Ringkasan AI untuk siswa',
        description: 'Memerlukan role admin atau teacher.',
        security: bearerAuth,
        parameters: [idParam('studentId', 'ID siswa')],
        responses: {
          200: successResponse('AI overview fetched successfully', { $ref: '#/components/schemas/AiOverview' }),
          401: errorResponse('Token tidak valid atau tidak dikirim'),
          403: errorResponse('Role tidak diizinkan'),
          404: errorResponse('Siswa tidak ditemukan'),
        },
      },
    },
    '/analytics/dashboard': {
      get: {
        tags: ['B. Guru - Kelas & Assessment'],
        summary: 'Ringkasan dashboard',
        description: 'Memerlukan role admin atau teacher.',
        security: bearerAuth,
        responses: {
          200: successResponse('Analytics dashboard fetched successfully', { $ref: '#/components/schemas/DashboardOverview' }),
          401: errorResponse('Token tidak valid atau tidak dikirim'),
          403: errorResponse('Role tidak diizinkan'),
        },
      },
    },
    '/analytics/students/{studentId}': {
      get: {
        tags: ['B. Guru - Kelas & Assessment'],
        summary: 'Analitik siswa',
        description: 'Memerlukan role admin atau teacher.',
        security: bearerAuth,
        parameters: [idParam('studentId', 'ID siswa')],
        responses: {
          200: successResponse('Student analytics fetched successfully', { $ref: '#/components/schemas/StudentAnalytics' }),
          401: errorResponse('Token tidak valid atau tidak dikirim'),
          403: errorResponse('Role tidak diizinkan'),
          404: errorResponse('Siswa tidak ditemukan'),
        },
      },
    },
    '/gamification/leaderboard': {
      get: {
        tags: ['A. Siswa - Kuis & Badge'],
        summary: 'Leaderboard siswa',
        security: bearerAuth,
        parameters: [
          {
            name: 'limit',
            in: 'query',
            schema: {
              type: 'integer',
              minimum: 1,
              maximum: 100,
              default: 10,
            },
          },
        ],
        responses: {
          200: successResponse('Leaderboard fetched successfully', {
            type: 'array',
            items: { $ref: '#/components/schemas/LeaderboardEntry' },
          }, true),
          401: errorResponse('Token tidak valid atau tidak dikirim'),
        },
      },
    },
    '/gamification/students/{studentId}/badges': {
      get: {
        tags: ['A. Siswa - Kuis & Badge'],
        summary: 'Badge milik siswa',
        security: bearerAuth,
        parameters: [idParam('studentId', 'ID siswa')],
        responses: {
          200: successResponse('Student badges fetched successfully', {
            type: 'array',
            items: { $ref: '#/components/schemas/Badge' },
          }),
          401: errorResponse('Token tidak valid atau tidak dikirim'),
        },
      },
    },
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    parameters: {
      ClassIdQuery: {
        name: 'classId',
        in: 'query',
        schema: { type: 'integer', minimum: 1 },
      },
      SubjectIdQuery: {
        name: 'subjectId',
        in: 'query',
        schema: { type: 'integer', minimum: 1 },
      },
      StudentIdQuery: {
        name: 'studentId',
        in: 'query',
        schema: { type: 'integer', minimum: 1 },
      },
      QuizIdQuery: {
        name: 'quizId',
        in: 'query',
        schema: { type: 'integer', minimum: 1 },
      },
      LevelQuery: {
        name: 'level',
        in: 'query',
        schema: { $ref: '#/components/schemas/LearningLevel' },
      },
      RiskStatusQuery: {
        name: 'riskStatus',
        in: 'query',
        schema: { $ref: '#/components/schemas/RiskStatus' },
      },
      QuizTypeQuery: {
        name: 'quizType',
        in: 'query',
        schema: { $ref: '#/components/schemas/QuizType' },
      },
      RecommendationStatusQuery: {
        name: 'status',
        in: 'query',
        schema: {
          type: 'string',
          enum: ['pending', 'done', 'ignored'],
        },
      },
    },
    schemas: {
      SuccessResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string' },
          encrypted: { type: 'boolean', example: true },
          data: {
            nullable: true,
            description: 'Encrypted JSON payload when API_RESPONSE_ENCRYPTION_ENABLED=true.',
            example: 'enc:json:v1:QmFzZTY0Q2lwaGVyVGV4dA==',
          },
        },
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string' },
          code: { type: 'string', example: 'BAD_REQUEST' },
          details: { nullable: true },
          stack: { type: 'string' },
        },
      },
      ListMeta: {
        type: 'object',
        properties: {
          total: { type: 'integer', example: 10 },
        },
      },
      LearningLevel: {
        type: 'string',
        enum: ['basic', 'intermediate', 'advanced'],
      },
      RiskStatus: {
        type: 'string',
        enum: ['safe', 'warning', 'danger'],
      },
      QuizType: {
        type: 'string',
        enum: ['diagnostic', 'practice', 'final'],
      },
      RegisterRequest: {
        type: 'object',
        required: ['name', 'email', 'password'],
        properties: {
          name: { type: 'string', minLength: 3, maxLength: 120, example: 'Budi Santoso' },
          email: { type: 'string', format: 'email', example: 'budi@example.com' },
          password: { type: 'string', minLength: 8, maxLength: 72, example: 'password123' },
          role: { type: 'string', enum: ['admin', 'teacher', 'student'], default: 'student' },
          avatar: { type: 'string', maxLength: 255, example: 'https://example.com/avatar.png' },
          classId: { type: 'integer', description: 'Required for student role' },
          studentNumber: { type: 'string', maxLength: 50, example: 'S12345' },
          employeeNumber: { type: 'string', maxLength: 50, example: 'T12345' },
          position: { type: 'string', enum: ['teacher', 'vice_principal', 'principal'], default: 'teacher' },
          specialization: { type: 'string', maxLength: 100, example: 'Mathematics' },
        },
      },
      LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email', example: 'budi@example.com' },
          password: { type: 'string', example: 'password123' },
        },
      },
      AuthPayload: {
        type: 'object',
        properties: {
          user: { $ref: '#/components/schemas/User' },
          token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
        },
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          school_id: { type: 'integer', example: 1 },
          role_id: { type: 'integer', example: 3 },
          role: { type: 'string', enum: ['admin', 'teacher', 'student'], example: 'student' },
          name: { type: 'string', example: 'Budi Santoso' },
          email: { type: 'string', format: 'email', example: 'budi@example.com' },
          avatar: { type: 'string', nullable: true },
          status: { type: 'string', enum: ['active', 'inactive'], example: 'active' },
          created_at: { type: 'string', format: 'date-time' },
          updated_at: { type: 'string', format: 'date-time' },
        },
      },
      Student: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          school_id: { type: 'integer', example: 1 },
          user_id: { type: 'integer', example: 10 },
          class_id: { type: 'integer', example: 2 },
          student_number: { type: 'string', nullable: true, example: 'S12345' },
          current_level: { $ref: '#/components/schemas/LearningLevel' },
          risk_status: { $ref: '#/components/schemas/RiskStatus' },
          total_score: { type: 'number', example: 87.5 },
          streak_days: { type: 'integer', example: 5 },
          name: { type: 'string', example: 'Budi Santoso' },
          email: { type: 'string', format: 'email' },
          avatar: { type: 'string', nullable: true },
          class_name: { type: 'string', example: '7A' },
          grade_level: { type: 'string', nullable: true, example: '7' },
          academic_year: { type: 'string', nullable: true, example: '2025/2026' },
        },
      },
      StudentDetail: {
        allOf: [
          { $ref: '#/components/schemas/Student' },
          {
            type: 'object',
            properties: {
              created_at: { type: 'string', format: 'date-time' },
              progress_summary: { $ref: '#/components/schemas/ProgressSummary' },
              recent_attempts: {
                type: 'array',
                items: { $ref: '#/components/schemas/RecentAttempt' },
              },
            },
          },
        ],
      },
      ProgressSummary: {
        type: 'object',
        properties: {
          total_materials: { type: 'integer', example: 12 },
          completed_materials: { type: 'integer', example: 8 },
          average_progress_percent: { type: 'number', example: 76.25 },
          total_time_spent_seconds: { type: 'integer', example: 3600 },
        },
      },
      RecentAttempt: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          score: { type: 'number' },
          accuracy_rate: { type: 'number' },
          ai_level_result: { $ref: '#/components/schemas/LearningLevel' },
          performance_trend: { type: 'string', enum: ['improving', 'stable', 'declining'] },
          submitted_at: { type: 'string', format: 'date-time', nullable: true },
          quiz_title: { type: 'string' },
        },
      },
      Teacher: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          school_id: { type: 'integer' },
          user_id: { type: 'integer' },
          employee_number: { type: 'string', nullable: true },
          position: { type: 'string', enum: ['teacher', 'vice_principal', 'principal'] },
          specialization: { type: 'string', nullable: true },
          created_at: { type: 'string', format: 'date-time' },
          name: { type: 'string' },
          email: { type: 'string', format: 'email' },
          avatar: { type: 'string', nullable: true },
        },
      },
      TeacherDetail: {
        allOf: [
          { $ref: '#/components/schemas/Teacher' },
          {
            type: 'object',
            properties: {
              classes: {
                type: 'array',
                items: { $ref: '#/components/schemas/Class' },
              },
            },
          },
        ],
      },
      Class: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          school_id: { type: 'integer' },
          class_id: { type: 'integer' },
          homeroom_teacher_id: { type: 'integer', nullable: true },
          homeroom_teacher_name: { type: 'string', nullable: true },
          name: { type: 'string' },
          grade_level: { type: 'string', nullable: true },
          academic_year: { type: 'string', nullable: true },
        },
      },
      Material: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          subject_id: { type: 'integer' },
          school_id: { type: 'integer' },
          title: { type: 'string' },
          level: { $ref: '#/components/schemas/LearningLevel' },
          media_url: { type: 'string', nullable: true },
          estimated_minutes: { type: 'integer' },
          created_at: { type: 'string', format: 'date-time' },
          subject_name: { type: 'string' },
          subject_code: { type: 'string', nullable: true },
        },
      },
      MaterialRequest: {
        type: 'object',
        required: ['subjectId', 'title'],
        properties: {
          subjectId: { type: 'integer', minimum: 1 },
          title: { type: 'string', minLength: 3, maxLength: 150 },
          content: { type: 'string' },
          level: { $ref: '#/components/schemas/LearningLevel' },
          mediaUrl: { type: 'string', maxLength: 255 },
          estimatedMinutes: { type: 'integer', minimum: 1, default: 10 },
        },
      },
      MaterialDetail: {
        allOf: [
          { $ref: '#/components/schemas/Material' },
          {
            type: 'object',
            properties: {
              content: { type: 'string', nullable: true },
              subject_description: { type: 'string', nullable: true },
            },
          },
        ],
      },
      Quiz: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          subject_id: { type: 'integer' },
          material_id: { type: 'integer', nullable: true },
          title: { type: 'string' },
          quiz_type: { $ref: '#/components/schemas/QuizType' },
          level: { $ref: '#/components/schemas/LearningLevel' },
          duration_minutes: { type: 'integer' },
          created_at: { type: 'string', format: 'date-time' },
          subject_name: { type: 'string' },
          material_title: { type: 'string', nullable: true },
          question_count: { type: 'integer' },
        },
      },
      QuizDetail: {
        allOf: [
          { $ref: '#/components/schemas/Quiz' },
          {
            type: 'object',
            properties: {
              subject_code: { type: 'string', nullable: true },
              questions: {
                type: 'array',
                items: { $ref: '#/components/schemas/Question' },
              },
            },
          },
        ],
      },
      Question: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          question_text: { type: 'string' },
          question_type: { type: 'string', enum: ['multiple_choice', 'essay'] },
          option_a: { type: 'string', nullable: true },
          option_b: { type: 'string', nullable: true },
          option_c: { type: 'string', nullable: true },
          option_d: { type: 'string', nullable: true },
          point: { type: 'number' },
          difficulty: { type: 'string', enum: ['easy', 'medium', 'hard'] },
        },
      },
      AssessmentAttempt: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          student_id: { type: 'integer' },
          quiz_id: { type: 'integer' },
          score: { type: 'number' },
          accuracy_rate: { type: 'number' },
          time_spent_seconds: { type: 'integer' },
          attempt_number: { type: 'integer' },
          ai_level_result: { $ref: '#/components/schemas/LearningLevel' },
          performance_trend: { type: 'string', enum: ['improving', 'stable', 'declining'] },
          started_at: { type: 'string', format: 'date-time' },
          submitted_at: { type: 'string', format: 'date-time', nullable: true },
          quiz_title: { type: 'string' },
          student_name: { type: 'string' },
        },
      },
      AssessmentSummary: {
        type: 'object',
        properties: {
          total_attempts: { type: 'integer' },
          average_score: { type: 'number' },
          average_accuracy: { type: 'number' },
          best_score: { type: 'number' },
          latest_scores: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                score: { type: 'number' },
                accuracy_rate: { type: 'number' },
              },
            },
          },
        },
      },
      AiRecommendation: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          student_id: { type: 'integer' },
          material_id: { type: 'integer', nullable: true },
          recommendation_type: { type: 'string', enum: ['review', 'next_material', 'remedial', 'challenge'] },
          reason: { type: 'string', nullable: true },
          priority: { type: 'string', enum: ['low', 'medium', 'high'] },
          status: { type: 'string', enum: ['pending', 'done', 'ignored'] },
          created_at: { type: 'string', format: 'date-time' },
          student_name: { type: 'string' },
          material_title: { type: 'string', nullable: true },
        },
      },
      AiOverview: {
        type: 'object',
        properties: {
          total_recommendations: { type: 'integer' },
          pending_recommendations: { type: 'integer' },
          high_priority_recommendations: { type: 'integer' },
        },
      },
      DashboardOverview: {
        type: 'object',
        properties: {
          counts: {
            type: 'object',
            properties: {
              total_students: { type: 'integer' },
              total_teachers: { type: 'integer' },
              total_materials: { type: 'integer' },
              total_quizzes: { type: 'integer' },
              average_quiz_score: { type: 'number' },
            },
          },
          progress: {
            type: 'object',
            properties: {
              total_progress_records: { type: 'integer' },
              average_progress_percent: { type: 'number' },
              completed_materials: { type: 'integer' },
            },
          },
        },
      },
      StudentAnalytics: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          name: { type: 'string' },
          current_level: { $ref: '#/components/schemas/LearningLevel' },
          risk_status: { $ref: '#/components/schemas/RiskStatus' },
          total_score: { type: 'number' },
          streak_days: { type: 'integer' },
          average_score: { type: 'number', nullable: true },
          average_accuracy: { type: 'number', nullable: true },
          average_progress: { type: 'number', nullable: true },
          badges_earned: { type: 'integer' },
        },
      },
      LeaderboardEntry: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          name: { type: 'string' },
          avatar: { type: 'string', nullable: true },
          total_score: { type: 'number' },
          streak_days: { type: 'integer' },
          current_level: { $ref: '#/components/schemas/LearningLevel' },
        },
      },
      Badge: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          name: { type: 'string' },
          description: { type: 'string', nullable: true },
          icon: { type: 'string', nullable: true },
          requirement: { type: 'string', nullable: true },
          earned_at: { type: 'string', format: 'date-time' },
        },
      },
    },
  },
};

module.exports = openApiSpec;
