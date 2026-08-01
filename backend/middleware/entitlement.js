// middleware/entitlement.js
// ============================================
// 🛡️ میدلورهای اعمال محدودیت (Backend Enforcement)
// --------------------------------------------
// همه بر اساس subscriptionService مرکزی کار می‌کنند.
// به فرانت‌اند برای محدودیت اعتماد نمی‌کنیم.
// ============================================
const svc = require('../services/subscriptionService');

// ============================================
// 📎 attachEntitlements
// پلن + فیچرها + مصرف کاربر را به req متصل می‌کند
// (جایگزین checkLimits قدیمی — خالص، بدون مسدودسازی)
// ============================================
async function attachEntitlements(req, res, next) {
    try {
        const userId = req.user.id;

        // ادمین: نامحدود (رفتار قبلی حفظ شد)
        if (req.user.role === 'admin') {
            req.plan = {
                name: 'ادمین', is_free: false,
                max_exams_month: 99999, max_questions_exam: 99999, max_file_size_mb: 99999,
                max_classes: 99999, max_students_class: 99999, max_advisor_month: 99999, max_advisor_chars: 99999,
            };
            req.entitlements = { plan: req.plan, subscription: null, usage: {}, features: {}, isAdmin: true };
            req.usage = { exams_used: 0, advisor_used: 0, questions_used: 0, classes_used: 0 };
            return next();
        }

        const ent = await svc.getEntitlements(userId, req.user.role);
        if (!ent.plan) {
            return res.status(403).json({
                success: false,
                message: 'هیچ پلنی برای نقش شما تعریف نشده است',
                error: 'NO_PLAN',
                redirect: '/dashboard/subscription',
            });
        }

        req.entitlements = ent;
        req.usage = ent.usage;
        // سازگاری با کدهای فعلی که req.plan.<max_*> می‌خوانند
        req.plan = {
            ...ent.plan,
            max_exams_month: ent.features.exam_generation?.limit,
            max_questions_exam: ent.features.exam_questions_per_exam?.limit,
            max_file_size_mb: ent.features.file_upload_size?.limit,
            max_classes: ent.features.class_create?.limit,
            max_students_class: ent.features.class_students_per_class?.limit,
            max_advisor_month: ent.features.advisor_chat?.limit,
            max_advisor_chars: ent.features.advisor_message_chars?.limit,
        };
        next();
    } catch (error) {
        console.error('❌ attachEntitlements error:', error.message);
        res.status(500).json({ success: false, message: 'خطا در بررسی اشتراک: ' + error.message });
    }
}

// ============================================
// 🚩 requireFeature — فیچر فلگ (مثل pdf_export)
// ============================================
function requireFeature(featureKey) {
    return async (req, res, next) => {
        try {
            if (req.user?.role === 'admin') return next();
            const check = await svc.checkFeature(req.user.id, featureKey);
            if (!check.allowed) {
                return res.status(403).json({
                    success: false,
                    message: check.message,
                    error: 'FEATURE_DISABLED',
                    feature: featureKey,
                    redirect: check.redirect || '/dashboard/subscription',
                });
            }
            next();
        } catch (error) {
            console.error(`❌ requireFeature(${featureKey}) error:`, error.message);
            res.status(500).json({ success: false, message: 'خطا در بررسی قابلیت' });
        }
    };
}

// ============================================
// 📊 requireLimit — فیچر مصرف‌محور (فقط بررسی؛
// مصرف واقعی با consume* در کنترلر اتمیک انجام می‌شود)
// amountResolver: (req) => number
// ============================================
function requireLimit(featureKey, amountResolver = null) {
    return async (req, res, next) => {
        try {
            if (req.user?.role === 'admin') return next();
            const amount = amountResolver ? Number(amountResolver(req)) || 0 : 1;
            const check = await svc.checkLimit(req.user.id, featureKey, { amount });
            if (!check.allowed) {
                return res.status(429).json({
                    success: false,
                    message: check.message,
                    error: check.reason === 'feature_disabled' ? 'FEATURE_DISABLED' : 'LIMIT_REACHED',
                    feature: featureKey,
                    limit: { used: check.used, max: check.limit, remaining: check.remaining },
                    redirect: check.redirect || '/dashboard/subscription',
                });
            }
            req.limitCheck = { ...(req.limitCheck || {}), [featureKey]: check };
            next();
        } catch (error) {
            console.error(`❌ requireLimit(${featureKey}) error:`, error.message);
            res.status(500).json({ success: false, message: 'خطا در بررسی محدودیت' });
        }
    };
}

// ============================================
// 📏 requireCap — سقف هر عملیات (مثل سوال هر آزمون،
// طول پیام مشاور، حجم فایل)
// valueResolver: (req) => number
// ============================================
function requireCap(featureKey, valueResolver, label = null) {
    return async (req, res, next) => {
        try {
            if (req.user?.role === 'admin') return next();
            const value = Number(valueResolver(req)) || 0;
            if (value <= 0) return next();

            const check = await svc.checkLimit(req.user.id, featureKey, { capValue: value });
            if (!check.allowed) {
                return res.status(429).json({
                    success: false,
                    message: check.message,
                    error: 'CAP_EXCEEDED',
                    feature: featureKey,
                    limit: { max: check.limit, requested: value },
                    redirect: check.redirect || '/dashboard/subscription',
                });
            }
            next();
        } catch (error) {
            console.error(`❌ requireCap(${featureKey}) error:`, error.message);
            res.status(500).json({ success: false, message: 'خطا در بررسی سقف قابلیت' });
        }
    };
}

// ============================================
// 🔁 نام‌های سازگار با روت‌های فعلی
// ============================================
const checkLimits = attachEntitlements;

const checkExamLimit = [
    requireLimit('exam_generation', () => 1),
    requireCap('exam_questions_per_exam', (req) =>
        req.body?.numQuestions || req.body?.examData?.questions?.length || 0
    ),
    requireCap('file_upload_size', (req) => {
        // حجم متن منبع (در صورت ارسال در config)
        const text = req.body?.config?.source_text || req.body?.source_text;
        if (!text) return 0;
        return Buffer.byteLength(String(text), 'utf8') / (1024 * 1024);
    }),
];

const checkAdvisorLimit = [
    requireLimit('advisor_chat', () => 1),
    requireCap('advisor_message_chars', (req) => (req.body?.message || '').length),
];

const checkClassLimit = requireLimit('class_create', () => 1);

module.exports = {
    attachEntitlements,
    requireFeature,
    requireLimit,
    requireCap,
    // سازگاری
    checkLimits,
    checkExamLimit,
    checkAdvisorLimit,
    checkClassLimit,
};
