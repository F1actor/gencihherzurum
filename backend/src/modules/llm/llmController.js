const llmService = require('./llmService');

/**
 * LLM Controller — Sadece HTTP katmanı.
 */

exports.chatWithAI = async (req, res, next) => {
  try {
    const reply = await llmService.chatWithAI(req.body);
    return res.status(200).json({ reply });
  } catch (err) {
    if (err.message && err.message.includes('API key not valid')) {
      return res.status(500).json({ message: 'Yapay zeka sistemi için tanımlanan API anahtarı geçersiz. Lütfen yöneticinize bildirin.' });
    }
    next(err);
  }
};
