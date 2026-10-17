/**
 * Muhabbet API — Muhabbet Okulu fetch katmanı.
 */

import { API_URL } from '../../../shared/config/api';

export const fetchPortalInfoApi = async () => {
  const res = await fetch(`${API_URL}/muhabbet/portal-info`);
  return res.json();
};

export const applyApi = async (data) => {
  const res = await fetch(`${API_URL}/muhabbet/apply`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return res.json();
};

export const fetchApplicationsApi = async (fetchWithAuth) => {
  return fetchWithAuth('/muhabbet/applications');
};

export const updateApplicationApi = async (fetchWithAuth, id, data) => {
  return fetchWithAuth(`/muhabbet/applications/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
};

export const deleteApplicationApi = async (fetchWithAuth, id) => {
  return fetchWithAuth(`/muhabbet/applications/${id}`, { method: 'DELETE' });
};

export const fetchClassesApi = async (fetchWithAuth) => {
  return fetchWithAuth('/muhabbet/classes');
};

export const createClassApi = async (fetchWithAuth, data) => {
  return fetchWithAuth('/muhabbet/classes', { method: 'POST', body: JSON.stringify(data) });
};

export const fetchAttendanceApi = async (fetchWithAuth, classId, date) => {
  return fetchWithAuth(`/muhabbet/attendance?classId=${classId}&attendanceDate=${date}`);
};

export const saveAttendanceApi = async (fetchWithAuth, data) => {
  return fetchWithAuth('/muhabbet/attendance', { method: 'POST', body: JSON.stringify(data) });
};

export const updateSettingApi = async (fetchWithAuth, key, value) => {
  return fetchWithAuth('/muhabbet/settings', {
    method: 'PUT',
    body: JSON.stringify({ settingKey: key, settingValue: value })
  });
};
