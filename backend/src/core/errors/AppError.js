/**
 * AppError — Uygulamaya özel merkezi hata sınıfı.
 * Operasyonel hataları (4xx, 5xx) güvenli biçimde temsil eder.
 */
class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
