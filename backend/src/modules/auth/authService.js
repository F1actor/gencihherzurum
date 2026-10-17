const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../../config/database');
const { sendOtpEmail } = require('../../services/emailService');
const AppError = require('../../core/errors/AppError');

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Auth Service — Kimlik doğrulama iş mantığı katmanı.
 * Controller'ı HTTP sorumluluktan arındırır.
 */

exports.registerUser = async ({ fullName, email, password, phoneNumber }) => {
  const userExists = await query.get('SELECT id FROM users WHERE email = ?', [email.toLowerCase()]);
  if (userExists) throw new AppError('Bu e-posta adresi zaten kullanımda.', 400);

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  const otpCode = generateOtp();
  const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  await query.run(
    `INSERT INTO users (fullName, email, passwordHash, role, phoneNumber, isEmailVerified, otpCode, otpExpiresAt)
     VALUES (?, ?, ?, 'PENDING', ?, 0, ?, ?)`,
    [fullName, email.toLowerCase(), passwordHash, phoneNumber, otpCode, otpExpiresAt]
  );

  sendOtpEmail(email.toLowerCase(), fullName, otpCode);
};

exports.verifyOtpCode = async ({ email, otpCode }) => {
  const user = await query.get('SELECT * FROM users WHERE email = ?', [email.toLowerCase()]);
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
  const user = await query.get('SELECT * FROM users WHERE email = ?', [email.toLowerCase()]);
  if (!user) throw new AppError('Kullanıcı bulunamadı.', 404);
  if (user.isEmailVerified === 1) throw new AppError('E-posta adresi zaten doğrulanmış.', 400);

  const otpCode = generateOtp();
  const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  await query.run('UPDATE users SET otpCode = ?, otpExpiresAt = ? WHERE id = ?', [otpCode, otpExpiresAt, user.id]);
  sendOtpEmail(user.email, user.fullName, otpCode);
};

exports.loginUser = async ({ email, password }) => {
  const user = await query.get('SELECT * FROM users WHERE email = ?', [email.toLowerCase()]);
  if (!user) throw new AppError('Hatalı e-posta veya şifre.', 401);

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) throw new AppError('Hatalı e-posta veya şifre.', 401);

  if (user.isEmailVerified !== 1) {
    const err = new AppError('Lütfen önce e-posta adresinizi doğrulayın.', 403);
    err.data = { isEmailVerified: false, email: user.email };
    throw err;
  }

  if (!process.env.JWT_SECRET) throw new AppError('Oturum yapılandırması eksik.', 503);
  const token = jwt.sign(
    { id: user.id, role: user.role, assignedUnit: user.assignedUnit },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );

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
    await query.run('UPDATE users SET passwordHash = ? WHERE id = ?', [newHash, userId]);
  }
};

exports.forgotPasswordRequest = async ({ email }) => {
  const user = await query.get('SELECT id, fullName FROM users WHERE email = ?', [email.toLowerCase()]);
  if (!user) return; // güvenlik: kullanıcı yoksa bile başarılı mesaj dön

  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  await query.run('UPDATE users SET resetOtpCode = ?, resetOtpExpiresAt = ? WHERE id = ?', [otpCode, expiresAt, user.id]);
  sendOtpEmail(email.toLowerCase(), user.fullName, otpCode, 'reset');
};

exports.resetUserPassword = async ({ email, otpCode, newPassword }) => {
  const user = await query.get('SELECT * FROM users WHERE email = ?', [email.toLowerCase()]);
  if (!user || !user.resetOtpCode) throw new AppError('Geçersiz istek.', 400);
  if (user.resetOtpCode !== otpCode) throw new AppError('Hatalı doğrulama kodu.', 400);
  if (new Date(user.resetOtpExpiresAt) < new Date()) throw new AppError('Kodun süresi dolmuş. Lütfen tekrar deneyin.', 400);

  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(newPassword, salt);
  await query.run('UPDATE users SET passwordHash = ?, resetOtpCode = NULL, resetOtpExpiresAt = NULL WHERE id = ?', [hash, user.id]);
};
