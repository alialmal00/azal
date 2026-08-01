// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authMiddleware } = require('../middleware/auth');

// =============================================
// 🔓 مسیرهای عمومی
// =============================================

// ثبت‌نام
router.post('/register', authController.register);

// تأیید کد
router.post('/verify', authController.verifyCode);

// ارسال مجدد کد
router.post('/resend-verification', authController.resendVerification);

// ورود
router.post('/login', authController.login);

// فراموشی رمز عبور
router.post('/forgot-password', authController.forgotPassword);

// بازیابی رمز عبور
router.post('/reset-password', authController.resetPassword);

// =============================================
// 🔒 مسیرهای نیازمند احراز هویت
// =============================================

// اطلاعات کاربر جاری
router.get('/me', authMiddleware, authController.getMe);

// خروج
router.post('/logout', authController.logout);

// انتخاب نقش
router.post('/select-role', authMiddleware, authController.selectRole);

module.exports = router;