// backend/models/SavedExam.js
const db = require('../config/db');

class SavedExam {
    // ✅ ذخیره آزمون در زمان شروع (با وضعیت in_progress)
    static async createInProgress(userId, examData, config) {
        try {
            console.log('📝 Creating in-progress exam for user:', userId);
            
            const query = `
                INSERT INTO saved_exams (
                    user_id, exam_data, config, 
                    exam_title, exam_type, difficulty, status, 
                    created_at
                ) VALUES ($1, $2, $3, $4, $5, $6, 'in_progress', NOW())
                RETURNING id, created_at
            `;
            
            const values = [
                userId,
                JSON.stringify(examData),
                JSON.stringify(config),
                examData.title || 'آزمون جدید',
                config.exam_type || 'ترکیبی',
                config.difficulty || 'متوسط'
            ];
            
            const result = await db.query(query, values);
            console.log('✅ In-progress exam created with ID:', result.rows[0].id);
            return result.rows[0];
            
        } catch (error) {
            console.error('Error creating in-progress exam:', error);
            throw error;
        }
    }

    // ✅ تکمیل آزمون (به‌روزرسانی وضعیت به completed)
    static async completeExam(examId, userId, userAnswers, results) {
        try {
            const query = `
                UPDATE saved_exams 
                SET 
                    user_answers = $1,
                    score = $2,
                    total_points = $3,
                    score_percentage = $4,
                    correct_count = $5,
                    wrong_count = $6,
                    time_spent = $7,
                    status = 'completed',
                    completed_at = NOW()
                WHERE id = $8 AND user_id = $9
                RETURNING *
            `;
            
            const wrongCount = results.wrongAnswersCount || 
                              (results.totalQuestions - results.correctAnswersCount);
            
            const values = [
                JSON.stringify(userAnswers),
                results.score || 0,
                results.totalPoints || 0,
                results.scorePercentage || 0,
                results.correctAnswersCount || 0,
                wrongCount,
                results.timeSpent || 0,
                examId,
                userId
            ];
            
            const result = await db.query(query, values);
            return result.rows[0];
            
        } catch (error) {
            console.error('Error completing exam:', error);
            throw error;
        }
    }

    // ✅ ذخیره آزمون کامل (برای آزمون‌هایی که از قبل کامل شدن)
    static async create(userId, examData, userAnswers, config, results) {
        try {
            console.log('Creating saved exam for user:', userId);

            const wrongCount = results.wrongAnswersCount || 
                              (examData.questions ? examData.questions.length - results.correctAnswersCount : 0);
            
            const examTitle = results.examTitle || examData.title || 'آزمون بدون عنوان';
            const examType = config.exam_type || 'ترکیبی';
            const difficulty = config.difficulty || 'متوسط';
            
            // بررسی وجود ستون time_spent
            const checkColumnQuery = `
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name='saved_exams' AND column_name='time_spent'
            `;
            const columnCheck = await db.query(checkColumnQuery);
            const hasTimeSpent = columnCheck.rows.length > 0;
            
            let query;
            let values;
            
            if (hasTimeSpent) {
                query = `
                    INSERT INTO saved_exams (
                        user_id, exam_data, user_answers, config, 
                        score, total_points, score_percentage, 
                        correct_count, wrong_count, exam_title,
                        exam_type, difficulty, status, completed_at, time_spent
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'completed', $13, $14)
                    RETURNING id, created_at
                `;
                
                values = [
                    userId,
                    JSON.stringify(examData),
                    JSON.stringify(userAnswers),
                    JSON.stringify(config),
                    results.score || 0,
                    results.totalPoints || 0,
                    results.scorePercentage || 0,
                    results.correctAnswersCount || 0,
                    wrongCount,
                    examTitle,
                    examType,
                    difficulty,
                    new Date(),
                    results.timeSpent || 0
                ];
            } else {
                query = `
                    INSERT INTO saved_exams (
                        user_id, exam_data, user_answers, config, 
                        score, total_points, score_percentage, 
                        correct_count, wrong_count, exam_title,
                        exam_type, difficulty, status, completed_at
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'completed', $13)
                    RETURNING id, created_at
                `;
                
                values = [
                    userId,
                    JSON.stringify(examData),
                    JSON.stringify(userAnswers),
                    JSON.stringify(config),
                    results.score || 0,
                    results.totalPoints || 0,
                    results.scorePercentage || 0,
                    results.correctAnswersCount || 0,
                    wrongCount,
                    examTitle,
                    examType,
                    difficulty,
                    new Date()
                ];
            }
            
            const result = await db.query(query, values);
            return result.rows[0];
            
        } catch (error) {
            console.error('Error in SavedExam.create:', error);
            throw error;
        }
    }

    // ✅ دریافت آزمون‌های کاربر (با وضعیت‌های مختلف)
    static async findByUserId(userId, filters = {}) {
        try {
            let query = `
                SELECT id, exam_title, exam_type, difficulty, score, 
                       total_points, score_percentage, correct_count, 
                       wrong_count, created_at, completed_at, is_favorite,
                       tags, notes, status, time_spent
                FROM saved_exams 
                WHERE user_id = $1
            `;
            
            const queryParams = [userId];
            let paramIndex = 2;
            
            if (filters.status) {
                query += ` AND status = $${paramIndex}`;
                queryParams.push(filters.status);
                paramIndex++;
            }
            
            if (filters.exam_type) {
                query += ` AND exam_type = $${paramIndex}`;
                queryParams.push(filters.exam_type);
                paramIndex++;
            }
            
            if (filters.is_favorite !== undefined) {
                query += ` AND is_favorite = $${paramIndex}`;
                queryParams.push(filters.is_favorite);
                paramIndex++;
            }
            
            // اگر فیلتر status نداشته باشه، همه وضعیت‌ها رو برگردون
            if (!filters.status) {
                query += ` AND status IN ('completed', 'in_progress')`;
            }
            
            query += ` ORDER BY created_at DESC`;
            
            if (filters.limit) {
                query += ` LIMIT $${paramIndex}`;
                queryParams.push(filters.limit);
            }
            
            const result = await db.query(query, queryParams);
            return result.rows;
            
        } catch (error) {
            console.error('Error finding exams:', error);
            throw error;
        }
    }

    // ✅ حذف فیزیکی آزمون
    static async delete(examId, userId) {
        try {
            const query = 'DELETE FROM saved_exams WHERE id = $1 AND user_id = $2 RETURNING id';
            const result = await db.query(query, [examId, userId]);
            return result.rows[0];
            
        } catch (error) {
            console.error('Error deleting exam:', error);
            throw error;
        }
    }

    // ✅ دریافت یک آزمون با جزئیات
    static async findById(id, userId) {
        try {
            const query = `
                SELECT * FROM saved_exams 
                WHERE id = $1 AND user_id = $2
            `;
            
            const result = await db.query(query, [id, userId]);
            
            if (result.rows[0]) {
                try {
                    result.rows[0].exam_data = JSON.parse(result.rows[0].exam_data);
                    result.rows[0].user_answers = JSON.parse(result.rows[0].user_answers);
                    result.rows[0].config = JSON.parse(result.rows[0].config);
                } catch (parseError) {
                    console.error('Error parsing JSON:', parseError);
                }
            }
            return result.rows[0];
            
        } catch (error) {
            console.error('Error finding exam by id:', error);
            throw error;
        }
    }

    // ✅ به‌روزرسانی آزمون
    static async update(id, userId, updates) {
        try {
            const allowedFields = ['is_favorite', 'tags', 'notes', 'status'];
            const updateFields = [];
            const values = [];
            let paramIndex = 1;
            
            Object.keys(updates).forEach(key => {
                if (allowedFields.includes(key)) {
                    updateFields.push(`${key} = $${paramIndex}`);
                    if (key === 'tags' && Array.isArray(updates[key])) {
                        values.push(updates[key]);
                    } else {
                        values.push(updates[key]);
                    }
                    paramIndex++;
                }
            });
            
            if (updateFields.length === 0) return null;
            
            values.push(id, userId);
            const query = `
                UPDATE saved_exams 
                SET ${updateFields.join(', ')} 
                WHERE id = $${paramIndex} AND user_id = $${paramIndex + 1}
                RETURNING id
            `;
            
            const result = await db.query(query, values);
            return result.rows[0];
            
        } catch (error) {
            console.error('Error updating exam:', error);
            throw error;
        }
    }

    // ✅ آمار پیشرفت کاربر
    static async getUserStats(userId) {
        try {
            const query = `
                SELECT 
                    COUNT(*) as total_exams,
                    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_exams,
                    COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress_exams,
                    COALESCE(SUM(correct_count), 0) as total_correct,
                    COALESCE(SUM(wrong_count), 0) as total_wrong,
                    COALESCE(AVG(score_percentage), 0) as avg_score,
                    COALESCE(MAX(score_percentage), 0) as max_score,
                    COALESCE(MIN(score_percentage), 0) as min_score,
                    COALESCE(AVG(time_spent), 0) as avg_time,
                    (
                        SELECT json_agg(
                            json_build_object(
                                'id', id,
                                'title', exam_title,
                                'score', score_percentage,
                                'date', created_at,
                                'time_spent', time_spent,
                                'status', status
                            ) ORDER BY created_at DESC
                        )
                        FROM saved_exams
                        WHERE user_id = $1
                        LIMIT 10
                    ) as recent_exams
                FROM saved_exams
                WHERE user_id = $1
            `;
            
            const result = await db.query(query, [userId]);
            return result.rows[0];
            
        } catch (error) {
            console.error('Error getting user stats:', error);
            throw error;
        }
    }
}

module.exports = SavedExam;