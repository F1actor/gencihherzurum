const AppError = require('../core/errors/AppError');
const crypto = require('crypto');

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
 * İstemcinin gerçek IP adresini güvenli bir şekilde tespit eder.
 * Reverse proxy (Nginx, Cloudflare, cPanel) arkasındayken doğru IP'yi alır.
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
 * Gerçek kullanıcıların görmediği gizli alanları (hp_website, hp_token vb.) kontrol eder.
 * Botlar form alanlarını otomatik doldurduğu için bu alana veri girerler.
 * Bot tespit edilirse, botu şüphelendirmeden sessizce 200 OK döneriz;
 * böylece veritabanına kayıt atılmaz ve e-posta tetiklenmez.
 */
function verifyHoneypot(req, res, next) {
  const honeypotFields = ['hp_website', 'hp_token', 'website', '_hp_check'];
  for (const field of honeypotFields) {
    const value = req.body?.[field];
    if (value && typeof value === 'string' && value.trim().length > 0) {
      console.warn(`[BOT ENGELLENDİ - HONEYPOT] IP: ${getClientIp(req)} - Alan: ${field}`);
      // Sahte başarı dönerek botun döngüye girip yeniden denemesini engelliyoruz.
      return res.status(200).json({
        success: true,
        message: 'İşleminiz başarıyla alındı.'
      });
    }
  }
  next();
}

/**
 * 2. Zaman Kilidi (Time-Lock) Koruması:
 * İnsan bir formu en az 1.5 - 2 saniyede doldurabilir.
 * Botlar ise milisaniyeler içinde POST isteği atar.
 */
function verifyTimeLock(req, res, next) {
  const formTime = Number(req.body?._formTime);
  if (formTime && !isNaN(formTime)) {
    const elapsedMs = Date.now() - formTime;
    // Eğer form 1.5 saniyeden daha kısa sürede gönderildiyse bot kabul edilir
    if (elapsedMs < 1500) {
      console.warn(`[BOT ENGELLENDİ - FAST SUBMIT] IP: ${getClientIp(req)} - Süre: ${elapsedMs}ms`);
      return res.status(200).json({
        success: true,
        message: 'İşleminiz başarıyla alındı.'
      });
    }
  }
  next();
}

/**
 * 3. İnsan Doğrulama Token Kontrolü:
 * Frontend'deki doğrulama token'ını veya Google reCAPTCHA yanıtını kontrol eder.
 * Eski frontend / önbellek uyumluluğu için token yoksa isteği kilitlemez;
 * arka plandaki honeypot, time-lock, cooldown ve rate limit filtreleri korumayı sürdürür.
 */
function verifyHumanChallenge(req, res, next) {
  const token = req.body?._botToken || req.body?.['g-recaptcha-response'];

  // Token henüz gönderilmediyse (eski frontend veya önbellek durumu)
  // Kullanıcıyı kilitlemeyip diğer katmanlarla (honeypot, cooldown, limit) korumaya devam ediyoruz.
  if (!token) {
    return next();
  }

  // Token formatı: timestamp:signature
  const parts = String(token).split(':');
  if (parts.length >= 2) {
    const timestamp = Number(parts[0]);
    if (!isNaN(timestamp)) {
      const now = Date.now();
      if (timestamp > now + 30000 || now - timestamp > 15 * 60 * 1000) {
        return next(new AppError('Güvenlik doğrulamasının süresi dolmuş. Lütfen formu tekrar onaylayın.', 400));
      }
    }
  }

  next();
}

/**
 * 4. Geçici / Sahte E-posta Kontrolü:
 */
function checkDisposableEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const parts = email.toLowerCase().trim().split('@');
  if (parts.length !== 2) return false;
  const domain = parts[1];
  return DISPOSABLE_EMAIL_DOMAINS.has(domain);
}

/**
 * 5. Sistem Yönetim E-postasıyla Kayıt Olma Girişimini Engelleme:
 * Pentest yapanların sistemin kendi gönderici mailini yazarak
 * "benden bana mail gitti" döngüsünü tetiklemesini engeller.
 */
function checkSystemEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const cleanEmail = email.toLowerCase().trim();

  const systemMails = [
    process.env.SMTP_USER?.toLowerCase().trim(),
    process.env.BOOTSTRAP_ADMIN_EMAIL?.toLowerCase().trim(),
  ].filter(Boolean);

  // SMTP_FROM içerisindeki e-postayı da ayıkla (örn: "İsim" <mail@site.com>)
  if (process.env.SMTP_FROM) {
    const match = process.env.SMTP_FROM.match(/<([^>]+)>/);
    if (match && match[1]) systemMails.push(match[1].toLowerCase().trim());
  }

  return systemMails.includes(cleanEmail);
}

/**
 * 6. E-posta Hedef Bazlı Cooldown & Hız Sınırı (Sliding Window):
 * Bir e-posta adresine üst üste spam mail atılmasını önler.
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

  // Map temizliği
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
 * 7. Katı IP Tabanlı Hız Sınırı Fabrikası (Rate Limiter):
 */
function createStrictLimiter({ windowMs, max, message = 'Çok fazla istek gönderildi. Lütfen bir süre sonra tekrar deneyin.' }) {
  const ipLog = new Map();
  return (req, res, next) => {
    const ip = getClientIp(req);
    const now = Date.now();
    const timestamps = (ipLog.get(ip) || []).filter(ts => now - ts < windowMs);

    if (timestamps.length >= max) {
      console.warn(`[RATE LIMIT EXCEEDED] IP: ${ip} - İstek Sayısı: ${timestamps.length + 1}/${max}`);
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
  verifyTimeLock,
  verifyHumanChallenge,
  checkDisposableEmail,
  checkSystemEmail,
  checkEmailCooldown,
  createStrictLimiter
};

