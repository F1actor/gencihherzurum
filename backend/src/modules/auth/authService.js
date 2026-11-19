const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../../config/database');
const { sendOtpEmail } = require('../../services/emailService');
const AppError = require('../../core/errors/AppError');
const { randomInt } = require('crypto');
const { checkDisposableEmail, checkSystemEmail, checkEmailCooldown } = require('../../middleware/botProtection');

function generateOtp() {
  return randomInt(100000, 1000000).toString();
}

function createSessionToken(user) {
  if (!process.env.JWT_SECRET) throw new AppError('Oturum yapılandırması eksik.', 503);
  return jwt.sign(
    { id: user.id, role: user.role, assignedUnit: user.assignedUnit },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '10m' }
  );
}

/**
 * Auth Service — Kimlik doğrulama iş mantığı katmanı.
 * Controller'ı HTTP sorumluluktan arındırır.
 */

exports.registerUser = async ({ fullName, email, password, phoneNumber }) => {
  const cleanEmail = email.toLowerCase().trim();

  // 1. Sistem/yönetici e-postasıyla doğrudan kayıt engeli (self-email spam döngüsünü keser)
  if (checkSystemEmail(cleanEmail)) {
    throw new AppError('Bu e-posta adresi doğrudan kayıt için kullanılamaz.', 400);
  }

  // 2. Geçici / sahte e-posta adresi engeli
  if (checkDisposableEmail(cleanEmail)) {
    throw new AppError('Geçici veya tek kullanımlık e-posta adresleri kabul edilmemektedir.', 400);
  }

  // 3. E-posta bazlı spam gönderim sınırlayıcısı (Cooldown & Rate limit)
  checkEmailCooldown(cleanEmail, 60, 3);

  const userExists = await query.get('SELECT id, isEmailVerified FROM users WHERE email = ?', [cleanEmail]);
  if (userExists && userExists.isEmailVerified === 1) {
    throw new AppError('Bu e-posta adresi zaten kullanımda.', 400);
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  const otpCode = generateOtp();
  const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  let targetUserId;
  if (userExists && userExists.isEmailVerified === 0) {
    // Daha önce onaylanmamış kayıt varsa güncelle
    await query.run(
      `UPDATE users SET fullName = ?, passwordHash = ?, phoneNumber = ?, otpCode = ?, otpExpiresAt = ? WHERE id = ?`,
      [fullName, passwordHash, phoneNumber, otpCode, otpExpiresAt, userExists.id]
    );
    targetUserId = userExists.id;
  } else {
    const created = await query.run(
      `INSERT INTO users (fullName, email, passwordHash, role, phoneNumber, isEmailVerified, otpCode, otpExpiresAt)
       VALUES (?, ?, ?, 'PENDING', ?, 0, ?, ?)`,
      [fullName, cleanEmail, passwordHash, phoneNumber, otpCode, otpExpiresAt]
    );
    targetUserId = created.id;
  }

  try {
    await sendOtpEmail(cleanEmail, fullName, otpCode);
  } catch (error) {
    if (!userExists) {
      await query.run('DELETE FROM users WHERE id = ? AND isEmailVerified = 0', [targetUserId]);
    }
    throw new AppError('Doğrulama e-postası gönderilemedi. Lütfen daha sonra tekrar deneyin.', 503);
  }
};

exports.verifyOtpCode = async ({ email, otpCode }) => {
  const cleanEmail = email.toLowerCase().trim();
  const user = await query.get('SELECT * FROM users WHERE email = ?', [cleanEmail]);
  if (!user) throw new AppError('Kullanıcı bulunamadı.', 404);
  if (user.isEmailVerified === 1) throw new AppError('E-posta adresi zaten doğrulanmış.', 400);
  if (user.otpCode !== otpCode) throw new AppError('Geçersiz doğrulama kodu.', 400);
  if (new Date(user.otpExpiresAt) < new Date()) throw new AppError('Doğrulama kodunun süresi dolmuş.', 400);

  await query.run(
    'UPDATE users SET isEmailVerified = 1, otpCode = NULL, otpExpiresAt = NULL WHERE id = ?',
    [user.id]
  );
};

exports.resendOtpCode = async ({ email }) => {
  const cleanEmail = email.toLowerCase().trim();
  checkEmailCooldown(cleanEmail, 60, 3);

  const user = await query.get('SELECT * FROM users WHERE email = ?', [cleanEmail]);
  if (!user) throw new AppError('Kullanıcı bulunamadı.', 404);
  if (user.isEmailVerified === 1) throw new AppError('E-posta adresi zaten doğrulanmış.', 400);

  const otpCode = generateOtp();
  const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  await query.run('UPDATE users SET otpCode = ?, otpExpiresAt = ? WHERE id = ?', [otpCode, otpExpiresAt, user.id]);
  try { await sendOtpEmail(user.email, user.fullName, otpCode); }
  catch { throw new AppError('Doğrulama e-postası gönderilemedi. Lütfen daha sonra tekrar deneyin.', 503); }
};

exports.loginUser = async ({ email, password }) => {
  const cleanEmail = email.toLowerCase().trim();
  const user = await query.get('SELECT * FROM users WHERE email = ?', [cleanEmail]);
  if (!user) throw new AppError('Hatalı e-posta veya şifre.', 401);

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) throw new AppError('Hatalı e-posta veya şifre.', 401);

  if (user.isEmailVerified !== 1) {
    const err = new AppError('Lütfen önce e-posta adresinizi doğrulayın.', 403);
    err.data = { isEmailVerified: false, email: user.email };
    throw err;
  }

  const token = createSessionToken(user);

  return {
    token,
    user: {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      assignedUnit: user.assignedUnit,
      phoneNumber: user.phoneNumber
    }
  };
};

exports.refreshSession = user => ({ token: createSessionToken(user) });

exports.updateUserProfile = async ({ userId, phoneNumber, currentPassword, newPassword }) => {
  if (phoneNumber) {
    await query.run('UPDATE users SET phoneNumber = ? WHERE id = ?', [phoneNumber, userId]);
  }

  if (currentPassword && newPassword) {
    const user = await query.get('SELECT passwordHash FROM users WHERE id = ?', [userId]);
    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) throw new AppError('Mevcut şifreniz yanlış.', 400);

    const salt = await bcrypt.genSalt(10);
    const newHash = await bcrypt.hash(newPassword, salt);
    await query.run('UPDATE users SET passwordHash = ?, resetOtpCode = NULL, resetOtpExpiresAt = NULL WHERE id = ?', [newHash, userId]);
  }
};

exports.forgotPasswordRequest = async ({ email }) => {
  const cleanEmail = email.toLowerCase().trim();
  // E-posta flood koruması
  checkEmailCooldown(cleanEmail, 60, 3);

  const user = await query.get('SELECT id, fullName FROM users WHERE email = ?', [cleanEmail]);
  if (!user) return; // Güvenlik: Kullanıcı olmasa bile enumeration vermemek için başarılı gibi davranıyoruz

  const otpCode = generateOtp();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  await query.run('UPDATE users SET resetOtpCode = ?, resetOtpExpiresAt = ? WHERE id = ?', [otpCode, expiresAt, user.id]);
  try { await sendOtpEmail(cleanEmail, user.fullName, otpCode, 'reset'); }
  catch { /* Aynı yanıtı koruyarak hesap varlığını açığa çıkarmıyoruz. */ }
};

exports.resetUserPassword = async ({ email, otpCode, newPassword }) => {
  const cleanEmail = email.toLowerCase().trim();
  const user = await query.get('SELECT * FROM users WHERE email = ?', [cleanEmail]);
  if (!user || !user.resetOtpCode) throw new AppError('Geçersiz istek.', 400);
  if (user.resetOtpCode !== otpCode) throw new AppError('Hatalı doğrulama kodu.', 400);
  if (new Date(user.resetOtpExpiresAt) < new Date()) throw new AppError('Kodun süresi dolmuş. Lütfen tekrar deneyin.', 400);

  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(newPassword, salt);
  await query.run('UPDATE users SET passwordHash = ?, resetOtpCode = NULL, resetOtpExpiresAt = NULL WHERE id = ?', [hash, user.id]);
};
