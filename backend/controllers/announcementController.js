const { query } = require('../config/database');

// ============================================================
// DUYURU YÖNETİMİ
// ============================================================

exports.getAnnouncements = async (req, res) => {
  try {
    const rows = await query.all(
      `SELECT * FROM announcements WHERE isActive = 1 ORDER BY createdAt DESC`
    );
    return res.status(200).json(rows);
  } catch (e) {
    console.error('Duyurular alınırken hata:', e);
    return res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// Birim başkanı için kendi birimine + genel duyuruları getir
exports.getAnnouncementsForUnit = async (req, res) => {
  const unit = req.user.assignedUnit;
  try {
    const rows = await query.all(
      `SELECT * FROM announcements WHERE isActive = 1 AND (targetUnit IS NULL OR targetUnit = ?) ORDER BY createdAt DESC`,
      [unit]
    );
    return res.status(200).json(rows);
  } catch (e) {
    console.error('Birim duyuruları alınırken hata:', e);
    return res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

exports.createAnnouncement = async (req, res) => {
  const { title, body, targetUnit } = req.body;
  if (!title || !body) return res.status(400).json({ message: 'Başlık ve içerik zorunludur.' });

  try {
    const sql = require('../config/database').dbType === 'postgres'
      ? `INSERT INTO announcements (title, body, targetUnit) VALUES (?, ?, ?) RETURNING id`
      : `INSERT INTO announcements (title, body, targetUnit) VALUES (?, ?, ?)`;
    const result = await query.run(sql, [title, body, targetUnit || null]);
    return res.status(201).json({ message: 'Duyuru oluşturuldu.', id: result.id });
  } catch (e) {
    console.error('Duyuru oluşturma hatası:', e);
    return res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

exports.deleteAnnouncement = async (req, res) => {
  const { id } = req.params;
  try {
    await query.run('UPDATE announcements SET isActive = 0 WHERE id = ?', [id]);
    return res.status(200).json({ message: 'Duyuru silindi.' });
  } catch (e) {
    console.error('Duyuru silme hatası:', e);
    return res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// ============================================================
// HEDEF YÖNETİMİ
// ============================================================

exports.getTargets = async (req, res) => {
  const { month } = req.query; // '2025-07'
  try {
    const rows = await query.all(
      `SELECT * FROM targets ${month ? 'WHERE month = ?' : ''} ORDER BY unit`,
      month ? [month] : []
    );
    return res.status(200).json(rows);
  } catch (e) {
    console.error('Hedefler alınırken hata:', e);
    return res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

exports.getTargetForUnit = async (req, res) => {
  const unit = req.user.assignedUnit;
  const today = new Date();
  const month = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  try {
    const target = await query.get(
      `SELECT * FROM targets WHERE unit = ? AND month = ?`,
      [unit, month]
    );
    return res.status(200).json(target || { unit, month, targetName: '', targetPoints: 0 });
  } catch (e) {
    console.error('Birim hedef alınırken hata:', e);
    return res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

exports.setTarget = async (req, res) => {
  const { unit, month, targetName, targetPoints } = req.body;
  if (!unit || !month) return res.status(400).json({ message: 'Birim ve ay zorunludur.' });

  try {
    // Güncelle veya oluştur
    const existing = await query.get('SELECT id FROM targets WHERE unit = ? AND month = ?', [unit, month]);
    if (existing) {
      await query.run(
        'UPDATE targets SET targetName = ?, targetPoints = ? WHERE unit = ? AND month = ?',
        [targetName || '', targetPoints || 0, unit, month]
      );
    } else {
      const sql = require('../config/database').dbType === 'postgres'
        ? `INSERT INTO targets (unit, month, targetName, targetPoints) VALUES (?, ?, ?, ?) RETURNING id`
        : `INSERT INTO targets (unit, month, targetName, targetPoints) VALUES (?, ?, ?, ?)`;
      await query.run(sql, [unit, month, targetName || '', targetPoints || 0]);
    }
    return res.status(200).json({ message: 'Hedef kaydedildi.' });
  } catch (e) {
    console.error('Hedef kaydetme hatası:', e);
    return res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// ============================================================
// ŞAMPIYON ARŞİVİ
// ============================================================

exports.getChampions = async (req, res) => {
  try {
    const rows = await query.all(`SELECT * FROM champions ORDER BY month DESC`);
    return res.status(200).json(rows);
  } catch (e) {
    console.error('Şampiyonlar alınırken hata:', e);
    return res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// Geçmişe dönük manuel şampiyon ekleme (admin)
exports.addChampion = async (req, res) => {
  const { month, unit, presidentName, points } = req.body;
  if (!month || !unit) return res.status(400).json({ message: 'Ay ve birim zorunludur.' });

  try {
    const existing = await query.get('SELECT id FROM champions WHERE month = ?', [month]);
    if (existing) return res.status(400).json({ message: 'Bu ay için şampiyon zaten kayıtlı.' });

    const sql = require('../config/database').dbType === 'postgres'
      ? `INSERT INTO champions (month, unit, presidentName, points) VALUES (?, ?, ?, ?) RETURNING id`
      : `INSERT INTO champions (month, unit, presidentName, points) VALUES (?, ?, ?, ?)`;
    await query.run(sql, [month, unit, presidentName || '', points || 0]);
    return res.status(201).json({ message: 'Şampiyon kaydedildi.' });
  } catch (e) {
    console.error('Şampiyon ekleme hatası:', e);
    return res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// ============================================================
// BİRİM GEÇMİŞİ & BAŞKAN DEVİR YÖNETİMİ
// ============================================================

exports.getUnitHistory = async (req, res) => {
  const { unit } = req.query;
  try {
    const rows = await query.all(
      `SELECT * FROM unit_history ${unit ? 'WHERE unit = ?' : ''} ORDER BY startDate DESC`,
      unit ? [unit] : []
    );
    return res.status(200).json(rows);
  } catch (e) {
    console.error('Birim geçmişi alınırken hata:', e);
    return res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// Birimi yeni başkana devret
exports.transferUnit = async (req, res) => {
  const { oldUserId, newUserId, unit, reason } = req.body;
  if (!newUserId || !unit) return res.status(400).json({ message: 'Yeni kullanıcı ve birim zorunludur.' });
  if (oldUserId && String(oldUserId) === String(newUserId)) return res.status(400).json({ message: 'Devreden ve devralan kişi aynı olamaz.' });

  try {
    const today = new Date().toISOString().split('T')[0];

    // Eski başkanı pasife al ve geçmiş kaydını kapat
    if (oldUserId) {
      const oldUser = await query.get('SELECT * FROM users WHERE id = ?', [oldUserId]);
      if (oldUser) {
        if (oldUser.assignedUnit !== unit) {
          return res.status(400).json({ message: `Devreden kişi (${oldUser.fullName}) ${unit} başkanı değil!` });
        }
        await query.run("UPDATE users SET role = 'PASSIVE', assignedUnit = NULL WHERE id = ?", [oldUserId]);
        // unit_history kaydını kapat
        await query.run(
          `UPDATE unit_history SET endDate = ? WHERE userId = ? AND unit = ? AND endDate IS NULL`,
          [today, oldUserId, unit]
        );
      }
    }

    // Yeni başkana birimi ata
    const newUser = await query.get('SELECT * FROM users WHERE id = ?', [newUserId]);
    if (!newUser) return res.status(404).json({ message: 'Yeni kullanıcı bulunamadı.' });

    await query.run(
      "UPDATE users SET role = 'UNIT_PRESIDENT', assignedUnit = ? WHERE id = ?",
      [unit, newUserId]
    );

    // unit_history'e yeni kayıt ekle
    const histSql = require('../config/database').dbType === 'postgres'
      ? `INSERT INTO unit_history (unit, userId, fullName, startDate, reason) VALUES (?, ?, ?, ?, ?) RETURNING id`
      : `INSERT INTO unit_history (unit, userId, fullName, startDate, reason) VALUES (?, ?, ?, ?, ?)`;
    await query.run(histSql, [unit, newUserId, newUser.fullName, today, reason || 'Başkan Değişikliği']);

    await query.run(
      "INSERT INTO audits (logType, message) VALUES ('SYSTEM', ?)",
      [`Birim Devri: ${unit} → ${newUser.fullName} (${today})`]
    );

    return res.status(200).json({ message: `${unit} birimi ${newUser.fullName}'e başarıyla devredildi.` });
  } catch (e) {
    console.error('Birim devir hatası:', e);
    return res.status(500).json({ message: 'Sunucu hatası.' });
  }
};
