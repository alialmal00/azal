// controllers/examController.js
const db = require('../config/db');
const SavedExam = require('../models/SavedExam');
const { incrementQuestionUsage } = require('../middleware/checkLimits');

// ============================================
// 🚀 شروع آزمون
// ============================================
const startExam = async (req, res) => {
    try {
        const userId = req.user.id;
        const { examData, config } = req.body;

        console.log('🚀 Starting exam for user:', userId);

        if (!examData || !examData.questions || examData.questions.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'داده‌های آزمون ناقص است'
            });
        }

        const numQuestions = examData.questions.length;
        await incrementQuestionUsage(userId, numQuestions);
        
        const savedExam = await SavedExam.createInProgress(userId, examData, config);
        console.log('✅ Exam saved with ID:', savedExam.id);

        res.status(201).json({
            success: true,
            message: 'آزمون با موفقیت شروع شد',
            data: {
                examId: savedExam.id,
                status: 'in_progress'
            }
        });

    } catch (error) {
        console.error('Start exam error:', error);
        res.status(500).json({
            success: false,
            message: 'خطا در شروع آزمون: ' + error.message
        });
    }
};

// ============================================
// 📝 تکمیل آزمون
// ============================================
const completeExam = async (req, res) => {
    try {
        const userId = req.user.id;
        const examId = req.params.id;
        const { userAnswers, timeSpent, results } = req.body;

        console.log('📝 Completing exam ' + examId + ' for user ' + userId);

        const examCheck = await db.query(
            'SELECT id, status FROM saved_exams WHERE id = $1 AND user_id = $2',
            [examId, userId]
        );

        if (examCheck.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'آزمون یافت نشد'
            });
        }

        const examData = await SavedExam.findById(examId, userId);
        
        if (!examData || !examData.exam_data) {
            return res.status(404).json({
                success: false,
                message: 'داده‌های آزمون یافت نشد'
            });
        }

        let score = 0;
        let totalPoints = 0;
        let correctCount = 0;
        let wrongCount = 0;

        if (examData.exam_data.questions) {
            for (let i = 0; i < examData.exam_data.questions.length; i++) {
                const question = examData.exam_data.questions[i];
                totalPoints += question.points || 1;
                const userAnswer = userAnswers[question.q_id];
                let isCorrect = false;

                switch (question.type) {
                    case 'mcq':
                    case 'tf':
                        let correctOption = null;
                        if (question.options) {
                            for (let j = 0; j < question.options.length; j++) {
                                if (question.options[j].is_correct) {
                                    correctOption = question.options[j];
                                    break;
                                }
                            }
                        }
                        isCorrect = correctOption && correctOption.id === userAnswer;
                        break;
                    case 'fitb':
                    case 'short':
                        isCorrect = typeof userAnswer === 'string' &&
                            userAnswer.trim().toLowerCase() === (question.correct_answer || '').trim().toLowerCase();
                        break;
                    default:
                        isCorrect = false;
                }

                if (isCorrect) {
                    score += question.points || 1;
                    correctCount++;
                } else {
                    wrongCount++;
                }
            }
        }

        const scorePercentage = totalPoints > 0 ? Math.round((score / totalPoints) * 100) : 0;

        const completedExam = await SavedExam.completeExam(
            examId,
            userId,
            userAnswers,
            {
                score: score,
                totalPoints: totalPoints,
                scorePercentage: scorePercentage,
                correctAnswersCount: correctCount,
                wrongAnswersCount: wrongCount,
                timeSpent: timeSpent || 0,
                totalQuestions: examData.exam_data.questions ? examData.exam_data.questions.length : 0
            }
        );

        if (!completedExam) {
            return res.status(404).json({
                success: false,
                message: 'خطا در تکمیل آزمون'
            });
        }

        res.json({
            success: true,
            message: 'آزمون با موفقیت تکمیل شد',
            data: {
                examId: completedExam.id,
                score: score,
                totalPoints: totalPoints,
                scorePercentage: scorePercentage,
                correctCount: correctCount,
                wrongCount: wrongCount
            }
        });

    } catch (error) {
        console.error('Complete exam error:', error);
        res.status(500).json({
            success: false,
            message: 'خطا در تکمیل آزمون: ' + error.message
        });
    }
};

// ============================================
// 💾 ذخیره آزمون
// ============================================
const saveExam = async (req, res) => {
    try {
        const userId = req.user.id;
        const { examData, userAnswers, config, results } = req.body;

        if (!examData || !userAnswers || !config || !results) {
            return res.status(400).json({
                success: false,
                message: 'اطلاعات ناقص است'
            });
        }

        const savedExam = await SavedExam.create(userId, examData, userAnswers, config, results);

        res.status(201).json({
            success: true,
            message: 'آزمون با موفقیت ذخیره شد',
            data: { examId: savedExam.id }
        });

    } catch (error) {
        console.error('Save exam error:', error);
        res.status(500).json({
            success: false,
            message: 'خطا در ذخیره آزمون: ' + error.message
        });
    }
};

// ============================================
// 📋 لیست آزمون‌ها
// ============================================
const getUserExams = async (req, res) => {
    try {
        const userId = req.user.id;
        const { status, exam_type, is_favorite, limit } = req.query;

        const filters = {};
        if (status) filters.status = status;
        if (exam_type) filters.exam_type = exam_type;
        if (is_favorite !== undefined) filters.is_favorite = is_favorite === 'true';
        if (limit) filters.limit = parseInt(limit);

        const exams = await SavedExam.findByUserId(userId, filters);

        res.json({
            success: true,
            data: { exams: exams }
        });

    } catch (error) {
        console.error('Get exams error:', error);
        res.status(500).json({
            success: false,
            message: 'خطا در دریافت آزمون‌ها'
        });
    }
};

// ============================================
// 📄 دریافت یک آزمون
// ============================================
const getExamById = async (req, res) => {
    try {
        const userId = req.user.id;
        const examId = req.params.id;

        const exam = await SavedExam.findById(examId, userId);

        if (!exam) {
            return res.status(404).json({
                success: false,
                message: 'آزمون یافت نشد'
            });
        }

        if (exam.exam_data && typeof exam.exam_data === 'string') {
            try {
                exam.exam_data = JSON.parse(exam.exam_data);
            } catch (e) {
                console.error('Error parsing exam_data:', e);
            }
        }
        if (exam.user_answers && typeof exam.user_answers === 'string') {
            try {
                exam.user_answers = JSON.parse(exam.user_answers);
            } catch (e) {
                console.error('Error parsing user_answers:', e);
            }
        }
        if (exam.config && typeof exam.config === 'string') {
            try {
                exam.config = JSON.parse(exam.config);
            } catch (e) {
                console.error('Error parsing config:', e);
            }
        }

        res.json({
            success: true,
            data: { exam: exam }
        });

    } catch (error) {
        console.error('Get exam error:', error);
        res.status(500).json({
            success: false,
            message: 'خطا در دریافت آزمون'
        });
    }
};

// ============================================
// 🔄 به‌روزرسانی
// ============================================
const updateExam = async (req, res) => {
    try {
        const userId = req.user.id;
        const examId = req.params.id;
        const updates = req.body;

        const updated = await SavedExam.update(examId, userId, updates);

        if (!updated) {
            return res.status(404).json({
                success: false,
                message: 'آزمون یافت نشد'
            });
        }

        res.json({
            success: true,
            message: 'آزمون با موفقیت به‌روزرسانی شد'
        });

    } catch (error) {
        console.error('Update exam error:', error);
        res.status(500).json({
            success: false,
            message: 'خطا در به‌روزرسانی آزمون'
        });
    }
};

// ============================================
// 🗑️ حذف
// ============================================
const deleteExam = async (req, res) => {
    try {
        const userId = req.user.id;
        const examId = req.params.id;

        const deleted = await SavedExam.delete(examId, userId);

        if (!deleted) {
            return res.status(404).json({
                success: false,
                message: 'آزمون یافت نشد'
            });
        }

        res.json({
            success: true,
            message: 'آزمون با موفقیت حذف شد'
        });

    } catch (error) {
        console.error('Delete exam error:', error);
        res.status(500).json({
            success: false,
            message: 'خطا در حذف آزمون'
        });
    }
};

// ============================================
// 📊 آمار کاربر
// ============================================
const getUserStats = async (req, res) => {
    try {
        const userId = req.user.id;

        const statsQuery = `
            SELECT 
                COUNT(*) as total_exams,
                COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_exams,
                COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress_exams,
                COALESCE(ROUND(AVG(CASE WHEN status = 'completed' THEN score_percentage END)), 0) as avg_score,
                COALESCE(SUM(CASE WHEN status = 'completed' THEN correct_count ELSE 0 END), 0) as total_correct,
                COALESCE(SUM(CASE WHEN status = 'completed' THEN wrong_count ELSE 0 END), 0) as total_wrong,
                COALESCE(SUM(CASE WHEN status = 'completed' THEN correct_count + wrong_count ELSE 0 END), 0) as total_questions,
                COALESCE(ROUND(AVG(CASE WHEN status = 'completed' THEN time_spent END) / 60), 0) as avg_time_minutes,
                COALESCE(MAX(CASE WHEN status = 'completed' THEN score_percentage END), 0) as best_score,
                COALESCE(MIN(CASE WHEN status = 'completed' THEN score_percentage END), 0) as worst_score
            FROM saved_exams
            WHERE user_id = $1
        `;

        const statsResult = await db.query(statsQuery, [userId]);

        const recentQuery = `
            SELECT 
                id,
                exam_title as title,
                score_percentage as score,
                created_at as date,
                time_spent,
                score,
                total_points,
                status
            FROM saved_exams
            WHERE user_id = $1
            ORDER BY created_at DESC
            LIMIT 10
        `;

        const recentResult = await db.query(recentQuery, [userId]);

        const stats = statsResult.rows[0] || {
            total_exams: 0,
            completed_exams: 0,
            in_progress_exams: 0,
            avg_score: 0,
            total_correct: 0,
            total_wrong: 0,
            total_questions: 0,
            avg_time_minutes: 0,
            best_score: 0,
            worst_score: 0
        };

        res.json({
            success: true,
            data: {
                stats: stats,
                recentExams: recentResult.rows
            }
        });

    } catch (error) {
        console.error('Get stats error:', error);
        res.json({
            success: true,
            data: {
                stats: {
                    total_exams: 0,
                    completed_exams: 0,
                    in_progress_exams: 0,
                    avg_score: 0,
                    total_correct: 0,
                    total_wrong: 0,
                    total_questions: 0,
                    avg_time_minutes: 0,
                    best_score: 0,
                    worst_score: 0
                },
                recentExams: []
            }
        });
    }
};

// ============================================
// 📤 صادر کردن توابع
// ============================================
module.exports = {
    startExam,
    completeExam,
    saveExam,
    getUserExams,
    getExamById,
    updateExam,
    deleteExam,
    getUserStats
};