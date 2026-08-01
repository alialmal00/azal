// controllers/subscriptionController.js
// ============================================
// 💳 کنترلر اشتراک — نسخه بازطراحی‌شده
// تمام منطق از services/subscriptionService می‌آید.
// ============================================
const db = require('../config/db');
const Plan = require('../models/Plan');
const Subscription = require('../models/Subscription');
const svc = require('../services/subscriptionService');

// ============================================
// 📋 دریافت لیست پلن‌ها (عمومی — بدون نیاز به لاگین)
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
// 👤 دریافت اشتراک فعلی + پلن + مصرف (از سرویس مرکزی)
// ============================================
const getMySubscription = async (req, res) => {
  try {
    const ent = await svc.getEntitlements(req.user.id, req.user.role);

    if (!ent.plan) {
      return res.status(404).json({
        success: false,
        message: 'هیچ پلنی برای نقش شما تعریف نشده است'
      });
    }

    // سازگاری: plan با فیلدهای max_* مانند قبل
    res.json({
      success: true,
      data: {
        subscription: ent.subscription,
        plan: {
          ...ent.plan,
          max_exams_month: ent.features.exam_generation?.limit,
          max_questions_exam: ent.features.exam_questions_per_exam?.limit,
          max_file_size_mb: ent.features.file_upload_size?.limit,
          max_classes: ent.features.class_create?.limit,
          max_students_class: ent.features.class_students_per_class?.limit,
          max_advisor_month: ent.features.advisor_chat?.limit,
          max_advisor_chars: ent.features.advisor_message_chars?.limit,
        },
        usage: ent.usage
      }
    });
  } catch (error) {
    console.error('Get subscription error:', error);
    res.status(500).json({ success: false, message: 'خطا در دریافت اشتراک: ' + error.message });
  }
};

// ============================================
// 🎫 دریافت کامل Entitlements (API جدید — قلب سیستم)
// GET /api/subscription/entitlements
// ============================================
const getEntitlements = async (req, res) => {
  try {
    // ادمین: نامحدود
    if (req.user.role === 'admin') {
      return res.json({
        success: true,
        data: {
          plan: { id: null, name: 'ادمین', is_free: false, unlimited: true },
          subscription: null,
          usage: { exams_used: 0, questions_used: 0, advisor_used: 0, classes_used: 0 },
          features: {},
          unlimited: true
        }
      });
    }

    const ent = await svc.getEntitlements(req.user.id, req.user.role);
    if (!ent.plan) {
      return res.status(404).json({
        success: false,
        message: 'هیچ پلنی برای نقش شما تعریف نشده است',
        error: 'NO_PLAN',
        redirect: '/dashboard/subscription'
      });
    }

    res.json({ success: true, data: ent });
  } catch (error) {
    console.error('Get entitlements error:', error);
    res.status(500).json({ success: false, message: 'خطا در دریافت مجوزها: ' + error.message });
  }
};

// ============================================
// 🛒 خرید اشتراک — ایجاد پرداخت در انتظار
// (فعال‌سازی فقط از مسیر verifyPayment انجام می‌شود)
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

    const result = await svc.purchaseRequest(userId, req.user.role, planId, duration);

    if (result.simulated) {
      // حالت تست: پرداخت خودکار تایید شد
      const ent = await svc.getEntitlements(userId, req.user.role);
      return res.json({
        success: true,
        message: '✅ اشتراک با موفقیت فعال شد',
        data: {
          payment: result.payment,
          subscription: result.subscription,
          entitlements: ent,
          simulated: true
        }
      });
    }

    // حالت واقعی: نیاز به هدایت به درگاه
    res.json({
      success: true,
      requiresPayment: true,
      message: 'پرداخت ایجاد شد. برای فعال‌سازی، پرداخت را تکمیل کنید.',
      data: {
        payment: result.payment,
        payment_url: result.payment_url
      }
    });
  } catch (error) {
    console.error('Purchase error:', error);
    res.status(error.status || 500).json({
      success: false,
      message: 'خطا در خرید اشتراک: ' + error.message
    });
  }
};

// ============================================
// ✅ تایید پرداخت (callback درگاه / تست)
// POST /api/subscription/verify  { paymentId, refId? }
// ============================================
const verifyPayment = async (req, res) => {
  try {
    const userId = req.user.id;
    const { paymentId, refId } = req.body;

    if (!paymentId) {
      return res.status(400).json({ success: false, message: 'شناسه پرداخت الزامی است' });
    }

    const result = await svc.verifyPayment(paymentId, userId, refId || null);
    const ent = await svc.getEntitlements(userId, req.user.role);

    res.json({
      success: true,
      message: result.already ? 'این پرداخت قبلاً تایید شده است' : '✅ پرداخت تایید و اشتراک فعال شد',
      data: {
        payment: result.payment,
        subscription: result.subscription,
        entitlements: ent
      }
    });
  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(error.status || 500).json({
      success: false,
      message: 'خطا در تایید پرداخت: ' + error.message
    });
  }
};

// ============================================
// 📊 دریافت مصرف ماهانه (سازگاری با فرانت‌اند فعلی)
// ============================================
const getUsage = async (req, res) => {
  try {
    const ent = await svc.getEntitlements(req.user.id, req.user.role);

    if (!ent.plan) {
      return res.status(404).json({ success: false, message: 'هیچ پلنی برای نقش شما تعریف نشده است' });
    }

    const f = ent.features;
    res.json({
      success: true,
      data: {
        usage: {
          ...ent.usage,
          storage_used_mb: 0 // هنوز ردیابی نشده — صادقانه گزارش می‌شود
        },
        limits: {
          max_exams: f.exam_generation?.limit ?? null,
          max_questions_per_exam: f.exam_questions_per_exam?.limit ?? null,
          max_total_questions: (f.exam_generation?.limit || 0) * (f.exam_questions_per_exam?.limit || 0),
          max_advisor: f.advisor_chat?.limit ?? null,
          max_storage: f.file_upload_size?.limit ?? null,
          max_classes: f.class_create?.limit ?? null,
          max_students_per_class: f.class_students_per_class?.limit ?? null,
          max_advisor_chars: f.advisor_message_chars?.limit ?? null
        },
        plan_name: ent.plan.name
      }
    });
  } catch (error) {
    console.error('Get usage error:', error);
    res.status(500).json({ success: false, message: 'خطا در دریافت مصرف: ' + error.message });
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
    res.status(500).json({ success: false, message: 'خطا در دریافت تاریخچه: ' + error.message });
  }
};

// ============================================
// ❌ لغو اشتراک (تراکنشی + بازگشت به رایگان)
// ============================================
const cancelSubscription = async (req, res) => {
  try {
    const result = await svc.cancelActiveSubscription(req.user.id, req.user.role);

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'اشتراک فعالی برای لغو یافت نشد'
      });
    }

    const ent = await svc.getEntitlements(req.user.id, req.user.role);

    res.json({
      success: true,
      message: 'اشتراک شما با موفقیت لغو شد',
      data: { subscription: result, entitlements: ent }
    });
  } catch (error) {
    console.error('Cancel subscription error:', error);
    res.status(500).json({ success: false, message: 'خطا در لغو اشتراک: ' + error.message });
  }
};

// ============================================
// 📊 محدودیت‌های کاربر — شکل سازگار با فرانت‌اند فعلی
// (App.tsx / AdvisorPage / ConfigurationForm از این می‌خوانند)
// ============================================
const getUserLimits = async (req, res) => {
  try {
    const payload = await svc.getLegacyLimitsPayload(req.user.id, req.user.role);

    if (!payload) {
      return res.status(404).json({
        success: false,
        message: 'هیچ پلنی برای نقش شما تعریف نشده است'
      });
    }

    res.json({ success: true, data: payload });
  } catch (error) {
    console.error('Get user limits error:', error);
    res.status(500).json({ success: false, message: 'خطا در دریافت محدودیت‌ها: ' + error.message });
  }
};

// ============================================
// 📤 صادر کردن ماژول
// ============================================
module.exports = {
  getPlans,
  getMySubscription,
  getEntitlements,
  purchaseSubscription,
  verifyPayment,
  getUsage,
  getBillingHistory,
  cancelSubscription,
  getUserLimits
};
