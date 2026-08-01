// backend/models/OnlineClass.js
const db = require('../config/db');
const bbbService = require('../services/bbbService');

class OnlineClass {
    // ایجاد جلسه کلاس آنلاین (با BigBlueButton)
    static async create(data) {
        const { class_id, teacher_id, title, description, scheduled_at, duration, record = true } = data;
        
        // تولید ID یکتا برای جلسه BBB
        const meetingId = `class_${class_id}_${Date.now()}`;
        
        // ایجاد جلسه در BigBlueButton
        const bbbResult = await bbbService.createMeeting(meetingId, title, {
            duration: duration || 60,
            record: record,
            welcome: `به جلسه "${title}" خوش آمدید!`,
            maxParticipants: 100,
            moderatorPW: `mod_${Math.random().toString(36).substring(2, 10)}`,
            attendeePW: `att_${Math.random().toString(36).substring(2, 10)}`
        });
        
        if (!bbbResult.success) {
            throw new Error(`BigBlueButton error: ${bbbResult.message}`);
        }
        
        const query = `
            INSERT INTO online_classes (
                class_id, teacher_id, title, description, scheduled_at, duration,
                bbb_meeting_id, bbb_attendee_url, bbb_moderator_url, status, record
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING *
        `;
        
        const values = [
            class_id, teacher_id, title, description || '', scheduled_at, duration || 60,
            bbbResult.meetingId, bbbResult.attendeeUrl, bbbResult.moderatorUrl,
            'scheduled', record !== false
        ];
        
        const result = await db.query(query, values);
        const onlineClass = result.rows[0];
        
        // ذخیره moderatorPW در یک جدول جداگانه برای امنیت بیشتر
        await db.query(`
            INSERT INTO online_class_secrets (online_class_id, moderator_pw, attendee_pw)
            VALUES ($1, $2, $3)
        `, [onlineClass.id, bbbResult.moderatorPW, bbbResult.attendeePW]);
        
        return onlineClass;
    }

    // دریافت جلسات کلاس
    static async getByClassId(classId, teacherId = null) {
        let query = `
            SELECT oc.*, u.name as teacher_name,
                   (SELECT COUNT(*) FROM online_class_attendees WHERE online_class_id = oc.id) as attendee_count,
                   (SELECT bbb_meeting_id FROM online_class_secrets WHERE online_class_id = oc.id LIMIT 1) as secret_meeting_id
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

    // دریافت یک جلسه با جزئیات کامل
    static async getById(onlineClassId, userId = null, isTeacher = false) {
        let query = `
            SELECT oc.*, u.name as teacher_name, c.name as class_name,
                   (SELECT COUNT(*) FROM online_class_attendees WHERE online_class_id = oc.id) as attendee_count,
                   (SELECT moderator_pw FROM online_class_secrets WHERE online_class_id = oc.id LIMIT 1) as moderator_pw,
                   (SELECT attendee_pw FROM online_class_secrets WHERE online_class_id = oc.id LIMIT 1) as attendee_pw
            FROM online_classes oc
            JOIN users u ON oc.teacher_id = u.id
            JOIN classes c ON oc.class_id = c.id
            WHERE oc.id = $1
        `;
        const params = [onlineClassId];
        
        if (userId && !isTeacher) {
            // بررسی دسترسی دانش‌آموز
            query += ` AND EXISTS (
                SELECT 1 FROM class_members cm 
                WHERE cm.class_id = oc.class_id AND cm.user_id = $2 AND cm.status = 'active'
            )`;
            params.push(userId);
        } else if (userId && isTeacher) {
            query += ` AND oc.teacher_id = $2`;
            params.push(userId);
        }
        
        const result = await db.query(query, params);
        if (result.rows.length === 0) return null;
        
        const onlineClass = result.rows[0];
        
        // دریافت وضعیت جلسه از BBB
        if (onlineClass.bbb_meeting_id) {
            const runningStatus = await bbbService.isMeetingRunning(onlineClass.bbb_meeting_id);
            onlineClass.bbb_is_running = runningStatus.success && runningStatus.isRunning;
            
            if (onlineClass.bbb_is_running) {
                const meetingInfo = await bbbService.getMeetingInfo(
                    onlineClass.bbb_meeting_id,
                    onlineClass.moderator_pw
                );
                if (meetingInfo.success) {
                    onlineClass.bbb_participant_count = meetingInfo.participantCount;
                    onlineClass.bbb_attendees = meetingInfo.attendees;
                }
            }
        }
        
        return onlineClass;
    }

    // شروع جلسه (فقط معلم)
    static async startSession(onlineClassId, teacherId) {
        const onlineClass = await this.getById(onlineClassId, teacherId, true);
        if (!onlineClass) {
            throw new Error('جلسه یافت نشد یا دسترسی ندارید');
        }
        
        if (onlineClass.status !== 'scheduled') {
            throw new Error('جلسه در وضعیت مناسبی برای شروع نیست');
        }
        
        await db.query(`
            UPDATE online_classes 
            SET status = 'active', started_at = NOW()
            WHERE id = $1 AND teacher_id = $2
        `, [onlineClassId, teacherId]);
        
        return onlineClass;
    }

    // پایان جلسه (فقط معلم)
    static async endSession(onlineClassId, teacherId) {
        const onlineClass = await this.getById(onlineClassId, teacherId, true);
        if (!onlineClass) {
            throw new Error('جلسه یافت نشد یا دسترسی ندارید');
        }
        
        // پایان جلسه در BBB
        if (onlineClass.bbb_meeting_id && onlineClass.moderator_pw) {
            await bbbService.endMeeting(onlineClass.bbb_meeting_id, onlineClass.moderator_pw);
        }
        
        const query = `
            UPDATE online_classes 
            SET status = 'completed', ended_at = NOW()
            WHERE id = $1 AND teacher_id = $2
            RETURNING *
        `;
        const result = await db.query(query, [onlineClassId, teacherId]);
        
        return result.rows[0];
    }

    // ثبت حضور دانش‌آموز در کلاس آنلاین
    static async markAttendance(onlineClassId, studentId, joinTime) {
        const existing = await db.query(
            'SELECT * FROM online_class_attendees WHERE online_class_id = $1 AND student_id = $2',
            [onlineClassId, studentId]
        );
        
        if (existing.rows.length > 0) {
            return existing.rows[0];
        }
        
        const query = `
            INSERT INTO online_class_attendees (online_class_id, student_id, join_time)
            VALUES ($1, $2, $3)
            RETURNING *
        `;
        const result = await db.query(query, [onlineClassId, studentId, joinTime]);
        return result.rows[0];
    }

    // ثبت خروج دانش‌آموز
    static async markLeave(onlineClassId, studentId) {
        const query = `
            UPDATE online_class_attendees 
            SET leave_time = NOW(), 
                duration = EXTRACT(EPOCH FROM (NOW() - join_time))::integer
            WHERE online_class_id = $1 AND student_id = $2 AND leave_time IS NULL
            RETURNING *
        `;
        const result = await db.query(query, [onlineClassId, studentId]);
        return result.rows[0];
    }

    // دریافت آمار جلسه
    static async getSessionStats(onlineClassId, teacherId) {
        const query = `
            SELECT 
                oc.*,
                COUNT(DISTINCT oca.student_id) as total_attendees,
                COALESCE(AVG(oca.duration), 0) as avg_duration,
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
        
        if (result.rows.length === 0) return null;
        
        const stats = result.rows[0];
        
        // دریافت ضبط‌های جلسه از BBB
        if (stats.bbb_meeting_id) {
            const recordings = await bbbService.getRecordings(stats.bbb_meeting_id);
            if (recordings.success) {
                stats.recordings = recordings.recordings;
            }
        }
        
        return stats;
    }

    // حذف جلسه (فقط معلم)
    static async delete(onlineClassId, teacherId) {
        const onlineClass = await this.getById(onlineClassId, teacherId, true);
        if (!onlineClass) {
            throw new Error('جلسه یافت نشد یا دسترسی ندارید');
        }
        
        if (onlineClass.status === 'active') {
            // اگر جلسه فعال است، اول پایان بده
            await this.endSession(onlineClassId, teacherId);
        }
        
        // حذف از دیتابیس
        await db.query('DELETE FROM online_class_secrets WHERE online_class_id = $1', [onlineClassId]);
        await db.query('DELETE FROM online_class_attendees WHERE online_class_id = $1', [onlineClassId]);
        const result = await db.query('DELETE FROM online_classes WHERE id = $1 AND teacher_id = $2 RETURNING id', [onlineClassId, teacherId]);
        
        return result.rows[0];
    }

    // دریافت لینک ورود برای کاربر
    static async getJoinLink(onlineClassId, userId, isTeacher = false) {
        const onlineClass = await this.getById(onlineClassId, userId, isTeacher);
        if (!onlineClass) {
            throw new Error('جلسه یافت نشد یا دسترسی ندارید');
        }
        
        // دریافت اطلاعات کاربر
        const userResult = await db.query('SELECT name FROM users WHERE id = $1', [userId]);
        const userName = userResult.rows[0]?.name || 'کاربر';
        
        // ساخت لینک ورود
        const bbbUrl = bbbService.getJoinUrl(
            onlineClass.bbb_meeting_id,
            userName,
            isTeacher ? onlineClass.moderator_pw : onlineClass.attendee_pw
        );
        
        // ثبت حضور
        if (!isTeacher) {
            await this.markAttendance(onlineClassId, userId, new Date());
        }
        
        return bbbUrl;
    }
}

module.exports = OnlineClass;