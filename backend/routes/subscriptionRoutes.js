// routes/subscriptionRoutes.js
const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const subscriptionController = require('../controllers/subscriptionController');
const { checkLimits } = require('../middleware/checkLimits');

// همه مسیرها نیاز به احراز هویت دارند
router.use(authMiddleware);
router.use(checkLimits);

// 📋 دریافت لیست پلن‌ها
router.get('/plans', subscriptionController.getPlans);

// 👤 دریافت اشتراک فعال کاربر
router.get('/my', subscriptionController.getMySubscription);

// 📊 دریافت مصرف ماهانه
router.get('/usage', subscriptionController.getUsage);

// 🛒 خرید اشتراک (شبیه‌سازی)
router.post('/purchase', subscriptionController.purchaseSubscription);

// 📋 دریافت تاریخچه صورت‌حساب‌ها
router.get('/billing', subscriptionController.getBillingHistory);

// ❌ لغو اشتراک
router.post('/cancel', subscriptionController.cancelSubscription);

// 📊 دریافت محدودیت‌های کاربر (برای تب مصرف)
router.get('/limits', subscriptionController.getUserLimits);

module.exports = router;