const AppError = require('../core/errors/AppError');

function securityHeaders(req, res, next) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  if (process.env.NODE_ENV === 'production') res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
}

function createRateLimiter({ windowMs, max, key = (req) => req.ip }) {
  const requests = new Map();
  return (req, res, next) => {
    const now = Date.now();
    const requestKey = key(req);
    const bucket = (requests.get(requestKey) || []).filter(timestamp => now - timestamp < windowMs);
    bucket.push(now);
    requests.set(requestKey, bucket);
    if (bucket.length > max) {
      res.setHeader('Retry-After', Math.ceil(windowMs / 1000));
      return next(new AppError('Çok fazla istek gönderildi. Lütfen kısa süre sonra tekrar deneyin.', 429));
    }
    next();
  };
}

module.exports = { securityHeaders, createRateLimiter };
