/**
 * Reports API — Rapor ve liderlik verileri fetch katmanı.
 */

export const fetchLeaderboardApi = async (fetchWithAuth) => {
  return fetchWithAuth('/reports/leaderboard');
};

export const fetchPerformanceApi = async (fetchWithAuth, unitName) => {
  const q = unitName ? `?unitName=${encodeURIComponent(unitName)}` : '';
  return fetchWithAuth(`/reports/performance${q}`);
};

export const fetchMonthlyReportApi = async (fetchWithAuth, year, month) => {
  return fetchWithAuth(`/reports/monthly-report?year=${year}&month=${month}`);
};

export const fetchAnnualReportApi = async (fetchWithAuth, unit = 'Tüm Sistem') => {
  return fetchWithAuth(`/reports/annual-report?unit=${encodeURIComponent(unit)}`);
};

export const exportCsvApi = async (fetchWithAuth) => {
  return fetchWithAuth('/reports/export-csv');
};

export const fetchUnitsForReportsApi = async (fetchWithAuth) => {
  return fetchWithAuth('/system/units');
};
