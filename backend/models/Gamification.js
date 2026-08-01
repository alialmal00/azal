// models/Gamification.js
const db = require('../config/db');

class Gamification {
    // افزودن امتیاز به کاربر
    static async addPoints(userId, points, reason, referenceId = null, referenceType = null) {
        // به‌روزرسانی امتیاز کلی
        await db.query(`
            INSERT INTO user_points (user_id, total_points, experience)
            VALUES ($1, $2, $2)
            ON CONFLICT (user_id) 
            DO UPDATE SET 
                total_points = user_points.total_points + $2,
                experience = user_points.experience + $2,
                updated_at = NOW()
        `, [userId, points]);

        // ثبت تراکنش
        await db.query(`
            INSERT INTO point_transactions (user_id, points, reason, reference_id, reference_type)
            VALUES ($1, $2, $3, $4, $5)
        `, [userId, points, reason, referenceId, referenceType]);

        // بررسی ارتقای سطح
        await this.checkLevelUp(userId);
        
        // بررسی نشان‌های جدید
        await this.checkBadges(userId);
    }

    // بررسی ارتقای سطح
    static async checkLevelUp(userId) {
        const userPoints = await db.query(
            'SELECT total_points, level FROM user_points WHERE user_id = $1',
            [userId]
        );
        if (!userPoints.rows[0]) return;
        
        const { total_points, level } = userPoints.rows[0];
        const newLevel = Math.floor(total_points / 100) + 1;
        
        if (newLevel > level) {
            await db.query(
                'UPDATE user_points SET level = $1 WHERE user_id = $2',
                [newLevel, userId]
            );
            // اینجا می‌توانید یک اعلان برای کاربر ایجاد کنید
            await this.createNotification(userId, `🎉 تبریک! شما به سطح ${newLevel} رسیدید.`);
        }
    }

    // بررسی و اعطای نشان‌ها
    static async checkBadges(userId) {
        const badges = await db.query('SELECT * FROM badges');
        
        for (const badge of badges.rows) {
            // بررسی اینکه کاربر قبلاً این نشان را گرفته
            const existing = await db.query(
                'SELECT id FROM user_badges WHERE user_id = $1 AND badge_id = $2',
                [userId, badge.id]
            );
            if (existing.rows.length > 0) continue;
            
            let earned = false;
            
            switch (badge.requirement_type) {
                case 'exam_count':
                    const examCount = await db.query(
                        'SELECT COUNT(*) FROM saved_exams WHERE user_id = $1 AND status = $2',
                        [userId, 'completed']
                    );
                    earned = parseInt(examCount.rows[0].count) >= badge.requirement_value;
                    break;
                    
                case 'high_score':
                    const highScoreExams = await db.query(`
                        SELECT COUNT(*) FROM saved_exams 
                        WHERE user_id = $1 AND score_percentage >= 90 AND status = 'completed'
                        ${badge.subject_filter ? ` AND exam_type = '${badge.subject_filter}'` : ''}
                    `, [userId]);
                    earned = parseInt(highScoreExams.rows[0].count) >= badge.requirement_value;
                    break;
                    
                case 'class_count':
                    const classCount = await db.query(`
                        SELECT COUNT(*) FROM classes 
                        WHERE teacher_id = $1 AND status = 'active'
                    `, [userId]);
                    earned = parseInt(classCount.rows[0].count) >= badge.requirement_value;
                    break;
                    
                case 'perfect_score':
                    const perfect = await db.query(
                        'SELECT COUNT(*) FROM saved_exams WHERE user_id = $1 AND score_percentage = 100',
                        [userId]
                    );
                    earned = parseInt(perfect.rows[0].count) >= 1;
                    break;
                    
                case 'online_attendance':
                    const attendance = await db.query(
                        'SELECT COUNT(*) FROM online_class_attendees WHERE student_id = $1',
                        [userId]
                    );
                    earned = parseInt(attendance.rows[0].count) >= badge.requirement_value;
                    break;
                    
                case 'ticket_count':
                    const tickets = await db.query(
                        'SELECT COUNT(*) FROM tickets WHERE user_id = $1 AND status = $2',
                        [userId, 'answered']
                    );
                    earned = parseInt(tickets.rows[0].count) >= badge.requirement_value;
                    break;
            }
            
            if (earned) {
                await db.query(
                    'INSERT INTO user_badges (user_id, badge_id) VALUES ($1, $2)',
                    [userId, badge.id]
                );
                await this.createNotification(userId, `🏅 نشان جدید! شما نشان "${badge.title}" را دریافت کردید.`);
            }
        }
    }

    // دریافت امتیازات کاربر
    static async getUserPoints(userId) {
        const result = await db.query(`
            SELECT up.*, 
                   (SELECT json_agg(json_build_object('id', b.id, 'name', b.name, 'title', b.title, 'icon', b.icon, 'earned_at', ub.earned_at))
                    FROM user_badges ub
                    JOIN badges b ON ub.badge_id = b.id
                    WHERE ub.user_id = up.user_id) as badges
            FROM user_points up
            WHERE up.user_id = $1
        `, [userId]);
        return result.rows[0] || { total_points: 0, level: 1, experience: 0, badges: [] };
    }

    // دریافت لیدربورد (جدول رتبه‌بندی)
    static async getLeaderboard(limit = 10) {
        const result = await db.query(`
            SELECT u.id, u.name, u.role, up.total_points, up.level
            FROM user_points up
            JOIN users u ON up.user_id = u.id
            ORDER BY up.total_points DESC
            LIMIT $1
        `, [limit]);
        return result.rows;
    }
    
    static async createNotification(userId, message) {
        // این تابع بعداً در مرحله اعلان‌ها کامل می‌شود
        // فعلاً فقط در کنسول لاگ می‌کنیم
        console.log(`🔔 Notification for user ${userId}: ${message}`);
    }
}

module.exports = Gamification;