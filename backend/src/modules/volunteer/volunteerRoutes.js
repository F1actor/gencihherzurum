const express = require('express');
const { query } = require('../../config/database');
const { authenticateToken, requireRole } = require('../../middleware/authMiddleware');
const { sendVolunteerForwardEmail } = require('../../services/emailService');

const router = express.Router();
const statuses = ['NEW', 'READ', 'FORWARDED', 'CALLED', 'POSITIVE', 'NEGATIVE'];
const clean = (body, key, max = 255) => typeof body?.[key] === 'string' ? body[key].trim().slice(0, max) : '';
const universityStatuses = new Set(['UNIVERSITY_STUDENT', 'UNIVERSITY_GRADUATE', 'ASSOCIATE_STUDENT', 'OPEN_EDUCATION', 'DISTANCE_EDUCATION', 'MASTERS', 'DOCTORATE']);
const graduateStatuses = new Set(['UNIVERSITY_GRADUATE']);

router.post('/', async (req, res, next) => {
  const fullName = clean(req.body, 'fullName');
  const phoneNumber = clean(req.body, 'phoneNumber', 50);
  const educationStatus = clean(req.body, 'educationStatus', 60);
  const needsUniversity = universityStatuses.has(educationStatus);
  const needsGrade = ['UNIVERSITY_STUDENT', 'ASSOCIATE_STUDENT', 'OPEN_EDUCATION', 'DISTANCE_EDUCATION', 'MASTERS', 'DOCTORATE'].includes(educationStatus);
  const needsEmployment = graduateStatuses.has(educationStatus);
  const university = clean(req.body, 'university') || 'Universite okumuyor';
  const faculty = clean(req.body, 'faculty') || '-';
  const department = clean(req.body, 'department') || '-';
  const grade = clean(req.body, 'grade', 100) || '-';
  const employmentStatus = clean(req.body, 'employmentStatus', 40);
  if (!fullName || !educationStatus || !req.body?.kvkkAccepted || (needsUniversity && (!clean(req.body, 'university') || !clean(req.body, 'faculty') || !clean(req.body, 'department') || (needsGrade && !clean(req.body, 'grade')))) || (needsEmployment && !['EMPLOYED', 'UNEMPLOYED'].includes(employmentStatus))) {
    return res.status(400).json({ message: 'Lutfen zorunlu alanlari doldurun ve KVKK aydinlatmasini onaylayin.' });
  }
  if (!/^[\d\s()+-]+$/.test(phoneNumber) || phoneNumber.replace(/\D/g, '').length !== 11) {
    return res.status(400).json({ message: 'Lutfen 11 haneli gecerli bir telefon numarasi girin.' });
  }
  try {
    await query.run('INSERT INTO volunteer_applications (fullName, phoneNumber, educationStatus, university, faculty, department, grade, employmentStatus, kvkkAccepted) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)', [fullName, phoneNumber, educationStatus, university, faculty, department, grade, employmentStatus || null]);
    return res.status(201).json({ message: 'Gonulluluk basvurunuz alindi.' });
  } catch (error) { return next(error); }
});

router.get('/', authenticateToken, requireRole('SUPER_ADMIN'), async (req, res, next) => {
  try { return res.json(await query.all('SELECT v.*, u.fullName AS forwardedToName FROM volunteer_applications v LEFT JOIN users u ON u.id = v.forwardedToUserId ORDER BY v.id DESC')); }
  catch (error) { return next(error); }
});

router.patch('/:id/status', authenticateToken, requireRole('SUPER_ADMIN'), async (req, res, next) => {
  const status = typeof req.body?.status === 'string' ? req.body.status : '';
  if (!statuses.includes(status)) return res.status(400).json({ message: 'Gecersiz basvuru durumu.' });
  try {
    const result = await query.run('UPDATE volunteer_applications SET applicationStatus = ?, statusNote = ? WHERE id = ?', [status, clean(req.body, 'note', 1000) || null, req.params.id]);
    if (!result.changes) return res.status(404).json({ message: 'Basvuru bulunamadi.' });
    return res.json({ message: 'Basvuru durumu guncellendi.' });
  } catch (error) { return next(error); }
});

router.post('/:id/forward', authenticateToken, requireRole('SUPER_ADMIN'), async (req, res, next) => {
  try {
    const application = await query.get('SELECT * FROM volunteer_applications WHERE id = ?', [req.params.id]);
    if (!application) return res.status(404).json({ message: 'Basvuru bulunamadi.' });
    if (application.educationStatus !== 'UNIVERSITY_STUDENT') return res.status(400).json({ message: 'Sadece universite ogrencisi basvurulari yonlendirilebilir.' });
    const recipient = await query.get('SELECT id, fullName, email FROM users WHERE receivesVolunteerApplications = 1 AND isEmailVerified = 1 ORDER BY id ASC LIMIT 1');
    if (!recipient) return res.status(409).json({ message: 'Universite baskani henuz tanimlanmadi. Yonetim ekranindan ilgili kisiyi basvuru alicisi olarak belirleyin.' });
    await sendVolunteerForwardEmail(recipient.email, recipient.fullName, application);
    await query.run("UPDATE volunteer_applications SET applicationStatus = 'FORWARDED', forwardedToUserId = ?, forwardedAt = NOW() WHERE id = ?", [recipient.id, application.id]);
    return res.json({ message: `${recipient.fullName} kişisine e-posta ile iletildi.` });
  } catch (error) { return next(error); }
});

router.delete('/:id', authenticateToken, requireRole('SUPER_ADMIN'), async (req, res, next) => {
  try {
    const result = await query.run('DELETE FROM volunteer_applications WHERE id = ?', [req.params.id]);
    if (!result.changes) return res.status(404).json({ message: 'Basvuru bulunamadi.' });
    return res.json({ message: 'Basvuru silindi.' });
  } catch (error) { return next(error); }
});

module.exports = router;
