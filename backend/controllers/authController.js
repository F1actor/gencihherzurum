const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../config/database');
const { sendOtpEmail } = require('../services/emailService');

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6 haneli OTP
}

exports.register = async (req, res) => {
  const { fullName, email, password, phoneNumber } = req.body;

  if (!fullName || !email || !password || !phoneNumber) {
    return res.status(400).json({ message: 'Lütfen tüm alanları doldurun.' });
  }

  try {
    // E-posta kontrolü
    const userExists = await query.get('SELECT id FROM users WHERE email = ?', [email.toLowerCase()]);
    if (userExists) {
      return res.status(400).json({ message: 'Bu e-posta adresi zaten kullanımda.' });
    }

    // Şifre şifreleme
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // OTP Kodu oluşturma (10 dk geçerli)
    const otpCode = generateOtp();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    // Veritabanına kaydet
    await query.run(
      `INSERT INTO users (fullName, email, passwordHash, role, phoneNumber, isEmailVerified, otpCode, otpExpiresAt)
       VALUES (?, ?, ?, 'PENDING', ?, 0, ?, ?)`,
      [fullName, email.toLowerCase(), passwordHash, phoneNumber, otpCode, otpExpiresAt]
    );

    // E-posta gönderimi (Arka planda çalışır, istek hızını düşürmemek için await edilmeyebilir ama hata kontrolü için loglayalım)
    sendOtpEmail(email.toLowerCase(), fullName, otpCode);

    return res.status(201).json({
      message: 'Kayıt başarılı. Lütfen e-posta adresinize gönderilen doğrulama kodunu girin.'
    });
  } catch (error) {
    console.error('Kayıt hatası:', error);
    return res.status(500).json({ message: 'Sunucu hatası oluştu.' });
  }
};

exports.verifyOtp = async (req, res) => {
  const { email, otpCode } = req.body;

  if (!email || !otpCode) {
    return res.status(400).json({ message: 'E-posta ve doğrulama kodu zorunludur.' });
  }

  try {
    const user = await query.get('SELECT * FROM users WHERE email = ?', [email.toLowerCase()]);

    if (!user) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı.' });
    }

    if (user.isEmailVerified === 1) {
      return res.status(400).json({ message: 'E-posta adresi zaten doğrulanmış.' });
    }

    // OTP kontrolü
    if (user.otpCode !== otpCode) {
      return res.status(400).json({ message: 'Geçersiz doğrulama kodu.' });
    }

    // Süre kontrolü
    const expiresAt = new Date(user.otpExpiresAt);
    if (expiresAt < new Date()) {
      return res.status(400).json({ message: 'Doğrulama kodunun süresi dolmuş. Lütfen yeni bir kod talep edin.' });
    }

    // Doğrulamayı onayla
    await query.run(
      'UPDATE users SET isEmailVerified = 1, otpCode = NULL, otpExpiresAt = NULL WHERE id = ?',
      [user.id]
    );

    return res.status(200).json({ message: 'E-posta adresiniz başarıyla doğrulandı. Hesabınızın Süper Admin tarafından onaylanıp bir birime atanmasını bekleyin.' });
  } catch (error) {
    console.error('OTP doğrulama hatası:', error);
    return res.status(500).json({ message: 'Sunucu hatası oluştu.' });
  }
};

exports.resendOtp = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'E-posta adresi zorunludur.' });
  }

  try {
    const user = await query.get('SELECT * FROM users WHERE email = ?', [email.toLowerCase()]);

    if (!user) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı.' });
    }

    if (user.isEmailVerified === 1) {
      return res.status(400).json({ message: 'E-posta adresi zaten doğrulanmış.' });
    }

    const otpCode = generateOtp();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    await query.run(
      'UPDATE users SET otpCode = ?, otpExpiresAt = ? WHERE id = ?',
      [otpCode, otpExpiresAt, user.id]
    );

    sendOtpEmail(user.email, user.fullName, otpCode);

    return res.status(200).json({ message: 'Yeni doğrulama kodu gönderildi.' });
  } catch (error) {
    console.error('OTP tekrar gönderme hatası:', error);
    return res.status(500).json({ message: 'Sunucu hatası oluştu.' });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Lütfen tüm alanları doldurun.' });
  }

  try {
    const user = await query.get('SELECT * FROM users WHERE email = ?', [email.toLowerCase()]);

    if (!user) {
      return res.status(401).json({ message: 'Hatalı e-posta veya şifre.' });
    }

    // Şifre kontrolü
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Hatalı e-posta veya şifre.' });
    }

    // E-posta onaylanmış mı?
    if (user.isEmailVerified !== 1) {
      return res.status(403).json({
        message: 'Lütfen önce e-posta adresinizi doğrulayın.',
        isEmailVerified: false,
        email: user.email
      });
    }

    // JWT token oluşturma
    const token = jwt.sign(
      { id: user.id, role: user.role, assignedUnit: user.assignedUnit },
      process.env.JWT_SECRET || 'gencihh_erzurum_teakip_gizli_anahtar_2026',
      { expiresIn: '24h' }
    );

    return res.status(200).json({
      token,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        assignedUnit: user.assignedUnit
      }
    });
  } catch (error) {
    console.error('Giriş hatası:', error);
    return res.status(500).json({ message: 'Sunucu hatası oluştu.' });
  }
};

exports.getMe = async (req, res) => {
  return res.status(200).json({ user: req.user });
};

exports.updateProfile = async (req, res) => {
  const { phoneNumber, currentPassword, newPassword } = req.body;
  const userId = req.user.id;

  try {
    if (phoneNumber) {
      await query.run('UPDATE users SET phoneNumber = ? WHERE id = ?', [phoneNumber, userId]);
    }

    if (currentPassword && newPassword) {
      const user = await query.get('SELECT passwordHash FROM users WHERE id = ?', [userId]);
      const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isMatch) {
        return res.status(400).json({ message: 'Mevcut şifreniz yanlış.' });
      }

      const salt = await bcrypt.genSalt(10);
      const newHash = await bcrypt.hash(newPassword, salt);
      await query.run('UPDATE users SET passwordHash = ? WHERE id = ?', [newHash, userId]);
    }

    return res.status(200).json({ message: 'Profiliniz başarıyla güncellendi.' });
  } catch (error) {
    console.error('Profil güncelleme hatası:', error);
    return res.status(500).json({ message: 'Sunucu hatası oluştu.' });
  }
};

// Şifre sıfırlama: 1. Adım - OTP gönder
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'E-posta adresi zorunludur.' });

  try {
    const user = await query.get('SELECT id, fullName FROM users WHERE email = ?', [email.toLowerCase()]);
    // Güvenlik: kullanıcı yoksa bile başarılı mesaj döndür
    if (!user) return res.status(200).json({ message: 'E-posta adresinize şifre sıfırlama kodu gönderildi.' });

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    await query.run('UPDATE users SET resetOtpCode = ?, resetOtpExpiresAt = ? WHERE id = ?', [otpCode, expiresAt, user.id]);

    sendOtpEmail(email.toLowerCase(), user.fullName, otpCode, 'reset');

    return res.status(200).json({ message: 'E-posta adresinize şifre sıfırlama kodu gönderildi.' });
  } catch (error) {
    console.error('Şifre sıfırlama OTP hatası:', error);
    return res.status(500).json({ message: 'Sunucu hatası oluştu.' });
  }
};

// Şifre sıfırlama: 2. Adım - OTP doğrula & yeni şifre kaydet
exports.resetPassword = async (req, res) => {
  const { email, otpCode, newPassword } = req.body;
  if (!email || !otpCode || !newPassword) {
    return res.status(400).json({ message: 'E-posta, doğrulama kodu ve yeni şifre zorunludur.' });
  }

  try {
    const user = await query.get('SELECT * FROM users WHERE email = ?', [email.toLowerCase()]);
    if (!user || !user.resetOtpCode) return res.status(400).json({ message: 'Geçersiz istek.' });

    if (user.resetOtpCode !== otpCode) return res.status(400).json({ message: 'Hatalı doğrulama kodu.' });

    const expires = new Date(user.resetOtpExpiresAt);
    if (expires < new Date()) return res.status(400).json({ message: 'Kodun süresi dolmuş. Lütfen tekrar deneyin.' });

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(newPassword, salt);

    await query.run('UPDATE users SET passwordHash = ?, resetOtpCode = NULL, resetOtpExpiresAt = NULL WHERE id = ?', [hash, user.id]);

    return res.status(200).json({ message: 'Şifreniz başarıyla sıfırlandı. Giriş yapabilirsiniz.' });
  } catch (error) {
    console.error('Şifre sıfırlama hatası:', error);
    return res.status(500).json({ message: 'Sunucu hatası oluştu.' });
  }
};

