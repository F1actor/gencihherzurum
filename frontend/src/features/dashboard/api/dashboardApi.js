/**
 * Dashboard API — Admin panel veri çekme katmanı.
 */

export const fetchDashboardStats = async (fetchWithAuth) => {
  return fetchWithAuth('/reports/dashboard-stats');
};

export const fetchPendingUsers = async (fetchWithAuth) => {
  return fetchWithAuth('/admin/pending-users');
};

export const fetchAllUsers = async (fetchWithAuth) => {
  return fetchWithAuth('/admin/users');
};

export const fetchLeaderboard = async (fetchWithAuth) => {
  return fetchWithAuth('/reports/leaderboard');
};

export const fetchPerformance = async (fetchWithAuth) => {
  return fetchWithAuth('/reports/performance');
};

export const fetchRoutines = async (fetchWithAuth) => {
  return fetchWithAuth('/admin/routines');
};

export const fetchAudits = async (fetchWithAuth) => {
  return fetchWithAuth('/admin/audits');
};

export const fetchEventsGallery = async (fetchWithAuth) => {
  return fetchWithAuth('/admin/events-gallery');
};

export const fetchUnits = async (fetchWithAuth) => {
  return fetchWithAuth('/system/units');
};

export const assignUnitApi = async (fetchWithAuth, data) => {
  return fetchWithAuth('/admin/assign-unit', {
    method: 'POST',
    body: JSON.stringify(data)
  });
};

export const deleteUserApi = async (fetchWithAuth, userId) => {
  return fetchWithAuth(`/admin/users/${userId}`, { method: 'DELETE' });
};

export const createRoutineApi = async (fetchWithAuth, data) => {
  return fetchWithAuth('/admin/routines', { method: 'POST', body: JSON.stringify(data) });
};

export const deleteRoutineApi = async (fetchWithAuth, routineId) => {
  return fetchWithAuth(`/admin/routines/${routineId}`, { method: 'DELETE' });
};

export const runAuditApi = async (fetchWithAuth) => {
  return fetchWithAuth('/admin/run-audit', { method: 'POST' });
};
