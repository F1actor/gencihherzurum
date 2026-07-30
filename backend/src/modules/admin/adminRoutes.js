const express = require('express');
const router = express.Router();
const adminController = require('./adminController');
const adminValidator = require('./adminValidator');
const { authenticateToken, requireRole } = require('../../middleware/authMiddleware');

router.use(authenticateToken);

router.get('/users', requireRole(['SUPER_ADMIN', 'MUHABBET_COORDINATOR']), adminController.getUsers);

router.use(requireRole('SUPER_ADMIN'));

router.get('/pending-users', adminController.getPendingUsers);
router.post('/assign-unit', adminValidator.validateAssignUnit, adminController.assignUnit);
router.get('/routines', adminController.getRoutines);
router.post('/routines', adminValidator.validateCreateRoutine, adminController.createRoutine);
router.delete('/routines/:id', adminController.deleteRoutine);
router.get('/audits', adminController.getAudits);
router.post('/run-audit', adminController.runManualAudit);
router.delete('/users/:id', adminController.deleteUser);
router.get('/events-gallery', adminController.getAllEventsWithProofs);

module.exports = router;
