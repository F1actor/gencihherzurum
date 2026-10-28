const { query } = require('../../config/database');
const AppError = require('../../core/errors/AppError');
const path = require('path');
const { uploadDirectory } = require('../../config/uploads');
const fs = require('fs');

/**
 * Event Service — Etkinlik iş mantığı katmanı.
 */

exports.createEvent = async ({ type, routineId, title, description, eventDate, targetId, proofImagePath, user }) => {
  if (!type || !title || !eventDate) throw new AppError('Etkinlik türü, başlığı ve tarihi zorunludur.', 400);
  if (type === 'ROUTINE' && !routineId) throw new AppError('Rutin etkinlikler için rutin seçimi zorunludur.', 400);
  if (type === 'TARGET' && !targetId) throw new AppError('Aylık hedef etkinlikleri için hedef seçimi zorunludur.', 400);
  if (isNaN(new Date(eventDate).getTime())) throw new AppError('Geçersiz etkinlik tarihi.', 400);

  let pointsEarned = 0;
  if (type === 'EXTRA') pointsEarned = 20;
  else if (type === 'ROUTINE') pointsEarned = 10;
  else if (type === 'TARGET') {
    const targetData = await query.get('SELECT targetPoints FROM targets WHERE id = ? AND unit = ?', [targetId, user.assignedUnit]);
    if (!targetData) throw new AppError('Geçersiz veya yetkiniz olmayan aylık hedef.', 400);
    pointsEarned = targetData.targetPoints;
  } else {
    throw new AppError('Geçersiz etkinlik türü.', 400);
  }

  const result = await query.run(
    `INSERT INTO events (userId, unit, type, routineId, targetId, title, description, eventDate, proofImagePath, pointsEarned)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [user.id, user.assignedUnit, type,
     type === 'ROUTINE' ? parseInt(routineId) : null,
     type === 'TARGET' ? parseInt(targetId) : null,
     title, description || '', eventDate, proofImagePath, pointsEarned]
  );

  await query.run("INSERT INTO audits (logType, message) VALUES ('SYSTEM', ?)",
    [`Etkinlik Eklendi: ${user.assignedUnit} - ${title} (Puan: ${pointsEarned})`]);

  return { id: result.id, title, type, pointsEarned, proofImagePath };
};

exports.getMyEvents = async (userId) => {
  return query.all(
    `SELECT e.*, r.title as routineTitle FROM events e LEFT JOIN routines r ON e.routineId = r.id
     WHERE e.userId = ? ORDER BY e.eventDate DESC, e.id DESC`,
    [userId]
  );
};

exports.getMyRoutines = async (assignedUnit) => {
  return query.all('SELECT * FROM routines WHERE unit = ? ORDER BY dayOfWeek ASC', [assignedUnit]);
};

exports.getAllEvents = async ({ unit, type } = {}) => {
  let sql = `SELECT e.*, u.fullName as presidentName, r.title as routineTitle
             FROM events e JOIN users u ON e.userId = u.id LEFT JOIN routines r ON e.routineId = r.id`;
  const params = [];
  const conditions = [];
  if (unit) { conditions.push('e.unit = ?'); params.push(unit); }
  if (type) { conditions.push('e.type = ?'); params.push(type); }
  if (conditions.length > 0) sql += ' WHERE ' + conditions.join(' AND ');
  sql += ' ORDER BY e.eventDate DESC, e.id DESC LIMIT 300';
  return query.all(sql, params);
};

exports.updateEvent = async ({ id, title, description, eventDate, proofImagePath, user }) => {
  const event = await query.get('SELECT * FROM events WHERE id = ?', [id]);
  if (!event) throw new AppError('Etkinlik bulunamadı.', 404);
  if (event.userId !== user.id && user.role !== 'SUPER_ADMIN') throw new AppError('Bu etkinliği düzenleme yetkiniz yok.', 403);

  if (user.role !== 'SUPER_ADMIN') {
    const diffHours = (Date.now() - new Date(event.createdAt).getTime()) / (1000 * 60 * 60);
    if (diffHours > 24) throw new AppError('Etkinlikler yalnızca eklendikten sonraki 24 saat içinde düzenlenebilir.', 403);
  }

  const newProofPath = proofImagePath || event.proofImagePath;
  if (proofImagePath && event.proofImagePath) {
    const oldPath = path.join(uploadDirectory, path.basename(event.proofImagePath));
    if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
  }

  await query.run('UPDATE events SET title = ?, description = ?, eventDate = ?, proofImagePath = ? WHERE id = ?',
    [title || event.title, description ?? event.description, eventDate || event.eventDate, newProofPath, id]);

  await query.run("INSERT INTO audits (logType, message) VALUES ('SYSTEM', ?)",
    [`Etkinlik Güncellendi: ${user.assignedUnit || 'Admin'} - ${title || event.title}`]);
};

exports.deleteEvent = async ({ id, user }) => {
  const event = await query.get('SELECT * FROM events WHERE id = ?', [id]);
  if (!event) throw new AppError('Etkinlik bulunamadı.', 404);

  if (user.role !== 'SUPER_ADMIN') {
    if (event.userId !== user.id) throw new AppError('Bu etkinliği silme yetkiniz yok.', 403);
    const createdAtStr = event.createdAt.includes('T') ? event.createdAt : event.createdAt.replace(' ', 'T') + 'Z';
    const diffHours = (Date.now() - new Date(createdAtStr).getTime()) / (1000 * 60 * 60);
    if (diffHours > 24) throw new AppError('Etkinlikler yalnızca eklendikten sonraki 24 saat içinde silinebilir.', 403);
  }

  if (event.proofImagePath) {
    const filePath = path.join(uploadDirectory, path.basename(event.proofImagePath));
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }

  await query.run('DELETE FROM events WHERE id = ?', [id]);
  await query.run("INSERT INTO audits (logType, message) VALUES ('SYSTEM', ?)",
    [`Etkinlik Silindi: ${event.unit} - ${event.title} (${event.eventDate})`]);
};
