// routes/contactRoutes.js
const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactController');

// =============================================
// 📩 مسیرهای مربوط به تماس با ما
// =============================================

// ✅ ارسال پیام جدید (عمومی - بدون احراز هویت)
router.post('/submit', contactController.submitContact);

// ✅ دریافت لیست پیام‌ها (برای تست یا ادمین - نیاز به احراز هویت)
router.get('/', contactController.getMessages);

// ✅ دریافت یک پیام با شناسه (برای تست)
router.get('/:id', contactController.getMessageById);

// ✅ علامت زدن پیام به عنوان خوانده شده
router.put('/:id/read', contactController.markAsRead);

// ✅ حذف پیام
router.delete('/:id', contactController.deleteMessage);

// ✅ دریافت آمار پیام‌ها
router.get('/stats', contactController.getMessageStats);

module.exports = router; // ✅ این خط بسیار مهم است