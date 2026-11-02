const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { uploadDirectory } = require('../../config/uploads');
const eventController = require('./eventController');
const eventValidator = require('./eventValidator');
const { authenticateToken, requireRole } = require('../../middleware/authMiddleware');
const { hasSystemAdminAccess } = require('../../core/accessPolicy');

// uploads klasörünün varlığından emin olalım
const uploadDir = uploadDirectory;
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer Disk Storage yapılandırması
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'evidence-' + uniqueSuffix + ext);
  }
});

// Resim dosyası filtreleme
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Sadece resim formatında (JPEG, JPG, PNG, WEBP, GIF) kanıt yüklenebilir.'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Max 5MB
  fileFilter: fileFilter
});

// Tüm rotalar korumalıdır
router.use(authenticateToken);

function requireEventGalleryAccess(req, res, next) {
  const canAccess = hasSystemAdminAccess(req.user.role)
    || (req.user.role === 'UNIT_PRESIDENT' && req.user.assignedUnit === 'Tanıtım ve Medya Başkanı');

  if (!canAccess) return res.status(403).json({ message: 'Tüm birimlerin etkinlik medyasını görüntüleme yetkiniz yok.' });
  next();
}

// Birim Başkanı Rotaları
router.post('/', requireRole('UNIT_PRESIDENT'), upload.single('proofImage'), eventValidator.validateCreateEvent, eventController.createEvent);
router.get('/my-events', requireRole('UNIT_PRESIDENT'), eventController.getMyEvents);
router.get('/my-routines', requireRole('UNIT_PRESIDENT'), eventController.getMyRoutines);
router.put('/:id', requireRole('UNIT_PRESIDENT'), upload.single('proofImage'), eventController.updateEvent);
router.delete('/:id', requireRole(['UNIT_PRESIDENT', 'SUPER_ADMIN']), eventController.deleteEvent);

// Tüm birimlerin etkinlik medyası yalnızca Süper Admin ve Tanıtım ve Medya Başkanı içindir.
router.get('/all', requireRole(['SUPER_ADMIN', 'UNIT_PRESIDENT']), requireEventGalleryAccess, eventController.getAllEvents);

module.exports = router;
