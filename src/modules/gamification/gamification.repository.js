const { pool } = require('../../config/db');

const findLeaderboard = async (schoolId, limit = 10, executor = pool) => {
  const [rows] = await executor.execute(
    `
      SELECT
        s.id,
        u.name,
        u.avatar,
        s.total_score,
        s.streak_days,
        s.current_level
      FROM students s
      INNER JOIN users u ON u.id = s.user_id AND u.school_id = s.school_id
      WHERE s.school_id = ?
      ORDER BY s.total_score DESC, s.streak_days DESC, u.name ASC
      LIMIT ?
    `,
    [schoolId, limit],
  );

  return rows;
};

const findStudentBadges = async (studentId, schoolId, executor = pool) => {
  const [rows] = await executor.execute(
    `
      SELECT
        b.id,
        b.name,
        b.description,
        b.icon,
        b.requirement,
        sb.earned_at
      FROM student_badges sb
      INNER JOIN students s ON s.id = sb.student_id AND s.school_id = sb.school_id
      INNER JOIN badges b ON b.id = sb.badge_id AND b.school_id = sb.school_id
      WHERE sb.student_id = ? AND s.school_id = ?
      ORDER BY sb.earned_at DESC
    `,
    [studentId, schoolId],
  );

  return rows;
};

module.exports = {
  findLeaderboard,
  findStudentBadges,
};
