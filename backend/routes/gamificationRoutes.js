// routes/gamificationRoutes.js
const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const Gamification = require('../models/Gamification');

router.get('/my-points', authMiddleware, async (req, res) => {
    try {
        const points = await Gamification.getUserPoints(req.user.id);
        const leaderboard = await Gamification.getLeaderboard(10);
        res.json({ success: true, data: { points, leaderboard } });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;