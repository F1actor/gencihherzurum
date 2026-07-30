import React, { useState } from 'react';
import { useAuth } from '../../shared/context/AuthContext';
import { useNotification } from '../../shared/context/NotificationContext';
import { User, Mail, Lock, Phone, Loader, Check } from 'lucide-react';
import AuthLayout from './AuthLayout';

export default function Register({ onLoginRedirect, onRegisterSuccess }) {
  const { register, setLoadingScreen } = useAuth();
  const { showNotification } = useNotification();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [kvkkAccepted, setKvkkAccepted] = useState(false);
  const [showKvkkModal, setShowKvkkModal] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!kvkkAccepted) {
      showNotification('Lütfen kayıt olmak için KVKK Aydınlatma Metni\'ni okuyup onaylayın.', 'warning');
      return;
    }
    
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
    <AuthLayout title="Yeni Kayıt Oluştur" subtitle="Teşkilat Portalına Katılın">
      <form onSubmit={handleSubmit} style={{ width: '100%', textAlign: 'left' }}>
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
              disabled={loading}
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
              disabled={loading}
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
              disabled={loading}
            />
          </div>
        </div>

        <div className="form-group" style={{ marginBottom: '15px' }}>
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
              disabled={loading}
            />
          </div>
        </div>

        {/* KVKK Checkbox */}
        <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
          <div 
            onClick={() => setKvkkAccepted(!kvkkAccepted)}
            style={{
              width: '20px',
              height: '20px',
              borderRadius: '4px',
              border: `2px solid ${kvkkAccepted ? 'var(--accent-primary)' : 'var(--border-color)'}`,
              backgroundColor: kvkkAccepted ? 'var(--accent-primary)' : 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0,
              marginTop: '2px',
              transition: 'all 0.2s'
            }}
          >
            {kvkkAccepted && <Check size={14} color="white" strokeWidth={3} />}
          </div>
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5, cursor: 'pointer' }} onClick={() => setKvkkAccepted(!kvkkAccepted)}>
            <button 
              type="button" 
              onClick={(e) => { e.stopPropagation(); setShowKvkkModal(true); }}
              style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', fontWeight: 'bold', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
            >
              KVKK Aydınlatma Metni
            </button>
            'ni okudum ve kişisel verilerimin işlenmesini kabul ediyorum.
          </p>
        </div>

        <button 
          type="submit" 
          className="btn btn-primary" 
          style={{ width: '100%', marginBottom: '20px', height: '44px' }}
          disabled={loading}
        >
          {loading ? <Loader size={18} className="spin" /> : 'Kayıt Ol'}
        </button>

        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
            Zaten hesabınız var mı? {' '}
            <button 
              type="button" 
              onClick={onLoginRedirect}
              style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', fontWeight: 'bold', cursor: 'pointer', padding: 0 }}
            >
              Giriş Yapın
            </button>
          </p>
        </div>
      </form>

      {/* KVKK Modal */}
      {showKvkkModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.6)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-lg)',
            width: '100%',
            maxWidth: '600px',
            maxHeight: '80vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
          }}>
            <div style={{ padding: '20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>KVKK Aydınlatma Metni</h3>
            </div>
            <div style={{ padding: '20px', overflowY: 'auto', fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              <p><strong>GENÇ İHH ERZURUM KİŞİSEL VERİLERİN KORUNMASI VE İŞLENMESİ AYDINLATMA METNİ</strong></p>
              <p>
                Değerli Teşkilat Mensubumuz, Genç İHH Erzurum olarak kişisel verilerinizin güvenliğine büyük önem vermekteyiz.
                Bu kapsamda, bizimle paylaştığınız kişisel verileriniz (ad-soyad, e-posta, telefon numarası, görev ve birim bilgileri, sisteme yüklenen etkinlik görselleri)
                6698 sayılı Kişisel Verilerin Korunması Kanunu (“KVKK”) uyarınca, teşkilat içi iletişim, etkinlik raporlama, başarı hesaplamaları ve istatistik üretimi 
                amacıyla işlenecek ve güvenle saklanacaktır.
              </p>
              <p>
                Sistemimize yüklediğiniz görseller, sadece yönetim kurulu ve il yönetimi tarafından performansı değerlendirmek ve
                sosyal mecralarımızda (onayınız dahilinde) paylaşılmak üzere kullanılabilir. Şifreleriniz kriptolu olarak veritabanında tutulmakta olup,
                sistem yöneticileri dâhil kimse tarafından görülemez.
              </p>
              <p>
                KVKK 11. Maddesi gereği haklarınızı kullanmak ve detaylı bilgi almak için Genç İHH Erzurum teşkilat birimleriyle iletişime geçebilirsiniz.
              </p>
            </div>
            <div style={{ padding: '15px 20px', borderTop: '1px solid var(--border-color)', textAlign: 'right' }}>
              <button 
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  setKvkkAccepted(true);
                  setShowKvkkModal(false);
                }}
              >
                Okudum, Onaylıyorum
              </button>
            </div>
          </div>
        </div>
      )}
    </AuthLayout>
  );
}
