const db = require('../config/db');

class Payment {
    // ایجاد درخواست پرداخت جدید
    static async create(userId, planId, duration, amount, description = '') {
        const result = await db.query(`
            INSERT INTO payments (user_id, plan_id, duration, amount, description, status, created_at)
            VALUES ($1, $2, $3, $4, $5, 'pending', CURRENT_TIMESTAMP)
            RETURNING *
        `, [userId, planId, duration, amount, description]);
        return result.rows[0];
    }

    // ثبت موفقیت پرداخت
    static async markSuccess(paymentId, refId = null) {
        const result = await db.query(`
            UPDATE payments 
            SET status = 'success', 
                ref_id = COALESCE($2, ref_id),
                paid_at = CURRENT_TIMESTAMP
            WHERE id = $1
            RETURNING *
        `, [paymentId, refId]);
        return result.rows[0];
    }

    // ثبت失败 پرداخت
    static async markFailed(paymentId, reason = null) {
        const result = await db.query(`
            UPDATE payments 
            SET status = 'failed',
                description = COALESCE($2, description)
            WHERE id = $1
            RETURNING *
        `, [paymentId, reason]);
        return result.rows[0];
    }

    // دریافت تاریخچه پرداخت‌های کاربر
    static async getHistory(userId) {
        const result = await db.query(`
            SELECT p.*, pl.name as plan_name
            FROM payments p
            JOIN plans pl ON p.plan_id = pl.id
            WHERE p.user_id = $1
            ORDER BY p.created_at DESC
        `, [userId]);
        return result.rows;
    }

    // دریافت یک پرداخت با شناسه
    static async findById(id) {
        const result = await db.query(`
            SELECT p.*, pl.name as plan_name
            FROM payments p
            JOIN plans pl ON p.plan_id = pl.id
            WHERE p.id = $1
        `, [id]);
        return result.rows[0];
    }
}

module.exports = Payment;