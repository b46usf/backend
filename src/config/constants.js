const ROLES = Object.freeze({
  ADMIN: 'admin',
  TEACHER: 'teacher',
  STUDENT: 'student',
});

const USER_STATUSES = Object.freeze({
  ACTIVE: 'active',
  INACTIVE: 'inactive',
});

const DEFAULT_SCHOOL_ID = 1;

const LEVELS = Object.freeze({
  BASIC: 'basic',
  INTERMEDIATE: 'intermediate',
  ADVANCED: 'advanced',
});

const QUIZ_TYPES = Object.freeze({
  DIAGNOSTIC: 'diagnostic',
  PRACTICE: 'practice',
  FINAL: 'final',
});

const PERFORMANCE_TRENDS = Object.freeze({
  IMPROVING: 'improving',
  STABLE: 'stable',
  DECLINING: 'declining',
});

const PROGRESS_STATUSES = Object.freeze({
  NOT_STARTED: 'not_started',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
});

const RECOMMENDATION_STATUSES = Object.freeze({
  PENDING: 'pending',
  DONE: 'done',
  IGNORED: 'ignored',
});

const RISK_STATUSES = Object.freeze({
  SAFE: 'safe',
  WARNING: 'warning',
  DANGER: 'danger',
});

const TEACHER_POSITIONS = Object.freeze({
  TEACHER: 'teacher',
  VICE_PRINCIPAL: 'vice_principal',
  PRINCIPAL: 'principal',
});

module.exports = {
  DEFAULT_SCHOOL_ID,
  LEVELS,
  PERFORMANCE_TRENDS,
  PROGRESS_STATUSES,
  QUIZ_TYPES,
  RECOMMENDATION_STATUSES,
  RISK_STATUSES,
  ROLES,
  TEACHER_POSITIONS,
  USER_STATUSES,
};
