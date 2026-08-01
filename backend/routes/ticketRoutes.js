// backend/routes/ticketRoutes.js
const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticketController');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

// همه مسیرها نیاز به احراز هویت دارند
router.use(authMiddleware);

// ========== مسیرهای عمومی ==========
router.get('/categories', ticketController.getCategories);
router.post('/', ticketController.submitTicket);

// ========== مسیرهای کاربر (Customer) ==========
router.get('/my', ticketController.getMyTickets);
router.get('/my/:id', ticketController.getTicketById);
router.post('/my/:id/reply', ticketController.addReply);
router.put('/my/:id/close', ticketController.closeTicket);
router.put('/my/:id/reopen', ticketController.reopenTicket);

// ========== مسیرهای ادمین (Admin) ==========
router.get('/admin/all', roleMiddleware('admin'), ticketController.getAllTickets);
router.get('/admin/:id', roleMiddleware('admin'), ticketController.getAdminTicketById);
router.post('/admin/:id/reply', roleMiddleware('admin'), ticketController.addAdminReply);
router.put('/admin/:id', roleMiddleware('admin'), ticketController.updateTicket);
router.delete('/admin/:id', roleMiddleware('admin'), ticketController.deleteTicket);

module.exports = router;