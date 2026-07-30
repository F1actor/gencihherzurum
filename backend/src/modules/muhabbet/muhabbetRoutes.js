const express = require('express');
const router = express.Router();
const muhabbetController = require('./muhabbetController');
const { authenticateToken, requireRole } = require('../../middleware/authMiddleware');

const coordOrAdmin = ['SUPER_ADMIN', 'MUHABBET_COORDINATOR'];

// Public Routes
router.post('/apply', muhabbetController.apply);
router.get('/menus', muhabbetController.getMenus);
router.get('/settings', muhabbetController.getSettings);
router.get('/portal-info', muhabbetController.getPortalInfo);

// Admin & Koordinatör Routes
router.get('/applications', authenticateToken, requireRole(coordOrAdmin), muhabbetController.getApplications);
router.put('/applications/:id', authenticateToken, requireRole(coordOrAdmin), muhabbetController.updateApplication);
router.delete('/applications/:id', authenticateToken, requireRole(coordOrAdmin), muhabbetController.deleteApplication);

router.post('/classes', authenticateToken, requireRole(coordOrAdmin), muhabbetController.createClass);
router.get('/classes', authenticateToken, muhabbetController.getClasses);
router.put('/classes/:id', authenticateToken, requireRole(coordOrAdmin), muhabbetController.updateClass);
router.delete('/classes/:id', authenticateToken, requireRole(coordOrAdmin), muhabbetController.deleteClass);

router.post('/menus', authenticateToken, requireRole(coordOrAdmin), muhabbetController.createMenu);
router.put('/settings', authenticateToken, requireRole(coordOrAdmin), muhabbetController.updateSetting);

// Teacher / Shared Routes
router.get('/my-class', authenticateToken, muhabbetController.getMyClass);
router.post('/attendance', authenticateToken, muhabbetController.saveAttendance);
router.get('/attendance', authenticateToken, muhabbetController.getAttendance);
router.get('/attendance-report', authenticateToken, muhabbetController.getAttendanceReport);

module.exports = router;
