/**
 * Auth API — Tüm auth işlemleri için merkezi fetch katmanı.
 * Bileşenler doğrudan fetch çağırmaz, bu modülü kullanır.
 */

const API_BASE = 'http://localhost:5000/api';

const authHeaders = () => ({
  'Content-Type': 'application/json',
  ...(localStorage.getItem('gencihh_token')
    ? { Authorization: `Bearer ${localStorage.getItem('gencihh_token')}` }
    : {})
});

export const loginApi = async (email, password) => {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  return res.json();
};

export const registerApi = async (data) => {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return res.json();
};

export const verifyOtpApi = async (email, otpCode) => {
  const res = await fetch(`${API_BASE}/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, otpCode })
  });
  return res.json();
};

export const resendOtpApi = async (email) => {
  const res = await fetch(`${API_BASE}/auth/resend-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  });
  return res.json();
};

export const forgotPasswordApi = async (email) => {
  const res = await fetch(`${API_BASE}/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  });
  return res.json();
};

export const resetPasswordApi = async (data) => {
  const res = await fetch(`${API_BASE}/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return res.json();
};

export const getMeApi = async () => {
  const res = await fetch(`${API_BASE}/auth/me`, { headers: authHeaders() });
  return res.json();
};

export const updateProfileApi = async (data) => {
  const res = await fetch(`${API_BASE}/auth/update-profile`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(data)
  });
  return res.json();
};
