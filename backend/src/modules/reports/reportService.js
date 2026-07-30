const { query } = require('../../config/database');
const AppError = require('../../core/errors/AppError');

/**
 * Report Service — Tüm raporlama iş mantığı katmanı.
 * Hardcoded birim listeleri bu modülde YOKTUR — DB'den dinamik çekilir.
 */

function formatLocalDate(date) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function getStartAndEndOfWeek(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return { monday: formatLocalDate(monday), sunday: formatLocalDate(sunday) };
}

function countDayOfWeekInPeriod(startDate, endDate, dayOfWeek) {
  let count = 0;
  const curDate = new Date(startDate);
  const end = new Date(endDate);
  const targetDay = dayOfWeek === 7 ? 0 : dayOfWeek;
  while (curDate <= end) {
    if (curDate.getDay() === targetDay) count++;
    curDate.setDate(curDate.getDate() + 1);
  }
  return count;
}

// DB'den aktif ve rekabetçi birimleri dinamik çek
async function getCompetitiveUnits() {
  const rows = await query.all(
    "SELECT name FROM units WHERE isActive = 1 AND name NOT IN ('İl Başkanı', 'Teşkilatlanma Başkanı', 'Yaz Okulu Hocası', 'Yaz Okulu Koordinatörü') ORDER BY id ASC"
  );
  return rows.map(r => r.name);
}

async function getAllActiveUnits() {
  const rows = await query.all('SELECT name FROM units WHERE isActive = 1 ORDER BY id ASC');
  return rows.map(r => r.name);
}

exports.getLeaderboard = async () => {
  const today = new Date();
  const { monday, sunday } = getStartAndEndOfWeek(today);
  const competitiveUnits = await getCompetitiveUnits();

  const firstDayOfMonth = formatLocalDate(new Date(today.getFullYear(), today.getMonth(), 1));
  const lastDayOfMonth = formatLocalDate(new Date(today.getFullYear(), today.getMonth() + 1, 0));

  const [weeklyRaw, monthlyRaw, overallRaw] = await Promise.all([
    query.all('SELECT unit, SUM(pointsEarned) as points FROM events WHERE eventDate >= ? AND eventDate <= ? GROUP BY unit', [monday, sunday]),
    query.all('SELECT unit, SUM(pointsEarned) as points FROM events WHERE eventDate >= ? AND eventDate <= ? GROUP BY unit', [firstDayOfMonth, lastDayOfMonth]),
    query.all('SELECT unit, SUM(pointsEarned) as points FROM events GROUP BY unit')
  ]);

  const mapToAllUnits = (rawPoints) => {
    const pointMap = {};
    rawPoints.forEach(r => { pointMap[r.unit] = r.points || 0; });
    return competitiveUnits.map(unit => ({ unit, points: pointMap[unit] || 0 })).sort((a, b) => b.points - a.points);
  };

  return {
    weekly: mapToAllUnits(weeklyRaw),
    monthly: mapToAllUnits(monthlyRaw),
    overall: mapToAllUnits(overallRaw),
    weekRange: { start: monday, end: sunday }
  };
};

exports.getPerformanceMetrics = async ({ unitName } = {}) => {
  const today = new Date();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(today.getDate() - 30);
  const startDate = formatLocalDate(thirtyDaysAgo);
  const endDate = formatLocalDate(today);

  const competitiveUnits = await getCompetitiveUnits();
  const unitsToProcess = unitName ? [unitName] : competitiveUnits;
  const report = [];

  for (const unit of unitsToProcess) {
    const routines = await query.all('SELECT * FROM routines WHERE unit = ?', [unit]);
    let totalPlannedRoutines = 0;
    let totalCompletedRoutines = 0;

    for (const r of routines) {
      totalPlannedRoutines += countDayOfWeekInPeriod(startDate, endDate, r.dayOfWeek);
      const completed = await query.get(
        `SELECT COUNT(id) as count FROM events WHERE unit = ? AND type = 'ROUTINE' AND routineId = ? AND eventDate >= ? AND eventDate <= ?`,
        [unit, r.id, startDate, endDate]
      );
      totalCompletedRoutines += parseInt(completed.count, 10) || 0;
    }

    const successRate = totalPlannedRoutines > 0
      ? Math.min(100, Math.round((totalCompletedRoutines / totalPlannedRoutines) * 100))
      : 0;

    const [extraScoreObj, totalEventsObj] = await Promise.all([
      query.get(`SELECT SUM(pointsEarned) as sumPoints FROM events WHERE unit = ? AND type IN ('EXTRA', 'TARGET') AND eventDate >= ? AND eventDate <= ?`, [unit, startDate, endDate]),
      query.get(`SELECT COUNT(id) as count FROM events WHERE unit = ? AND eventDate >= ? AND eventDate <= ?`, [unit, startDate, endDate])
    ]);

    report.push({
      unit, period: 'Son 30 Gün',
      routinesPlanned: totalPlannedRoutines,
      routinesCompleted: totalCompletedRoutines,
      routineSuccessRate: successRate,
      extraEffortScore: extraScoreObj.sumPoints || 0,
      totalEventsCount: totalEventsObj.count || 0
    });
  }

  return report.sort((a, b) => b.routineSuccessRate - a.routineSuccessRate);
};

exports.getAdminDashboardStats = async () => {
  const competitiveUnits = await getCompetitiveUnits();
  const today = new Date();

  const [totalPresidents, pendingCount, totalEvents, recentEvents] = await Promise.all([
    query.get("SELECT COUNT(id) as count FROM users WHERE role = 'UNIT_PRESIDENT'"),
    query.get("SELECT COUNT(id) as count FROM users WHERE role = 'PENDING' AND isEmailVerified = 1"),
    query.get('SELECT COUNT(id) as count FROM events'),
    query.all(`SELECT e.*, u.fullName as presidentName FROM events e JOIN users u ON e.userId = u.id ORDER BY e.id DESC LIMIT 5`)
  ]);

  const weeksData = [];
  for (let i = 3; i >= 0; i--) {
    const targetDay = new Date();
    targetDay.setDate(today.getDate() - (i * 7));
    const { monday, sunday } = getStartAndEndOfWeek(targetDay);
    const weeklySum = await query.all(
      `SELECT unit, COUNT(id) as points FROM events WHERE eventDate >= ? AND eventDate <= ? GROUP BY unit`,
      [monday, sunday]
    );
    const pointsMap = {};
    weeklySum.forEach(w => { pointsMap[w.unit] = w.points || 0; });
    weeksData.push({ label: `${monday} / ${sunday}`, pointsMap });
  }

  return {
    summary: { totalPresidents: totalPresidents.count, pendingApprovals: pendingCount.count, totalEvents: totalEvents.count },
    recentEvents, weeksData, unitsList: competitiveUnits
  };
};

exports.exportToCSV = async () => {
  const events = await query.all(
    `SELECT e.id, e.unit, e.title, e.type, e.pointsEarned, e.eventDate, e.createdAt, u.fullName
     FROM events e LEFT JOIN users u ON e.userId = u.id ORDER BY e.eventDate DESC`
  );
  const lines = ['ID,Birim,Baskan_Adi,Etkinlik_Basligi,Tip,Puan,Etkinlik_Tarihi,Kayit_Tarihi'];
  events.forEach(e => {
    lines.push([e.id, `"${e.unit || ''}"`, `"${e.fullName || ''}"`, `"${(e.title || '').replace(/"/g, '""')}"`, e.type, e.pointsEarned, e.eventDate, e.createdAt].join(','));
  });
  return lines.join('\n');
};

exports.getMonthlyReport = async ({ year, month }) => {
  const y = parseInt(year, 10);
  const m = parseInt(month, 10);
  if (isNaN(y) || isNaN(m) || m < 1 || m > 12) throw new AppError('Geçersiz yıl veya ay değeri.', 400);

  const startDate = `${y}-${String(m).padStart(2, '0')}-01`;
  const lastDay = new Date(y, m, 0).getDate();
  const endDate = `${y}-${String(m).padStart(2, '0')}-${lastDay}`;
  const monthLabel = new Date(y, m - 1, 1).toLocaleString('tr-TR', { month: 'long', year: 'numeric' });

  const competitiveUnits = await getCompetitiveUnits();
  const routinesList = await query.all('SELECT * FROM routines');
  const unitStats = [];

  for (const u of competitiveUnits) {
    const unitRoutines = routinesList.filter(r => r.unit === u);
    let totalPlannedRoutines = 0;
    let totalCompletedRoutines = 0;

    for (const r of unitRoutines) {
      totalPlannedRoutines += countDayOfWeekInPeriod(startDate, endDate, r.dayOfWeek);
      const completedObj = await query.get(
        `SELECT COUNT(id) as count FROM events WHERE unit = ? AND type = 'ROUTINE' AND routineId = ? AND eventDate >= ? AND eventDate <= ?`,
        [u, r.id, startDate, endDate]
      );
      totalCompletedRoutines += parseInt(completedObj.count, 10) || 0;
    }

    const successRate = totalPlannedRoutines > 0 ? Math.min(100, Math.round((totalCompletedRoutines / totalPlannedRoutines) * 100)) : 0;
    const [extrasObj, targetsObj, totalPointsObj, totalEventsObj] = await Promise.all([
      query.get(`SELECT COUNT(id) as count, SUM(pointsEarned) as totalPoints FROM events WHERE unit = ? AND type = 'EXTRA' AND eventDate >= ? AND eventDate <= ?`, [u, startDate, endDate]),
      query.get(`SELECT COUNT(id) as count FROM events WHERE unit = ? AND type = 'TARGET' AND eventDate >= ? AND eventDate <= ?`, [u, startDate, endDate]),
      query.get(`SELECT SUM(pointsEarned) as total FROM events WHERE unit = ? AND eventDate >= ? AND eventDate <= ?`, [u, startDate, endDate]),
      query.get(`SELECT COUNT(id) as count FROM events WHERE unit = ? AND eventDate >= ? AND eventDate <= ?`, [u, startDate, endDate])
    ]);

    unitStats.push({
      unit: u, routinesPlanned: totalPlannedRoutines, routinesCompleted: totalCompletedRoutines,
      routineSuccessRate: successRate,
      extrasCompleted: parseInt(extrasObj.count, 10) || 0,
      extraEffortScore: parseInt(extrasObj.totalPoints, 10) || 0,
      targetsCompleted: parseInt(targetsObj.count, 10) || 0,
      totalPoints: parseInt(totalPointsObj.total, 10) || 0,
      totalEventsCount: parseInt(totalEventsObj.count, 10) || 0
    });
  }

  return { monthLabel, startDate, endDate, unitStats: unitStats.sort((a, b) => b.routineSuccessRate - a.routineSuccessRate) };
};

exports.getAnnualReport = async ({ unit }) => {
  const targetUnit = unit && unit !== 'Tüm Sistem' ? unit : null;
  const today = new Date();
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(today.getFullYear() - 1);
  const startDate = oneYearAgo.toISOString().split('T')[0];
  const endDate = today.toISOString().split('T')[0];

  const monthsData = [];
  const monthNames = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    monthNames.push(d.toLocaleString('tr-TR', { month: 'short', year: 'numeric' }));
    const dStart = new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
    const dEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split('T')[0];
    let queryStr = `SELECT SUM(pointsEarned) as total FROM events WHERE eventDate >= ? AND eventDate <= ?`;
    const queryParams = [dStart, dEnd];
    if (targetUnit) { queryStr += ' AND unit = ?'; queryParams.push(targetUnit); }
    const mPoints = await query.get(queryStr, queryParams);
    monthsData.push(mPoints.total || 0);
  }

  const allUnits = await getAllActiveUnits();
  const unitsToUse = targetUnit ? [targetUnit] : allUnits;
  const routinesList = await query.all('SELECT * FROM routines');
  const unitStats = [];

  for (const u of unitsToUse) {
    const unitRoutines = routinesList.filter(r => r.unit === u);
    let totalPlannedRoutines = 0;
    let totalCompletedRoutines = 0;
    for (const r of unitRoutines) {
      totalPlannedRoutines += countDayOfWeekInPeriod(startDate, endDate, r.dayOfWeek);
      const completedObj = await query.get(
        `SELECT COUNT(id) as count FROM events WHERE unit = ? AND type = 'ROUTINE' AND routineId = ? AND eventDate >= ? AND eventDate <= ?`,
        [u, r.id, startDate, endDate]
      );
      totalCompletedRoutines += parseInt(completedObj.count, 10) || 0;
    }
    const [extrasObj, targetsObj] = await Promise.all([
      query.get(`SELECT COUNT(id) as count FROM events WHERE unit = ? AND type = 'EXTRA' AND eventDate >= ? AND eventDate <= ?`, [u, startDate, endDate]),
      query.get(`SELECT COUNT(id) as count FROM events WHERE unit = ? AND type = 'TARGET' AND eventDate >= ? AND eventDate <= ?`, [u, startDate, endDate])
    ]);
    unitStats.push({
      unit: u, routinesPlanned: totalPlannedRoutines, routinesCompleted: totalCompletedRoutines,
      extrasCompleted: parseInt(extrasObj.count, 10) || 0,
      targetsCompleted: parseInt(targetsObj.count, 10) || 0
    });
  }

  unitStats.sort((a, b) => (b.routinesCompleted + b.extrasCompleted + b.targetsCompleted) - (a.routinesCompleted + a.extrasCompleted + a.targetsCompleted));

  return { lineChartData: { labels: monthNames, data: monthsData }, unitStats };
};
