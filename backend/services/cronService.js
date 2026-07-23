const cron = require('node-cron');
const { query } = require('../config/database');
const { sendWeeklySummaryEmail } = require('./emailService');

const competitiveUnits = [
  'Eğitim Başkanı', 'Üniversite Başkanı', 'Lise Başkanı', 'Ortaokul Başkanı',
  'İHH Çocuk Başkanı', 'Tanıtım ve Medya Başkanı', 'Çalışan Gençlik Başkanı',
  'Sosyal Faaliyet Başkanı', 'Proje - Fon Başkanı', 'Atom Başkanı'
];

// Pasiflik Kontrolü: 2 haftadır etkinlik girmeyen birimleri denetle
async function checkUnitActivity() {
  console.log('Pasiflik denetimi çalıştırılıyor...');
  try {
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
    const fourteenDaysAgoStr = fourteenDaysAgo.toISOString().split('T')[0];

    const unitPresidents = await query.all(
      "SELECT id, fullName, assignedUnit, createdAt FROM users WHERE role = 'UNIT_PRESIDENT' AND assignedUnit IS NOT NULL"
    );

    for (const president of unitPresidents) {
      let isInactive = false;
      const lastEvent = await query.get(
        "SELECT MAX(eventDate) as lastDate FROM events WHERE userId = ?",
        [president.id]
      );

      let lastDate = lastEvent.lastDate;

      if (!lastDate) {
        const registrationDate = new Date(president.createdAt);
        if (registrationDate < fourteenDaysAgo) {
          isInactive = true;
          lastDate = president.createdAt.split(' ')[0];
        }
      } else {
        if (lastDate < fourteenDaysAgoStr) {
          isInactive = true;
        }
      }

      if (isInactive) {
        const warningMsg = `UYARI: ${president.assignedUnit} (${president.fullName}) son 2 haftadır (En son: ${lastDate || 'Hiç'}) sisteme etkinlik veya kanıt girişi yapmadı!`;
        
        const dateQuery = require('../config/database').dbType === 'postgres' 
          ? "createdAt >= NOW() - INTERVAL '1 day'" 
          : "createdAt >= datetime('now', '-1 day')";

        const duplicateWarning = await query.get(
          `SELECT id FROM audits WHERE logType = 'WARNING' AND message = ? AND ${dateQuery}`,
          [warningMsg]
        );

        if (!duplicateWarning) {
          await query.run(
            "INSERT INTO audits (logType, message) VALUES ('WARNING', ?)",
            [warningMsg]
          );
          console.log(`Pasiflik uyarısı kaydedildi: ${president.assignedUnit}`);
        }
      }
    }
  } catch (error) {
    console.error('Pasiflik denetimi sırasında hata:', error);
  }
}

// Aylık Şampiyon Hesaplama ve champions tablosuna kaydetme
async function calculateMonthlyChampion() {
  console.log('Aylık şampiyon hesaplanıyor...');
  try {
    const today = new Date();
    const firstDayOfPrevMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1).toISOString().split('T')[0];
    const lastDayOfPrevMonth = new Date(today.getFullYear(), today.getMonth(), 0).toISOString().split('T')[0];
    
    const prevMonthStr = `${today.getFullYear()}-${String(today.getMonth()).padStart(2, '0')}`; // e.g. '2025-06'
    const prevMonthName = new Date(today.getFullYear(), today.getMonth() - 1, 1).toLocaleString('tr-TR', { month: 'long', year: 'numeric' });

    // Mükerrer kayıt kontrolü
    const existing = await query.get('SELECT id FROM champions WHERE month = ?', [prevMonthStr]);
    if (existing) {
      console.log(`${prevMonthStr} için şampiyon zaten kaydedilmiş.`);
      return;
    }

    const champion = await query.get(
      `SELECT e.unit, SUM(e.pointsEarned) as points, u.fullName as presidentName
       FROM events e
       LEFT JOIN users u ON u.assignedUnit = e.unit AND u.role = 'UNIT_PRESIDENT'
       WHERE e.eventDate >= ? AND e.eventDate <= ?
       GROUP BY e.unit, u.fullName ORDER BY points DESC LIMIT 1`,
      [firstDayOfPrevMonth, lastDayOfPrevMonth]
    );

    if (champion && champion.points > 0) {
      // Champions tablosuna kaydet
      const insertSql = require('../config/database').dbType === 'postgres'
        ? `INSERT INTO champions (month, unit, presidentName, points) VALUES (?, ?, ?, ?) RETURNING id`
        : `INSERT INTO champions (month, unit, presidentName, points) VALUES (?, ?, ?, ?)`;
      await query.run(insertSql, [prevMonthStr, champion.unit, champion.presidentName || 'Bilinmiyor', champion.points]);

      const championMsg = `🏆 ÖDÜL: ${champion.unit}, ${champion.points} puan toplayarak ${prevMonthName} ayının şampiyonu olmuştur!`;
      const dup = await query.get("SELECT id FROM audits WHERE logType = 'SYSTEM' AND message = ?", [championMsg]);
      if (!dup) {
        await query.run("INSERT INTO audits (logType, message) VALUES ('SYSTEM', ?)", [championMsg]);
      }
      console.log(`Aylık şampiyon: ${champion.unit} (${champion.points} Puan)`);
    }
  } catch (error) {
    console.error('Aylık şampiyon hesaplama hatası:', error);
  }
}

// Haftalık Özet E-posta (Her Pazar Admin'e)
async function sendWeeklySummary() {
  try {
    const admin = await query.get("SELECT email FROM users WHERE role = 'SUPER_ADMIN' LIMIT 1");
    if (!admin) return;

    const today = new Date();
    const dayOfWeek = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7));
    const mondayStr = monday.toISOString().split('T')[0];
    const sundayStr = today.toISOString().split('T')[0];

    const weeklyData = await query.all(
      `SELECT unit, SUM(pointsEarned) as points FROM events
       WHERE eventDate >= ? AND eventDate <= ? GROUP BY unit`,
      [mondayStr, sundayStr]
    );

    const activeUnits = weeklyData.filter(u => u.points > 0).map(u => u.unit);
    const inactiveUnits = competitiveUnits.filter(u => !activeUnits.includes(u));
    const topUnit = weeklyData.sort((a, b) => b.points - a.points)[0]?.unit || null;

    await sendWeeklySummaryEmail(admin.email, {
      activeCount: activeUnits.length,
      inactiveUnits,
      topUnit,
      weekRange: `${mondayStr} - ${sundayStr}`
    });

    console.log(`Haftalık özet e-postası gönderildi: ${admin.email}`);
  } catch (err) {
    console.error('Haftalık özet cron hatası:', err);
  }
}

// Zamanlanmış Görevleri Başlat
function initCronJobs() {
  // Her gün gece yarısı pasiflik kontrolü
  cron.schedule('0 0 * * *', () => { checkUnitActivity(); });

  // Her ayın 1'inde gece yarısı aylık şampiyonu belirle
  cron.schedule('5 0 1 * *', () => { calculateMonthlyChampion(); });

  // Her pazar saat 09:00'da haftalık özet e-postası
  cron.schedule('0 9 * * 0', () => { sendWeeklySummary(); });

  console.log('Cron Job planlayıcıları aktif edildi.');
  
  setTimeout(() => { checkUnitActivity(); }, 10000);
}

module.exports = {
  initCronJobs,
  checkUnitActivity,
  calculateMonthlyChampion,
  sendWeeklySummary
};


