const express = require('express');
const router = express.Router();
const examController = require('../controllers/examController');
const { authMiddleware } = require('../middleware/auth');
const { checkLimits, checkExamLimit } = require('../middleware/checkLimits');

router.use(authMiddleware);

// 🔹 اعمال محدودیت قبل از شروع آزمون
router.post('/start', checkLimits, checkExamLimit, examController.startExam);
router.post('/:id/complete', examController.completeExam);
router.get('/stats', examController.getUserStats);
router.post('/save', examController.saveExam);
router.get('/', examController.getUserExams);
router.get('/:id', examController.getExamById);
router.put('/:id', examController.updateExam);
router.delete('/:id', examController.deleteExam);

module.exports = router;