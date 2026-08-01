// routes/subscriptionRoutes.js
const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const subscriptionController = require('../controllers/subscriptionController');

// ============================================
// 🔓 عمومی — لیست پلن‌ها (صفحه Pricing بدون لاگین)
// قبلاً پشت auth + checkLimits بود و باعث بن‌بست
// «بدون پلن نمی‌توان پلن دید» می‌شد.
// ============================================
router.get('/plans', subscriptionController.getPlans);

// ============================================
// 🔒 همه مسیرهای زیر نیاز به احراز هویت دارند
// ============================================
router.use(authMiddleware);

// 🎫 نمای کامل مجوزها (قلب سیستم جدید)
router.get('/entitlements', subscriptionController.getEntitlements);

// 👤 اشتراک فعال کاربر
router.get('/my', subscriptionController.getMySubscription);

// 📊 مصرف ماهانه
router.get('/usage', subscriptionController.getUsage);

// 📊 محدودیت‌ها (شکل سازگار با فرانت فعلی)
router.get('/limits', subscriptionController.getUserLimits);

// 🛒 ایجاد پرداخت خرید
router.post('/purchase', subscriptionController.purchaseSubscription);

// ✅ تایید پرداخت و فعال‌سازی اشتراک
router.post('/verify', subscriptionController.verifyPayment);

// 📋 تاریخچه صورت‌حساب‌ها
router.get('/billing', subscriptionController.getBillingHistory);

// ❌ لغو اشتراک
router.post('/cancel', subscriptionController.cancelSubscription);

module.exports = router;
