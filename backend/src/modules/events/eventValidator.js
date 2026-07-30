const AppError = require('../../core/errors/AppError');

exports.validateCreateEvent = (req, res, next) => {
  const { type, title, eventDate } = req.body;
  if (!type || !title || !eventDate) return next(new AppError('Etkinlik türü, başlığı ve tarihi zorunludur.', 400));
  const validTypes = ['ROUTINE', 'EXTRA', 'TARGET'];
  if (!validTypes.includes(type)) return next(new AppError('Geçersiz etkinlik türü.', 400));
  next();
};
