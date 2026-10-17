const express = require('express');
const router = express.Router();
const muhabbetController = require('./muhabbetController');
const muhabbetValidator = require('./muhabbetValidator');
const { authenticateToken, requireRole } = require('../../middleware/authMiddleware');

const coordOrAdmin = ['SUPER_ADMIN', 'MUHABBET_COORDINATOR'];

// Public Routes
router.post('/apply', muhabbetValidator.validateApply, muhabbetController.apply);
router.get('/menus', muhabbetController.getMenus);
router.get('/settings', muhabbetController.getSettings);
router.get('/portal-info', muhabbetController.getPortalInfo);

// Admin & Koordinatör Routes
router.get('/applications', authenticateToken, requireRole(coordOrAdmin), muhabbetController.getApplications);
router.put('/applications/:id', authenticateToken, requireRole(coordOrAdmin), muhabbetController.updateApplication);
router.delete('/applications/:id', authenticateToken, requireRole(coordOrAdmin), muhabbetController.deleteApplication);

router.post('/classes', authenticateToken, requireRole(coordOrAdmin), muhabbetValidator.validateCreateClass, muhabbetController.createClass);
router.get('/classes', authenticateToken, requireRole(coordOrAdmin), muhabbetController.getClasses);
router.put('/classes/:id', authenticateToken, requireRole(coordOrAdmin), muhabbetController.updateClass);
router.delete('/classes/:id', authenticateToken, requireRole(coordOrAdmin), muhabbetController.deleteClass);

router.post('/menus', authenticateToken, requireRole(coordOrAdmin), muhabbetController.createMenu);
router.put('/menus/:id', authenticateToken, requireRole(coordOrAdmin), muhabbetController.updateMenu);
router.delete('/menus/:id', authenticateToken, requireRole(coordOrAdmin), muhabbetController.deleteMenu);
router.put('/settings', authenticateToken, requireRole(coordOrAdmin), muhabbetController.updateSetting);

// Teacher / Shared Routes
router.get('/my-class', authenticateToken, requireRole('MUHABBET_TEACHER'), muhabbetController.getMyClass);
router.post('/attendance', authenticateToken, muhabbetController.saveAttendance);
router.get('/attendance', authenticateToken, muhabbetController.getAttendance);
router.get('/attendance-report', authenticateToken, requireRole(coordOrAdmin), muhabbetController.getAttendanceReport);

module.exports = router;
