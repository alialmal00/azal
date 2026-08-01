// models/Notification.js
const db = require('../config/db');

class Notification {
    // ایجاد اعلان جدید
    static async create(userId, type, title, message, link = null, metadata = null, scheduledFor = null) {
        const query = `
            INSERT INTO notifications (user_id, type, title, message, link, metadata, scheduled_for)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
        `;
        const values = [userId, type, title, message, link, metadata ? JSON.stringify(metadata) : null, scheduledFor];
        const result = await db.query(query, values);
        return result.rows[0];
    }

    // دریافت اعلان‌های کاربر
    static async getUserNotifications(userId, limit = 50, offset = 0) {
        const query = `
            SELECT * FROM notifications
            WHERE user_id = $1 AND (scheduled_for IS NULL OR scheduled_for <= NOW())
            ORDER BY created_at DESC
            LIMIT $2 OFFSET $3
        `;
        const result = await db.query(query, [userId, limit, offset]);
        return result.rows;
    }

    // دریافت تعداد اعلان‌های خوانده نشده
    static async getUnreadCount(userId) {
        const query = `
            SELECT COUNT(*) FROM notifications
            WHERE user_id = $1 AND is_read = false AND (scheduled_for IS NULL OR scheduled_for <= NOW())
        `;
        const result = await db.query(query, [userId]);
        return parseInt(result.rows[0].count);
    }

    // علامت زدن یک اعلان به عنوان خوانده شده
    static async markAsRead(notificationId, userId) {
        const query = `
            UPDATE notifications SET is_read = true
            WHERE id = $1 AND user_id = $2
            RETURNING *
        `;
        const result = await db.query(query, [notificationId, userId]);
        return result.rows[0];
    }

    // علامت زدن همه اعلان‌ها به عنوان خوانده شده
    static async markAllAsRead(userId) {
        const query = `
            UPDATE notifications SET is_read = true
            WHERE user_id = $1 AND is_read = false
        `;
        await db.query(query, [userId]);
        return true;
    }

    // حذف اعلان (اختیاری)
    static async delete(notificationId, userId) {
        const query = 'DELETE FROM notifications WHERE id = $1 AND user_id = $2 RETURNING id';
        const result = await db.query(query, [notificationId, userId]);
        return result.rows[0];
    }

    // ارسال اعلان زمان‌دار برای همه کاربران یک کلاس (مثلاً یادآوری آزمون)
    static async sendBulk(users, type, title, message, link = null, metadata = null) {
        for (const userId of users) {
            await this.create(userId, type, title, message, link, metadata, null);
        }
    }
}

module.exports = Notification;