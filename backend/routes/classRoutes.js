// routes/classRoutes.js
const express = require('express');
const router = express.Router();
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const { checkLimits, checkClassLimit } = require('../middleware/checkLimits');
const classController = require('../controllers/classController');


// =============================================
// 🔒 همه مسیرها نیاز به احراز هویت دارند
// =============================================
router.use(authMiddleware);

// =============================================
// 🏢 مدیریت سازمان/مدرسه
// =============================================
router.post('/organization/create', classController.createOrganization);
router.get('/organization/members', classController.getOrganizationMembers);
router.get('/organization/full-members', classController.getOrganizationFullMembers);
router.post('/organization/add-member', classController.addMemberToOrganization);
router.post('/organization/leave', classController.leaveOrganization);
router.delete('/organization/:organizationId/teacher/:teacherId', classController.expelTeacher);
router.put('/organization/:organizationId/member/:memberId/role', classController.changeMemberRole);

// =============================================
// 📚 کلاس‌ها
// =============================================

// ✅ ایجاد کلاس جدید — با بررسی محدودیت پلن معلم
router.post('/class/create',
  roleMiddleware('teacher'),
  checkLimits,
  checkClassLimit,
  classController.createClass
);

router.get('/class/my-classes', classController.getMyClasses);
router.get('/class/:id', classController.getClassById);

// ✅ پیوستن به کلاس (دانش‌آموز بدون محدودیت)
router.post('/class/join', classController.joinClassByCode);

router.post('/class/:id/invite', roleMiddleware('teacher'), classController.inviteToClass);
router.put('/class/accept-invite', classController.acceptInvitation);
router.post('/class/:id/leave', classController.leaveClass);
router.delete('/class/:id/member/:studentId', roleMiddleware('teacher'), classController.expelStudent);
router.delete('/class/:id/member/:userId', roleMiddleware('teacher'), classController.removeMember);
router.get('/class/:id/members', classController.getClassMembers);
router.get('/class/:id/exams', classController.getClassExams);

module.exports = router;