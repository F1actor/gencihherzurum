const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');

router.use(authenticateToken);

// Liderlik tablosu ve performans analizini birim başkanları da görebilir
router.get('/leaderboard', reportController.getLeaderboard);
router.get('/performance', reportController.getPerformanceMetrics);

// Süper Admin dashboard istatistikleri sadece Süper Admin yetkisine açıktır
router.get('/dashboard-stats', requireRole('SUPER_ADMIN'), reportController.getAdminDashboardStats);
router.get('/export-csv', requireRole('SUPER_ADMIN'), reportController.exportToCSV);

module.exports = router;
