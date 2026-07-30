const express = require('express');
const router = express.Router();
const llmController = require('./llmController');
const { authenticateToken } = require('../../middleware/authMiddleware');

// Tüm rotalar korumalıdır (sadece giriş yapmış kullanıcılar chat kullanabilir)
router.use(authenticateToken);

// Chat endpoint'i
router.post('/chat', llmController.chatWithAI);

module.exports = router;
