// routes/classExamRoutes.js
const express = require('express');
const router = express.Router();
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const {
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
} = require('../controllers/classExamController');

// =============================================
// 🔒 همه مسیرها نیاز به احراز هویت دارند
// =============================================
router.use(authMiddleware);

// =============================================
// 📊 محدودیت‌های معلم
// =============================================
router.get('/teacher/limits', roleMiddleware('teacher'), getTeacherExamLimits);

// =============================================
// 📝 آزمون‌های کلاسی
// =============================================

// ایجاد آزمون جدید
router.post('/exam/create', roleMiddleware('teacher'), createExam);

// دریافت آزمون‌های کلاس (معلم)
router.get('/class/:classId/exams', roleMiddleware('teacher'), getClassExams);

// دریافت یک آزمون
router.get('/exam/:examId', getExamById);

// به‌روزرسانی آزمون
router.put('/exam/:examId', roleMiddleware('teacher'), updateExam);

// انتشار آزمون
router.post('/exam/:examId/publish', roleMiddleware('teacher'), publishExam);

// حذف آزمون
router.delete('/exam/:examId', roleMiddleware('teacher'), deleteExam);

// =============================================
// 👨‍🎓 دانش‌آموز
// =============================================

// دریافت آزمون‌های دانش‌آموز
router.get('/my-exams', getMyExams);

// ثبت پاسخ‌های آزمون
router.post('/exam/:examId/submit', submitExam);

// دریافت نتایج یک آزمون (معلم)
router.get('/exam/:examId/results', roleMiddleware('teacher'), getExamResults);

// دریافت نتایج دانش‌آموز
router.get('/my-results', getMyResults);

// دریافت آمار پیشرفت کلاس
router.get('/class/:classId/progress', roleMiddleware('teacher'), getClassProgress);

module.exports = router;