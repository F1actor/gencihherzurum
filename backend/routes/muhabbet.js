const express = require('express');
const router = express.Router();
const muhabbetController = require('../controllers/muhabbetController');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');

// Public Routes
router.post('/apply', muhabbetController.apply);
router.get('/menus', muhabbetController.getMenus);
router.get('/settings', muhabbetController.getSettings);

// Admin & Koordinatör Routes
const coordOrAdmin = ['SUPER_ADMIN', 'MUHABBET_COORDINATOR'];
router.get('/applications', authenticateToken, requireRole(coordOrAdmin), muhabbetController.getApplications);
router.put('/applications/:id', authenticateToken, requireRole(coordOrAdmin), muhabbetController.updateApplication);
router.delete('/applications/:id', authenticateToken, requireRole(coordOrAdmin), muhabbetController.deleteApplication);

router.post('/classes', authenticateToken, requireRole(coordOrAdmin), muhabbetController.createClass);
router.get('/classes', authenticateToken, muhabbetController.getClasses); // Everyone logged in
router.put('/classes/:id', authenticateToken, requireRole(coordOrAdmin), muhabbetController.updateClass);
router.delete('/classes/:id', authenticateToken, requireRole(coordOrAdmin), muhabbetController.deleteClass);

router.post('/menus', authenticateToken, requireRole(coordOrAdmin), muhabbetController.addMenu);
router.put('/menus/:id', authenticateToken, requireRole(coordOrAdmin), muhabbetController.updateMenu);
router.delete('/menus/:id', authenticateToken, requireRole(coordOrAdmin), muhabbetController.deleteMenu);

router.put('/settings', authenticateToken, requireRole(coordOrAdmin), muhabbetController.updateSettings);

// Teacher / Shared Routes (SUPER_ADMIN, MUHABBET_COORDINATOR and MUHABBET_TEACHER)
router.get('/my-class', authenticateToken, muhabbetController.getMyClass);
router.post('/attendance', authenticateToken, muhabbetController.takeAttendance);
router.get('/attendance', authenticateToken, muhabbetController.getAttendance);

module.exports = router;
