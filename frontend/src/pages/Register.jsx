import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { User, Mail, Lock, Loader, Phone } from 'lucide-react';
import logoImg from '../assets/logo.jpg';

export default function Register({ onLoginRedirect, onRegisterSuccess }) {
  const { register, setLoadingScreen } = useAuth();
  const { showNotification } = useNotification();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setLoadingScreen(true);

    try {
      await register(fullName, email, password, phoneNumber);
      showNotification('Kayıt başarılı! E-posta adresinize doğrulama kodu gönderildi.', 'success');
      onRegisterSuccess(email);
    } catch (err) {
      showNotification(err.message || 'Kayıt sırasında bir hata oluştu.', 'error');
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
      <div className="card" style={{
        width: '100%',
        maxWidth: '420px',
        textAlign: 'center',
        padding: '30px',
        borderRadius: 'var(--radius-lg)'
      }}>
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
            Yeni Kayıt Oluştur
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            Genç İHH Teşkilat Portalına Katılın
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Adınız ve Soyadınız</label>
            <div style={{ position: 'relative' }}>
              <User size={18} style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)'
              }} />
              <input
                type="text"
                required
                className="form-control"
                placeholder="Örn: Ahmet Yılmaz"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                style={{ paddingLeft: '40px', width: '100%' }}
              />
            </div>
          </div>

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
                placeholder="Örn: ornek@gencihh.org"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ paddingLeft: '40px', width: '100%' }}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Telefon Numarası</label>
            <div style={{ position: 'relative' }}>
              <Phone size={18} style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)'
              }} />
              <input
                type="tel"
                required
                className="form-control"
                placeholder="Örn: 05551234567"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                style={{ paddingLeft: '40px', width: '100%' }}
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '20px' }}>
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
                placeholder="En az 6 karakter"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingLeft: '40px', width: '100%' }}
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            disabled={loading}
            style={{ width: '100%', marginBottom: '15px' }}
          >
            {loading ? <Loader className="animate-spin" size={18} /> : 'Kayıt Ol'}
          </button>
        </form>

        <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
          Zaten hesabınız var mı?{' '}
          <button 
            onClick={onLoginRedirect}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--accent-primary)',
              fontWeight: '600',
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            Giriş Yap
          </button>
        </p>
      </div>
    </div>
  );
}
