import React from 'react';
import { Users, Award, CheckSquare, Bell, Calendar, LogOut, Moon, Sun, User, Shield, BarChart2, TrendingUp, X, Download, Image as ImageIcon, Filter, Search, Settings, Target } from 'lucide-react';
import logoImg from '../../../assets/logo.jpg';

/**
 * Sidebar — Admin paneli sol menü bileşeni.
 * Props: user, activeTab, setActiveTab, isSidebarCollapsed, setIsSidebarCollapsed,
 *         theme, toggleTheme, triggerTransition, handleLogout
 */
export default function Sidebar({
  user, activeTab, isSidebarCollapsed, setIsSidebarCollapsed,
  theme, toggleTheme, triggerTransition, handleLogout, setActiveTab
}) {
  const isCoordinator = user?.role === 'MUHABBET_COORDINATOR';
  const disabledStyle = { opacity: 0.35, cursor: 'not-allowed', pointerEvents: 'none' };

  const navItems = [
    { id: 'overview', icon: <Shield size={18} />, label: 'Genel Panel' },
    { id: 'presidents', icon: <Users size={18} />, label: 'Birim Başkanları' },
    { id: 'reports', icon: <BarChart2 size={18} />, label: 'Raporlar' },
    { id: 'tasks', icon: <CheckSquare size={18} />, label: 'Görevler' },
    { id: 'audits', icon: <Bell size={18} />, label: 'Denetim & Pasiflik' },
    { id: 'gallery', icon: <ImageIcon size={18} />, label: 'Etkinlik Medyası' },
    { id: 'muhabbet', icon: <Target size={18} />, label: 'Muhabbet Okulu' },
    { id: 'system', icon: <Settings size={18} />, label: 'Sistem Yönetimi' },
  ];

  return (
    <aside style={{
      width: isSidebarCollapsed ? '80px' : '280px',
      backgroundColor: 'var(--bg-secondary)',
      borderRight: '1px solid var(--border-color)',
      display: 'flex', flexDirection: 'column',
      padding: isSidebarCollapsed ? '30px 10px' : '30px 20px',
      flexShrink: 0, top: 0, height: '100vh',
      justifyContent: 'space-between',
      transition: 'width 0.3s cubic-bezier(0.4,0,0.2,1), padding 0.3s cubic-bezier(0.4,0,0.2,1)',
      position: 'sticky'
    }}>
      {/* Collapse Toggle */}
      <button
        onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        className="btn btn-secondary"
        style={{
          position: 'absolute', right: '-12px', top: '32px',
          width: '24px', height: '24px', borderRadius: '50%', padding: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)',
          cursor: 'pointer', zIndex: 10, backgroundColor: 'var(--bg-secondary)',
          color: 'var(--text-primary)', fontSize: '12px', lineHeight: 1
        }}
        title={isSidebarCollapsed ? 'Menüyü Genişlet' : 'Menüyü Daralt'}
      >
        {isSidebarCollapsed ? '»' : '«'}
      </button>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '40px', justifyContent: isSidebarCollapsed ? 'center' : 'flex-start', overflow: 'hidden' }}>
          <img src={logoImg} alt="Logo" style={{ width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0 }} />
          {!isSidebarCollapsed && (
            <div style={{ textAlign: 'left' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '800', fontFamily: 'var(--font-display)', lineHeight: '1.2' }}>Genç İHH</h3>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '600', letterSpacing: '0.5px' }}>
                {isCoordinator ? 'YAZ OKULU KOORDİNATÖRÜ' : 'SÜPER ADMİN'}
              </span>
            </div>
          )}
        </div>

        {/* Nav Links */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, alignItems: isSidebarCollapsed ? 'center' : 'stretch' }}>
          {navItems.map(item => {
            const isOnlyAllowed = isCoordinator && item.id !== 'muhabbet';
            return (
              <button
                key={item.id}
                onClick={() => !isOnlyAllowed && triggerTransition(() => setActiveTab(item.id))}
                className={`btn ${activeTab === item.id ? 'btn-primary' : 'btn-secondary'}`}
                style={{
                  justifyContent: isSidebarCollapsed ? 'center' : 'flex-start',
                  width: '100%',
                  padding: isSidebarCollapsed ? '10px 0' : '10px 16px',
                  ...(isOnlyAllowed ? disabledStyle : {})
                }}
                title={isOnlyAllowed ? 'Bu alana erişim yetkiniz yok' : item.label}
                disabled={isOnlyAllowed}
              >
                {item.icon}
                {!isSidebarCollapsed && <span style={{ marginLeft: '10px' }}>{item.label}</span>}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom: Profile & Logout */}
      <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '20px', display: 'flex', flexDirection: 'column', gap: '10px', alignItems: isSidebarCollapsed ? 'center' : 'stretch' }}>
        <div
          onClick={() => triggerTransition(() => setActiveTab('profile'))}
          style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            justifyContent: isSidebarCollapsed ? 'center' : 'flex-start',
            overflow: 'hidden', width: '100%', cursor: 'pointer',
            padding: '6px', borderRadius: 'var(--radius-md)', transition: 'background-color 0.2s'
          }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
          title="Hesabım"
        >
          <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-full)', backgroundColor: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', flexShrink: 0 }}>
            {user?.fullName?.[0]}
          </div>
          {!isSidebarCollapsed && (
            <div style={{ textAlign: 'left', overflow: 'hidden' }}>
              <h4 style={{ fontSize: '13px', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{user?.fullName}</h4>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{user?.email}</span>
            </div>
          )}
        </div>

        <button
          onClick={() => triggerTransition(() => setActiveTab('profile'))}
          className={`btn ${activeTab === 'profile' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ width: '100%', padding: isSidebarCollapsed ? '10px 0' : '10px 16px', justifyContent: isSidebarCollapsed ? 'center' : 'flex-start', gap: '8px' }}
          title="Hesabım"
        >
          <User size={16} />
          {!isSidebarCollapsed && <span>Hesabım</span>}
        </button>

        <button
          onClick={handleLogout}
          className="btn btn-secondary"
          style={{ width: '100%', padding: isSidebarCollapsed ? '10px 0' : '10px 16px', justifyContent: isSidebarCollapsed ? 'center' : 'flex-start', gap: '8px' }}
          title="Çıkış Yap"
        >
          <LogOut size={16} />
          {!isSidebarCollapsed && <span>Çıkış Yap</span>}
        </button>
      </div>
    </aside>
  );
}
