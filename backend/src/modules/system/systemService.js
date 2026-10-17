const { query } = require('../../config/database');
const AppError = require('../../core/errors/AppError');

/**
 * System Service — Sistem ayarları, duyurular, hedefler ve birimler için iş mantığı katmanı.
 */

// ==================== BİRİMLER ====================

exports.getUnits = async () => {
  return query.all('SELECT * FROM units WHERE isActive = 1 ORDER BY id ASC');
};

exports.createUnit = async ({ name }) => {
  const normalizedName = String(name || '').trim();
  if (normalizedName.length < 2 || normalizedName.length > 100) throw new AppError('Birim adı 2-100 karakter arasında olmalıdır.', 400);
  const existing = await query.get('SELECT id FROM units WHERE LOWER(name) = LOWER(?)', [normalizedName]);
  if (existing) throw new AppError('Bu birim zaten kayıtlı.', 409);
  return query.run('INSERT INTO units (name, isActive) VALUES (?, 1)', [normalizedName]);
};

exports.deactivateUnit = async (id) => {
  const unit = await query.get('SELECT id, name FROM units WHERE id = ?', [id]);
  if (!unit) throw new AppError('Birim bulunamadı.', 404);
  const activeAssignments = await query.get('SELECT id FROM users WHERE assignedUnit = ? LIMIT 1', [unit.name]);
  if (activeAssignments) throw new AppError('Bu birime atanmış kullanıcılar varken birim pasifleştirilemez.', 409);
  await query.run('UPDATE units SET isActive = 0 WHERE id = ?', [id]);
};

// ==================== DUYURULAR ====================

exports.getAnnouncements = async () => {
  return query.all('SELECT * FROM announcements WHERE isActive = 1 ORDER BY createdAt DESC');
};

exports.getAnnouncementsForUnit = async (unit) => {
  return query.all(
    'SELECT * FROM announcements WHERE isActive = 1 AND (targetUnit IS NULL OR targetUnit = ?) ORDER BY createdAt DESC',
    [unit]
  );
};

exports.createAnnouncement = async ({ title, body, targetUnit }) => {
  if (!title || !body) throw new AppError('Başlık ve içerik zorunludur.', 400);
  const sql = 'INSERT INTO announcements (title, body, targetUnit) VALUES (?, ?, ?)';
  return query.run(sql, [title, body, targetUnit || null]);
};

exports.deleteAnnouncement = async (id) => {
  await query.run('UPDATE announcements SET isActive = 0 WHERE id = ?', [id]);
};

// ==================== HEDEFLER ====================

exports.getTargets = async ({ month } = {}) => {
  return query.all(
    `SELECT * FROM targets ${month ? 'WHERE month = ?' : ''} ORDER BY unit`,
    month ? [month] : []
  );
};

exports.getTargetForUnit = async (unit) => {
  const today = new Date();
  const month = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  const target = await query.get('SELECT * FROM targets WHERE unit = ? AND month = ?', [unit, month]);
  return target || { unit, month, targetName: '', targetPoints: 0 };
};

exports.setTarget = async ({ unit, month, targetName, targetPoints }) => {
  if (!unit || !month) throw new AppError('Birim ve ay zorunludur.', 400);
  const existing = await query.get('SELECT id FROM targets WHERE unit = ? AND month = ?', [unit, month]);
  if (existing) {
    await query.run('UPDATE targets SET targetName = ?, targetPoints = ? WHERE unit = ? AND month = ?', [targetName, targetPoints, unit, month]);
  } else {
    const sql = 'INSERT INTO targets (unit, month, targetName, targetPoints) VALUES (?, ?, ?, ?)';
    await query.run(sql, [unit, month, targetName, targetPoints]);
  }
};

exports.deleteTarget = async (id) => {
  await query.run('DELETE FROM targets WHERE id = ?', [id]);
};

// ==================== ŞAMPİYON ARŞİVİ ====================

exports.getChampions = async () => {
  return query.all('SELECT * FROM champions ORDER BY month DESC');
};

exports.addChampion = async ({ unit, month, points }) => {
  if (!unit || !month) throw new AppError('Birim ve ay zorunludur.', 400);
  const sql = 'INSERT INTO champions (unit, month, points) VALUES (?, ?, ?)';
  return query.run(sql, [unit, month, Number(points) || 0]);
};

// ==================== BİRİM GEÇMİŞİ ====================

exports.getUnitHistory = async () => {
  return query.all('SELECT * FROM unit_history ORDER BY id DESC LIMIT 100');
};

exports.transferUnit = async ({ fromUnit, toUnit, presidentId, oldUserId, newUserId, unit, reason }) => {
  if (newUserId) {
    if (!unit) throw new AppError('Birim zorunludur.', 400);
    const nextUser = await query.get('SELECT id, fullName FROM users WHERE id = ?', [newUserId]);
    if (!nextUser) throw new AppError('Devralacak kullanıcı bulunamadı.', 404);
    if (oldUserId) {
      const previousUser = await query.get('SELECT id FROM users WHERE id = ? AND assignedUnit = ?', [oldUserId, unit]);
      if (!previousUser) throw new AppError('Devreden kullanıcı bu birime atanmamış.', 400);
      await query.run('UPDATE unit_history SET endDate = ? WHERE userId = ? AND unit = ? AND endDate IS NULL', [new Date().toISOString(), oldUserId, unit]);
      await query.run("UPDATE users SET role = 'PASSIVE', assignedUnit = NULL WHERE id = ?", [oldUserId]);
    }
    await query.run("UPDATE users SET role = 'UNIT_PRESIDENT', assignedUnit = ? WHERE id = ? AND role != 'SUPER_ADMIN'", [unit, newUserId]);
    await query.run('INSERT INTO unit_history (unit, userId, fullName, startDate, reason) VALUES (?, ?, ?, ?, ?)', [unit, nextUser.id, nextUser.fullName, new Date().toISOString(), reason || 'Birim devri']);
    return;
  }
  if (!fromUnit || !toUnit) throw new AppError('Kaynak ve hedef birim zorunludur.', 400);
  const user = presidentId
    ? await query.get('SELECT id, fullName FROM users WHERE id = ?', [presidentId])
    : await query.get('SELECT id, fullName FROM users WHERE assignedUnit = ?', [fromUnit]);
  if (!user) throw new AppError('Devredilecek kullanıcı bulunamadı.', 404);
  await query.run('UPDATE unit_history SET endDate = ? WHERE userId = ? AND unit = ? AND endDate IS NULL', [new Date().toISOString(), user.id, fromUnit]);
  await query.run('UPDATE users SET assignedUnit = ? WHERE id = ?', [toUnit, user.id]);
  await query.run('INSERT INTO unit_history (unit, userId, fullName, startDate, reason) VALUES (?, ?, ?, ?, ?)', [toUnit, user.id, user.fullName, new Date().toISOString(), `Devir: ${fromUnit}`]);
};
