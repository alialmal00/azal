// routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

// ========== همه مسیرها نیاز به ادمین دارند ==========
router.use(authMiddleware);
router.use(adminMiddleware);

// ========== آمار داشبورد ==========
router.get('/dashboard-stats', adminController.getDashboardStats);

// ========== مدیریت کاربران ==========
router.get('/users', adminController.getUsers);
router.get('/users/:id', adminController.getUserById);
router.put('/users/:id/status', adminController.updateUserStatus);
router.put('/users/:id/role', adminController.updateUserRole);
router.delete('/users/:id', adminController.deleteUser);

// ========== مدیریت پیام‌ها ==========
router.get('/messages', adminController.getMessages);
router.put('/messages/:id/read', adminController.markMessageAsRead);
router.delete('/messages/:id', adminController.deleteMessage);

// ========== مدیریت تیکت‌ها ==========
router.get('/tickets', adminController.getTickets);
router.put('/tickets/:id/status', adminController.updateTicketStatus);
router.delete('/tickets/:id', adminController.deleteTicket);

// ========== مدیریت اشتراک‌ها ==========
router.get('/subscriptions', adminController.getAllSubscriptions);

// ========== آمار ==========
router.get('/exam-stats', adminController.getExamStats);
router.get('/activity-stats', adminController.getActivityStats);

module.exports = router;