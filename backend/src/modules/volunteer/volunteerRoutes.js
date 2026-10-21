const express = require('express');
const { query } = require('../../config/database');
const { authenticateToken, requireRole } = require('../../middleware/authMiddleware');

const router = express.Router();

router.post('/', async (req, res, next) => {
  const fields = ['fullName', 'phoneNumber', 'university', 'faculty', 'grade'];
  const values = fields.map(field => typeof req.body?.[field] === 'string' ? req.body[field].trim() : '');
  if (values.some((value, index) => !value || value.length > (index === 1 ? 50 : index === 4 ? 100 : 255))) {
    return res.status(400).json({ message: 'Lütfen tüm alanları geçerli bilgilerle doldurun.' });
  }
  if (!/^[\d\s()+-]+$/.test(values[1]) || values[1].replace(/\D/g, '').length < 10 || values[1].replace(/\D/g, '').length > 15) {
    return res.status(400).json({ message: 'Lütfen geçerli bir telefon numarası girin.' });
  }
  try {
    await query.run('INSERT INTO volunteer_applications (fullName, phoneNumber, university, faculty, grade) VALUES (?, ?, ?, ?, ?)', values);
    return res.status(201).json({ message: 'Gönüllülük başvurunuz alındı.' });
  } catch (error) { return next(error); }
});

router.get('/', authenticateToken, requireRole('SUPER_ADMIN'), async (req, res, next) => {
  try {
    return res.json(await query.all('SELECT id, fullName, phoneNumber, university, faculty, grade, createdAt FROM volunteer_applications ORDER BY id DESC'));
  } catch (error) { return next(error); }
});

module.exports = router;
