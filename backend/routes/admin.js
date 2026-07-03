const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');

// Tüm rotalar sadece Süper Admin yetkisine açık
router.use(authenticateToken);
router.use(requireRole('SUPER_ADMIN'));

router.get('/pending-users', adminController.getPendingUsers);
router.post('/assign-unit', adminController.assignUnit);
router.get('/users', adminController.getUsers);
router.get('/routines', adminController.getRoutines);
router.post('/routines', adminController.createRoutine);
router.delete('/routines/:id', adminController.deleteRoutine);
router.get('/audits', adminController.getAudits);
router.post('/run-audit', adminController.runManualAudit);
router.delete('/users/:id', adminController.deleteUser);
router.get('/events-gallery', adminController.getAllEventsWithProofs);

module.exports = router;
