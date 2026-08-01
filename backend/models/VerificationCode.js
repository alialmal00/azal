// models/VerificationCode.js
const db = require('../config/db');

class VerificationCode {
    static async create(phone, code) {
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + 15); // 15 دقیقه

        await db.query(
            'DELETE FROM verification_codes WHERE phone = $1 AND is_used = false',
            [phone]
        );

        const query = `
            INSERT INTO verification_codes (phone, code, expires_at, created_at)
            VALUES ($1, $2, $3, NOW())
            RETURNING id, phone, expires_at
        `;
        const values = [phone, code, expiresAt];
        
        try {
            const result = await db.query(query, values);
            return result.rows[0];
        } catch (error) {
            console.error('Create verification code error:', error);
            throw error;
        }
    }

    static async verify(phone, code) {
        const query = `
            SELECT * FROM verification_codes 
            WHERE phone = $1 AND code = $2 
            AND expires_at > NOW() 
            AND is_used = false
            ORDER BY created_at DESC
            LIMIT 1
        `;
        const result = await db.query(query, [phone, code]);
        return result.rows[0];
    }

    static async markAsUsed(id) {
        const query = `
            UPDATE verification_codes 
            SET is_used = true, used_at = NOW()
            WHERE id = $1
            RETURNING *
        `;
        const result = await db.query(query, [id]);
        return result.rows[0];
    }

    static async getAttemptsInHour(phone) {
        const query = `
            SELECT COUNT(*) as count 
            FROM verification_codes 
            WHERE phone = $1 AND created_at > NOW() - INTERVAL '1 hour'
        `;
        const result = await db.query(query, [phone]);
        return parseInt(result.rows[0].count);
    }

    // ✅ حذف کدهای منقضی شده (برای پاکسازی)
    static async deleteExpired() {
        const query = `
            DELETE FROM verification_codes 
            WHERE expires_at < NOW() OR is_used = true
        `;
        await db.query(query);
        return true;
    }
}

module.exports = VerificationCode;