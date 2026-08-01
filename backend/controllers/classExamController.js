// controllers/classExamController.js
const db = require('../config/db');
const Notification = require('../models/Notification');
const subscriptionService = require('../services/subscriptionService');

// ============================================
// 📝 ایجاد آزمون جدید با بررسی محدودیت‌ها
// ============================================
const createExam = async (req, res) => {
    try {
        const { class_id, title, description, exam_data, config } = req.body;
        const teacherId = req.user.id;

        console.log('📝 Creating exam for class:', class_id);
        console.log('👤 Teacher:', teacherId);
        console.log('📊 Exam data:', { title, questionCount: exam_data?.questions?.length });

        // ============================================
        // 🔥 ۱. بررسی محدودیت‌ها از طریق سرویس مرکزی
        // ============================================

        const ent = await subscriptionService.getEntitlements(teacherId, 'teacher');
        if (!ent.plan) {
            return res.status(403).json({
                success: false,
                message: 'هیچ پلنی برای نقش شما تعریف نشده است',
                redirect: '/dashboard/subscription'
            });
        }

        const examFeat = ent.features.exam_generation;
        const qCapFeat = ent.features.exam_questions_per_exam;
        console.log(`📊 Plan: ${ent.plan.name}, exams: ${examFeat?.used}/${examFeat?.limit}, q/exam cap: ${qCapFeat?.limit}`);

        // سقف سوال در هر آزمون
        const numQuestions = exam_data?.questions?.length || 0;
        if (qCapFeat && qCapFeat.is_enabled && qCapFeat.limit !== null && numQuestions > qCapFeat.limit) {
            return res.status(429).json({
                success: false,
                message: `حداکثر ${qCapFeat.limit} سوال در هر آزمون مجاز است.`,
                error: 'QUESTION_LIMIT_EXCEEDED',
                limit: { max: qCapFeat.limit, requested: numQuestions }
            });
        }

        // سقف حجم متن/فایل منبع (اگر در config ارسال شده باشد)
        const sourceText = config?.source_text || '';
        if (sourceText) {
            const sizeMB = Buffer.byteLength(String(sourceText), 'utf8') / (1024 * 1024);
            const fileCheck = await subscriptionService.checkLimit(teacherId, 'file_upload_size', { capValue: sizeMB });
            if (!fileCheck.allowed) {
                return res.status(429).json({
                    success: false,
                    message: `حجم فایل منبع بیش از حد مجاز پلن شما است (حداکثر ${fileCheck.limit} مگابایت).`,
                    error: 'FILE_SIZE_EXCEEDED',
                    limit: { max: fileCheck.limit, requested: sizeMB.toFixed(2) }
                });
            }
        }

        // سقف آزمون ماهانه
        if (examFeat && examFeat.is_enabled && examFeat.limit !== null && examFeat.used >= examFeat.limit) {
            return res.status(429).json({
                success: false,
                message: `سقف ${examFeat.limit} آزمون ماهانه شما کامل شده است.`,
                redirect: '/dashboard/subscription',
                error: 'EXAM_LIMIT_REACHED',
                limit: { used: examFeat.used, max: examFeat.limit }
            });
        }

        // ============================================
        // ✅ ۴. ایجاد آزمون (اگر همه محدودیت‌ها پاس شده باشن)
        // ============================================
        
        // بررسی دسترسی به کلاس
        const classCheck = await db.query(
            'SELECT * FROM classes WHERE id = $1 AND teacher_id = $2 AND status = $3',
            [class_id, teacherId, 'active']
        );

        if (classCheck.rows.length === 0) {
            return res.status(403).json({
                success: false,
                message: 'شما اجازه ایجاد آزمون در این کلاس را ندارید'
            });
        }

        // ذخیره آزمون در دیتابیس
        // ⚠️ source_text فقط برای enforce سقف حجم (بالا) ارسال می‌شود؛
        // قبل از ذخیره حذفش می‌کنیم تا رکورد کلاس با متن منبع سنگین نشود
        const configToStore = config ? { ...config } : null;
        if (configToStore && configToStore.source_text !== undefined) {
            delete configToStore.source_text;
        }
        const examDataString = JSON.stringify(exam_data);
        const configString = configToStore ? JSON.stringify(configToStore) : null;

        const query = `
            INSERT INTO class_exams (class_id, teacher_id, title, description, exam_data, config, status, created_at)
            VALUES ($1, $2, $3, $4, $5::jsonb, $6::jsonb, 'draft', NOW())
            RETURNING *
        `;
        const values = [class_id, teacherId, title, description || '', examDataString, configString];

        const result = await db.query(query, values);
        const exam = result.rows[0];

        console.log(`✅ Exam created successfully: ${exam.id}`);

        // ============================================
        // 🔹 ۵. مصرف سهمیه — اتمیک از طریق سرویس مرکزی
        // ============================================
        let consumed = null;
        try {
            consumed = await subscriptionService.consumeExam(teacherId, numQuestions);
        } catch (consumeError) {
            // اگر مصرف سهمیه شکست خورد، آزمون ساخته‌شده را پاک کن تا سیستم Sync بماند
            await db.query('DELETE FROM class_exams WHERE id = $1', [exam.id]);
            throw consumeError;
        }

        if (consumed && !consumed.allowed) {
            // Race نادر: سهمیه بین بررسی و مصرف پر شده
            await db.query('DELETE FROM class_exams WHERE id = $1', [exam.id]);
            return res.status(429).json({
                success: false,
                message: consumed.message,
                redirect: '/dashboard/subscription',
                error: 'EXAM_LIMIT_REACHED',
                limit: { used: consumed.used, max: consumed.limit }
            });
        }

        const updatedUsage = await subscriptionService.getUsage(teacherId);
        const maxExamsPerMonth = examFeat?.limit ?? null;

        res.status(201).json({
            success: true,
            message: 'آزمون با موفقیت ایجاد شد',
            data: { 
                exam: {
                    id: exam.id,
                    title: exam.title,
                    status: exam.status,
                    created_at: exam.created_at
                },
                usage: {
                    exams_used: updatedUsage.exams_used,
                    max_exams: maxExamsPerMonth,
                    questions_used: updatedUsage.questions_used,
                    exams_remaining: maxExamsPerMonth !== null
                        ? Math.max(0, maxExamsPerMonth - updatedUsage.exams_used)
                        : null
                }
            }
        });

    } catch (error) {
        console.error('❌ Create exam error:', error);
        console.error('❌ Error stack:', error.stack);
        res.status(500).json({
            success: false,
            message: 'خطا در ایجاد آزمون: ' + error.message
        });
    }
};

// ============================================
// 📊 دریافت محدودیت‌های آزمون معلم (از سرویس مرکزی)
// ============================================
const getTeacherExamLimits = async (req, res) => {
    try {
        const teacherId = req.user.id;

        const ent = await subscriptionService.getEntitlements(teacherId, 'teacher');
        if (!ent.plan) {
            return res.status(404).json({
                success: false,
                message: 'هیچ پلنی برای نقش شما تعریف نشده است'
            });
        }

        const examFeat = ent.features.exam_generation;
        const qCapFeat = ent.features.exam_questions_per_exam;

        const maxExams = examFeat?.limit ?? null;
        const maxQPerExam = qCapFeat?.limit ?? null;
        const examsUsed = examFeat?.used ?? 0;
        const questionsUsed = ent.usage.questions_used;
        // 🔄 سقف اشتراک: بین آزمون‌ساز داشبورد و آزمون‌ساز کلاسی «مشترک» است
        // (هر دو از یک شمارنده exams_used / questions_used تغذیه می‌شوند)

        res.json({
            success: true,
            data: {
                plan: {
                    name: ent.plan.name,
                    max_exams_month: maxExams,
                    max_questions_exam: maxQPerExam,
                    max_total_questions: (maxExams || 0) * (maxQPerExam || 0)
                },
                usage: {
                    exams_used: examsUsed,
                    questions_used: questionsUsed,
                    max_exams: maxExams,
                    max_questions: maxQPerExam,
                    exams_remaining: maxExams !== null ? Math.max(0, maxExams - examsUsed) : null,
                    questions_remaining: (maxExams || 0) * (maxQPerExam || 0) > 0
                        ? Math.max(0, (maxExams * maxQPerExam) - questionsUsed)
                        : null
                }
            }
        });

    } catch (error) {
        console.error('Error getting teacher limits:', error);
        res.status(500).json({
            success: false,
            message: 'خطا در دریافت محدودیت‌ها'
        });
    }
};

// ============================================
// 📋 دریافت آزمون‌های کلاس (معلم)
// ============================================
const getClassExams = async (req, res) => {
    try {
        const classId = req.params.classId;
        const teacherId = req.user.id;
        
        const query = `
            SELECT ce.*, 
                   (SELECT COUNT(*) FROM class_exam_submissions WHERE exam_id = ce.id) as submission_count,
                   (SELECT COALESCE(AVG(score_percentage), 0) FROM class_exam_submissions WHERE exam_id = ce.id) as avg_score
            FROM class_exams ce
            WHERE ce.class_id = $1 AND ce.teacher_id = $2
            ORDER BY ce.created_at DESC
        `;
        
        const result = await db.query(query, [classId, teacherId]);
        
        result.rows.forEach(row => {
            if (row.exam_data && typeof row.exam_data === 'string') {
                try { row.exam_data = JSON.parse(row.exam_data); } catch(e) {}
            }
            if (row.config && typeof row.config === 'string') {
                try { row.config = JSON.parse(row.config); } catch(e) {}
            }
        });
        
        res.json({ success: true, data: { exams: result.rows } });
        
    } catch (error) {
        console.error('Get class exams error:', error);
        res.status(500).json({ success: false, message: 'خطا در دریافت آزمون‌ها' });
    }
};

// ============================================
// 📄 دریافت یک آزمون
// ============================================
const getExamById = async (req, res) => {
    try {
        const examId = req.params.examId;
        const userId = req.user.id;
        const userRole = req.user.role;
        
        let query = `
            SELECT ce.*, c.name as class_name, c.class_code, u.name as teacher_name
            FROM class_exams ce
            JOIN classes c ON ce.class_id = c.id
            JOIN users u ON ce.teacher_id = u.id
            WHERE ce.id = $1
        `;
        const params = [examId];
        
        if (userRole !== 'admin') {
            query += ` AND (ce.teacher_id = $2 OR c.id IN (SELECT class_id FROM class_members WHERE user_id = $2 AND status = 'active'))`;
            params.push(userId);
        }
        
        const result = await db.query(query, params);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'آزمون یافت نشد' });
        }
        
        const exam = result.rows[0];
        if (exam.exam_data && typeof exam.exam_data === 'string') {
            exam.exam_data = JSON.parse(exam.exam_data);
        }
        if (exam.config && typeof exam.config === 'string') {
            exam.config = JSON.parse(exam.config);
        }
        
        res.json({ success: true, data: { exam } });
        
    } catch (error) {
        console.error('Get exam error:', error);
        res.status(500).json({ success: false, message: 'خطا در دریافت آزمون' });
    }
};

// ============================================
// 🔄 به‌روزرسانی آزمون
// ============================================
const updateExam = async (req, res) => {
    try {
        const examId = req.params.examId;
        const teacherId = req.user.id;
        const { exam_data, config, status, title, description } = req.body;
        
        let examDataJson = null;
        let configJson = null;
        
        if (exam_data) {
            examDataJson = typeof exam_data === 'string' ? exam_data : JSON.stringify(exam_data);
        }
        if (config) {
            configJson = typeof config === 'string' ? config : JSON.stringify(config);
        }
        
        const query = `
            UPDATE class_exams 
            SET exam_data = COALESCE($1, exam_data),
                config = COALESCE($2, config),
                status = COALESCE($3, status),
                title = COALESCE($4, title),
                description = COALESCE($5, description),
                updated_at = NOW()
            WHERE id = $6 AND teacher_id = $7
            RETURNING *
        `;
        const values = [examDataJson, configJson, status, title, description, examId, teacherId];
        const result = await db.query(query, values);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'آزمون یافت نشد' });
        }
        
        const exam = result.rows[0];
        if (exam.exam_data && typeof exam.exam_data === 'string') {
            exam.exam_data = JSON.parse(exam.exam_data);
        }
        if (exam.config && typeof exam.config === 'string') {
            exam.config = JSON.parse(exam.config);
        }
        
        res.json({ success: true, message: 'آزمون با موفقیت به‌روزرسانی شد', data: { exam } });
        
    } catch (error) {
        console.error('Update exam error:', error);
        res.status(500).json({ success: false, message: 'خطا در به‌روزرسانی آزمون' });
    }
};

// ============================================
// 📢 انتشار آزمون
// ============================================
const publishExam = async (req, res) => {
    try {
        const examId = req.params.examId;
        const teacherId = req.user.id;
        
        const query = `
            UPDATE class_exams 
            SET status = 'published', published_at = NOW(), updated_at = NOW()
            WHERE id = $1 AND teacher_id = $2
            RETURNING *
        `;
        const result = await db.query(query, [examId, teacherId]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'آزمون یافت نشد' });
        }
        
        const exam = result.rows[0];
        
        // ارسال اعلان به دانش‌آموزان
        const classId = exam.class_id;
        const students = await db.query(
            'SELECT user_id FROM class_members WHERE class_id = $1 AND role = $2 AND status = $3',
            [classId, 'student', 'active']
        );
        
        for (const student of students.rows) {
            try {
                await Notification.create(
                    student.user_id,
                    'exam_reminder',
                    `آزمون جدید: ${exam.title}`,
                    `آزمون "${exam.title}" در کلاس شما منتشر شد. برای شرکت در آزمون وارد شوید.`,
                    `/app/take-class-exam`,
                    { exam_id: examId, class_id: classId }
                );
            } catch (notifError) {
                console.error('Failed to send notification:', notifError.message);
            }
        }
        
        res.json({ success: true, message: 'آزمون با موفقیت منتشر شد', data: { exam } });
        
    } catch (error) {
        console.error('Publish exam error:', error);
        res.status(500).json({ success: false, message: 'خطا در انتشار آزمون' });
    }
};

// ============================================
// 🗑️ حذف آزمون
// ============================================
const deleteExam = async (req, res) => {
    try {
        const examId = req.params.examId;
        const teacherId = req.user.id;
        
        const result = await db.query(
            'DELETE FROM class_exams WHERE id = $1 AND teacher_id = $2 RETURNING id',
            [examId, teacherId]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'آزمون یافت نشد' });
        }
        
        res.json({ success: true, message: 'آزمون با موفقیت حذف شد' });
        
    } catch (error) {
        console.error('Delete exam error:', error);
        res.status(500).json({ success: false, message: 'خطا در حذف آزمون' });
    }
};

// ============================================
// 📋 دریافت آزمون‌های دانش‌آموز
// ============================================
const getMyExams = async (req, res) => {
    try {
        const studentId = req.user.id;
        const { classId } = req.query;
        
        let query = `
            SELECT ce.*, c.name as class_name, c.class_code, u.name as teacher_name,
                   cs.id as submission_id, cs.score, cs.score_percentage, cs.status as submission_status
            FROM class_exams ce
            JOIN classes c ON ce.class_id = c.id
            JOIN class_members cm ON c.id = cm.class_id
            JOIN users u ON ce.teacher_id = u.id
            LEFT JOIN class_exam_submissions cs ON ce.id = cs.exam_id AND cs.student_id = $1
            WHERE cm.user_id = $1 AND cm.status = 'active' AND ce.status = 'published'
        `;
        const params = [studentId];
        
        if (classId) {
            query += ` AND c.id = $2`;
            params.push(classId);
        }
        
        query += ` ORDER BY ce.created_at DESC`;
        
        const result = await db.query(query, params);
        
        result.rows.forEach(row => {
            if (row.exam_data && typeof row.exam_data === 'string') {
                try { row.exam_data = JSON.parse(row.exam_data); } catch(e) {}
            }
            if (row.config && typeof row.config === 'string') {
                try { row.config = JSON.parse(row.config); } catch(e) {}
            }
        });
        
        res.json({ success: true, data: { exams: result.rows } });
        
    } catch (error) {
        console.error('Get my exams error:', error);
        res.status(500).json({ success: false, message: 'خطا در دریافت آزمون‌ها' });
    }
};

// ============================================
// 📝 ثبت پاسخ‌های آزمون
// ============================================
const submitExam = async (req, res) => {
    try {
        const examId = req.params.examId;
        const studentId = req.user.id;
        const { answers, time_spent } = req.body;
        
        const examQuery = `
            SELECT ce.*, c.id as class_id
            FROM class_exams ce
            JOIN classes c ON ce.class_id = c.id
            WHERE ce.id = $1 AND ce.status = 'published'
        `;
        const examResult = await db.query(examQuery, [examId]);
        
        if (examResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'آزمون یافت نشد' });
        }
        
        const exam = examResult.rows[0];
        
        const memberCheck = await db.query(
            'SELECT * FROM class_members WHERE class_id = $1 AND user_id = $2 AND status = $3',
            [exam.class_id, studentId, 'active']
        );
        
        if (memberCheck.rows.length === 0) {
            return res.status(403).json({ success: false, message: 'شما دسترسی به این آزمون ندارید' });
        }
        
        const existingSubmit = await db.query(
            'SELECT * FROM class_exam_submissions WHERE exam_id = $1 AND student_id = $2',
            [examId, studentId]
        );
        
        if (existingSubmit.rows.length > 0) {
            return res.status(400).json({ success: false, message: 'شما قبلاً در این آزمون شرکت کرده‌اید' });
        }
        
        const examData = exam.exam_data;
        let score = 0;
        let totalPoints = 0;
        let correctCount = 0;
        let wrongCount = 0;
        
        if (examData && examData.questions) {
            examData.questions.forEach(question => {
                totalPoints += question.points || 1;
                const userAnswer = answers[question.q_id];
                let isCorrect = false;
                
                switch (question.type) {
                    case 'mcq':
                    case 'tf':
                        const correctOption = question.options?.find(o => o.is_correct);
                        isCorrect = correctOption?.id === userAnswer;
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
            });
        }
        
        const scorePercentage = totalPoints > 0 ? Math.round((score / totalPoints) * 100) : 0;
        
        const answersJson = JSON.stringify(answers);
        const insertQuery = `
            INSERT INTO class_exam_submissions (exam_id, student_id, answers, score, total_points, 
                                                score_percentage, correct_count, wrong_count, time_spent, status, submitted_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'completed', NOW())
            RETURNING *
        `;
        
        await db.query(insertQuery, [examId, studentId, answersJson, score, totalPoints, scorePercentage, correctCount, wrongCount, time_spent || 0]);
        
        res.json({
            success: true,
            message: 'پاسخ‌های شما با موفقیت ثبت شد',
            data: { score, totalPoints, scorePercentage, correctCount, wrongCount }
        });
        
    } catch (error) {
        console.error('Submit exam error:', error);
        res.status(500).json({ success: false, message: 'خطا در ثبت پاسخ‌ها: ' + error.message });
    }
};

// ============================================
// 📊 دریافت نتایج یک آزمون (معلم)
// ============================================
const getExamResults = async (req, res) => {
    try {
        const examId = req.params.examId;
        const teacherId = req.user.id;
        
        const resultsQuery = `
            SELECT cs.*, u.name as student_name, u.email as student_email
            FROM class_exam_submissions cs
            JOIN users u ON cs.student_id = u.id
            JOIN class_exams ce ON cs.exam_id = ce.id
            WHERE cs.exam_id = $1 AND ce.teacher_id = $2 AND cs.status = 'completed'
            ORDER BY cs.score_percentage DESC
        `;
        const resultsResult = await db.query(resultsQuery, [examId, teacherId]);
        
        const stats = {
            total_students: resultsResult.rows.length,
            avg_score: resultsResult.rows.length > 0 
                ? Math.round(resultsResult.rows.reduce((a, b) => a + b.score_percentage, 0) / resultsResult.rows.length) 
                : 0,
            max_score: resultsResult.rows.length > 0 ? Math.max(...resultsResult.rows.map(r => r.score_percentage)) : 0,
            min_score: resultsResult.rows.length > 0 ? Math.min(...resultsResult.rows.map(r => r.score_percentage)) : 0,
            passed_count: resultsResult.rows.filter(r => r.score_percentage >= 50).length
        };
        
        res.json({ success: true, data: { results: resultsResult.rows, stats } });
        
    } catch (error) {
        console.error('Get exam results error:', error);
        res.status(500).json({ success: false, message: 'خطا در دریافت نتایج' });
    }
};

// ============================================
// 📊 دریافت نتایج دانش‌آموز
// ============================================
const getMyResults = async (req, res) => {
    try {
        const studentId = req.user.id;
        const { classId } = req.query;
        
        let query = `
            SELECT cs.*, ce.title as exam_title, ce.exam_data, ce.config, c.name as class_name
            FROM class_exam_submissions cs
            JOIN class_exams ce ON cs.exam_id = ce.id
            JOIN classes c ON ce.class_id = c.id
            WHERE cs.student_id = $1 AND cs.status = 'completed'
        `;
        const params = [studentId];
        
        if (classId) {
            query += ` AND ce.class_id = $2`;
            params.push(classId);
        }
        
        query += ` ORDER BY cs.submitted_at DESC`;
        
        const result = await db.query(query, params);
        
        result.rows.forEach(row => {
            if (row.exam_data && typeof row.exam_data === 'string') {
                try { row.exam_data = JSON.parse(row.exam_data); } catch(e) {}
            }
            if (row.config && typeof row.config === 'string') {
                try { row.config = JSON.parse(row.config); } catch(e) {}
            }
        });
        
        res.json({ success: true, data: { results: result.rows } });
        
    } catch (error) {
        console.error('Get my results error:', error);
        res.status(500).json({ success: false, message: 'خطا در دریافت نتایج' });
    }
};

// ============================================
// 📊 دریافت آمار پیشرفت کلاس
// ============================================
const getClassProgress = async (req, res) => {
    try {
        const classId = req.params.classId;
        const teacherId = req.user.id;
        
        const query = `
            SELECT 
                u.id as student_id, u.name as student_name, u.email as student_email,
                COUNT(DISTINCT cs.exam_id) as total_exams,
                COALESCE(AVG(cs.score_percentage), 0) as avg_score,
                COALESCE(MAX(cs.score_percentage), 0) as max_score
            FROM class_members cm
            JOIN users u ON cm.user_id = u.id
            LEFT JOIN class_exam_submissions cs ON u.id = cs.student_id
            LEFT JOIN class_exams ce ON cs.exam_id = ce.id AND ce.teacher_id = $2
            WHERE cm.class_id = $1 AND cm.role = 'student' AND cm.status = 'active'
            GROUP BY u.id, u.name, u.email
            ORDER BY avg_score DESC
        `;
        const result = await db.query(query, [classId, teacherId]);
        
        const classStats = {
            total_students: result.rows.length,
            avg_class_score: result.rows.length > 0 ? Math.round(result.rows.reduce((a, b) => a + (b.avg_score || 0), 0) / result.rows.length) : 0,
            total_exams: result.rows.reduce((a, b) => a + (b.total_exams || 0), 0),
            top_students: result.rows.slice(0, 5)
        };
        
        res.json({ success: true, data: { progress: result.rows, classStats } });
        
    } catch (error) {
        console.error('Get class progress error:', error);
        res.status(500).json({ success: false, message: 'خطا در دریافت آمار پیشرفت' });
    }
};

// ============================================
// 📤 صادر کردن ماژول
// ============================================
module.exports = {
    createExam,
    getTeacherExamLimits,
    getClassExams,
    getExamById,
    updateExam,
    publishExam,
    deleteExam,
    getMyExams,
    submitExam,
    getExamResults,
    getMyResults,
    getClassProgress
};