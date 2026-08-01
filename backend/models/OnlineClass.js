// models/OnlineClass.js
const db = require('../config/db');

class OnlineClass {
    // ایجاد جلسه کلاس آنلاین
    static async create(data) {
        const { class_id, teacher_id, title, description, meet_link, scheduled_at, duration } = data;
        
        const query = `
            INSERT INTO online_classes (class_id, teacher_id, title, description, meet_link, scheduled_at, duration, status)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *
        `;
        const values = [class_id, teacher_id, title, description, meet_link, scheduled_at, duration, 'scheduled'];
        
        const result = await db.query(query, values);
        return result.rows[0];
    }

    // دریافت جلسات کلاس
    static async getByClassId(classId, teacherId = null) {
        let query = `
            SELECT oc.*, u.name as teacher_name,
                   (SELECT COUNT(*) FROM online_class_attendees WHERE online_class_id = oc.id) as attendee_count
            FROM online_classes oc
            JOIN users u ON oc.teacher_id = u.id
            WHERE oc.class_id = $1
        `;
        const params = [classId];
        
        if (teacherId) {
            query += ` AND oc.teacher_id = $2`;
            params.push(teacherId);
        }
        
        query += ` ORDER BY oc.scheduled_at DESC`;
        
        const result = await db.query(query, params);
        return result.rows;
    }

    // دریافت جلسات فعال برای دانش‌آموز
    static async getStudentOnlineClasses(studentId) {
        const query = `
            SELECT oc.*, c.name as class_name, c.class_code,
                   u.name as teacher_name,
                   (SELECT COUNT(*) FROM online_class_attendees WHERE online_class_id = oc.id) as attendee_count,
                   CASE WHEN oca.id IS NOT NULL THEN true ELSE false END as has_joined
            FROM online_classes oc
            JOIN classes c ON oc.class_id = c.id
            JOIN class_members cm ON c.id = cm.class_id
            JOIN users u ON oc.teacher_id = u.id
            LEFT JOIN online_class_attendees oca ON oc.id = oca.online_class_id AND oca.student_id = $1
            WHERE cm.user_id = $1 AND cm.status = 'active'
              AND oc.status = 'scheduled'
              AND oc.scheduled_at > NOW() - INTERVAL '1 day'
            ORDER BY oc.scheduled_at ASC
        `;
        const result = await db.query(query, [studentId]);
        return result.rows;
    }

    // ثبت حضور دانش‌آموز در کلاس آنلاین
    static async markAttendance(onlineClassId, studentId, joinTime, leaveTime = null) {
        // بررسی حضور قبلی
        const existing = await db.query(
            'SELECT * FROM online_class_attendees WHERE online_class_id = $1 AND student_id = $2',
            [onlineClassId, studentId]
        );
        
        if (existing.rows.length > 0) {
            const query = `
                UPDATE online_class_attendees 
                SET leave_time = COALESCE($1, leave_time),
                    duration = EXTRACT(EPOCH FROM (COALESCE($1, NOW()) - join_time))::integer
                WHERE online_class_id = $2 AND student_id = $3
                RETURNING *
            `;
            const result = await db.query(query, [leaveTime, onlineClassId, studentId]);
            return result.rows[0];
        } else {
            const query = `
                INSERT INTO online_class_attendees (online_class_id, student_id, join_time)
                VALUES ($1, $2, $3)
                RETURNING *
            `;
            const result = await db.query(query, [onlineClassId, studentId, joinTime]);
            return result.rows[0];
        }
    }

    // دریافت آمار جلسه
    static async getSessionStats(onlineClassId, teacherId) {
        const query = `
            SELECT 
                oc.*,
                COUNT(DISTINCT oca.student_id) as total_attendees,
                json_agg(json_build_object(
                    'student_id', u.id,
                    'student_name', u.name,
                    'student_email', u.email,
                    'join_time', oca.join_time,
                    'leave_time', oca.leave_time,
                    'duration', oca.duration
                )) as attendees
            FROM online_classes oc
            LEFT JOIN online_class_attendees oca ON oc.id = oca.online_class_id
            LEFT JOIN users u ON oca.student_id = u.id
            WHERE oc.id = $1 AND oc.teacher_id = $2
            GROUP BY oc.id
        `;
        const result = await db.query(query, [onlineClassId, teacherId]);
        return result.rows[0];
    }

    // پایان جلسه
    static async endSession(onlineClassId, teacherId) {
        const query = `
            UPDATE online_classes 
            SET status = 'completed', ended_at = NOW()
            WHERE id = $1 AND teacher_id = $2
            RETURNING *
        `;
        const result = await db.query(query, [onlineClassId, teacherId]);
        return result.rows[0];
    }
}

module.exports = OnlineClass;