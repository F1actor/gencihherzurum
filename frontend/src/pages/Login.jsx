import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { Moon, Sun, Lock, Mail, Loader } from 'lucide-react';
import logoImg from '../assets/logo.jpg';

export default function Login({ onRegisterRedirect, onVerifyRedirect }) {
  const { login, theme, toggleTheme, setLoadingScreen } = useAuth();
  const { showNotification } = useNotification();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Şifre Sıfırlama State'leri
  const [forgotMode, setForgotMode] = useState(false); // true: E-posta iste, false: normal login
  const [resetMode, setResetMode] = useState(false); // true: OTP ve yeni şifre iste
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
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      backgroundColor: 'var(--bg-primary)',
      transition: 'background-color var(--transition-normal)'
    }}>
      {/* Tema Değiştirici Buton */}
      <button 
        onClick={toggleTheme}
        className="btn btn-secondary"
        style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          borderRadius: 'var(--radius-full)',
          padding: '10px',
          width: '40px',
          height: '40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
      </button>

      <div className="card" style={{
        width: '100%',
        maxWidth: '420px',
        textAlign: 'center',
        padding: '30px',
        borderRadius: 'var(--radius-lg)'
      }}>
        {/* Logo/Başlık */}
        <div style={{ marginBottom: '25px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '4px',
            borderRadius: '50%',
            marginBottom: '12px'
          }}>
            <img 
              src={logoImg} 
              alt="Genç İHH" 
              style={{ width: '70px', height: '70px', borderRadius: '50%' }} 
            />
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: '800', fontFamily: 'var(--font-display)', marginBottom: '4px' }}>
            Genç İHH Erzurum
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            Teşkilat Takip Platformu
          </p>
        </div>

        <form onSubmit={handleSubmit}>
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
                disabled={resetMode}
              />
            </div>
          </div>

          {!forgotMode && (
            <div className="form-group" style={{ marginBottom: '10px' }}>
              <label className="form-label">Şifre</label>
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
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ paddingLeft: '40px', width: '100%' }}
                />
              </div>
            </div>
          )}

          {resetMode && (
            <>
              <div className="form-group">
                <label className="form-label">Doğrulama Kodu (OTP)</label>
                <input
                  type="text"
                  required
                  className="form-control"
                  placeholder="Örn: 123456"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>
              <div className="form-group" style={{ marginBottom: '10px' }}>
                <label className="form-label">Yeni Şifre</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="password"
                    required
                    className="form-control"
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    style={{ paddingLeft: '40px', width: '100%' }}
                  />
                </div>
              </div>
            </>
          )}

          {!forgotMode && (
            <div style={{ textAlign: 'right', marginBottom: '20px' }}>
              <button 
                type="button" 
                onClick={() => setForgotMode(true)} 
                style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', fontSize: '13px', cursor: 'pointer', padding: 0 }}
              >
                Şifremi Unuttum
              </button>
            </div>
          )}

          {forgotMode && !resetMode && (
            <div style={{ textAlign: 'right', marginBottom: '20px' }}>
              <button 
                type="button" 
                onClick={() => setForgotMode(false)} 
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '13px', cursor: 'pointer', padding: 0 }}
              >
                Giriş Ekranına Dön
              </button>
            </div>
          )}

          <button 
            type="submit" 
            className="btn btn-primary" 
            disabled={loading}
            style={{ width: '100%', marginBottom: '15px' }}
          >
            {loading ? <Loader className="animate-spin" size={18} /> : (
              resetMode ? 'Şifremi Sıfırla' : (forgotMode ? 'Kod Gönder' : 'Giriş Yap')
            )}
          </button>
        </form>

        <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
          Hesabınız yok mu?{' '}
          <button 
            onClick={onRegisterRedirect}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--accent-primary)',
              fontWeight: '600',
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            Kayıt Ol
          </button>
        </p>
      </div>
    </div>
  );
}
