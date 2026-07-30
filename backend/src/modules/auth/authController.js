const authService = require('./authService');

/**
 * Auth Controller — Sadece HTTP istek/yanıt sorumlulukları.
 * İş mantığı authService'e devredilmiştir.
 */

exports.register = async (req, res, next) => {
  try {
    await authService.registerUser(req.body);
    return res.status(201).json({ message: 'Kayıt başarılı. Lütfen e-posta adresinize gönderilen doğrulama kodunu girin.' });
  } catch (err) { next(err); }
};

exports.verifyOtp = async (req, res, next) => {
  try {
    await authService.verifyOtpCode(req.body);
    return res.status(200).json({ message: 'E-posta adresiniz başarıyla doğrulandı. Hesabınızın Süper Admin tarafından onaylanıp bir birime atanmasını bekleyin.' });
  } catch (err) { next(err); }
};

exports.resendOtp = async (req, res, next) => {
  try {
    await authService.resendOtpCode(req.body);
    return res.status(200).json({ message: 'Yeni doğrulama kodu gönderildi.' });
  } catch (err) { next(err); }
};

exports.login = async (req, res, next) => {
  try {
    const result = await authService.loginUser(req.body);
    return res.status(200).json(result);
  } catch (err) {
    if (err.data) {
      return res.status(err.statusCode).json({ message: err.message, ...err.data });
    }
    next(err);
  }
};

exports.getMe = (req, res) => {
  return res.status(200).json({ user: req.user });
};

exports.updateProfile = async (req, res, next) => {
  try {
    await authService.updateUserProfile({ userId: req.user.id, ...req.body });
    return res.status(200).json({ message: 'Profiliniz başarıyla güncellendi.' });
  } catch (err) { next(err); }
};

exports.forgotPassword = async (req, res, next) => {
  try {
    await authService.forgotPasswordRequest(req.body);
    return res.status(200).json({ message: 'E-posta adresinize şifre sıfırlama kodu gönderildi.' });
  } catch (err) { next(err); }
};

exports.resetPassword = async (req, res, next) => {
  try {
    await authService.resetUserPassword(req.body);
    return res.status(200).json({ message: 'Şifreniz başarıyla sıfırlandı. Giriş yapabilirsiniz.' });
  } catch (err) { next(err); }
};
