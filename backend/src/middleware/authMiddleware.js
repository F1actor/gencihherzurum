const jwt = require('jsonwebtoken');
const { query } = require('../config/database');

async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Erişim engellendi. Oturum açmanız gerekiyor.' });
  }

  try {
    if (!process.env.JWT_SECRET) throw new Error('JWT yapılandırması eksik.');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await query.get('SELECT id, fullName, email, role, assignedUnit, phoneNumber, isEmailVerified FROM users WHERE id = ?', [decoded.id]);

    if (!user) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı.' });
    }

    if (user.isEmailVerified !== 1) {
      return res.status(403).json({ message: 'E-posta adresinizi doğrulamanız gerekmektedir.' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Geçersiz veya süresi dolmuş oturum anahtarı.' });
  }
}

// Belirli bir rolü zorunlu kılmak için yardımcı middleware
function requireRole(roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Kimlik doğrulaması başarısız.' });
    }

    const hasRole = Array.isArray(roles) ? roles.includes(req.user.role) : req.user.role === roles;
    
    if (!hasRole) {
      return res.status(403).json({ message: 'Bu işlem için yetkiniz bulunmamaktadır.' });
    }

    // Birim başkanları için birim ataması kontrolü yap (Süper Admin hariç)
    if (req.user.role === 'UNIT_PRESIDENT' && !req.user.assignedUnit) {
      return res.status(403).json({ message: 'Birim atamanız henüz yapılmamıştır. Lütfen yöneticinizle iletişime geçin.' });
    }

    next();
  };
}

module.exports = {
  authenticateToken,
  requireRole
};
