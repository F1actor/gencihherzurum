import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyOtp from './pages/VerifyOtp';
import AdminDashboard from './pages/AdminDashboard';
import UnitDashboard from './pages/UnitDashboard';
import MuhabbetTeacherDashboard from './pages/MuhabbetTeacherDashboard';
import { ShieldAlert, RefreshCw, LogOut, Sun, Moon } from 'lucide-react';
import logoImg from './assets/logo.jpg';
import AIChatWidget from './components/AIChatWidget';

// Public Pages
import PublicHome from './pages/PublicHome';
import MuhabbetApply from './pages/MuhabbetApply';
import MuhabbetPortal from './pages/MuhabbetPortal';

function PortalContent() {
  const { user, loading, logout, theme, toggleTheme, loadingScreen, triggerTransition } = useAuth();
  const [authView, setAuthView] = useState('login');
  const [verifyEmail, setVerifyEmail] = useState('');
  const [refreshLoading, setRefreshLoading] = useState(false);

  if (loading) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
        <div style={{ textAlign: 'center' }}>
          <img src={logoImg} className="spin-logo-image" style={{ width: '50px', height: '50px', marginBottom: '15px' }} alt="Logo" />
          <p style={{ fontSize: '15px', fontWeight: '700', color: 'var(--accent-primary)' }}>Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (user) {
    return (
      <>
        {user.role === 'SUPER_ADMIN' ? (
          <AdminDashboard />
        ) : user.role === 'MUHABBET_TEACHER' ? (
          <MuhabbetTeacherDashboard />
        ) : user.role === 'UNIT_PRESIDENT' && user.assignedUnit ? (
          <UnitDashboard />
        ) : (
          <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', padding: '20px', backgroundColor: 'var(--bg-primary)', transition: 'background-color var(--transition-normal)' }}>
            <button onClick={toggleTheme} className="btn btn-secondary" style={{ position: 'absolute', top: '20px', right: '20px', borderRadius: 'var(--radius-full)', padding: '10px' }}>
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>
            <div className="card" style={{ width: '100%', maxWidth: '500px', textAlign: 'center', padding: '40px 30px', borderRadius: 'var(--radius-lg)' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', padding: '16px', borderRadius: 'var(--radius-full)', marginBottom: '20px' }}>
                <ShieldAlert size={36} />
              </div>
              <h2 style={{ fontSize: '22px', fontWeight: '800', fontFamily: 'var(--font-display)', marginBottom: '10px' }}>Onay Bekleniyor</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '15px', lineHeight: '1.6', marginBottom: '25px', textAlign: 'left' }}>
                Sayın <strong>{user.fullName}</strong>,<br /><br />
                Sistem güvenliği ve hiyerarşisi gereği, hangi birime başkanlık edeceğiniz veya Muhabbet Okulu sınıfınız Süper Admin tarafından <strong>manuel olarak atanmalıdır</strong>.<br /><br />
                Birim atamanız tamamlandığında panelinize tam erişim hakkı kazanacaksınız.
              </p>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => window.location.reload()} className="btn btn-primary" disabled={refreshLoading} style={{ flex: 1 }}>
                  <RefreshCw className={refreshLoading ? 'animate-spin' : ''} size={16} /> Durumu Kontrol Et
                </button>
                <button onClick={logout} className="btn btn-secondary" style={{ flex: 1, gap: '8px' }}>
                  <LogOut size={16} /> Çıkış Yap
                </button>
              </div>
            </div>
          </div>
        )}
        {loadingScreen && (
          <div className="loading-overlay">
            <img src={logoImg} className="spin-logo-image" style={{ width: '50px', height: '50px' }} alt="Yükleniyor..." />
            <span style={{ fontWeight: '700', color: 'var(--accent-primary)', fontSize: '15px' }}>Yükleniyor...</span>
          </div>
        )}
        <AIChatWidget />
      </>
    );
  }

  return (
    <>
      {authView === 'login' && (
        <Login 
          onRegisterRedirect={() => triggerTransition(() => setAuthView('register'))} 
          onVerifyRedirect={(email) => triggerTransition(() => { setVerifyEmail(email); setAuthView('verify'); })}
        />
      )}
      {authView === 'register' && (
        <Register 
          onLoginRedirect={() => triggerTransition(() => setAuthView('login'))}
          onRegisterSuccess={(email) => triggerTransition(() => { setVerifyEmail(email); setAuthView('verify'); })}
        />
      )}
      {authView === 'verify' && (
        <VerifyOtp 
          initialEmail={verifyEmail}
          onBackToLogin={() => triggerTransition(() => setAuthView('login'))}
        />
      )}
      {loadingScreen && (
        <div className="loading-overlay">
          <img src={logoImg} className="spin-logo-image" style={{ width: '50px', height: '50px' }} alt="Yükleniyor..." />
          <span style={{ fontWeight: '700', color: 'var(--accent-primary)', fontSize: '15px' }}>Yükleniyor...</span>
        </div>
      )}
    </>
  );
}

export default function App() {
  return (
    <NotificationProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<PublicHome />} />
            <Route path="/basvuru" element={<MuhabbetApply />} />
            <Route path="/muhabbet" element={<MuhabbetPortal />} />
            <Route path="/yonetim/*" element={<PortalContent />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </NotificationProvider>
  );
}
