const { query } = require('../config/database');

function formatLocalDate(date) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

// Haftanın günlerini JS tarihleriyle hesaplayan yardımcı fonk
function getStartAndEndOfWeek(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Pazartesiye git
  const monday = new Date(d.setDate(diff));
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  return {
    monday: formatLocalDate(monday),
    sunday: formatLocalDate(sunday)
  };
}

// Belirli bir tarih aralığındaki belirli bir günün sayısını bulur
// (dayOfWeek: 1: Pazartesi, ..., 7: Pazar)
function countDayOfWeekInPeriod(startDate, endDate, dayOfWeek) {
  let count = 0;
  const curDate = new Date(startDate);
  const end = new Date(endDate);
  
  // JS'te Pazar 0'dır, bizim şemamızda 7'dir.
  const targetDay = dayOfWeek === 7 ? 0 : dayOfWeek;

  while (curDate <= end) {
    if (curDate.getDay() === targetDay) {
      count++;
    }
    curDate.setDate(curDate.getDate() + 1);
  }
  return count;
}

const listAllUnits = [
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
  'Atom Başkanı'
];

const competitiveUnits = listAllUnits.filter(unit => unit !== 'İl Başkanı' && unit !== 'Teşkilatlanma Başkanı');

// Liderlik Tablosu
exports.getLeaderboard = async (req, res) => {
  try {
    const today = new Date();
    const { monday, sunday } = getStartAndEndOfWeek(today);

    // 1. Haftalık Puanlar
    const weeklyRaw = await query.all(
      `SELECT unit, SUM(pointsEarned) as points 
       FROM events 
       WHERE eventDate >= ? AND eventDate <= ? 
       GROUP BY unit`,
      [monday, sunday]
    );

    // 2. Aylık Puanlar
    const firstDayOfMonth = formatLocalDate(new Date(today.getFullYear(), today.getMonth(), 1));
    const lastDayOfMonth = formatLocalDate(new Date(today.getFullYear(), today.getMonth() + 1, 0));
    
    const monthlyRaw = await query.all(
      `SELECT unit, SUM(pointsEarned) as points 
       FROM events 
       WHERE eventDate >= ? AND eventDate <= ? 
       GROUP BY unit`,
      [firstDayOfMonth, lastDayOfMonth]
    );

    // 3. Genel Puanlar (Tüm Zamanlar)
    const overallRaw = await query.all(
      `SELECT unit, SUM(pointsEarned) as points 
       FROM events 
       GROUP BY unit`
    );

    // Tüm birimleri kapsayacak şekilde verileri haritala
    const mapToAllUnits = (rawPoints) => {
      const pointMap = {};
      rawPoints.forEach(r => {
        pointMap[r.unit] = r.points || 0;
      });

      return competitiveUnits.map(unit => ({
        unit,
        points: pointMap[unit] || 0
      })).sort((a, b) => b.points - a.points);
    };

    const weekly = mapToAllUnits(weeklyRaw);
    const monthly = mapToAllUnits(monthlyRaw);
    const overall = mapToAllUnits(overallRaw);

    return res.status(200).json({
      weekly,
      monthly,
      overall,
      weekRange: { start: monday, end: sunday }
    });

  } catch (error) {
    console.error('Liderlik tablosu hesaplama hatası:', error);
    return res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// Birim Performans Analizi (KPI ve Yüzdelikler)
exports.getPerformanceMetrics = async (req, res) => {
  const { unitName } = req.query; // Opsiyonel filtre
  const unitsToProcess = unitName ? [unitName] : competitiveUnits;

  try {
    const today = new Date();
    // Son 30 günlük periyot üzerinden KPI analizi yapalım
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    const startDate = formatLocalDate(thirtyDaysAgo);
    const endDate = formatLocalDate(today);

    const report = [];

    for (const unit of unitsToProcess) {
      // 1. Birimin tanımlanmış rutinlerini çek
      const routines = await query.all("SELECT * FROM routines WHERE unit = ?", [unit]);
      
      let totalPlannedRoutines = 0;
      let totalCompletedRoutines = 0;

      // Planlanan rutin adetlerini hesapla
      for (const r of routines) {
        const plannedCount = countDayOfWeekInPeriod(startDate, endDate, r.dayOfWeek);
        totalPlannedRoutines += plannedCount;

        // Bu rutin için yapılan etkinlikleri çek
        const completed = await query.get(
          `SELECT COUNT(id) as count FROM events 
           WHERE unit = ? AND type = 'ROUTINE' AND routineId = ? AND eventDate >= ? AND eventDate <= ?`,
          [unit, r.id, startDate, endDate]
        );
        totalCompletedRoutines += parseInt(completed.count, 10) || 0;
      }

      // Rutin Başarı Oranı % hesapla
      const successRate = totalPlannedRoutines > 0 
        ? Math.min(100, Math.round((totalCompletedRoutines / totalPlannedRoutines) * 100))
        : 0;

      // 2. Ekstra Efor Skoru (Ekstra ve Aylık Hedef etkinliklerinin puan toplamı)
      const extraScoreObj = await query.get(
        `SELECT SUM(pointsEarned) as sumPoints FROM events 
         WHERE unit = ? AND type IN ('EXTRA', 'TARGET') AND eventDate >= ? AND eventDate <= ?`,
        [unit, startDate, endDate]
      );
      const extraEffortScore = extraScoreObj.sumPoints || 0;

      // 3. Toplam Etkinlik Sayısı (Rutin & Ekstra)
      const totalEvents = await query.get(
        `SELECT COUNT(id) as count FROM events WHERE unit = ? AND eventDate >= ? AND eventDate <= ?`,
        [unit, startDate, endDate]
      );

      report.push({
        unit,
        period: 'Son 30 Gün',
        routinesPlanned: totalPlannedRoutines,
        routinesCompleted: totalCompletedRoutines,
        routineSuccessRate: successRate, // % Değer (Maks 100)
        extraEffortScore, // Ekstra etkinlik puanları
        totalEventsCount: totalEvents.count || 0
      });
    }

    // Başarı oranına göre azalan sırala
    report.sort((a, b) => b.routineSuccessRate - a.routineSuccessRate);

    return res.status(200).json(report);

  } catch (error) {
    console.error('Performans analiz hatası:', error);
    return res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// Süper Admin Dashboard İstatistikleri
exports.getAdminDashboardStats = async (req, res) => {
  try {
    // 1. Toplam Birim Başkanı sayısı
    const totalPresidents = await query.get("SELECT COUNT(id) as count FROM users WHERE role = 'UNIT_PRESIDENT'");
    
    // 2. Onay Bekleyen (PENDING) üye sayısı
    const pendingCount = await query.get("SELECT COUNT(id) as count FROM users WHERE role = 'PENDING' AND isEmailVerified = 1");
    
    // 3. Toplam Etkinlik sayısı
    const totalEvents = await query.get("SELECT COUNT(id) as count FROM events");

    // 4. Son Eklenen 5 Etkinlik
    const recentEvents = await query.all(
      `SELECT e.*, u.fullName as presidentName 
       FROM events e
       JOIN users u ON e.userId = u.id
       ORDER BY e.id DESC LIMIT 5`
    );

    // 5. Grafikler için son 4 haftanın etkinlik trendi
    const weeksData = [];
    const today = new Date();
    
    for (let i = 3; i >= 0; i--) {
      const targetDay = new Date();
      targetDay.setDate(today.getDate() - (i * 7));
      const { monday, sunday } = getStartAndEndOfWeek(targetDay);
      
      const weeklySum = await query.all(
        `SELECT unit, COUNT(id) as points 
         FROM events 
         WHERE eventDate >= ? AND eventDate <= ? 
         GROUP BY unit`,
        [monday, sunday]
      );

      const pointsMap = {};
      weeklySum.forEach(w => {
        pointsMap[w.unit] = w.points || 0;
      });

      weeksData.push({
        label: `${monday} / ${sunday}`,
        pointsMap
      });
    }

    return res.status(200).json({
      summary: {
        totalPresidents: totalPresidents.count,
        pendingApprovals: pendingCount.count,
        totalEvents: totalEvents.count
      },
      recentEvents,
      weeksData,
      unitsList: competitiveUnits
    });

  } catch (error) {
    console.error('Admin dashboard istatistik hatası:', error);
    return res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// CSV Export İndirme
exports.exportToCSV = async (req, res) => {
  try {
    const today = new Date();
    const { monday, sunday } = getStartAndEndOfWeek(today);
    
    const events = await query.all(
      `SELECT e.id, e.unit, e.title, e.type, e.pointsEarned, e.eventDate, e.createdAt, u.fullName
       FROM events e
       LEFT JOIN users u ON e.userId = u.id
       ORDER BY e.eventDate DESC`
    );

    const lines = ['ID,Birim,Baskan_Adi,Etkinlik_Basligi,Tip,Puan,Etkinlik_Tarihi,Kayit_Tarihi'];
    events.forEach(e => {
      const row = [
        e.id,
        `"${e.unit || ''}"`,
        `"${e.fullName || ''}"`,
        `"${(e.title || '').replace(/"/g, '""')}"`,
        e.type,
        e.pointsEarned,
        e.eventDate,
        e.createdAt
      ];
      lines.push(row.join(','));
    });

    const csvData = lines.join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="etkinlikler.csv"');
    return res.status(200).send(csvData);
  } catch (error) {
    console.error('CSV export hatası:', error);
    return res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// ============================================================
// AYLIK RAPOR (MONTHLY REPORT)
// ============================================================
exports.getMonthlyReport = async (req, res) => {
  try {
    const { year, month } = req.query;

    if (!year || !month) {
      return res.status(400).json({ message: 'Yıl ve ay parametreleri zorunludur.' });
    }

    const y = parseInt(year, 10);
    const m = parseInt(month, 10); // 1-12

    if (isNaN(y) || isNaN(m) || m < 1 || m > 12) {
      return res.status(400).json({ message: 'Geçersiz yıl veya ay değeri.' });
    }

    const startDate = `${y}-${String(m).padStart(2, '0')}-01`;
    const lastDay = new Date(y, m, 0).getDate();
    const endDate = `${y}-${String(m).padStart(2, '0')}-${lastDay}`;

    const monthLabel = new Date(y, m - 1, 1).toLocaleString('tr-TR', { month: 'long', year: 'numeric' });

    const routinesList = await query.all('SELECT * FROM routines');
    const unitStats = [];

    for (const u of competitiveUnits) {
      const unitRoutines = routinesList.filter(r => r.unit === u);
      let totalPlannedRoutines = 0;
      let totalCompletedRoutines = 0;

      for (const r of unitRoutines) {
        const plannedCount = countDayOfWeekInPeriod(startDate, endDate, r.dayOfWeek);
        totalPlannedRoutines += plannedCount;

        const completedObj = await query.get(
          `SELECT COUNT(id) as count FROM events WHERE unit = ? AND type = 'ROUTINE' AND routineId = ? AND eventDate >= ? AND eventDate <= ?`,
          [u, r.id, startDate, endDate]
        );
        totalCompletedRoutines += parseInt(completedObj.count, 10) || 0;
      }

      const successRate = totalPlannedRoutines > 0
        ? Math.min(100, Math.round((totalCompletedRoutines / totalPlannedRoutines) * 100))
        : 0;

      const extrasObj = await query.get(
        `SELECT COUNT(id) as count, SUM(pointsEarned) as totalPoints FROM events WHERE unit = ? AND type = 'EXTRA' AND eventDate >= ? AND eventDate <= ?`,
        [u, startDate, endDate]
      );
      const targetsObj = await query.get(
        `SELECT COUNT(id) as count FROM events WHERE unit = ? AND type = 'TARGET' AND eventDate >= ? AND eventDate <= ?`,
        [u, startDate, endDate]
      );
      const totalPointsObj = await query.get(
        `SELECT SUM(pointsEarned) as total FROM events WHERE unit = ? AND eventDate >= ? AND eventDate <= ?`,
        [u, startDate, endDate]
      );
      const totalEventsObj = await query.get(
        `SELECT COUNT(id) as count FROM events WHERE unit = ? AND eventDate >= ? AND eventDate <= ?`,
        [u, startDate, endDate]
      );

      unitStats.push({
        unit: u,
        routinesPlanned: totalPlannedRoutines,
        routinesCompleted: totalCompletedRoutines,
        routineSuccessRate: successRate,
        extrasCompleted: parseInt(extrasObj.count, 10) || 0,
        extraEffortScore: parseInt(extrasObj.totalPoints, 10) || 0,
        targetsCompleted: parseInt(targetsObj.count, 10) || 0,
        totalPoints: parseInt(totalPointsObj.total, 10) || 0,
        totalEventsCount: parseInt(totalEventsObj.count, 10) || 0
      });
    }

    unitStats.sort((a, b) => b.routineSuccessRate - a.routineSuccessRate);

    return res.status(200).json({
      monthLabel,
      startDate,
      endDate,
      unitStats
    });

  } catch (error) {
    console.error('Aylık rapor hatası:', error);
    return res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// ============================================================
// YILLIK RAPOR (ANNUAL REPORT)
// ============================================================
exports.getAnnualReport = async (req, res) => {
  try {
    const { unit } = req.query;
    const targetUnit = unit && unit !== 'Tüm Sistem' ? unit : null;

    const today = new Date();
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(today.getFullYear() - 1);
    
    const startDate = oneYearAgo.toISOString().split('T')[0];
    const endDate = today.toISOString().split('T')[0];

    // 1. Aylık Trend (Line Chart Data)
    const monthsData = [];
    const monthNames = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const mName = d.toLocaleString('tr-TR', { month: 'short', year: 'numeric' });
      monthNames.push(mName);

      const dStart = new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
      const dEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split('T')[0];
      
      let queryStr = `SELECT SUM(pointsEarned) as total FROM events WHERE eventDate >= ? AND eventDate <= ?`;
      let queryParams = [dStart, dEnd];

      if (targetUnit) {
        queryStr += ` AND unit = ?`;
        queryParams.push(targetUnit);
      }

      const mPoints = await query.get(queryStr, queryParams);
      monthsData.push(mPoints.total || 0);
    }

    // 2. Birim Bazlı İstatistikler
    const validUnits = [
      'Tüm Sistem',
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
      'Atom Başkanı'
    ];

    if (targetUnit && validUnits.includes(targetUnit)) {
      validUnits = [targetUnit];
    }

    const unitStats = [];
    const routinesList = await query.all("SELECT * FROM routines");

    for (const u of validUnits) {
      const unitRoutines = routinesList.filter(r => r.unit === u);
      let totalPlannedRoutines = 0;
      let totalCompletedRoutines = 0;

      for (const r of unitRoutines) {
        const plannedCount = countDayOfWeekInPeriod(startDate, endDate, r.dayOfWeek);
        totalPlannedRoutines += plannedCount;

        const completedObj = await query.get(
          `SELECT COUNT(id) as count FROM events WHERE unit = ? AND type = 'ROUTINE' AND routineId = ? AND eventDate >= ? AND eventDate <= ?`,
          [u, r.id, startDate, endDate]
        );
        totalCompletedRoutines += parseInt(completedObj.count, 10) || 0;
      }

      const extrasObj = await query.get(
        `SELECT COUNT(id) as count FROM events WHERE unit = ? AND type = 'EXTRA' AND eventDate >= ? AND eventDate <= ?`,
        [u, startDate, endDate]
      );
      const targetsObj = await query.get(
        `SELECT COUNT(id) as count FROM events WHERE unit = ? AND type = 'TARGET' AND eventDate >= ? AND eventDate <= ?`,
        [u, startDate, endDate]
      );

      unitStats.push({
        unit: u,
        routinesPlanned: totalPlannedRoutines,
        routinesCompleted: totalCompletedRoutines,
        extrasCompleted: parseInt(extrasObj.count, 10) || 0,
        targetsCompleted: parseInt(targetsObj.count, 10) || 0
      });
    }

    unitStats.sort((a, b) => (b.routinesCompleted + b.extrasCompleted + b.targetsCompleted) - (a.routinesCompleted + a.extrasCompleted + a.targetsCompleted));

    return res.status(200).json({
      lineChartData: {
        labels: monthNames,
        data: monthsData
      },
      unitStats
    });

  } catch (error) {
    console.error('Yıllık rapor çekilirken hata:', error);
    return res.status(500).json({ message: 'Sunucu hatası.' });
  }
};
