// middleware/checkLimits.js
// ============================================
// 🔁 لایه سازگاری — تمام منطق محدودیت‌ها به
// middleware/entitlement.js + services/subscriptionService.js
// منتقل شده است. این فایل فقط برای سازگاری با
// require های قدیمی نگه داشته شده است.
// ============================================
const entitlement = require('./entitlement');

module.exports = {
    checkLimits: entitlement.checkLimits,
    checkExamLimit: entitlement.checkExamLimit,
    checkAdvisorLimit: entitlement.checkAdvisorLimit,
    checkClassLimit: entitlement.checkClassLimit,
};
