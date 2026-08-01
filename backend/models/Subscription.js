// models/Subscription.js
const db = require('../config/db');
const Plan = require('./Plan');

class Subscription {
    // دریافت اشتراک فعال کاربر
    static async getActiveSubscription(userId) {
        const result = await db.query(`
            SELECT s.*, p.*, p.name as plan_name
            FROM subscriptions s
            JOIN plans p ON s.plan_id = p.id
            WHERE s.user_id = $1 
            AND s.status = 'active' 
            AND s.end_date >= CURRENT_DATE
            ORDER BY s.end_date DESC
            LIMIT 1
        `, [userId]);
        
        if (result.rows.length === 0) return null;
        
        const row = result.rows[0];
        return {
            id: row.id,
            user_id: row.user_id,
            plan_id: row.plan_id,
            plan_name: row.plan_name,
            duration: row.duration,
            start_date: row.start_date,
            end_date: row.end_date,
            status: row.status,
            // فیلدهای پلن
            max_exams_month: row.max_exams_month,
            max_questions_exam: row.max_questions_exam,
            max_file_size_mb: row.max_file_size_mb,
            max_classes: row.max_classes,
            max_students_class: row.max_students_class,
            max_advisor_month: row.max_advisor_month,
            max_advisor_chars: row.max_advisor_chars
        };
    }

    // ایجاد اشتراک رایگان برای کاربر جدید
    static async createFreeSubscription(userId, panelType) {
        const freePlan = await Plan.getFreePlan(panelType);
        if (!freePlan) {
            throw new Error('پلن رایگان برای این نقش یافت نشد');
        }

        // بررسی اینکه کاربر قبلاً اشتراک رایگان دارد یا نه
        const existing = await db.query(`
            SELECT * FROM subscriptions 
            WHERE user_id = $1 AND plan_id = $2 AND status = 'active'
        `, [userId, freePlan.id]);

        if (existing.rows.length > 0) {
            return existing.rows[0];
        }

        // غیرفعال کردن اشتراک‌های قبلی
        await db.query(`
            UPDATE subscriptions 
            SET status = 'expired' 
            WHERE user_id = $1 AND status = 'active'
        `, [userId]);

        const result = await db.query(`
            INSERT INTO subscriptions (user_id, plan_id, duration, start_date, end_date, status)
            VALUES ($1, $2, '1m', CURRENT_DATE, CURRENT_DATE + INTERVAL '1 month', 'active')
            RETURNING *
        `, [userId, freePlan.id]);

        return result.rows[0];
    }

    // خرید اشتراک جدید
    static async purchase(userId, planId, duration) {
        // دریافت اطلاعات پلن
        const plan = await Plan.findById(planId);
        if (!plan) {
            throw new Error('پلن مورد نظر یافت نشد');
        }

        // محاسبه تاریخ پایان
        let interval = '1 month';
        if (duration === '3m') interval = '3 months';
        if (duration === '9m') interval = '9 months';

        // غیرفعال کردن اشتراک‌های قبلی
        await db.query(`
            UPDATE subscriptions 
            SET status = 'expired' 
            WHERE user_id = $1 AND status = 'active'
        `, [userId]);

        const result = await db.query(`
            INSERT INTO subscriptions (user_id, plan_id, duration, start_date, end_date, status)
            VALUES ($1, $2, $3, CURRENT_DATE, CURRENT_DATE + INTERVAL '${interval}', 'active')
            RETURNING *
        `, [userId, planId, duration]);

        return result.rows[0];
    }

    // تمدید اشتراک
    static async renew(userId, planId, duration) {
        // غیرفعال کردن اشتراک‌های قبلی
        await db.query(`
            UPDATE subscriptions 
            SET status = 'expired' 
            WHERE user_id = $1 AND status = 'active'
        `, [userId]);

        let interval = '1 month';
        if (duration === '3m') interval = '3 months';
        if (duration === '9m') interval = '9 months';

        const result = await db.query(`
            INSERT INTO subscriptions (user_id, plan_id, duration, start_date, end_date, status)
            VALUES ($1, $2, $3, CURRENT_DATE, CURRENT_DATE + INTERVAL '${interval}', 'active')
            RETURNING *
        `, [userId, planId, duration]);

        return result.rows[0];
    }

    // لغو اشتراک
    static async cancel(userId) {
        const result = await db.query(`
            UPDATE subscriptions 
            SET status = 'cancelled' 
            WHERE user_id = $1 AND status = 'active'
            RETURNING *
        `, [userId]);
        return result.rows[0];
    }

    // دریافت تاریخچه اشتراک‌های کاربر
    static async getHistory(userId) {
        const result = await db.query(`
            SELECT s.*, p.name as plan_name, p.panel_type
            FROM subscriptions s
            JOIN plans p ON s.plan_id = p.id
            WHERE s.user_id = $1
            ORDER BY s.created_at DESC
        `, [userId]);
        return result.rows;
    }
}

module.exports = Subscription;