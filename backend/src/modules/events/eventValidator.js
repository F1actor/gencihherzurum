const AppError = require('../../core/errors/AppError');

exports.validateCreateEvent = (req, res, next) => {
  const { type, title, eventDate, participantCount } = req.body;
  if (!type || !title || !eventDate) return next(new AppError('Etkinlik türü, başlığı ve tarihi zorunludur.', 400));
  const validTypes = ['ROUTINE', 'EXTRA', 'TARGET'];
  if (!validTypes.includes(type)) return next(new AppError('Geçersiz etkinlik türü.', 400));
  const participantTotal = Number.parseInt(participantCount, 10);
  if (!Number.isInteger(participantTotal) || participantTotal < 1 || participantTotal > 100000) {
    return next(new AppError('Katılımcı sayısı 1 ile 100000 arasında olmalıdır.', 400));
  }
  next();
};
