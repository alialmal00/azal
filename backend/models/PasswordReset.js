// models/PasswordReset.js
const db = require('../config/db');

class PasswordReset {
    // ایجاد کد بازیابی
    static async create(phone, code) {
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + 15);

        // حذف کدهای قبلی
        await db.query(
            'DELETE FROM password_resets WHERE phone = $1 AND is_used = false',
            [phone]
        );

        const query = `
            INSERT INTO password_resets (phone, code, expires_at, created_at)
            VALUES ($1, $2, $3, NOW())
            RETURNING id, phone, expires_at
        `;
        const values = [phone, code, expiresAt];
        
        try {
            const result = await db.query(query, values);
            return result.rows[0];
        } catch (error) {
            console.error('Create password reset error:', error);
            throw error;
        }
    }

    // بررسی کد بازیابی
    static async verify(phone, code) {
        const query = `
            SELECT * FROM password_resets 
            WHERE phone = $1 AND code = $2 AND expires_at > NOW() AND is_used = false
            ORDER BY created_at DESC
            LIMIT 1
        `;
        const result = await db.query(query, [phone, code]);
        return result.rows[0];
    }

    // علامت زدن کد به عنوان استفاده شده
    static async markAsUsed(id) {
        const query = `
            UPDATE password_resets 
            SET is_used = true, used_at = NOW()
            WHERE id = $1
            RETURNING *
        `;
        const result = await db.query(query, [id]);
        return result.rows[0];
    }

    // دریافت تعداد تلاش‌های ارسال در یک ساعت
    static async getAttemptsInHour(phone) {
        const query = `
            SELECT COUNT(*) as count 
            FROM password_resets 
            WHERE phone = $1 AND created_at > NOW() - INTERVAL '1 hour'
        `;
        const result = await db.query(query, [phone]);
        return parseInt(result.rows[0].count);
    }
}

module.exports = PasswordReset;