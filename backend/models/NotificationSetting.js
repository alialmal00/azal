// models/NotificationSetting.js
const db = require('../config/db');

class NotificationSetting {
    // دریافت تنظیمات کاربر (با ایجاد خودکار اگر وجود نداشته باشد)
    static async getUserSettings(userId) {
        let result = await db.query(
            'SELECT * FROM notification_settings WHERE user_id = $1',
            [userId]
        );
        if (result.rows.length === 0) {
            // ایجاد تنظیمات پیش‌فرض
            const insert = await db.query(
                `INSERT INTO notification_settings (user_id) VALUES ($1) RETURNING *`,
                [userId]
            );
            return insert.rows[0];
        }
        return result.rows[0];
    }

    // به‌روزرسانی تنظیمات
    static async updateSettings(userId, settings) {
        const allowedFields = ['exam_reminder', 'exam_deadline', 'online_class', 'ticket_answer', 'class_join', 'achievements', 'system', 'email_notification'];
        const updates = [];
        const values = [];
        let paramIndex = 1;
        
        for (const field of allowedFields) {
            if (settings[field] !== undefined) {
                updates.push(`${field} = $${paramIndex}`);
                values.push(settings[field]);
                paramIndex++;
            }
        }
        
        if (updates.length === 0) return await this.getUserSettings(userId);
        
        values.push(userId);
        const query = `
            UPDATE notification_settings 
            SET ${updates.join(', ')}, updated_at = NOW()
            WHERE user_id = $${paramIndex}
            RETURNING *
        `;
        const result = await db.query(query, values);
        return result.rows[0];
    }
}

module.exports = NotificationSetting;