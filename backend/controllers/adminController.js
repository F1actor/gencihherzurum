const { query } = require('../config/database');

exports.getPendingUsers = async (req, res) => {
  try {
    // E-postası doğrulanmış ama rolü hala beklemede olan kullanıcılar
    const users = await query.all(
      "SELECT id, fullName, email, phoneNumber, role, createdAt FROM users WHERE role = 'PENDING' AND isEmailVerified = 1 ORDER BY id DESC"
    );
    return res.status(200).json(users);
  } catch (error) {
    console.error('Bekleyen kullanıcılar çekilirken hata:', error);
    return res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

exports.assignUnit = async (req, res) => {
  const { userId, unit } = req.body;

  if (!userId || !unit) {
    return res.status(400).json({ message: 'Kullanıcı ID ve birim zorunludur.' });
  }

  // Geçerli birimler listesi
  const validUnits = [
    'İl Başkanı',
    'Teşkilatlanma Başkanı',
    'Eğitim Başkanı',
    'Üniversite Başkanı',
    'Lise Başkanı',
    'Ortaokul Başkanı',
    'İHH Çocuk Başkanı',
    'Tanıtım ve Medya Başkanı',
    'Çalışan Gençlik Başkanı',
    'Sosyal Faaliyet Başkanı',
    'Proje - Fon Başkanı',
    'Atom Başkanı',
    'Yaz Okulu Hocası',
    'Yaz Okulu Koordinatörü'
  ];

  if (!validUnits.includes(unit)) {
    return res.status(400).json({ message: 'Geçersiz bir birim seçtiniz.' });
  }

  try {
    const user = await query.get('SELECT * FROM users WHERE id = ?', [userId]);
    if (!user) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı.' });
    }

    // Seçilen birime daha önce atanmış aktif başkan var mı? (Bilgilendirme için, engellemiyoruz)
    const existingPresident = await query.get(
      "SELECT fullName FROM users WHERE assignedUnit = ?",
      [unit]
    );

    // İl Başkanı veya Teşkilatlanma Başkanı atandıysa rolü SUPER_ADMIN yapıyoruz,
    // Yaz Okulu Koordinatörü ise MUHABBET_COORDINATOR, Yaz Okulu Hocası ise MUHABBET_TEACHER,
    // diğerlerini UNIT_PRESIDENT
    let assignedRole = 'UNIT_PRESIDENT';
    if (unit === 'İl Başkanı' || unit === 'Teşkilatlanma Başkanı') {
      assignedRole = 'SUPER_ADMIN';
    } else if (unit === 'Yaz Okulu Koordinatörü') {
      assignedRole = 'MUHABBET_COORDINATOR';
    } else if (unit === 'Yaz Okulu Hocası') {
      assignedRole = 'MUHABBET_TEACHER';
    }

    // Birim atamasını gerçekleştir
    await query.run(
      "UPDATE users SET role = ?, assignedUnit = ? WHERE id = ?",
      [assignedRole, unit, userId]
    );

    let message = `${user.fullName} kullanıcısı ${unit} olarak başarıyla atandı ve ${
      assignedRole === 'SUPER_ADMIN' ? 'Süper Admin' :
      assignedRole === 'MUHABBET_COORDINATOR' ? 'Yaz Okulu Koordinatörü' :
      assignedRole === 'MUHABBET_TEACHER' ? 'Yaz Okulu Hocası' : 'Birim Başkanı'
    } yetkileri tanımlandı.`;
    if (existingPresident) {
      message += ` Not: Bu birimde daha önce ${existingPresident.fullName} atanmıştı.`;
    }

    // Log kaydı
    await query.run(
      "INSERT INTO audits (logType, message) VALUES ('SYSTEM', ?)",
      [`Yönetici Ataması: ${user.fullName} -> ${unit} (Yetki: ${assignedRole})`]
    );

    return res.status(200).json({ message });
  } catch (error) {
    console.error('Birim atama hatası:', error);
    return res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

exports.getUsers = async (req, res) => {
  try {
    const users = await query.all(
      "SELECT id, fullName, email, phoneNumber, role, assignedUnit, isEmailVerified, createdAt FROM users WHERE email != 'admin@gencihh.org' ORDER BY role ASC, id DESC"
    );
    return res.status(200).json(users);
  } catch (error) {
    console.error('Kullanıcılar çekilirken hata:', error);
    return res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

exports.getRoutines = async (req, res) => {
  try {
    const routines = await query.all("SELECT * FROM routines ORDER BY unit ASC, dayOfWeek ASC");
    return res.status(200).json(routines);
  } catch (error) {
    console.error('Rutinler çekilirken hata:', error);
    return res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

exports.createRoutine = async (req, res) => {
  const { unit, title, dayOfWeek } = req.body;

  if (!unit || !title || !dayOfWeek) {
    return res.status(400).json({ message: 'Lütfen tüm alanları doldurun.' });
  }

  const dayInt = parseInt(dayOfWeek);
  if (isNaN(dayInt) || dayInt < 1 || dayInt > 7) {
    return res.status(400).json({ message: 'Haftanın günü 1 (Pazartesi) ile 7 (Pazar) arasında olmalıdır.' });
  }

  try {
    const result = await query.run(
      "INSERT INTO routines (unit, title, dayOfWeek) VALUES (?, ?, ?)",
      [unit, title, dayInt]
    );
    return res.status(201).json({
      message: 'Rutin görev başarıyla oluşturuldu.',
      routine: { id: result.id, unit, title, dayOfWeek: dayInt }
    });
  } catch (error) {
    console.error('Rutin oluşturma hatası:', error);
    return res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

exports.deleteRoutine = async (req, res) => {
  const { id } = req.params;

  try {
    const routine = await query.get('SELECT * FROM routines WHERE id = ?', [id]);
    if (!routine) {
      return res.status(404).json({ message: 'Rutin görev bulunamadı.' });
    }

    await query.run('DELETE FROM routines WHERE id = ?', [id]);
    return res.status(200).json({ message: 'Rutin görev başarıyla silindi.' });
  } catch (error) {
    console.error('Rutin silme hatası:', error);
    return res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

exports.getAudits = async (req, res) => {
  try {
    const audits = await query.all("SELECT * FROM audits ORDER BY id DESC LIMIT 100");
    return res.status(200).json(audits);
  } catch (error) {
    console.error('Denetim kayıtları çekilirken hata:', error);
    return res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

exports.runManualAudit = async (req, res) => {
  try {
    const cronService = require('../services/cronService');
    await cronService.checkUnitActivity();
    await cronService.calculateMonthlyChampion();
    return res.status(200).json({ message: 'Manuel denetim başarıyla tamamlandı. Uyarılar ve şampiyonlar güncellendi.' });
  } catch (error) {
    console.error('Manuel denetim hatası:', error);
    return res.status(500).json({ message: 'Denetim çalıştırılırken hata oluştu.' });
  }
};

exports.deleteUser = async (req, res) => {
  const { id } = req.params;

  try {
    const user = await query.get('SELECT * FROM users WHERE id = ?', [id]);
    if (!user) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı.' });
    }

    if (user.id === req.user.id) {
      return res.status(400).json({ message: 'Kendi hesabınızı silemezsiniz.' });
    }

    // Kullanıcıya ait etkinlikleri de temizleyelim
    await query.run('DELETE FROM events WHERE userId = ?', [id]);
    await query.run('DELETE FROM users WHERE id = ?', [id]);

    await query.run(
      "INSERT INTO audits (logType, message) VALUES ('SYSTEM', ?)",
      [`Kullanıcı Silindi: ${user.fullName} (${user.assignedUnit || 'Birim atanmamış'})`]
    );

    return res.status(200).json({ message: 'Kullanıcı başarıyla silindi.' });
  } catch (error) {
    console.error('Kullanıcı silme hatası:', error);
    return res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

exports.getAllEventsWithProofs = async (req, res) => {
  try {
    const events = await query.all(
      `SELECT e.id, e.title, e.description, e.type, e.unit, e.eventDate, e.pointsEarned, e.proofImagePath, e.createdAt,
              u.fullName as presidentName, u.email as presidentEmail
       FROM events e
       JOIN users u ON e.userId = u.id
       ORDER BY e.id DESC`
    );
    return res.status(200).json(events);
  } catch (error) {
    console.error('Etkinlik galerisi çekilirken hata:', error);
    return res.status(500).json({ message: 'Sunucu hatası.' });
  }
};
