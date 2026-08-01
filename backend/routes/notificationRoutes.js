// routes/notificationRoutes.js
const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

router.get('/', notificationController.getNotifications);
router.put('/:id/read', notificationController.markAsRead);
router.put('/read-all', notificationController.markAllAsRead);
router.get('/settings', notificationController.getSettings);
router.put('/settings', notificationController.updateSettings);

// مسیر ادمین برای ارسال نوتیفیکیشن عمومی
router.post('/admin/broadcast', roleMiddleware('admin'), notificationController.sendSystemNotification);

module.exports = router;