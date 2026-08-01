// services/subscriptionService.js
// ============================================
// 🏛️ سرویس مرکزی اشتراک (Single Source of Truth)
// --------------------------------------------
// تمام منطق Plan / Subscription / Entitlement / Usage
// فقط و فقط از این فایل عبور می‌کند. هیچ کنترلر یا
// میدلوری حق ندارد مستقیماً محدودیتی را با SQL جداگانه
// محاسبه کند.
//
// زنجیره: User → Subscription → Plan → Entitlements
//         → Features + Limits → Usage → Enforcement
// ============================================
const db = require('../config/db');

// ============================================
// 📦 رجیستری قابلیت‌ها (Feature Keys استاندارد)
// --------------------------------------------
// kind:
//   metered → مصرف‌محور ماهانه (در usage_counters شمرده می‌شود)
//   cap     → سقف هر عملیات (مثل تعداد سوال هر آزمون)
//   flag    → فعال/غیرفعال (مثل خروجی PDF)
// planColumn → ستون معادل در جدول plans (سازگاری با دیتابیس فعلی)
// ============================================
const FEATURES = {
    exam_generation: {
        kind: 'metered', planColumn: 'max_exams_month', usageColumn: 'exams_used',
        label: 'ساخت آزمون', unit: 'آزمون', resetPeriod: 'monthly'
    },
    exam_questions_per_exam: {
        kind: 'cap', planColumn: 'max_questions_exam',
        label: 'تعداد سوال در هر آزمون', unit: 'سوال', resetPeriod: 'none'
    },
    file_upload_size: {
        kind: 'cap', planColumn: 'max_file_size_mb',
        label: 'حجم فایل منبع', unit: 'مگابایت', resetPeriod: 'none'
    },
    class_create: {
        kind: 'metered', planColumn: 'max_classes', usageColumn: 'classes_used',
        label: 'ساخت کلاس', unit: 'کلاس', resetPeriod: 'monthly'
    },
    class_students_per_class: {
        kind: 'cap', planColumn: 'max_students_class',
        label: 'ظرفیت دانش‌آموز هر کلاس', unit: 'نفر', resetPeriod: 'none'
    },
    class_membership: {
        kind: 'cap', planColumn: null, // فقط از plan_features
        label: 'عضویت در کلاس', unit: 'کلاس', resetPeriod: 'none'
    },
    advisor_chat: {
        kind: 'metered', planColumn: 'max_advisor_month', usageColumn: 'advisor_used',
        label: 'پیام مشاور هوشمند', unit: 'پیام', resetPeriod: 'monthly'
    },
    advisor_message_chars: {
        kind: 'cap', planColumn: 'max_advisor_chars',
        label: 'طول هر پیام مشاور', unit: 'کاراکتر', resetPeriod: 'none'
    },
    pdf_export: {
        kind: 'flag', planColumn: null, // پیش‌فرض فعال (رفتار فعلی سیستم)
        label: 'خروجی PDF', unit: null, resetPeriod: 'none'
    },
};

const FEATURE_KEYS = Object.keys(FEATURES);

// ============================================
// 🧰 ابزار داخلی
// ============================================

// کش وجود جدول plan_features (سازگاری با دیتابیس‌هایی که هنوز مایگریت نشده‌اند)
let _planFeaturesTable = null;
async function planFeaturesTableExists() {
    if (_planFeaturesTable !== null) return _planFeaturesTable;
    try {
        const r = await db.query(`SELECT to_regclass('public.plan_features') AS t`);
        _planFeaturesTable = !!r.rows[0].t;
    } catch (e) {
        _planFeaturesTable = false;
    }
    return _planFeaturesTable;
}

// بازه مصرف ماه تقویم جاری
function currentPeriod() {
    const now = new Date();
    return {
        start: new Date(now.getFullYear(), now.getMonth(), 1),
        end: new Date(now.getFullYear(), now.getMonth() + 1, 1),
    };
}

function toInt(v, fallback = 0) {
    const n = parseInt(v, 10);
    return Number.isFinite(n) ? n : fallback;
}

// ============================================
// 1) validateSubscription — انقضاهای کهنه را علامت بزن
//    (همگام‌سازی وضعیت اشتراک با کل سایت)
// ============================================
async function expireStaleSubscriptions(userId = null) {
    try {
        if (userId) {
            await db.query(
                `UPDATE subscriptions SET status = 'expired', updated_at = NOW()
                 WHERE user_id = $1 AND status = 'active' AND end_date < CURRENT_DATE`,
                [userId]
            );
        } else {
            await db.query(
                `UPDATE subscriptions SET status = 'expired', updated_at = NOW()
                 WHERE status = 'active' AND end_date < CURRENT_DATE`
            );
        }
    } catch (e) {
        console.warn('⚠️ expireStaleSubscriptions:', e.message);
    }
}

// ============================================
// 2) getSubscription — اشتراک فعال (بدون تداخل ستون‌ها)
// ============================================
async function getSubscription(userId) {
    await expireStaleSubscriptions(userId);
    const r = await db.query(
        `SELECT
            s.id            AS subscription_id,
            s.user_id       AS user_id,
            s.plan_id       AS plan_id,
            s.duration      AS duration,
            s.start_date    AS start_date,
            s.end_date      AS end_date,
            s.status        AS status,
            s.created_at    AS created_at,
            p.name          AS plan_name,
            p.panel_type    AS panel_type
         FROM subscriptions s
         JOIN plans p ON p.id = s.plan_id
         WHERE s.user_id = $1 AND s.status = 'active' AND s.end_date >= CURRENT_DATE
         ORDER BY s.end_date DESC
         LIMIT 1`,
        [userId]
    );
    if (r.rows.length === 0) return null;
    const row = r.rows[0];
    return {
        id: row.subscription_id, // ✅ رفع باگ: قبلاً id پلن برمی‌گشت
        user_id: row.user_id,
        plan_id: row.plan_id,
        plan_name: row.plan_name,
        panel_type: row.panel_type,
        duration: row.duration,
        start_date: row.start_date,
        end_date: row.end_date,
        status: row.status,
        created_at: row.created_at,
    };
}

// ============================================
// 3) getCurrentPlan — پلن مؤثر کاربر
//    (اشتراک فعال → در غیر این صورت پلن رایگان)
// ============================================
async function getFreePlanForRole(role) {
    const r = await db.query(
        `SELECT * FROM plans
         WHERE panel_type = $1 AND is_active = true
           AND (name = 'رایگان' OR is_default = true OR COALESCE(price_1m, 0) = 0)
         ORDER BY CASE WHEN name = 'رایگان' THEN 0 ELSE 1 END
         LIMIT 1`,
        [role]
    );
    return r.rows[0] || null;
}

async function getCurrentPlan(userId, role = null) {
    const subscription = await getSubscription(userId);
    if (subscription) {
        const p = await db.query('SELECT * FROM plans WHERE id = $1', [subscription.plan_id]);
        if (p.rows[0]) return { plan: p.rows[0], subscription, isFree: false };
    }

    const userRole = role || (await db.query('SELECT role FROM users WHERE id = $1', [userId])).rows[0]?.role || 'student';
    const freePlan = await getFreePlanForRole(userRole);
    if (freePlan) {
        // اگر اشتراک فعالی نیست، نسخه رایگان را راه‌اندازی کن (رفتار فعلی سایت حفظ شود)
        if (!subscription) {
            try { await ensureFreeSubscription(userId, userRole); } catch (e) { /* بی‌اثر */ }
        }
        return { plan: freePlan, subscription: null, isFree: true };
    }
    return { plan: null, subscription: null, isFree: false };
}

// راه‌اندازی اشتراک رایگان (بدون تکرار و بدون حذف اشتراک‌های پولی فعال)
async function ensureFreeSubscription(userId, role) {
    const existing = await getSubscription(userId);
    if (existing) return existing;
    const freePlan = await getFreePlanForRole(role);
    if (!freePlan) return null;

    const r = await db.query(
        `INSERT INTO subscriptions (user_id, plan_id, duration, start_date, end_date, status, created_at)
         VALUES ($1, $2, '1m', CURRENT_DATE, CURRENT_DATE + INTERVAL '1 month', 'active', NOW())
         RETURNING *`,
        [userId, freePlan.id]
    );
    console.log(`✅ Free plan ensured for user ${userId} (${role})`);
    return r.rows[0];
}

// ============================================
// 4) getFeatureLimits — استخراج محدودیت‌های پلن
//    اولویت: plan_features → ستون‌های plans (سازگاری)
// ============================================
async function getFeatureLimits(plan) {
    const limits = {};
    if (!plan || !plan.id) return limits;

    // مقدار پیش‌فرض از ستون‌های plans
    for (const key of FEATURE_KEYS) {
        const f = FEATURES[key];
        let limit = null;
        if (f.planColumn && plan[f.planColumn] !== undefined && plan[f.planColumn] !== null) {
            limit = f.kind === 'flag' ? null : toInt(plan[f.planColumn], null);
        }
        if (key === 'pdf_export') limit = null; // پیش‌فرض فعال
        limits[key] = {
            key, kind: f.kind, is_enabled: true, limit,
            label: f.label, unit: f.unit, reset_period: f.resetPeriod,
        };
    }

    // بازنویسی از plan_features در صورت وجود
    if (await planFeaturesTableExists()) {
        try {
            const r = await db.query(
                'SELECT feature_key, is_enabled, limit_value, reset_period FROM plan_features WHERE plan_id = $1',
                [plan.id]
            );
            for (const row of r.rows) {
                if (!FEATURES[row.feature_key]) continue; // کلید ناشناخته نادیده گرفته شود
                const l = limits[row.feature_key];
                l.is_enabled = !!row.is_enabled;
                if (row.limit_value !== null && row.limit_value !== undefined) {
                    l.limit = toInt(row.limit_value, l.limit);
                }
                if (row.reset_period) l.reset_period = row.reset_period;
            }
        } catch (e) {
            console.warn('⚠️ plan_features read failed, using plans columns:', e.message);
        }
    }
    return limits;
}

// ============================================
// 5) getUsage — مصرف ماه جاری (ایجاد امن، بدون seed تقلبی)
// ============================================
async function getUsage(userId) {
    const { start, end } = currentPeriod();

    // درج امن با ON CONFLICT (ایندکس یکتا در مایگریشن؛ در نبود آن catch می‌شود)
    try {
        await db.query(
            `INSERT INTO usage_counters (user_id, period_start, period_end, exams_used, advisor_used, questions_used, classes_used)
             VALUES ($1, $2, $3, 0, 0, 0, 0)
             ON CONFLICT (user_id, period_start) DO NOTHING`,
            [userId, start, end]
        );
    } catch (e) {
        // اگر ایندکس یکتا نیست، درج ساده با بررسی
        const existing = await db.query(
            'SELECT id FROM usage_counters WHERE user_id = $1 AND period_start = $2 LIMIT 1',
            [userId, start]
        );
        if (existing.rows.length === 0) {
            try {
                await db.query(
                    `INSERT INTO usage_counters (user_id, period_start, period_end, exams_used, advisor_used, questions_used, classes_used)
                     VALUES ($1, $2, $3, 0, 0, 0, 0)`,
                    [userId, start, end]
                );
            } catch (e2) { /* race: رکورد همزمان ساخته شده */ }
        }
    }

    const r = await db.query(
        `SELECT * FROM usage_counters
         WHERE user_id = $1 AND period_start = $2
         ORDER BY id ASC LIMIT 1`,
        [userId, start]
    );
    const row = r.rows[0] || {};
    return {
        id: row.id || null,
        user_id: userId,
        period_start: row.period_start || start,
        exams_used: toInt(row.exams_used),
        advisor_used: toInt(row.advisor_used),
        questions_used: toInt(row.questions_used),
        classes_used: toInt(row.classes_used),
    };
}

// ============================================
// 6) getEntitlements — نمای کامل: پلن + فیچرها + مصرف + باقی‌مانده
// ============================================
async function getEntitlements(userId, role = null) {
    const { plan, subscription, isFree } = await getCurrentPlan(userId, role);
    const usage = await getUsage(userId);

    if (!plan) {
        return { plan: null, subscription: null, usage, features: {} };
    }

    const featureLimits = await getFeatureLimits(plan);
    const features = {};

    for (const key of FEATURE_KEYS) {
        const f = featureLimits[key];
        const used = f.kind === 'metered' ? usage[FEATURES[key].usageColumn] : null;
        const remaining = f.kind === 'metered' && f.limit !== null
            ? Math.max(0, f.limit - used)
            : null;
        features[key] = {
            ...f,
            used,
            remaining,
        };
    }

    return {
        plan: {
            id: plan.id,
            name: plan.name || 'رایگان',
            panel_type: plan.panel_type,
            is_free: isFree || plan.name === 'رایگان' || toInt(plan.price_1m) === 0,
            price_1m: toInt(plan.price_1m),
            price_3m: toInt(plan.price_3m),
            price_9m: toInt(plan.price_9m),
            description: plan.description || null,
        },
        subscription,
        usage: {
            exams_used: usage.exams_used,
            questions_used: usage.questions_used,
            advisor_used: usage.advisor_used,
            classes_used: usage.classes_used,
        },
        features,
    };
}

// ============================================
// 7) checkLimit — بررسی خالص (بدون مصرف کردن)
// --------------------------------------------
// opts.amount     → برای metered (پیش‌فرض 1)
// opts.capValue   → برای cap (مقدار درخواستی فعلی)
// opts.limitOwner → userId دیگری که پلن مالکیت دارد
//                   (مثلاً ظرفیت کلاس بر اساس پلن معلم)
// ============================================
async function checkLimit(userId, featureKey, opts = {}) {
    const { amount = 1, capValue = null, limitOwner = null } = opts;
    const f = FEATURES[featureKey];
    if (!f) return { allowed: true, reason: 'unknown_feature' };

    const ownerId = limitOwner || userId;
    const ent = await getEntitlements(ownerId);

    // ادمین: نامحدود
    if (opts.isAdmin) {
        return { allowed: true, unlimited: true, feature: ent.features[featureKey] };
    }

    if (!ent.plan) {
        return {
            allowed: false, reason: 'no_plan',
            message: 'هیچ پلنی برای نقش شما تعریف نشده است',
            redirect: '/dashboard/subscription',
        };
    }

    const feature = ent.features[featureKey];
    if (!feature) {
        // فیچر برای این پلن تعریف نشده → محدود نیست
        return { allowed: true, feature: null };
    }

    // پلن مخصوص نقش دیگر است؟ (معلم پلن دانش‌آموز نخرد)
    if (!feature.is_enabled) {
        return {
            allowed: false, reason: 'feature_disabled', feature,
            message: `${feature.label} در پلن «${ent.plan.name}» فعال نیست. برای استفاده، اشتراک خود را ارتقا دهید.`,
            redirect: '/dashboard/subscription',
        };
    }

    switch (feature.kind) {
        case 'flag':
            return { allowed: true, feature };

        case 'cap': {
            if (feature.limit === null || feature.limit === undefined) {
                return { allowed: true, feature }; // بدون سقف
            }
            if ( capValue !== null && capValue > feature.limit) {
                return {
                    allowed: false, reason: 'cap_exceeded', feature,
                    limit: feature.limit, requested: capValue,
                    message: `${feature.label} در پلن «${ent.plan.name}» حداکثر ${feature.limit} ${feature.unit || ''} است.`,
                    redirect: '/dashboard/subscription',
                };
            }
            return { allowed: true, feature, limit: feature.limit };
        }

        case 'metered':
        default: {
            const used = feature.used || 0;
            if (feature.limit === null || feature.limit === undefined) {
                return { allowed: true, feature, used, remaining: null };
            }
            if (used + amount > feature.limit) {
                const remaining = Math.max(0, feature.limit - used);
                return {
                    allowed: false, reason: 'limit_exceeded', feature,
                    used, limit: feature.limit, remaining,
                    message: `سقف ${feature.limit} ${feature.unit} ${feature.label} در این ماه کامل شده است.${remaining === 0 ? ' برای ادامه، اشتراک خود را ارتقا دهید.' : ''}`,
                    redirect: '/dashboard/subscription',
                };
            }
            return {
                allowed: true, feature,
                used, limit: feature.limit,
                remaining: feature.limit - used - amount,
            };
        }
    }
}

async function checkFeature(userId, featureKey, opts = {}) {
    return checkLimit(userId, featureKey, opts);
}

// ============================================
// 8) consumeMetered — بررسی + مصرف اتمیک (ضد Race Condition)
// --------------------------------------------
// با قفل سطح سطر (FOR UPDATE) داخل تراکنش انجام می‌شود؛
// دو درخواست همزمان نمی‌توانند سهمیه را دور بزنند.
// ============================================
async function consumeMetered(userId, featureKey, amount = 1) {
    const f = FEATURES[featureKey];
    if (!f || f.kind !== 'metered') {
        return { allowed: true, skipped: true };
    }
    const column = f.usageColumn;
    const { start, end } = currentPeriod();

    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');

        // رکورد وجود دارد؟ بساز + قفل کن
        try {
            await client.query(
                `INSERT INTO usage_counters (user_id, period_start, period_end, exams_used, advisor_used, questions_used, classes_used)
                 VALUES ($1, $2, $3, 0, 0, 0, 0)
                 ON CONFLICT (user_id, period_start) DO NOTHING`,
                [userId, start, end]
            );
        } catch (e) {
            await client.query(
                `INSERT INTO usage_counters (user_id, period_start, period_end, exams_used, advisor_used, questions_used, classes_used)
                 SELECT $1, $2, $3, 0, 0, 0, 0
                 WHERE NOT EXISTS (SELECT 1 FROM usage_counters WHERE user_id = $1 AND period_start = $2)`,
                [userId, start, end]
            );
        }

        const locked = await client.query(
            `SELECT id, ${column} AS used FROM usage_counters
             WHERE user_id = $1 AND period_start = $2
             ORDER BY id ASC LIMIT 1 FOR UPDATE`,
            [userId, start]
        );

        // پلن و سقف (داخل همان تراکنش خوانده می‌شود)
        const { plan } = await getCurrentPlan(userId);
        const featureLimits = plan ? await getFeatureLimits(plan) : {};
        const feat = featureLimits[featureKey];
        const used = toInt(locked.rows[0]?.used);

        if (feat && feat.is_enabled === false) {
            await client.query('ROLLBACK');
            return {
                allowed: false, reason: 'feature_disabled',
                message: `${f.label} در پلن «${plan?.name || '—'}» فعال نیست.`,
                redirect: '/dashboard/subscription',
            };
        }
        if (feat && feat.limit !== null && feat.limit !== undefined && used + amount > feat.limit) {
            await client.query('ROLLBACK');
            return {
                allowed: false, reason: 'limit_exceeded',
                used, limit: feat.limit,
                remaining: Math.max(0, feat.limit - used),
                message: `سقف ${feat.limit} ${f.unit} ${f.label} در این ماه کامل شده است. برای ادامه، اشتراک خود را ارتقا دهید.`,
                redirect: '/dashboard/subscription',
            };
        }

        const upd = await client.query(
            `UPDATE usage_counters SET ${column} = ${column} + $1, updated_at = CURRENT_TIMESTAMP
             WHERE id = $2 RETURNING exams_used, advisor_used, questions_used, classes_used`,
            [amount, locked.rows[0].id]
        );

        await client.query('COMMIT');
        return { allowed: true, used: used + amount, usage: upd.rows[0] };
    } catch (e) {
        try { await client.query('ROLLBACK'); } catch (_) { /* ignore */ }
        console.error(`❌ consumeMetered(${featureKey}) error:`, e.message);
        throw e;
    } finally {
        client.release();
    }
}

// ============================================
// 9) decrementUsage — جبران (مثلاً خطای AI بعد از رزرو سهمیه)
// ============================================
async function decrementUsage(userId, featureKey, amount = 1) {
    const f = FEATURES[featureKey];
    if (!f || f.kind !== 'metered') return;
    const { start } = currentPeriod();
    await db.query(
        `UPDATE usage_counters
         SET ${f.usageColumn} = GREATEST(0, ${f.usageColumn} - $1), updated_at = CURRENT_TIMESTAMP
         WHERE user_id = $2 AND period_start = $3`,
        [amount, userId, start]
    );
}

// ============================================
// 10) consumeExam — مصرف همزمان آزمون + سوالات (اتمیک)
// ============================================
async function consumeExam(userId, numQuestions = 0) {
    const { start, end } = currentPeriod();
    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');
        try {
            await client.query(
                `INSERT INTO usage_counters (user_id, period_start, period_end, exams_used, advisor_used, questions_used, classes_used)
                 VALUES ($1, $2, $3, 0, 0, 0, 0)
                 ON CONFLICT (user_id, period_start) DO NOTHING`,
                [userId, start, end]
            );
        } catch (e) {
            await client.query(
                `INSERT INTO usage_counters (user_id, period_start, period_end, exams_used, advisor_used, questions_used, classes_used)
                 SELECT $1, $2, $3, 0, 0, 0, 0
                 WHERE NOT EXISTS (SELECT 1 FROM usage_counters WHERE user_id = $1 AND period_start = $2)`,
                [userId, start, end]
            );
        }

        const locked = await client.query(
            `SELECT id, exams_used, questions_used FROM usage_counters
             WHERE user_id = $1 AND period_start = $2
             ORDER BY id ASC LIMIT 1 FOR UPDATE`,
            [userId, start]
        );

        const { plan } = await getCurrentPlan(userId);
        const featureLimits = plan ? await getFeatureLimits(plan) : {};
        const examFeat = featureLimits.exam_generation;
        const examsUsed = toInt(locked.rows[0]?.exams_used);

        if (examFeat && examFeat.limit !== null && examFeat.limit !== undefined && examsUsed + 1 > examFeat.limit) {
            await client.query('ROLLBACK');
            return {
                allowed: false, reason: 'limit_exceeded', feature: 'exam_generation',
                used: examsUsed, limit: examFeat.limit,
                remaining: Math.max(0, examFeat.limit - examsUsed),
                message: `سقف ${examFeat.limit} آزمون ماهانه شما کامل شده است. برای ساخت آزمون جدید، اشتراک خود را ارتقا دهید.`,
                redirect: '/dashboard/subscription',
            };
        }

        const upd = await client.query(
            `UPDATE usage_counters
             SET exams_used = exams_used + 1,
                 questions_used = questions_used + $1,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $2
             RETURNING exams_used, advisor_used, questions_used, classes_used`,
            [numQuestions, locked.rows[0].id]
        );

        await client.query('COMMIT');
        return { allowed: true, usage: upd.rows[0] };
    } catch (e) {
        try { await client.query('ROLLBACK'); } catch (_) { /* ignore */ }
        console.error('❌ consumeExam error:', e.message);
        throw e;
    } finally {
        client.release();
    }
}

// ============================================
// 11) resetUsage — ریست مصرف ماه جاری (بعد از خرید موفق)
// ============================================
async function resetUsage(userId) {
    const { start, end } = currentPeriod();
    try {
        await db.query(
            `INSERT INTO usage_counters (user_id, period_start, period_end, exams_used, advisor_used, questions_used, classes_used)
             VALUES ($1, $2, $3, 0, 0, 0, 0)
             ON CONFLICT (user_id, period_start)
             DO UPDATE SET exams_used = 0, advisor_used = 0, questions_used = 0, classes_used = 0, updated_at = CURRENT_TIMESTAMP`,
            [userId, start, end]
        );
    } catch (e) {
        await db.query(
            `UPDATE usage_counters SET exams_used = 0, advisor_used = 0, questions_used = 0, classes_used = 0
             WHERE user_id = $1 AND period_start = $2`,
            [userId, start]
        );
    }
}

// ============================================
// 12) purchase — ایجاد پرداخت در انتظار (درگاه‌محور)
// --------------------------------------------
// پرداخت «موفق» فقط از مسیر verifyPayment ثبت می‌شود.
// PAYMENT_SIMULATION=true → حالت تست: بلافاصله تایید می‌شود.
// ============================================
const DURATIONS = {
    '1m': { interval: '1 month', label: '۱ ماهه', priceCol: 'price_1m' },
    '3m': { interval: '3 months', label: '۳ ماهه', priceCol: 'price_3m' },
    '9m': { interval: '9 months', label: '۹ ماهه', priceCol: 'price_9m' },
};

async function purchaseRequest(userId, userRole, planId, duration) {
    const d = DURATIONS[duration];
    if (!d) {
        const err = new Error('مدت زمان اشتراک نامعتبر است');
        err.status = 400;
        throw err;
    }

    const planR = await db.query('SELECT * FROM plans WHERE id = $1 AND is_active = true', [planId]);
    const plan = planR.rows[0];
    if (!plan) {
        const err = new Error('پلن مورد نظر یافت نشد');
        err.status = 404;
        throw err;
    }

    // جلوگیری از خرید پلن پنل دیگر
    if (plan.panel_type && userRole && plan.panel_type !== userRole && userRole !== 'admin') {
        const err = new Error(`این پلن مخصوص پنل «${plan.panel_type}» است و با نقش شما سازگار نیست`);
        err.status = 403;
        throw err;
    }

    const price = toInt(plan[d.priceCol]);
    const payR = await db.query(
        `INSERT INTO payments (user_id, plan_id, duration, amount, status, description, created_at)
         VALUES ($1, $2, $3, $4, 'pending', $5, CURRENT_TIMESTAMP)
         RETURNING *`,
        [userId, planId, duration, price, `خرید اشتراک ${plan.name} - ${d.label}`]
    );
    const payment = payR.rows[0];

    const simulation = (process.env.PAYMENT_SIMULATION || 'true') === 'true';
    if (simulation) {
        // حالت تست: تایید خودکار (درگاه واقعی: این بخش با callback زرین‌پال جایگزین می‌شود)
        const verified = await verifyPayment(payment.id, userId, `SIM-${payment.id}-${Date.now()}`);
        return { payment: verified.payment, subscription: verified.subscription, simulated: true };
    }

    // حالت واقعی: کاربر به درگاه هدایت می‌شود (نقطه اتصال زرین‌پال)
    return {
        payment,
        subscription: null,
        simulated: false,
        payment_url: null, // TODO: ZarinPal request → authority URL
    };
}

// ============================================
// 13) verifyPayment — تنها مسیر فعال‌سازی اشتراک (تراکنشی + idempotent)
// ============================================
async function verifyPayment(paymentId, userId, refId = null) {
    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');

        const payR = await client.query(
            `SELECT * FROM payments WHERE id = $1 AND user_id = $2 FOR UPDATE`,
            [paymentId, userId]
        );
        const payment = payR.rows[0];
        if (!payment) {
            await client.query('ROLLBACK');
            const err = new Error('پرداخت یافت نشد');
            err.status = 404;
            throw err;
        }

        // idempotent: اگر قبلاً موفق شده، همان وضعیت را برگردان
        if (payment.status === 'success') {
            await client.query('COMMIT');
            const sub = await getSubscription(userId);
            return { payment, subscription: sub, already: true };
        }
        if (payment.status !== 'pending') {
            await client.query('ROLLBACK');
            const err = new Error('این پرداخت قابل تایید نیست');
            err.status = 400;
            throw err;
        }

        const d = DURATIONS[payment.duration] || DURATIONS['1m'];

        // ۱) ثبت موفقیت پرداخت
        await client.query(
            `UPDATE payments SET status = 'success', ref_id = $2, paid_at = CURRENT_TIMESTAMP WHERE id = $1`,
            [paymentId, refId]
        );

        // ۲) انقضای اشتراک‌های قبلی
        await client.query(
            `UPDATE subscriptions SET status = 'expired', updated_at = NOW()
             WHERE user_id = $1 AND status = 'active'`,
            [userId]
        );

        // ۳) فعال‌سازی اشتراک جدید
        const subR = await client.query(
            `INSERT INTO subscriptions (user_id, plan_id, duration, start_date, end_date, status, created_at)
             VALUES ($1, $2, $3, CURRENT_DATE, CURRENT_DATE + $4::interval, 'active', NOW())
             RETURNING *`,
            [userId, payment.plan_id, payment.duration, d.interval]
        );

        // ۴) ریست مصرف ماه جاری (همان منطق قبلی، ولی داخل تراکنش)
        const { start, end } = currentPeriod();
        try {
            await client.query(
                `INSERT INTO usage_counters (user_id, period_start, period_end, exams_used, advisor_used, questions_used, classes_used)
                 VALUES ($1, $2, $3, 0, 0, 0, 0)
                 ON CONFLICT (user_id, period_start)
                 DO UPDATE SET exams_used = 0, advisor_used = 0, questions_used = 0, classes_used = 0, updated_at = CURRENT_TIMESTAMP`,
                [userId, start, end]
            );
        } catch (e) {
            await client.query(
                `UPDATE usage_counters SET exams_used = 0, advisor_used = 0, questions_used = 0, classes_used = 0
                 WHERE user_id = $1 AND period_start = $2`,
                [userId, start]
            );
        }

        await client.query('COMMIT');
        console.log(`✅ Subscription activated: user=${userId} plan=${payment.plan_id} duration=${payment.duration}`);

        return { payment: { ...payment, status: 'success', ref_id: refId }, subscription: subR.rows[0] };
    } catch (e) {
        try { await client.query('ROLLBACK'); } catch (_) { /* ignore */ }
        console.error('❌ verifyPayment error:', e.message);
        throw e;
    } finally {
        client.release();
    }
}

// ============================================
// 14) cancel — لغو اشتراک فعال (تراکنشی) + بازگشت به رایگان
// ============================================
async function cancelActiveSubscription(userId, userRole) {
    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');
        const r = await client.query(
            `UPDATE subscriptions SET status = 'cancelled', updated_at = NOW()
             WHERE user_id = $1 AND status = 'active'
             RETURNING *`,
            [userId]
        );
        await client.query('COMMIT');

        if (r.rows.length === 0) return null;

        // بازگشت به پلن رایگان (اگر تعریف شده)
        try { await ensureFreeSubscription(userId, userRole); } catch (e) { /* بی‌اثر */ }
        return r.rows[0];
    } catch (e) {
        try { await client.query('ROLLBACK'); } catch (_) { /* ignore */ }
        throw e;
    } finally {
        client.release();
    }
}

// ============================================
// 15) getRemainingUsage / legacy shape برای سازگاری فرانت‌اند فعلی
// ============================================
async function getLegacyLimitsPayload(userId, userRole) {
    const ent = await getEntitlements(userId, userRole);
    if (!ent.plan) return null;

    const f = ent.features;
    const lim = (key) => f[key]?.limit ?? null;
    const used = (key) => f[key]?.used ?? 0;

    return {
        plan: {
            id: ent.plan.id,
            name: ent.plan.name,
            is_free: ent.plan.is_free,
            max_exams_month: lim('exam_generation'),
            max_questions_exam: lim('exam_questions_per_exam'),
            max_total_questions: (lim('exam_generation') || 0) * (lim('exam_questions_per_exam') || 0),
            max_file_size_mb: lim('file_upload_size'),
            max_classes: lim('class_create'),
            max_students_class: lim('class_students_per_class'),
            max_advisor_month: lim('advisor_chat'),
            max_advisor_chars: lim('advisor_message_chars'),
        },
        usage: ent.usage,
        limits: {
            exams_remaining: f.exam_generation?.remaining ?? null,
            questions_remaining: null,
            advisor_remaining: f.advisor_chat?.remaining ?? null,
            classes_remaining: f.class_create?.remaining ?? null,
        },
        features: ent.features, // 🔹 نگاشت کامل فیچرها برای UI جدید
        subscription: ent.subscription,
    };
}

module.exports = {
    FEATURES,
    FEATURE_KEYS,
    // reads
    getSubscription,
    getCurrentPlan,
    getFreePlanForRole,
    getEntitlements,
    getFeatureLimits,
    getUsage,
    getRemainingUsage: getUsage, // alias معنایی
    getLegacyLimitsPayload,
    // checks
    checkFeature,
    checkLimit,
    validateSubscription: getSubscription,
    // mutations
    ensureFreeSubscription,
    consumeMetered,
    consumeExam,
    decrementUsage,
    resetUsage,
    expireStaleSubscriptions,
    // payments
    purchaseRequest,
    verifyPayment,
    cancelActiveSubscription,
    DURATIONS,
};
