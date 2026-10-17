const AppError = require('../core/errors/AppError');

/**
 * Global Express hata yakalama middleware'i.
 * Tüm next(err) çağrılarını merkezi olarak karşılar.
 */
const errorMiddleware = (err, req, res, next) => {
  const isPayloadTooLarge = err.type === 'entity.too.large';
  const isMulterError = err.name === 'MulterError';
  const statusCode = err.statusCode || (isPayloadTooLarge ? 413 : isMulterError ? 400 : 500);
  const message = err.isOperational ? err.message : 'Sunucuda beklenmeyen bir hata oluştu.';

  if (process.env.NODE_ENV !== 'production') {
    console.error(`[ERROR] ${statusCode} - ${err.message}`);
    if (!err.isOperational) console.error(err.stack);
  }

  return res.status(statusCode).json({ message });
};

module.exports = errorMiddleware;
