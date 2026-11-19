const AppError = require('../core/errors/AppError');

/**
 * Bilinen tek kullanımlık / sahte e-posta sağlayıcıları listesi.
 */
const DISPOSABLE_EMAIL_DOMAINS = new Set([
  'tempmail.com', 'temp-mail.org', '10minutemail.com', 'mailinator.com',
  'guerrillamail.com', 'sharklasers.com', 'throwawaymail.com', 'yopmail.com',
  'trashmail.com', 'getairmail.com', 'mohmal.com', 'dispostable.com',
  'fakeinbox.com', 'crazymailing.com', 'maildrop.cc', 'tempmailaddress.com',
  'burnermail.io', 'inboxkitten.com', 'mytemp.email', 'dropmail.me'
]);

/**
 * İstemcinin gerçek IP adresini tespit eder (Nginx / cPanel reverse proxy arkasında).
 */
function getClientIp(req) {
  const cfIp = req.headers['cf-connecting-ip'];
  if (cfIp) return cfIp;

  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0].trim();
  }

  const realIp = req.headers['x-real-ip'];
  if (realIp) return realIp;

  return req.ip || req.connection?.remoteAddress || '127.0.0.1';
}

/**
 * 1. Bal Küpü (Honeypot) Koruması:
 * İnsanların görmediği gizli alanları kontrol eder.
 * Botlar doldurursa sessizce 200 döner, veritabanına ve SMTP'ye dokunmaz.
 */
function verifyHoneypot(req, res, next) {
  const honeypotFields = ['hp_website', 'hp_token', 'website', '_hp_check'];
  for (const field of honeypotFields) {
    const value = req.body?.[field];
    if (value && typeof value === 'string' && value.trim().length > 0) {
      console.warn(`[BOT ENGELLENDİ - HONEYPOT] IP: ${getClientIp(req)} - Alan: ${field}`);
      return res.status(200).json({
        success: true,
        message: 'İşleminiz başarıyla alındı.'
      });
    }
  }
  next();
}

/**
 * 2. Resmi Google reCAPTCHA v2 Doğrulaması:
 * Google'ın siteverify API'si ile gelen token'ı doğrular.
 * Eğer .env içerisinde RECAPTCHA_SECRET_KEY henüz girilmediyse formu kilitlemez.
 */
async function verifyRecaptcha(req, res, next) {
  const secretKey = process.env.RECAPTCHA_SECRET_KEY;

  // Anahtar henüz tanımlanmadıysa formu kilitleme (geliştirme veya geçiş süreci)
  if (!secretKey) {
    return next();
  }

  const token = req.body?.recaptchaToken || req.body?.['g-recaptcha-response'];
  if (!token || typeof token !== 'string') {
    return next(new AppError('Lütfen "Ben robot değilim" onay kutusunu doğrulayın.', 400));
  }

  try {
    const clientIp = getClientIp(req);
    const params = new URLSearchParams({
      secret: secretKey,
      response: token,
      remoteip: clientIp
    });

    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString()
    });

    const data = await response.json();

    if (!data.success) {
      console.warn(`[RECAPTCHA DOĞRULAMA BAŞARISIZ] IP: ${clientIp} - Kodlar:`, data['error-codes']);
      return next(new AppError('Robot doğrulaması başarısız oldu. Lütfen kutucuğu tekrar işaretleyin.', 400));
    }

    next();
  } catch (error) {
    console.error('Google reCAPTCHA iletişim hatası:', error.message);
    return next(new AppError('Güvenlik doğrulaması sırasında bir hata oluştu.', 500));
  }
}

/**
 * 3. Geçici / Sahte E-posta Kontrolü:
 */
function checkDisposableEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const parts = email.toLowerCase().trim().split('@');
  if (parts.length !== 2) return false;
  const domain = parts[1];
  return DISPOSABLE_EMAIL_DOMAINS.has(domain);
}

/**
 * 4. Sistem Yönetim E-postasıyla Kayıt Olma Girişimini Engelleme:
 * Saldırganın yöneticinin SMTP adresini yazıp "benden bana mail gönderildi" döngüsünü engeller.
 */
function checkSystemEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const cleanEmail = email.toLowerCase().trim();

  const systemMails = [
    process.env.SMTP_USER?.toLowerCase().trim(),
    process.env.BOOTSTRAP_ADMIN_EMAIL?.toLowerCase().trim(),
  ].filter(Boolean);

  if (process.env.SMTP_FROM) {
    const match = process.env.SMTP_FROM.match(/<([^>]+)>/);
    if (match && match[1]) systemMails.push(match[1].toLowerCase().trim());
  }

  return systemMails.includes(cleanEmail);
}

/**
 * 5. E-posta Hedef Bazlı Cooldown & Hız Sınırı:
 * Bir e-posta adresine üst üste spam mail gitmesini önler.
 */
const emailSendLog = new Map();

function checkEmailCooldown(targetEmail, cooldownSeconds = 60, maxPer15Min = 3) {
  const email = targetEmail.toLowerCase().trim();
  const now = Date.now();
  const history = (emailSendLog.get(email) || []).filter(ts => now - ts < 15 * 60 * 1000);

  if (history.length > 0) {
    const lastSend = history[history.length - 1];
    const diffSeconds = Math.ceil((cooldownSeconds * 1000 - (now - lastSend)) / 1000);
    if (diffSeconds > 0) {
      throw new AppError(`Bu e-posta adresine kısa süre önce kod gönderildi. Lütfen ${diffSeconds} saniye bekleyin.`, 429);
    }
  }

  if (history.length >= maxPer15Min) {
    throw new AppError('Bu e-posta adresine çok fazla deneme yapıldı. Lütfen 15 dakika sonra tekrar deneyin.', 429);
  }

  history.push(now);
  emailSendLog.set(email, history);

  if (emailSendLog.size > 2000) {
    const cutoff = now - 15 * 60 * 1000;
    for (const [key, list] of emailSendLog.entries()) {
      const active = list.filter(ts => ts > cutoff);
      if (active.length === 0) emailSendLog.delete(key);
      else emailSendLog.set(key, active);
    }
  }
}

/**
 * 6. Katı IP Tabanlı Hız Sınırı:
 */
function createStrictLimiter({ windowMs, max, message = 'Çok fazla istek gönderildi. Lütfen bir süre sonra tekrar deneyin.' }) {
  const ipLog = new Map();
  return (req, res, next) => {
    const ip = getClientIp(req);
    const now = Date.now();
    const timestamps = (ipLog.get(ip) || []).filter(ts => now - ts < windowMs);

    if (timestamps.length >= max) {
      console.warn(`[RATE LIMIT EXCEEDED] IP: ${ip} - İstek: ${timestamps.length + 1}/${max}`);
      res.setHeader('Retry-After', Math.ceil(windowMs / 1000));
      return next(new AppError(message, 429));
    }

    timestamps.push(now);
    ipLog.set(ip, timestamps);
    next();
  };
}

module.exports = {
  getClientIp,
  verifyHoneypot,
  verifyRecaptcha,
  checkDisposableEmail,
  checkSystemEmail,
  checkEmailCooldown,
  createStrictLimiter
};
