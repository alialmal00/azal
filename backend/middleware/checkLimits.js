// middleware/checkLimits.js
const Subscription = require('../models/Subscription');
const UsageCounter = require('../models/UsageCounter');
const Plan = require('../models/Plan');

// ============================================
// 🛡️ میدلور اصلی بررسی محدودیت‌ها
// ============================================
async function checkLimits(req, res, next) {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    if (userRole === 'admin') {
      req.plan = {
        max_exams_month: 99999, max_questions_exam: 99999, max_file_size_mb: 99999,
        max_classes: 99999, max_students_class: 99999, max_advisor_month: 99999, max_advisor_chars: 99999
      };
      req.subscription = { status: 'active' };
      req.usage = { exams_used: 0, advisor_used: 0, questions_used: 0, classes_used: 0 };
      return next();
    }

    let subscription = await Subscription.getActiveSubscription(userId);
    let plan = null;
    if (!subscription) {
      const freePlan = await Plan.getFreePlan(userRole);
      if (freePlan) {
        plan = freePlan;
        await Subscription.createFreeSubscription(userId, userRole);
      }
    } else {
      plan = await Plan.findById(subscription.plan_id);
    }

    if (!plan) {
      return res.status(403).json({
        success: false,
        message: 'هیچ پلنی برای نقش شما تعریف نشده است',
        redirect: '/pricing'
      });
    }

    const usage = await UsageCounter.getCurrentUsage(userId);
    req.plan = plan;
    req.subscription = subscription;
    req.usage = usage;
    next();
  } catch (error) {
    console.error('Check limits error:', error);
    res.status(500).json({ success: false, message: 'خطا در بررسی محدودیت‌ها: ' + error.message });
  }
}

// ============================================
// 📊 بررسی محدودیت آزمون
// ============================================
async function checkExamLimit(req, res, next) {
  try {
    const userId = req.user.id;
    const numQuestions = req.body.numQuestions || req.body.examData?.questions?.length || 0;

    const examCheck = await UsageCounter.checkLimits(userId, 'exam', 1);
    if (!examCheck.allowed) {
      return res.status(429).json({
        success: false,
        message: examCheck.message,
        limit: examCheck,
        redirect: '/dashboard/subscription'
      });
    }

    if (numQuestions > 0) {
      const questionCheck = await UsageCounter.checkLimits(userId, 'question', numQuestions);
      if (!questionCheck.allowed) {
        return res.status(429).json({
          success: false,
          message: questionCheck.message,
          limit: questionCheck,
          redirect: '/dashboard/subscription'
        });
      }
    }
    next();
  } catch (error) {
    console.error('Check exam limit error:', error);
    res.status(500).json({ success: false, message: 'خطا در بررسی محدودیت آزمون: ' + error.message });
  }
}

// ============================================
// 💬 بررسی محدودیت مشاور (تعداد + کاراکتر هر پیام)
// ============================================
async function checkAdvisorLimit(req, res, next) {
  try {
    const userId = req.user.id;
    const message = req.body.message || '';

    const check = await UsageCounter.checkLimits(userId, 'advisor', 1);
    if (!check.allowed) {
      return res.status(429).json({
        success: false,
        message: check.message,
        limit: check,
        redirect: '/dashboard/subscription'
      });
    }

    // 🔹 بررسی کاراکتر هر پیام
    const plan = req.plan;
    if (plan && message.length > plan.max_advisor_chars) {
      return res.status(429).json({
        success: false,
        message: `حداکثر ${plan.max_advisor_chars} کاراکتر در هر پیام مجاز است. پیام شما ${message.length} کاراکتر دارد.`,
        error: 'ADVISOR_CHAR_LIMIT'
      });
    }
    next();
  } catch (error) {
    console.error('Check advisor limit error:', error);
    res.status(500).json({ success: false, message: 'خطا در بررسی محدودیت مشاور: ' + error.message });
  }
}

// ============================================
// 🏫 بررسی محدودیت کلاس (برای معلم)
// ============================================
async function checkClassLimit(req, res, next) {
  try {
    const userId = req.user.id;
    const check = await UsageCounter.checkLimits(userId, 'class', 1);
    if (!check.allowed) {
      return res.status(429).json({
        success: false,
        message: check.message,
        limit: check,
        redirect: '/dashboard/subscription'
      });
    }
    next();
  } catch (error) {
    console.error('Check class limit error:', error);
    res.status(500).json({ success: false, message: 'خطا در بررسی محدودیت کلاس: ' + error.message });
  }
}

module.exports = {
  checkLimits,
  checkExamLimit,
  checkAdvisorLimit,
  checkClassLimit
};