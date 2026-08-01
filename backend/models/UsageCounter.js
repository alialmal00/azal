// models/UsageCounter.js
const db = require('../config/db');

class UsageCounter {
  // ============================================
  // 📊 دریافت مصرف جاری ماهانه
  // ============================================
  static async getCurrentUsage(userId) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    // 🔹 دریافت یا ایجاد رکورد usage_counters برای ماه جاری
    let counter = await db.query(`
      SELECT * FROM usage_counters
      WHERE user_id = $1 AND period_start >= $2 AND period_end <= $3
      ORDER BY period_start DESC LIMIT 1
    `, [userId, startOfMonth, endOfMonth]);

    if (counter.rows.length === 0) {
      // ✅ محاسبه مقدار اولیه از جداول واقعی (فقط برای اولین بار)
      const examsResult = await db.query(`
        SELECT
          (SELECT COUNT(*) FROM saved_exams
             WHERE user_id = $1 AND created_at >= $2 AND created_at < $3) AS personal_exams,
          (SELECT COUNT(*) FROM class_exams
             WHERE teacher_id = $1 AND created_at >= $2 AND created_at < $3) AS class_exams
      `, [userId, startOfMonth, endOfMonth]);

      const classesResult = await db.query(`
        SELECT COUNT(*) AS count FROM classes
        WHERE teacher_id = $1 AND status = 'active'
      `, [userId]);

      const initialExams = parseInt(examsResult.rows[0].personal_exams) + parseInt(examsResult.rows[0].class_exams);
      const initialClasses = parseInt(classesResult.rows[0].count) || 0;

      counter = await db.query(`
        INSERT INTO usage_counters (user_id, period_start, period_end, exams_used, advisor_used, questions_used, classes_used)
        VALUES ($1, $2, $3, $4, 0, 0, $5)
        RETURNING *
      `, [userId, startOfMonth, endOfMonth, initialExams, initialClasses]);
    }

    const row = counter.rows[0];
    return {
      ...row,
      exams_used: parseInt(row.exams_used) || 0,
      classes_used: parseInt(row.classes_used) || 0,
      questions_used: parseInt(row.questions_used) || 0,
      advisor_used: parseInt(row.advisor_used) || 0,
    };
  }

  // ============================================
  // 🔹 افزایش تعداد سوالات مصرف‌شده
  // ============================================
  static async incrementQuestionUsage(userId, numQuestions) {
    const usage = await this.getCurrentUsage(userId);
    const result = await db.query(`
      UPDATE usage_counters
      SET questions_used = questions_used + $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `, [numQuestions, usage.id]);
    return result.rows[0];
  }

  // ============================================
  // 🔹 افزایش تعداد پیام‌های مشاور
  // ============================================
  static async incrementAdvisorUsage(userId) {
    const usage = await this.getCurrentUsage(userId);
    const result = await db.query(`
      UPDATE usage_counters
      SET advisor_used = advisor_used + 1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `, [usage.id]);
    return result.rows[0];
  }

  // ============================================
  // 🔹 افزایش تعداد آزمون‌های ماهانه
  // ============================================
  static async incrementExamUsage(userId) {
    const usage = await this.getCurrentUsage(userId);
    const result = await db.query(`
      UPDATE usage_counters
      SET exams_used = exams_used + 1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `, [usage.id]);
    return result.rows[0];
  }

  // ============================================
  // 🔹 افزایش تعداد کلاس‌های ساخته‌شده
  // ============================================
  static async incrementClassUsage(userId) {
    const usage = await this.getCurrentUsage(userId);
    const result = await db.query(`
      UPDATE usage_counters
      SET classes_used = classes_used + 1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `, [usage.id]);
    return result.rows[0];
  }

  // ============================================
  // 🔄 ریست مصرف ماهانه (بعد از خرید)
  // ============================================
  static async resetMonthlyUsage(userId) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    await db.query(`
      DELETE FROM usage_counters WHERE user_id = $1 AND period_end < $2
    `, [userId, startOfMonth]);

    const result = await db.query(`
      INSERT INTO usage_counters (user_id, period_start, period_end, exams_used, advisor_used, questions_used, classes_used)
      VALUES ($1, $2, $3, 0, 0, 0, 0)
      ON CONFLICT (user_id, period_start)
      DO UPDATE SET exams_used = 0, advisor_used = 0, questions_used = 0, classes_used = 0, updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `, [userId, startOfMonth, endOfMonth]);
    return result.rows[0];
  }

  // ============================================
  // 🛡️ بررسی محدودیت‌ها
  // ============================================
  static async checkLimits(userId, type, amount = 1) {
    const usage = await this.getCurrentUsage(userId);

    const subscription = await db.query(`
      SELECT s.*, p.*
      FROM subscriptions s
      JOIN plans p ON s.plan_id = p.id
      WHERE s.user_id = $1 AND s.status = 'active' AND s.end_date >= CURRENT_DATE
      ORDER BY s.end_date DESC LIMIT 1
    `, [userId]);

    let limits = null;
    if (subscription.rows.length > 0) {
      limits = subscription.rows[0];
    } else {
      const freePlan = await db.query(`
        SELECT * FROM plans
        WHERE panel_type = (SELECT role FROM users WHERE id = $1)
        AND name = 'رایگان' AND is_active = true
      `, [userId]);
      limits = freePlan.rows[0];
    }

    if (!limits) {
      return { allowed: false, message: 'هیچ پلنی برای شما تعریف نشده است' };
    }

    switch (type) {
      case 'exam': {
        const examsUsed = parseInt(usage.exams_used) + amount;
        if (examsUsed > limits.max_exams_month) {
          return {
            allowed: false,
            message: `سقف ${limits.max_exams_month} آزمون ماهانه شما کامل شده است`,
            limit: limits.max_exams_month,
            used: usage.exams_used,
            remaining: Math.max(0, limits.max_exams_month - usage.exams_used)
          };
        }
        break;
      }
      case 'question': {
        const questionsUsed = parseInt(usage.questions_used) + amount;
        const maxQuestions = limits.max_exams_month * limits.max_questions_exam;
        if (questionsUsed > maxQuestions) {
          return {
            allowed: false,
            message: `سقف ${maxQuestions} سوال ماهانه شما کامل شده است`,
            limit: maxQuestions,
            used: usage.questions_used,
            remaining: Math.max(0, maxQuestions - usage.questions_used)
          };
        }
        break;
      }
      case 'advisor': {
        const advisorUsed = parseInt(usage.advisor_used) + amount;
        if (advisorUsed > limits.max_advisor_month) {
          return {
            allowed: false,
            message: `سقف ${limits.max_advisor_month} پیام مشاور ماهانه شما کامل شده است`,
            limit: limits.max_advisor_month,
            used: usage.advisor_used,
            remaining: Math.max(0, limits.max_advisor_month - usage.advisor_used)
          };
        }
        break;
      }
      case 'class': {
        const classesUsed = parseInt(usage.classes_used) + amount;
        if (classesUsed > limits.max_classes) {
          return {
            allowed: false,
            message: `سقف ${limits.max_classes} کلاس شما کامل شده است`,
            limit: limits.max_classes,
            used: usage.classes_used,
            remaining: Math.max(0, limits.max_classes - usage.classes_used)
          };
        }
        break;
      }
      default:
        return { allowed: true };
    }
    return { allowed: true };
  }
}

module.exports = UsageCounter;