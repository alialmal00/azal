const db = require('../config/db');
const crypto = require('crypto');

class Class {
    static generateClassCode() {
        return crypto.randomBytes(4).toString('hex').toUpperCase();
    }

    static async create(data) {
        const { organization_id, teacher_id, name, description, subject, grade_level } = data;
        const class_code = this.generateClassCode();
        const query = `
            INSERT INTO classes (organization_id, teacher_id, name, description, subject, grade_level, class_code)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
        `;
        const values = [organization_id, teacher_id, name, description, subject, grade_level, class_code];
        const result = await db.query(query, values);
        return result.rows[0];
    }

    static async findById(id) {
        const query = `
            SELECT c.*, u.name as teacher_name, u.email as teacher_email,
                   o.name as organization_name
            FROM classes c
            JOIN users u ON c.teacher_id = u.id
            LEFT JOIN organizations o ON c.organization_id = o.id
            WHERE c.id = $1
        `;
        const result = await db.query(query, [id]);
        return result.rows[0];
    }

    static async findByTeacherId(teacherId) {
        const query = `
            SELECT c.*, 
                   (SELECT COUNT(*) FROM class_members WHERE class_id = c.id AND status = 'active') as member_count
            FROM classes c
            WHERE c.teacher_id = $1 AND c.status = 'active'
            ORDER BY c.created_at DESC
        `;
        const result = await db.query(query, [teacherId]);
        return result.rows;
    }

    static async findByStudentId(studentId) {
        const query = `
            SELECT c.*, u.name as teacher_name, u.email as teacher_email,
                   (SELECT COUNT(*) FROM class_members WHERE class_id = c.id AND status = 'active') as member_count,
                   cm.joined_at as joined_date
            FROM classes c
            JOIN class_members cm ON c.id = cm.class_id
            JOIN users u ON c.teacher_id = u.id
            WHERE cm.user_id = $1 AND cm.status = 'active' AND c.status = 'active'
            ORDER BY c.created_at DESC
        `;
        const result = await db.query(query, [studentId]);
        return result.rows;
    }

    static async addMember(classId, userId, role = 'student') {
        const query = `
            INSERT INTO class_members (class_id, user_id, role)
            VALUES ($1, $2, $3)
            ON CONFLICT (class_id, user_id) DO UPDATE SET status = 'active', role = $3
            RETURNING *
        `;
        const result = await db.query(query, [classId, userId, role]);
        return result.rows[0];
    }

    static async removeMember(classId, userId) {
        const query = `
            UPDATE class_members 
            SET status = 'removed', left_at = CURRENT_TIMESTAMP
            WHERE class_id = $1 AND user_id = $2
            RETURNING *
        `;
        const result = await db.query(query, [classId, userId]);
        return result.rows[0];
    }

    static async getMembers(classId) {
        const query = `
            SELECT cm.*, u.name, u.email, u.avatar_url
            FROM class_members cm
            JOIN users u ON cm.user_id = u.id
            WHERE cm.class_id = $1 AND cm.status = 'active'
            ORDER BY cm.joined_at ASC
        `;
        const result = await db.query(query, [classId]);
        return result.rows;
    }

    static async getClassExams(classId) {
        const query = `
            SELECT se.*, 
                   (SELECT COUNT(*) FROM class_exam_submissions WHERE exam_id = se.id) as submission_count
            FROM saved_exams se
            WHERE se.class_id = $1
            ORDER BY se.created_at DESC
        `;
        const result = await db.query(query, [classId]);
        return result.rows;
    }
}

module.exports = Class;