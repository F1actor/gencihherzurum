const { query } = require('../config/database');
const path = require('path');
const fs = require('fs');

// Etkinlik ekleme (Birim Başkanı)
exports.createEvent = async (req, res) => {
  const { type, routineId, title, description, eventDate, targetId } = req.body;
  const user = req.user;

  if (!type || !title || !eventDate) {
    return res.status(400).json({ message: 'Etkinlik türü, başlığı ve tarihi zorunludur.' });
  }

  if (type === 'ROUTINE' && !routineId) {
    return res.status(400).json({ message: 'Rutin etkinlikler için rutin seçimi zorunludur.' });
  }
  
  if (type === 'TARGET' && !targetId) {
    return res.status(400).json({ message: 'Aylık hedef etkinlikleri için hedef seçimi zorunludur.' });
  }

  // Tarih geçerlilik kontrolü
  const parsedEventDate = new Date(eventDate);
  if (isNaN(parsedEventDate.getTime())) {
    return res.status(400).json({ message: 'Geçersiz etkinlik tarihi.' });
  }

  try {
    let pointsEarned = 0;
    
    if (type === 'EXTRA') {
      pointsEarned = 20;
    } else if (type === 'ROUTINE') {
      pointsEarned = 10;
    } else if (type === 'TARGET') {
      const targetData = await query.get('SELECT targetPoints FROM targets WHERE id = ? AND unit = ?', [targetId, user.assignedUnit]);
      if (!targetData) {
        return res.status(400).json({ message: 'Geçersiz veya yetkiniz olmayan aylık hedef.' });
      }
      pointsEarned = targetData.targetPoints;
    } else {
      return res.status(400).json({ message: 'Geçersiz etkinlik türü.' });
    }

    // Dosya yolu ayarla
    const proofImagePath = req.file ? `/uploads/${req.file.filename}` : null;

    // Etkinliği veritabanına kaydet
    const result = await query.run(
      `INSERT INTO events (userId, unit, type, routineId, targetId, title, description, eventDate, proofImagePath, pointsEarned)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        user.id,
        user.assignedUnit,
        type,
        type === 'ROUTINE' ? parseInt(routineId) : null,
        type === 'TARGET' ? parseInt(targetId) : null,
        title,
        description || '',
        eventDate,
        proofImagePath,
        pointsEarned
      ]
    );

    // Sistem logu kaydet
    await query.run(
      "INSERT INTO audits (logType, message) VALUES ('SYSTEM', ?)",
      [`Etkinlik Eklendi: ${user.assignedUnit} - ${title} (${type === 'ROUTINE' ? 'Rutin' : 'Ekstra'}, Puan: ${pointsEarned})`]
    );

    return res.status(201).json({
      message: 'Etkinlik başarıyla kaydedildi.',
      event: {
        id: result.id,
        title,
        type,
        pointsEarned,
        proofImagePath
      }
    });

  } catch (error) {
    console.error('Etkinlik ekleme hatası:', error);
    return res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// Birim Başkanının kendi etkinliklerini listelemesi
exports.getMyEvents = async (req, res) => {
  const user = req.user;

  try {
    const events = await query.all(
      `SELECT e.*, r.title as routineTitle 
       FROM events e 
       LEFT JOIN routines r ON e.routineId = r.id 
       WHERE e.userId = ? 
       ORDER BY e.eventDate DESC, e.id DESC`,
      [user.id]
    );
    return res.status(200).json(events);
  } catch (error) {
    console.error('Kişisel etkinlikleri çekme hatası:', error);
    return res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// Birim başkanına atanmış olan aktif rutin planları listele
exports.getMyRoutines = async (req, res) => {
  const user = req.user;

  try {
    const routines = await query.all(
      "SELECT * FROM routines WHERE unit = ? ORDER BY dayOfWeek ASC",
      [user.assignedUnit]
    );
    return res.status(200).json(routines);
  } catch (error) {
    console.error('Birim rutinleri çekme hatası:', error);
    return res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// Süper Admin için tüm etkinlikleri listeleme (Filtrelenebilir)
exports.getAllEvents = async (req, res) => {
  const { unit, type } = req.query;

  try {
    let sql = `
      SELECT e.*, u.fullName as presidentName, r.title as routineTitle 
      FROM events e
      JOIN users u ON e.userId = u.id
      LEFT JOIN routines r ON e.routineId = r.id
    `;
    const params = [];
    const conditions = [];

    if (unit) {
      conditions.push("e.unit = ?");
      params.push(unit);
    }
    if (type) {
      conditions.push("e.type = ?");
      params.push(type);
    }

    if (conditions.length > 0) {
      sql += " WHERE " + conditions.join(" AND ");
    }

    sql += " ORDER BY e.eventDate DESC, e.id DESC LIMIT 300";

    const events = await query.all(sql, params);
    return res.status(200).json(events);
  } catch (error) {
    console.error('Tüm etkinlikleri çekme hatası:', error);
    return res.status(500).json({ message: 'Sunucu hatası.' });
  }
};
// Etkinlik Güncelleme (Birim Başkanı - 24 saat içinde)
exports.updateEvent = async (req, res) => {
  const { id } = req.params;
  const { title, description, eventDate } = req.body;
  const user = req.user;

  try {
    const event = await query.get('SELECT * FROM events WHERE id = ?', [id]);
    if (!event) return res.status(404).json({ message: 'Etkinlik bulunamadı.' });

    // Sadece kendi etkinliğini düzenleyebilir
    if (event.userId !== user.id && user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ message: 'Bu etkinliği düzenleme yetkiniz yok.' });
    }

    // 24 saat kontrolü (sadece başkanlar için)
    if (user.role !== 'SUPER_ADMIN') {
      const createdAt = new Date(event.createdAt);
      const diffHours = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);
      if (diffHours > 24) {
        return res.status(403).json({ message: 'Etkinlikler yalnızca eklendikten sonraki 24 saat içinde düzenlenebilir.' });
      }
    }

    const newProofPath = req.file ? `/uploads/${req.file.filename}` : event.proofImagePath;

    // Eski fotoğrafı sil (değiştiyse)
    if (req.file && event.proofImagePath) {
      const oldPath = path.join(__dirname, '..', event.proofImagePath);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    await query.run(
      `UPDATE events SET title = ?, description = ?, eventDate = ?, proofImagePath = ? WHERE id = ?`,
      [title || event.title, description ?? event.description, eventDate || event.eventDate, newProofPath, id]
    );

    await query.run(
      "INSERT INTO audits (logType, message) VALUES ('SYSTEM', ?)",
      [`Etkinlik Güncellendi: ${user.assignedUnit || 'Admin'} - ${title || event.title}`]
    );

    return res.status(200).json({ message: 'Etkinlik başarıyla güncellendi.' });
  } catch (error) {
    console.error('Etkinlik güncelleme hatası:', error);
    return res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// Etkinlik Silme (Birim Başkanı: 24h içinde kendi etkinliği | Admin: her zaman)
exports.deleteEvent = async (req, res) => {
  const { id } = req.params;
  const user = req.user;

  try {
    const event = await query.get('SELECT * FROM events WHERE id = ?', [id]);
    if (!event) return res.status(404).json({ message: 'Etkinlik bulunamadı.' });

    if (user.role !== 'SUPER_ADMIN') {
      if (event.userId !== user.id) {
        return res.status(403).json({ message: 'Bu etkinliği silme yetkiniz yok.' });
      }
      const createdAt = new Date(event.createdAt);
      const diffHours = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);
      if (diffHours > 24) {
        return res.status(403).json({ message: 'Etkinlikler yalnızca eklendikten sonraki 24 saat içinde silinebilir.' });
      }
    }

    // Fotoğrafı dosya sisteminden sil
    if (event.proofImagePath) {
      const filePath = path.join(__dirname, '..', event.proofImagePath);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    await query.run('DELETE FROM events WHERE id = ?', [id]);

    await query.run(
      "INSERT INTO audits (logType, message) VALUES ('SYSTEM', ?)",
      [`Etkinlik Silindi: ${event.unit} - ${event.title} (${event.eventDate})`]
    );

    return res.status(200).json({ message: 'Etkinlik başarıyla silindi.' });
  } catch (error) {
    console.error('Etkinlik silme hatası:', error);
    return res.status(500).json({ message: 'Sunucu hatası.' });
  }
};
