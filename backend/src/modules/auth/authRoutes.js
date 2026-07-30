const express = require('express');
const router = express.Router();
const authController = require('./authController');
const authValidator = require('./authValidator');
const { authenticateToken } = require('../../middleware/authMiddleware');

router.post('/register', authValidator.validateRegister, authController.register);
router.post('/verify-otp', authValidator.validateVerifyOtp, authController.verifyOtp);
router.post('/resend-otp', authController.resendOtp);
router.post('/login', authValidator.validateLogin, authController.login);
router.post('/forgot-password', authValidator.validateForgotPassword, authController.forgotPassword);
router.post('/reset-password', authValidator.validateResetPassword, authController.resetPassword);
router.get('/me', authenticateToken, authController.getMe);
router.put('/update-profile', authenticateToken, authController.updateProfile);

module.exports = router;
