import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { API_URL } from '../config/api';

const AuthContext = createContext(null);
const TOKEN_KEY = 'gencihh_token';
const IDLE_TIMEOUT_MS = 10 * 60 * 1000;
const TOKEN_RENEW_INTERVAL_MS = 60 * 1000;

function getStoredToken() {
  const token = sessionStorage.getItem(TOKEN_KEY);
  // Eski ekranların dinamik çağrıları için yalnızca açık sayfa ömründe aynalanır.
  // Sayfa/sekme kapanırken aşağıdaki pagehide dinleyicisi bu anahtarı temizler.
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
  return token;
}

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(getStoredToken);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState(localStorage.getItem('gencihh_theme') || 'light');
  const [loadingScreen, setLoadingScreen] = useState(false);
  const lastRenewalRef = useRef(0);

  const clearSession = () => {
    sessionStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('gencihh_theme', theme);
  }, [theme]);

  useEffect(() => {
    const clearMirroredToken = event => {
      if (!event.persisted) localStorage.removeItem(TOKEN_KEY);
    };
    window.addEventListener('pagehide', clearMirroredToken);
    return () => window.removeEventListener('pagehide', clearMirroredToken);
  }, []);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return undefined;
    }

    let idleTimeout;
    let renewing = false;
    const resetIdleTimeout = () => {
      window.clearTimeout(idleTimeout);
      idleTimeout = window.setTimeout(clearSession, IDLE_TIMEOUT_MS);
    };

    const renewToken = async () => {
      if (renewing || Date.now() - lastRenewalRef.current < TOKEN_RENEW_INTERVAL_MS) return;
      renewing = true;
      try {
        const response = await fetch(`${API_URL}/auth/refresh`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
        const data = await response.json();
        if (!response.ok || !data.token) {
          clearSession();
          return;
        }
        lastRenewalRef.current = Date.now();
        sessionStorage.setItem(TOKEN_KEY, data.token);
        localStorage.setItem(TOKEN_KEY, data.token);
        setToken(data.token);
      } catch {
        // Geçici bağlantı kesintisinde kullanıcıyı anında atma; token süresi sunucuda ayrıca korunur.
      } finally {
        renewing = false;
      }
    };

    const handleActivity = () => {
      resetIdleTimeout();
      renewToken();
    };
    const activityEvents = ['pointerdown', 'pointermove', 'keydown', 'scroll', 'touchstart'];
    activityEvents.forEach(eventName => window.addEventListener(eventName, handleActivity));
    resetIdleTimeout();

    const verifySession = async () => {
      try {
        const response = await fetch(`${API_URL}/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
        const data = await response.json();
        if (response.ok) setUser(data.user);
        else clearSession();
      } catch (error) {
        console.error('Oturum doğrulama hatası:', error);
      } finally {
        setLoading(false);
      }
    };
    verifySession();

    return () => {
      window.clearTimeout(idleTimeout);
      activityEvents.forEach(eventName => window.removeEventListener(eventName, handleActivity));
    };
  }, [token]);

  const toggleTheme = () => setTheme(current => current === 'light' ? 'dark' : 'light');

  const register = async (fullName, email, password, phoneNumber) => {
    const response = await fetch(`${API_URL}/auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fullName, email, password, phoneNumber }) });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Kayıt sırasında hata oluştu.');
    return data;
  };

  const verifyOtp = async (email, otpCode) => {
    const response = await fetch(`${API_URL}/auth/verify-otp`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, otpCode }) });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Doğrulama hatası.');
    return data;
  };

  const resendOtp = async email => {
    const response = await fetch(`${API_URL}/auth/resend-otp`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Kod gönderme hatası.');
    return data;
  };

  const login = async (email, password) => {
    const response = await fetch(`${API_URL}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
    const data = await response.json();
    if (!response.ok) {
      if (response.status === 403 && data.isEmailVerified === false) throw { unverified: true, email: data.email, message: data.message };
      throw new Error(data.message || 'Giriş yapılamadı.');
    }
    lastRenewalRef.current = Date.now();
    sessionStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(TOKEN_KEY, data.token);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    setLoadingScreen(true);
    window.setTimeout(() => { clearSession(); setLoadingScreen(false); }, 350);
  };

  const fetchWithAuth = async (url, options = {}) => {
    const headers = { ...options.headers, Authorization: `Bearer ${token}` };
    if (!(options.body instanceof FormData)) headers['Content-Type'] = 'application/json';
    const response = await fetch(`${API_URL}${url}`, { ...options, headers });
    if (response.status === 401) clearSession();
    if (response.status === 403) {
      const data = await response.clone().json().catch(() => ({}));
      if (data.message === 'Geçersiz veya süresi dolmuş oturum anahtarı.') clearSession();
    }
    return response;
  };

  const triggerTransition = callback => {
    setLoadingScreen(true);
    window.setTimeout(() => { if (typeof callback === 'function') callback(); setLoadingScreen(false); }, 350);
  };

  return <AuthContext.Provider value={{ user, token, loading, theme, toggleTheme, loadingScreen, setLoadingScreen, triggerTransition, register, verifyOtp, resendOtp, login, logout, fetchWithAuth }}>{children}</AuthContext.Provider>;
};
