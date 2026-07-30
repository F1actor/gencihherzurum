const AppError = require('../../core/errors/AppError');

/**
 * Auth modülü giriş doğrulama katmanı.
 * Controller'a ulaşmadan önce tüm zorunlu alanları kontrol eder.
 */

exports.validateRegister = (req, res, next) => {
  const { fullName, email, password, phoneNumber } = req.body;
  if (!fullName || !email || !password || !phoneNumber) {
    return next(new AppError('Lütfen tüm alanları doldurun.', 400));
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return next(new AppError('Geçerli bir e-posta adresi girin.', 400));
  }
  if (password.length < 6) {
    return next(new AppError('Şifre en az 6 karakter olmalıdır.', 400));
  }
  next();
};

exports.validateLogin = (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return next(new AppError('E-posta ve şifre zorunludur.', 400));
  }
  next();
};

exports.validateVerifyOtp = (req, res, next) => {
  const { email, otpCode } = req.body;
  if (!email || !otpCode) {
    return next(new AppError('E-posta ve doğrulama kodu zorunludur.', 400));
  }
  next();
};

exports.validateForgotPassword = (req, res, next) => {
  const { email } = req.body;
  if (!email) {
    return next(new AppError('E-posta adresi zorunludur.', 400));
  }
  next();
};

exports.validateResetPassword = (req, res, next) => {
  const { email, otpCode, newPassword } = req.body;
  if (!email || !otpCode || !newPassword) {
    return next(new AppError('E-posta, doğrulama kodu ve yeni şifre zorunludur.', 400));
  }
  if (newPassword.length < 6) {
    return next(new AppError('Yeni şifre en az 6 karakter olmalıdır.', 400));
  }
  next();
};
