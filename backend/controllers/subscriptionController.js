// controllers/subscriptionController.js
const db = require('../config/db');
const Plan = require('../models/Plan');
const Subscription = require('../models/Subscription');
const UsageCounter = require('../models/UsageCounter');

// ============================================
// 📋 دریافت لیست پلن‌ها
// ============================================
const getPlans = async (req, res) => {
  try {
    const panelType = req.query.panel;
    let plans;
    if (panelType) {
      plans = await Plan.getByPanel(panelType);
    } else {
      plans = await Plan.getAll();
    }
    res.json({ success: true, data: { plans } });
  } catch (error) {
    console.error('Get plans error:', error);
    res.status(500).json({ success: false, message: 'خطا در دریافت پلن‌ها: ' + error.message });
  }
};

// ============================================
// 👤 دریافت اشتراک فعلی + پلن + مصرف
// ============================================
const getMySubscription = async (req, res) => {
  try {
    const userId = req.user.id;
    const subscription = await Subscription.getActiveSubscription(userId);
    const usage = await UsageCounter.getCurrentUsage(userId);
    let plan = null;

    if (subscription) {
      plan = await Plan.findById(subscription.plan_id);
    } else {
      const freePlan = await Plan.getFreePlan(req.user.role);
      if (freePlan) {
        plan = freePlan;
        await Subscription.createFreeSubscription(userId, req.user.role);
      }
    }

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'هیچ پلنی برای نقش شما تعریف نشده است'
      });
    }

    res.json({
      success: true,
      data: {
        subscription: subscription || null,
        plan: plan,
        usage: usage || { 
          exams_used: 0, 
          advisor_used: 0, 
          storage_used_mb: 0, 
          questions_used: 0, 
          classes_used: 0 
        }
      }
    });
  } catch (error) {
    console.error('Get subscription error:', error);
    res.status(500).json({ success: false, message: 'خطا در دریافت اشتراک: ' + error.message });
  }
};

// ============================================
// 🛒 خرید اشتراک (شبیه‌سازی)
// ============================================
const purchaseSubscription = async (req, res) => {
  try {
    const userId = req.user.id;
    const { planId, duration } = req.body;

    if (!planId || !duration) {
      return res.status(400).json({ 
        success: false, 
        message: 'شناسه پلن و مدت زمان الزامی است' 
      });
    }

    const plan = await Plan.findById(planId);
    if (!plan) {
      return res.status(404).json({ 
        success: false, 
        message: 'پلن مورد نظر یافت نشد' 
      });
    }

    let price;
    let durationLabel;
    switch (duration) {
      case '1m': 
        price = plan.price_1m; 
        durationLabel = '۱ ماهه'; 
        break;
      case '3m': 
        price = plan.price_3m; 
        durationLabel = '۳ ماهه'; 
        break;
      case '9m': 
        price = plan.price_9m; 
        durationLabel = '۹ ماهه'; 
        break;
      default:
        return res.status(400).json({ 
          success: false, 
          message: 'مدت زمان نامعتبر است' 
        });
    }

    // ثبت پرداخت
    await db.query(`
      INSERT INTO payments (user_id, plan_id, duration, amount, status, description, created_at)
      VALUES ($1, $2, $3, $4, 'success', $5, CURRENT_TIMESTAMP)
      RETURNING id
    `, [userId, planId, duration, price, `خرید اشتراک ${plan.name} - ${durationLabel}`]);

    // ایجاد اشتراک
    const subscription = await Subscription.purchase(userId, planId, duration);

    // 🔹 ریست مصرف ماهانه بعد از خرید
    await UsageCounter.resetMonthlyUsage(userId);

    // دریافت مجدد مصرف برای نمایش
    const updatedUsage = await UsageCounter.getCurrentUsage(userId);

    res.json({
      success: true,
      message: `✅ اشتراک ${plan.name} با موفقیت خریداری شد`,
      data: { 
        subscription,
        usage: updatedUsage
      }
    });
  } catch (error) {
    console.error('Purchase error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'خطا در خرید اشتراک: ' + error.message 
    });
  }
};

// ============================================
// 📊 دریافت مصرف ماهانه
// ============================================
const getUsage = async (req, res) => {
  try {
    const userId = req.user.id;
    const usage = await UsageCounter.getCurrentUsage(userId);
    const subscription = await Subscription.getActiveSubscription(userId);
    let plan = null;
    
    if (subscription) {
      plan = await Plan.findById(subscription.plan_id);
    } else {
      plan = await Plan.getFreePlan(req.user.role);
    }

    res.json({
      success: true,
      data: {
        usage: usage || { 
          exams_used: 0, 
          advisor_used: 0, 
          questions_used: 0, 
          classes_used: 0, 
          storage_used_mb: 0 
        },
        limits: {
          max_exams: plan?.max_exams_month || 2,
          max_questions_per_exam: plan?.max_questions_exam || 5,
          max_total_questions: (plan?.max_exams_month || 2) * (plan?.max_questions_exam || 5),
          max_advisor: plan?.max_advisor_month || 20,
          max_storage: plan?.max_file_size_mb || 1.5,
          max_classes: plan?.max_classes || 1,
          max_students_per_class: plan?.max_students_class || 2,
          max_advisor_chars: plan?.max_advisor_chars || 500
        },
        plan_name: plan?.name || 'رایگان'
      }
    });
  } catch (error) {
    console.error('Get usage error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'خطا در دریافت مصرف: ' + error.message 
    });
  }
};

// ============================================
// 📋 دریافت تاریخچه صورت‌حساب‌ها
// ============================================
const getBillingHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const payments = await db.query(`
      SELECT p.*, pl.name as plan_name
      FROM payments p
      JOIN plans pl ON p.plan_id = pl.id
      WHERE p.user_id = $1
      ORDER BY p.created_at DESC
    `, [userId]);
    
    const subscriptions = await Subscription.getHistory(userId);
    
    res.json({ 
      success: true, 
      data: { 
        payments: payments.rows, 
        subscriptions 
      } 
    });
  } catch (error) {
    console.error('Get billing history error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'خطا در دریافت تاریخچه: ' + error.message 
    });
  }
};

// ============================================
// ❌ لغو اشتراک
// ============================================
const cancelSubscription = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await Subscription.cancel(userId);
    
    if (!result) {
      return res.status(404).json({ 
        success: false, 
        message: 'اشتراک فعالی برای لغو یافت نشد' 
      });
    }
    
    res.json({ 
      success: true, 
      message: 'اشتراک شما با موفقیت لغو شد', 
      data: { subscription: result } 
    });
  } catch (error) {
    console.error('Cancel subscription error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'خطا در لغو اشتراک: ' + error.message 
    });
  }
};

// ============================================
// 📊 دریافت محدودیت‌های کاربر (برای تب مصرف)
// ============================================
const getUserLimits = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    // دریافت اشتراک فعال
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
      return res.status(404).json({ 
        success: false, 
        message: 'هیچ پلنی برای نقش شما تعریف نشده است' 
      });
    }

    // دریافت مصرف جاری
    const usage = await UsageCounter.getCurrentUsage(userId);

    // محاسبه مقادیر باقی‌مانده
    const maxTotalQuestions = (plan.max_exams_month || 2) * (plan.max_questions_exam || 5);

    res.json({
      success: true,
      data: {
        // اطلاعات پلن
        plan: {
          id: plan.id,
          name: plan.name,
          is_free: plan.name === 'رایگان',
          max_exams_month: plan.max_exams_month || 2,
          max_questions_exam: plan.max_questions_exam || 5,
          max_total_questions: maxTotalQuestions,
          max_file_size_mb: parseFloat(plan.max_file_size_mb) || 1.5,
          max_classes: plan.max_classes || 1,
          max_students_class: plan.max_students_class || 2,
          max_advisor_month: plan.max_advisor_month || 20,
          max_advisor_chars: plan.max_advisor_chars || 500
        },
        // مصرف فعلی
        usage: {
          exams_used: usage?.exams_used || 0,
          questions_used: usage?.questions_used || 0,
          advisor_used: usage?.advisor_used || 0,
          classes_used: usage?.classes_used || 0
        },
        // مقادیر باقی‌مانده
        limits: {
          exams_remaining: Math.max(0, (plan.max_exams_month || 2) - (usage?.exams_used || 0)),
          questions_remaining: Math.max(0, maxTotalQuestions - (usage?.questions_used || 0)),
          advisor_remaining: Math.max(0, (plan.max_advisor_month || 20) - (usage?.advisor_used || 0)),
          classes_remaining: Math.max(0, (plan.max_classes || 1) - (usage?.classes_used || 0))
        },
        // اطلاعات اشتراک (اگر وجود داشته باشد)
        subscription: subscription ? {
          id: subscription.id,
          plan_id: subscription.plan_id,
          duration: subscription.duration,
          start_date: subscription.start_date,
          end_date: subscription.end_date,
          status: subscription.status
        } : null
      }
    });
  } catch (error) {
    console.error('Get user limits error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'خطا در دریافت محدودیت‌ها: ' + error.message 
    });
  }
};

// ============================================
// 📤 صادر کردن ماژول
// ============================================
module.exports = {
  getPlans,
  getMySubscription,
  purchaseSubscription,
  getUsage,
  getBillingHistory,
  cancelSubscription,
  getUserLimits
};