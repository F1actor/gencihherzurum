import React, { createContext, useState, useEffect, useContext } from 'react';
import { API_URL } from '../config/api';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('gencihh_token') || null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState(localStorage.getItem('gencihh_theme') || 'light');
  const [loadingScreen, setLoadingScreen] = useState(false);

  // Tema değiştirme işlevi
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('gencihh_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  // Uygulama yüklendiğinde oturumu doğrula
  useEffect(() => {
    const verifySession = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(`${API_URL}/auth/me`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await res.json();
        if (res.ok) {
          setUser(data.user);
        } else {
          // Token geçersizse oturumu kapat
          logout();
        }
      } catch (err) {
        console.error('Oturum doğrulama hatası:', err);
      } finally {
        setLoading(false);
      }
    };
    verifySession();
  }, [token]);

  // Kayıt işlemi
  const register = async (fullName, email, password, phoneNumber) => {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName, email, password, phoneNumber })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Kayıt sırasında hata oluştu.');
    return data;
  };

  // OTP E-posta Doğrulama
  const verifyOtp = async (email, otpCode) => {
    const res = await fetch(`${API_URL}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otpCode })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Doğrulama hatası.');
    return data;
  };

  // OTP Tekrar Gönderme
  const resendOtp = async (email) => {
    const res = await fetch(`${API_URL}/auth/resend-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Kod gönderme hatası.');
    return data;
  };

  // Giriş Yap
  const login = async (email, password) => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) {
      // E-posta doğrulanmamışsa özel bir hata döndür
      if (res.status === 403 && data.isEmailVerified === false) {
        throw { unverified: true, email: data.email, message: data.message };
      }
      throw new Error(data.message || 'Giriş yapılamadı.');
    }
    
    localStorage.setItem('gencihh_token', data.token);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  // Çıkış Yap
  const logout = () => {
    setLoadingScreen(true);
    setTimeout(() => {
      localStorage.removeItem('gencihh_token');
      setToken(null);
      setUser(null);
      setLoadingScreen(false);
    }, 500);
  };

  // Yetkili API istekleri için yardımcı fonksiyon
  const fetchWithAuth = async (url, options = {}) => {
    const headers = {
      ...options.headers,
      'Authorization': `Bearer ${token}`
    };
    
    // Eğer FormData gönderiliyorsa Content-Type eklenmemeli (Tarayıcı otomatik belirler boundary ile)
    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    const res = await fetch(`${API_URL}${url}`, {
      ...options,
      headers
    });
    
    if (res.status === 401 || res.status === 403) {
      const data = await res.json();
      if (data.message === 'Geçersiz veya süresi dolmuş oturum anahtarı.') {
        logout();
      }
    }
    
    return res;
  };

  const triggerTransition = (callback) => {
    setLoadingScreen(true);
    setTimeout(() => {
      if (typeof callback === 'function') {
        callback();
      }
      setLoadingScreen(false);
    }, 500);
  };

  const value = {
    user,
    token,
    loading,
    theme,
    toggleTheme,
    loadingScreen,
    setLoadingScreen,
    triggerTransition,
    register,
    verifyOtp,
    resendOtp,
    login,
    logout,
    fetchWithAuth
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
