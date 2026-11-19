const express = require('express');
const router = express.Router();
const authController = require('./authController');
const authValidator = require('./authValidator');
const { authenticateToken } = require('../../middleware/authMiddleware');
const {
  verifyHoneypot,
  verifyTimeLock,
  verifyHumanChallenge,
  createStrictLimiter
} = require('../../middleware/botProtection');

// Katı Hız Sınırları (Brute-force ve Spam Koruması)
const registerLimiter = createStrictLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Kısa süre içinde çok fazla kayıt denemesi yapıldı. Lütfen 15 dakika bekleyin.'
});

const forgotLimiter = createStrictLimiter({
  windowMs: 15 * 60 * 1000,
  max: 4,
  message: 'Şifre sıfırlama talebi sınırına ulaşıldı. Lütfen bir süre sonra tekrar deneyin.'
});

const resendLimiter = createStrictLimiter({
  windowMs: 10 * 60 * 1000,
  max: 3,
  message: 'Çok fazla doğrulama kodu talep edildi. Lütfen 10 dakika sonra tekrar deneyin.'
});

const loginLimiter = createStrictLimiter({
  windowMs: 10 * 60 * 1000,
  max: 10,
  message: 'Çok fazla hatalı giriş denemesi. Lütfen 10 dakika sonra tekrar deneyin.'
});

router.post(
  '/register',
  registerLimiter,
  verifyHoneypot,
  verifyTimeLock,
  verifyHumanChallenge,
  authValidator.validateRegister,
  authController.register
);

router.post(
  '/forgot-password',
  forgotLimiter,
  verifyHoneypot,
  verifyTimeLock,
  verifyHumanChallenge,
  authValidator.validateForgotPassword,
  authController.forgotPassword
);

router.post(
  '/resend-otp',
  resendLimiter,
  authController.resendOtp
);

router.post(
  '/login',
  loginLimiter,
  authValidator.validateLogin,
  authController.login
);

router.post('/verify-otp', authValidator.validateVerifyOtp, authController.verifyOtp);
router.post('/reset-password', authValidator.validateResetPassword, authController.resetPassword);
router.get('/me', authenticateToken, authController.getMe);
router.post('/refresh', authenticateToken, authController.refreshSession);
router.put('/update-profile', authenticateToken, authController.updateProfile);

module.exports = router;
