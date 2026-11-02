const { query } = require('../../config/database');
const AppError = require('../../core/errors/AppError');
const { sendUnitAssignmentEmail } = require('../../services/emailService');

/**
 * Admin Service — Admin paneli iş mantığı katmanı.
 */

exports.getActiveUnits = async () => {
  const rows = await query.all('SELECT name FROM units WHERE isActive = 1 ORDER BY id ASC');
  return rows.map(r => r.name);
};

exports.getPendingUsers = async () => {
  return query.all(
    "SELECT id, fullName, email, phoneNumber, role, createdAt FROM users WHERE role = 'PENDING' AND isEmailVerified = 1 ORDER BY id DESC"
  );
};

exports.getUsers = async () => {
  return query.all(
    "SELECT id, fullName, email, phoneNumber, role, assignedUnit, isEmailVerified, receivesVolunteerApplications, createdAt FROM users WHERE email != 'admin@gencihh.org' ORDER BY role ASC, id DESC"
  );
};

exports.assignUnit = async ({ userId, unit, role = 'UNIT_PRESIDENT' }) => {
  const validUnits = await exports.getActiveUnits();
  if (!validUnits.includes(unit)) throw new AppError('Geçersiz bir birim seçtiniz.', 400);

  const user = await query.get('SELECT * FROM users WHERE id = ?', [userId]);
  if (!user) throw new AppError('Kullanıcı bulunamadı.', 404);

  const existingPresident = await query.get('SELECT fullName FROM users WHERE assignedUnit = ? AND id != ?', [unit, userId]);
  const allowedRoles = ['UNIT_PRESIDENT', 'MUHABBET_COORDINATOR', 'MUHABBET_TEACHER', 'IL_BASKANI', 'IL_TESKILAT_BASKANI'];
  const assignedRole = allowedRoles.includes(role) ? role : 'UNIT_PRESIDENT';

  await query.run('UPDATE users SET role = ?, assignedUnit = ? WHERE id = ?', [assignedRole, unit, userId]);
  await query.run('UPDATE unit_history SET endDate = ? WHERE userId = ? AND endDate IS NULL', [new Date().toISOString(), userId]);
  await query.run('INSERT INTO unit_history (unit, userId, fullName, startDate, reason) VALUES (?, ?, ?, ?, ?)', [unit, userId, user.fullName, new Date().toISOString(), 'Yönetici ataması']);

  await query.run(
    "INSERT INTO audits (logType, message) VALUES ('SYSTEM', ?)",
    [`Yönetici Ataması: ${user.fullName} -> ${unit} (Yetki: ${assignedRole})`]
  );

  const roleLabel = {
    SUPER_ADMIN: 'Süper Admin',
    IL_BASKANI: 'İl Başkanı',
    IL_TESKILAT_BASKANI: 'İl Teşkilat Başkanı',
    MUHABBET_COORDINATOR: 'Yaz Okulu Koordinatörü',
    MUHABBET_TEACHER: 'Yaz Okulu Hocası'
  }[assignedRole] || 'Birim Başkanı';

  let message = `${user.fullName} kullanıcısı ${unit} olarak atandı ve ${roleLabel} yetkileri tanımlandı.`;
  if (existingPresident) message += ` Not: Bu birimde daha önce ${existingPresident.fullName} atanmıştı.`;

  const emailSent = await sendUnitAssignmentEmail(user.email, user.fullName, unit, roleLabel);
  message += emailSent
    ? ' Onay e-postası kullanıcıya gönderildi.'
    : ' Atama tamamlandı; onay e-postası gönderilemedi. SMTP ayarlarını kontrol edin.';

  return message;
};

exports.updateUserRole = async ({ userId, role, requesterId }) => {
  if (Number(userId) === Number(requesterId)) throw new AppError('Kendi yetkinizi bu ekrandan değiştiremezsiniz.', 400);
  const user = await query.get('SELECT id, fullName, assignedUnit FROM users WHERE id = ?', [userId]);
  if (!user) throw new AppError('Kullanıcı bulunamadı.', 404);

  await query.run('UPDATE users SET role = ? WHERE id = ?', [role, userId]);
  await query.run("INSERT INTO audits (logType, message) VALUES ('SYSTEM', ?)", [`Rol Güncellendi: ${user.fullName} -> ${role}`]);
  return user;
};

exports.setVolunteerRecipient = async ({ userId, enabled }) => {
  const user = await query.get('SELECT id, fullName, isEmailVerified FROM users WHERE id = ?', [userId]);
  if (!user) throw new AppError('Kullanici bulunamadi.', 404);
  if (user.isEmailVerified !== 1) throw new AppError('E-posta dogrulamasi tamamlanmamis kullanici basvuru alicisi olamaz.', 400);
  if (enabled) await query.run('UPDATE users SET receivesVolunteerApplications = 0');
  await query.run('UPDATE users SET receivesVolunteerApplications = ? WHERE id = ?', [enabled ? 1 : 0, userId]);
  return { ...user, receivesVolunteerApplications: Boolean(enabled) };
};

exports.getRoutines = async () => {
  return query.all('SELECT * FROM routines ORDER BY unit ASC, dayOfWeek ASC');
};

exports.createRoutine = async ({ unit, title, dayOfWeek }) => {
  if (!unit || !title || !dayOfWeek) throw new AppError('Lütfen tüm alanları doldurun.', 400);
  const dayInt = parseInt(dayOfWeek);
  if (isNaN(dayInt) || dayInt < 1 || dayInt > 7) throw new AppError("Haftanın günü 1-7 arasında olmalıdır.", 400);
  const result = await query.run('INSERT INTO routines (unit, title, dayOfWeek) VALUES (?, ?, ?)', [unit, title, dayInt]);
  return { id: result.id, unit, title, dayOfWeek: dayInt };
};

exports.deleteRoutine = async (id) => {
  const routine = await query.get('SELECT * FROM routines WHERE id = ?', [id]);
  if (!routine) throw new AppError('Rutin görev bulunamadı.', 404);
  await query.run('DELETE FROM routines WHERE id = ?', [id]);
};

exports.getAudits = async () => {
  return query.all('SELECT * FROM audits ORDER BY id DESC LIMIT 100');
};

exports.deleteUser = async ({ userId, requesterId }) => {
  if (parseInt(userId) === parseInt(requesterId)) throw new AppError('Kendi hesabınızı silemezsiniz.', 400);
  const user = await query.get('SELECT * FROM users WHERE id = ?', [userId]);
  if (!user) throw new AppError('Kullanıcı bulunamadı.', 404);
  await query.run('DELETE FROM events WHERE userId = ?', [userId]);
  await query.run('DELETE FROM users WHERE id = ?', [userId]);
  await query.run("INSERT INTO audits (logType, message) VALUES ('SYSTEM', ?)", [`Kullanıcı Silindi: ${user.fullName} (${user.assignedUnit || 'Birim atanmamış'})`]);
};

exports.getAllEventsWithProofs = async () => {
  return query.all(
    `SELECT e.id, e.title, e.description, e.participantCount, e.type, e.unit, e.eventDate, e.pointsEarned, e.proofImagePath, e.createdAt,
            u.fullName as presidentName, u.email as presidentEmail
     FROM events e
     JOIN users u ON e.userId = u.id
     ORDER BY e.id DESC`
  );
};
