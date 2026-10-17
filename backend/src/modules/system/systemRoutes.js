const express = require('express');
const router = express.Router();
const systemController = require('./systemController');
const { authenticateToken, requireRole } = require('../../middleware/authMiddleware');

router.use(authenticateToken);
router.post('/units', requireRole('SUPER_ADMIN'), systemController.createUnit);
router.delete('/units/:id', requireRole('SUPER_ADMIN'), systemController.deactivateUnit);

// =======================
// BİRİMLER (UNITS)
// =======================
router.get('/units', systemController.getUnits); // Herkes (auth olan) görebilir

// =======================
// DUYURULAR
// =======================
router.get('/announcements/unit', requireRole('UNIT_PRESIDENT'), systemController.getAnnouncementsForUnit);
router.get('/announcements', requireRole(['SUPER_ADMIN', 'UNIT_PRESIDENT']), systemController.getAnnouncements);
router.post('/announcements', requireRole('SUPER_ADMIN'), systemController.createAnnouncement);
router.delete('/announcements/:id', requireRole('SUPER_ADMIN'), systemController.deleteAnnouncement);

// =======================
// HEDEFLER
// =======================
router.get('/targets/unit', requireRole('UNIT_PRESIDENT'), systemController.getTargetForUnit);
router.get('/targets', requireRole(['SUPER_ADMIN', 'UNIT_PRESIDENT']), systemController.getTargets);
router.post('/targets', requireRole('SUPER_ADMIN'), systemController.setTarget);
router.delete('/targets/:id', requireRole('SUPER_ADMIN'), systemController.deleteTarget);

// =======================
// ŞAMPİYON ARŞİVİ
// =======================
router.get('/champions', requireRole(['SUPER_ADMIN', 'UNIT_PRESIDENT']), systemController.getChampions);
router.post('/champions', requireRole('SUPER_ADMIN'), systemController.addChampion);

// =======================
// BİRİM GEÇMİŞİ & DEVİR
// =======================
router.get('/unit-history', requireRole('SUPER_ADMIN'), systemController.getUnitHistory);
router.post('/transfer-unit', requireRole('SUPER_ADMIN'), systemController.transferUnit);

module.exports = router;
