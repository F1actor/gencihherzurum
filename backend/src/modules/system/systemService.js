const { query, dbType } = require('../../config/database');
const AppError = require('../../core/errors/AppError');

/**
 * System Service — Sistem ayarları, duyurular, hedefler ve birimler için iş mantığı katmanı.
 */

// ==================== BİRİMLER ====================

exports.getUnits = async () => {
  return query.all('SELECT * FROM units WHERE isActive = 1 ORDER BY id ASC');
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
  const sql = dbType === 'postgres'
    ? 'INSERT INTO announcements (title, body, targetUnit) VALUES (?, ?, ?) RETURNING id'
    : 'INSERT INTO announcements (title, body, targetUnit) VALUES (?, ?, ?)';
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
    const sql = dbType === 'postgres'
      ? 'INSERT INTO targets (unit, month, targetName, targetPoints) VALUES (?, ?, ?, ?) RETURNING id'
      : 'INSERT INTO targets (unit, month, targetName, targetPoints) VALUES (?, ?, ?, ?)';
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

exports.addChampion = async ({ unit, month, pointsEarned }) => {
  if (!unit || !month) throw new AppError('Birim ve ay zorunludur.', 400);
  const sql = dbType === 'postgres'
    ? 'INSERT INTO champions (unit, month, pointsEarned) VALUES (?, ?, ?) RETURNING id'
    : 'INSERT INTO champions (unit, month, pointsEarned) VALUES (?, ?, ?)';
  return query.run(sql, [unit, month, pointsEarned]);
};

// ==================== BİRİM GEÇMİŞİ ====================

exports.getUnitHistory = async () => {
  return query.all('SELECT * FROM unit_history ORDER BY id DESC LIMIT 100');
};

exports.transferUnit = async ({ fromUnit, toUnit, presidentId }) => {
  if (!fromUnit || !toUnit) throw new AppError('Kaynak ve hedef birim zorunludur.', 400);
  await query.run("INSERT INTO unit_history (fromUnit, toUnit, presidentId) VALUES (?, ?, ?)", [fromUnit, toUnit, presidentId || null]);
  await query.run("UPDATE users SET assignedUnit = ? WHERE assignedUnit = ?", [toUnit, fromUnit]);
};
