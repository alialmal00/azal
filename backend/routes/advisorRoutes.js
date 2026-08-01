const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { checkLimits, checkAdvisorLimit } = require('../middleware/checkLimits');
const advisorController = require('../controllers/advisorController');

router.use(authMiddleware);

// 🔹 اعمال محدودیت تعداد + کاراکتر
router.post('/chat', checkLimits, checkAdvisorLimit, advisorController.chat);

module.exports = router;