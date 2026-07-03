import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { Mail, Loader, ArrowLeft } from 'lucide-react';
import logoImg from '../assets/logo.jpg';

export default function VerifyOtp({ initialEmail, onBackToLogin }) {
  const { verifyOtp, resendOtp, setLoadingScreen } = useAuth();
  const { showNotification } = useNotification();
  const [email, setEmail] = useState(initialEmail || '');
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  // Geri sayım sayacı
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setLoadingScreen(true);

    try {
      const data = await verifyOtp(email, otpCode);
      showNotification(data.message || 'E-posta adresiniz başarıyla doğrulandı!', 'success');
      setTimeout(() => {
        onBackToLogin();
      }, 3000);
    } catch (err) {
      showNotification(err.message || 'Doğrulama kodu hatalı veya süresi geçmiş.', 'error');
    } finally {
      setLoading(false);
      setLoadingScreen(false);
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0) return;
    setResending(true);
    setLoadingScreen(true);

    try {
      const data = await resendOtp(email);
      showNotification(data.message || 'Yeni doğrulama kodu e-posta adresinize gönderildi.', 'success');
      setResendTimer(60);
    } catch (err) {
      showNotification(err.message || 'Kod tekrar gönderilirken hata oluştu.', 'error');
    } finally {
      setResending(false);
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
      <div className="card" style={{
        width: '100%',
        maxWidth: '420px',
        textAlign: 'center',
        padding: '30px',
        borderRadius: 'var(--radius-lg)'
      }}>
        {/* Geri Dön Butonu */}
        <button 
          onClick={onBackToLogin}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            background: 'none',
            border: 'none',
            color: 'var(--text-secondary)',
            fontSize: '13px',
            cursor: 'pointer',
            padding: '0',
            marginBottom: '20px',
            outline: 'none'
          }}
        >
          <ArrowLeft size={16} /> Giriş Ekranına Dön
        </button>

        {/* Header */}
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
            E-posta Doğrulama
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            Lütfen e-posta adresinize gönderilen 6 haneli doğrulama kodunu girin.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">E-posta Adresi</label>
            <input
              type="email"
              required
              className="form-control"
              placeholder="E-posta adresinizi girin"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={!!initialEmail}
              style={{ width: '100%' }}
            />
          </div>

          <div className="form-group" style={{ marginBottom: '25px' }}>
            <label className="form-label">Doğrulama Kodu (OTP)</label>
            <input
              type="text"
              required
              maxLength={6}
              className="form-control"
              placeholder="######"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
              style={{ 
                textAlign: 'center', 
                fontSize: '24px', 
                letterSpacing: '6px', 
                fontWeight: '700',
                padding: '10px',
                width: '100%'
              }}
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            disabled={loading || otpCode.length !== 6}
            style={{ width: '100%', marginBottom: '15px' }}
          >
            {loading ? <Loader className="animate-spin" size={18} /> : 'Kodu Doğrula'}
          </button>
        </form>

        <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
          Kod gelmedi mi?{' '}
          <button 
            onClick={handleResend}
            disabled={resendTimer > 0 || resending}
            style={{
              background: 'none',
              border: 'none',
              color: resendTimer > 0 ? 'var(--text-muted)' : 'var(--accent-primary)',
              fontWeight: '600',
              cursor: resendTimer > 0 ? 'not-allowed' : 'pointer',
              outline: 'none'
            }}
          >
            {resending ? 'Gönderiliyor...' : resendTimer > 0 ? `Tekrar Gönder (${resendTimer}s)` : 'Tekrar Gönder'}
          </button>
        </p>
      </div>
    </div>
  );
}
