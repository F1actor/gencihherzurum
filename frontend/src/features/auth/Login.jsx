import React, { useState } from 'react';
import { useAuth } from '../../shared/context/AuthContext';
import { useNotification } from '../../shared/context/NotificationContext';
import { Lock, Mail, Loader } from 'lucide-react';
import AuthLayout from './AuthLayout';

export default function Login({ onRegisterRedirect, onVerifyRedirect }) {
  const { login, setLoadingScreen } = useAuth();
  const { showNotification } = useNotification();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Şifre Sıfırlama State'leri
  const [forgotMode, setForgotMode] = useState(false);
  const [resetMode, setResetMode] = useState(false);
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setLoadingScreen(true);

    try {
      if (resetMode) {
        // Şifre Sıfırlama Onayı
        const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/reset-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, otp, newPassword })
        });
        const data = await res.json();
        if (res.ok) {
          showNotification('Şifreniz başarıyla değiştirildi. Giriş yapabilirsiniz.', 'success');
          setResetMode(false);
          setForgotMode(false);
        } else {
          showNotification(data.message, 'error');
        }
      } else if (forgotMode) {
        // Şifre Sıfırlama Kodu Gönderme
        const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/forgot-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        });
        const data = await res.json();
        if (res.ok) {
          showNotification('Doğrulama kodu e-postanıza gönderildi.', 'info');
          setResetMode(true);
        } else {
          showNotification(data.message, 'error');
        }
      } else {
        // Normal Login
        await login(email, password);
        showNotification('Başarıyla giriş yapıldı. Hoş geldiniz!', 'success');
      }
    } catch (err) {
      if (err.unverified) {
        showNotification('Lütfen önce e-posta adresinizi doğrulayın.', 'warning');
        onVerifyRedirect(err.email);
      } else {
        showNotification(err.message || 'Bir hata oluştu.', 'error');
      }
    } finally {
      setLoading(false);
      setLoadingScreen(false);
    }
  };

  return (
    <AuthLayout title="Tekrar Hoş Geldiniz" subtitle="Hesabınıza giriş yaparak devam edin">
      <form onSubmit={handleSubmit} style={{ width: '100%', textAlign: 'left' }}>
        <div className="form-group">
          <label className="form-label">E-posta Adresi</label>
          <div style={{ position: 'relative' }}>
            <Mail size={18} style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)'
            }} />
            <input
              type="email"
              required
              className="form-control"
              placeholder="Örn: ornek@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ paddingLeft: '40px', width: '100%' }}
              disabled={loading || (forgotMode && !resetMode)}
            />
          </div>
        </div>

        {!forgotMode && (
          <div className="form-group" style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label className="form-label" style={{ margin: 0 }}>Şifre</label>
              <button 
                type="button" 
                onClick={() => setForgotMode(true)}
                style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', fontSize: '12px', fontWeight: '600', cursor: 'pointer', padding: 0 }}
              >
                Şifremi Unuttum
              </button>
            </div>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)'
              }} />
              <input
                type="password"
                required
                className="form-control"
                placeholder="••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingLeft: '40px', width: '100%' }}
                disabled={loading}
              />
            </div>
          </div>
        )}

        {forgotMode && !resetMode && (
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: 1.5 }}>
            Şifrenizi sıfırlamak için hesabınıza bağlı e-posta adresini girin. Size bir doğrulama kodu göndereceğiz.
          </p>
        )}

        {resetMode && (
          <>
            <div className="form-group">
              <label className="form-label">Doğrulama Kodu</label>
              <input
                type="text"
                required
                className="form-control"
                placeholder="Örn: 123456"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                style={{ width: '100%', textAlign: 'center', letterSpacing: '2px', fontWeight: 'bold' }}
                disabled={loading}
              />
            </div>
            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label className="form-label">Yeni Şifre</label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)'
                }} />
                <input
                  type="password"
                  required
                  className="form-control"
                  placeholder="En az 6 karakter"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  style={{ paddingLeft: '40px', width: '100%' }}
                  disabled={loading}
                />
              </div>
            </div>
          </>
        )}

        <button 
          type="submit" 
          className="btn btn-primary" 
          style={{ width: '100%', marginBottom: '20px', height: '44px' }}
          disabled={loading}
        >
          {loading ? (
            <Loader size={18} className="spin" />
          ) : forgotMode && !resetMode ? (
            'Doğrulama Kodu Gönder'
          ) : resetMode ? (
            'Şifreyi Güncelle'
          ) : (
            'Giriş Yap'
          )}
        </button>

        <div style={{ textAlign: 'center', marginTop: '10px' }}>
          {forgotMode ? (
            <button 
              type="button"
              onClick={() => {
                setForgotMode(false);
                setResetMode(false);
              }}
              style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '14px', cursor: 'pointer', fontWeight: '500' }}
            >
              Giriş ekranına dön
            </button>
          ) : (
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
              Hesabınız yok mu? {' '}
              <button 
                type="button" 
                onClick={onRegisterRedirect}
                style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', fontWeight: 'bold', cursor: 'pointer', padding: 0 }}
              >
                Hemen Kayıt Olun
              </button>
            </p>
          )}
        </div>
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <a href="/" style={{ fontSize: '14px', color: 'var(--text-secondary)', textDecoration: 'none', fontWeight: '500' }}>
            ← Ana Sayfaya Dön
          </a>
        </div>
      </form>
    </AuthLayout>
  );
}
