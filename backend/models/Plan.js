// models/Plan.js
const db = require('../config/db');

class Plan {
    // دریافت همه پلن‌ها
    static async getAll() {
        const result = await db.query(`
            SELECT * FROM plans 
            WHERE is_active = true 
            ORDER BY panel_type, price_1m
        `);
        return result.rows;
    }

    // دریافت پلن‌های یک پنل خاص
    static async getByPanel(panelType) {
        const result = await db.query(`
            SELECT * FROM plans 
            WHERE panel_type = $1 AND is_active = true 
            ORDER BY price_1m
        `, [panelType]);
        return result.rows;
    }

    // دریافت یک پلن با شناسه
    static async findById(id) {
        const result = await db.query('SELECT * FROM plans WHERE id = $1', [id]);
        return result.rows[0];
    }

    // دریافت پلن رایگان برای یک نقش
    static async getFreePlan(panelType) {
        const result = await db.query(`
            SELECT * FROM plans 
            WHERE panel_type = $1 AND name = 'رایگان' AND is_active = true
        `, [panelType]);
        return result.rows[0];
    }

    // ایجاد پلن جدید (فقط ادمین)
    static async create(data) {
        const {
            name, panel_type, price_1m, price_3m, price_9m,
            max_exams_month, max_questions_exam, max_file_size_mb,
            max_classes, max_students_class, max_advisor_month, max_advisor_chars
        } = data;

        const result = await db.query(`
            INSERT INTO plans (
                name, panel_type, price_1m, price_3m, price_9m,
                max_exams_month, max_questions_exam, max_file_size_mb,
                max_classes, max_students_class, max_advisor_month, max_advisor_chars,
                is_active, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, true, NOW(), NOW())
            RETURNING *
        `, [
            name, panel_type, price_1m, price_3m, price_9m,
            max_exams_month, max_questions_exam, max_file_size_mb,
            max_classes, max_students_class, max_advisor_month, max_advisor_chars
        ]);
        return result.rows[0];
    }

    // به‌روزرسانی پلن (فقط ادمین)
    static async update(id, data) {
        const fields = [];
        const values = [];
        let idx = 1;

        const allowedFields = [
            'name', 'panel_type', 'price_1m', 'price_3m', 'price_9m',
            'max_exams_month', 'max_questions_exam', 'max_file_size_mb',
            'max_classes', 'max_students_class', 'max_advisor_month', 'max_advisor_chars',
            'is_active'
        ];

        for (const field of allowedFields) {
            if (data[field] !== undefined) {
                fields.push(`${field} = $${idx++}`);
                values.push(data[field]);
            }
        }

        if (fields.length === 0) return null;

        values.push(id);
        const query = `
            UPDATE plans 
            SET ${fields.join(', ')}, updated_at = NOW()
            WHERE id = $${idx}
            RETURNING *
        `;

        const result = await db.query(query, values);
        return result.rows[0];
    }
}

module.exports = Plan;