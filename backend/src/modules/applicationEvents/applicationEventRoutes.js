const express = require('express');
const { query } = require('../../config/database');
const { authenticateToken, requireRole } = require('../../middleware/authMiddleware');

const router = express.Router();
const clean = (body, key, max = 255) => typeof body?.[key] === 'string' ? body[key].trim().slice(0, max) : '';
const normalize = body => ({ title: clean(body, 'title'), description: clean(body, 'description', 5000), eventDate: clean(body, 'eventDate', 10), eventTime: clean(body, 'eventTime', 20), location: clean(body, 'location'), isActive: body?.isActive ? 1 : 0 });
const universityStatuses = new Set(['UNIVERSITY_STUDENT', 'UNIVERSITY_GRADUATE', 'ASSOCIATE_STUDENT', 'OPEN_EDUCATION', 'DISTANCE_EDUCATION', 'MASTERS', 'DOCTORATE']);
const graduateStatuses = new Set(['UNIVERSITY_GRADUATE']);

router.get('/active', async (req, res, next) => { try { return res.json(await query.all('SELECT id, title, description, eventDate, eventTime, location FROM application_events WHERE isActive = 1 ORDER BY eventDate ASC, id DESC')); } catch (error) { return next(error); } });

router.get('/manage', authenticateToken, requireRole('SUPER_ADMIN'), async (req, res, next) => {
  try { return res.json(await query.all(`SELECT e.*, COUNT(a.id) AS applicationCount FROM application_events e LEFT JOIN application_event_entries a ON a.eventId = e.id GROUP BY e.id ORDER BY e.id DESC`)); } catch (error) { return next(error); }
});

router.post('/manage', authenticateToken, requireRole('SUPER_ADMIN'), async (req, res, next) => {
  const event = normalize(req.body); if (!event.title) return res.status(400).json({ message: 'Etkinlik basligi zorunludur.' });
  try { const result = await query.run('INSERT INTO application_events (title, description, eventDate, eventTime, location, isActive, createdBy) VALUES (?, ?, ?, ?, ?, ?, ?)', [event.title, event.description || null, event.eventDate || null, event.eventTime || null, event.location || null, event.isActive, req.user.id]); return res.status(201).json({ id: result.id, message: 'Etkinlik basvuru formu olusturuldu.' }); } catch (error) { return next(error); }
});

router.put('/manage/:id', authenticateToken, requireRole('SUPER_ADMIN'), async (req, res, next) => {
  const event = normalize(req.body); if (!event.title) return res.status(400).json({ message: 'Etkinlik basligi zorunludur.' });
  try { const result = await query.run('UPDATE application_events SET title = ?, description = ?, eventDate = ?, eventTime = ?, location = ?, isActive = ? WHERE id = ?', [event.title, event.description || null, event.eventDate || null, event.eventTime || null, event.location || null, event.isActive, req.params.id]); if (!result.changes) return res.status(404).json({ message: 'Etkinlik bulunamadi.' }); return res.json({ message: 'Etkinlik formu guncellendi.' }); } catch (error) { return next(error); }
});

router.delete('/manage/:id', authenticateToken, requireRole('SUPER_ADMIN'), async (req, res, next) => { try { await query.run('DELETE FROM application_event_entries WHERE eventId = ?', [req.params.id]); const result = await query.run('DELETE FROM application_events WHERE id = ?', [req.params.id]); if (!result.changes) return res.status(404).json({ message: 'Etkinlik bulunamadi.' }); return res.json({ message: 'Etkinlik ve basvurular silindi.' }); } catch (error) { return next(error); } });
router.get('/manage/:id/applications', authenticateToken, requireRole('SUPER_ADMIN'), async (req, res, next) => { try { return res.json(await query.all('SELECT * FROM application_event_entries WHERE eventId = ? ORDER BY id DESC', [req.params.id])); } catch (error) { return next(error); } });

router.get('/:id', async (req, res, next) => { try { const event = await query.get('SELECT id, title, description, eventDate, eventTime, location FROM application_events WHERE id = ? AND isActive = 1', [req.params.id]); if (!event) return res.status(404).json({ message: 'Etkinlik formu bulunamadi veya basvuruya kapali.' }); return res.json(event); } catch (error) { return next(error); } });
router.post('/:id/applications', async (req, res, next) => {
  const fullName = clean(req.body, 'fullName'); const phoneNumber = clean(req.body, 'phoneNumber', 50); const educationStatus = clean(req.body, 'educationStatus', 60); const needsUniversity = universityStatuses.has(educationStatus); const needsGrade = ['UNIVERSITY_STUDENT', 'ASSOCIATE_STUDENT', 'OPEN_EDUCATION', 'DISTANCE_EDUCATION', 'MASTERS', 'DOCTORATE'].includes(educationStatus); const needsEmployment = graduateStatuses.has(educationStatus);
  const university = clean(req.body, 'university') || 'Universite okumuyor'; const faculty = clean(req.body, 'faculty') || '-'; const department = clean(req.body, 'department') || '-'; const grade = clean(req.body, 'grade', 100) || '-';
  const employmentStatus = clean(req.body, 'employmentStatus', 40);
  if (!fullName || !educationStatus || !req.body?.kvkkAccepted || (needsUniversity && (!clean(req.body, 'university') || !clean(req.body, 'faculty') || !clean(req.body, 'department') || (needsGrade && !clean(req.body, 'grade'))))) return res.status(400).json({ message: 'Lutfen zorunlu alanlari ve KVKK onayini tamamlayin.' });
  if (!/^[\d\s()+-]+$/.test(phoneNumber) || phoneNumber.replace(/\D/g, '').length !== 11) return res.status(400).json({ message: 'Gecerli bir telefon numarasi girin.' });
  try { const event = await query.get('SELECT id FROM application_events WHERE id = ? AND isActive = 1', [req.params.id]); if (!event) return res.status(404).json({ message: 'Etkinlik basvuruya kapali.' }); await query.run('INSERT INTO application_event_entries (eventId, fullName, phoneNumber, educationStatus, university, faculty, department, grade, employmentStatus, kvkkAccepted) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)', [event.id, fullName, phoneNumber, educationStatus, university, faculty, department, grade, employmentStatus || null]); return res.status(201).json({ message: 'Etkinlik basvurunuz alindi.' }); } catch (error) { return next(error); }
});

module.exports = router;
