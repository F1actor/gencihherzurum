import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { 
  Users, Award, CheckSquare, Bell, Calendar, LogOut, Moon, Sun, 
  User, UserCheck, AlertTriangle, Shield, Check, Trash2, RefreshCw, BarChart2, TrendingUp, X, Download, Image as ImageIcon, Filter, Search, Settings 
} from 'lucide-react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import logoImg from '../assets/logo.jpg';
import SystemSettingsPanel from '../components/SystemSettingsPanel';
import EventMediaGallery from '../components/EventMediaGallery';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend);

const validUnits = [
  'İl Başkanı',
  'Teşkilatlanma Başkanı',
  'Eğitim Başkanı',
  'Üniversite Başkanı',
  'Lise Başkanı',
  'Ortaokul Başkanı',
  'İHH Çocuk Başkanı',
  'Tanıtım ve Medya Başkanı',
  'Çalışan Gençlik Başkanı',
  'Sosyal Faaliyet Başkanı',
  'Proje - Fon Başkanı',
  'Atom Başkanı'
];

const daysMap = {
  1: 'Pazartesi',
  2: 'Salı',
  3: 'Çarşamba',
  4: 'Perşembe',
  5: 'Cuma',
  6: 'Cumartesi',
  7: 'Pazar'
};

export default function AdminDashboard() {
  const { user, logout, theme, toggleTheme, fetchWithAuth, setLoadingScreen, triggerTransition } = useAuth();
  const { showNotification, showConfirm } = useNotification();
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'performance', 'routines', 'audits'

  // Veri Durumları
  const [pendingUsers, setPendingUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [stats, setStats] = useState({ totalPresidents: 0, pendingApprovals: 0, totalEvents: 0 });
  const [recentEvents, setRecentEvents] = useState([]);
  const [leaderboard, setLeaderboard] = useState({ weekly: [], monthly: [], overall: [] });
  const [performance, setPerformance] = useState([]);
  const [routines, setRoutines] = useState([]);
  const [audits, setAudits] = useState([]);
  const [chartWeeksData, setChartWeeksData] = useState([]);
  const [eventsGallery, setEventsGallery] = useState([]);
  const [gallerySearch, setGallerySearch] = useState('');
  const [galleryTypeFilter, setGalleryTypeFilter] = useState('ALL'); // ALL, ROUTINE, EXTRA
  const [galleryProofFilter, setGalleryProofFilter] = useState('ALL'); // ALL, WITH_PROOF, WITHOUT_PROOF
  
  // İşlem Durumları
  const [selectedUnits, setSelectedUnits] = useState({}); // { userId: selectedUnit }
  const [newRoutine, setNewRoutine] = useState({ unit: validUnits[0], title: '', dayOfWeek: '1' });
  const [activeLeaderboardTab, setActiveLeaderboardTab] = useState('weekly'); // 'weekly', 'monthly', 'overall'
  const [previewImage, setPreviewImage] = useState(null);
  const [eventSearchQuery, setEventSearchQuery] = useState('');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [profileForm, setProfileForm] = useState({
    phoneNumber: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    if (user) {
      setProfileForm(prev => ({ ...prev, phoneNumber: user.phoneNumber || '' }));
    }
  }, [user]);

  const loadDashboardData = async (showOverlay = true) => {
    if (showOverlay) setLoadingScreen(true);
    try {
      // 1. Stats and Overview
      const statsRes = await fetchWithAuth('/reports/dashboard-stats');
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData.summary);
        setRecentEvents(statsData.recentEvents);
        setChartWeeksData(statsData.weeksData);
      }

      // 2. Pending Users
      const pendingRes = await fetchWithAuth('/admin/pending-users');
      if (pendingRes.ok) {
        const pendingData = await pendingRes.json();
        setPendingUsers(pendingData);
      }

      // 3. All Users
      const usersRes = await fetchWithAuth('/admin/users');
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setAllUsers(usersData);
      }

      // 4. Leaderboard
      const leaderboardRes = await fetchWithAuth('/reports/leaderboard');
      if (leaderboardRes.ok) {
        const leaderboardData = await leaderboardRes.json();
        setLeaderboard(leaderboardData);
      }

      // 5. Performance Report
      const perfRes = await fetchWithAuth('/reports/performance');
      if (perfRes.ok) {
        const perfData = await perfRes.json();
        setPerformance(perfData);
      }

      // 6. Routines
      const routinesRes = await fetchWithAuth('/admin/routines');
      if (routinesRes.ok) {
        const routinesData = await routinesRes.json();
        setRoutines(routinesData);
      }

      // 7. Audit logs
      const auditsRes = await fetchWithAuth('/admin/audits');
      if (auditsRes.ok) {
        const auditsData = await auditsRes.json();
        setAudits(auditsData);
      }

      // 8. Events Gallery
      const galleryRes = await fetchWithAuth('/admin/events-gallery');
      if (galleryRes.ok) {
        const galleryData = await galleryRes.json();
        setEventsGallery(galleryData);
      }

    } catch (error) {
      console.error('Veri yükleme hatası:', error);
      showNotification('Veriler yüklenirken hata oluştu.', 'error');
    } finally {
      if (showOverlay) setLoadingScreen(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Birim Atama İşlemi
  const handleAssignUnit = async (userId) => {
    const unit = selectedUnits[userId];
    if (!unit) {
      showNotification('Lütfen atanacak bir birim seçin.', 'warning');
      return;
    }

    setLoadingScreen(true);
    try {
      const res = await fetchWithAuth('/admin/assign-unit', {
        method: 'POST',
        body: JSON.stringify({ userId, unit })
      });
      const data = await res.json();
      if (res.ok) {
        showNotification(data.message, 'success');
        loadDashboardData(false);
      } else {
        showNotification(data.message, 'error');
      }
    } catch (error) {
      showNotification('Atama yapılırken hata oluştu.', 'error');
    } finally {
      setLoadingScreen(false);
    }
  };

  const handleDeleteUser = (userId, userName) => {
    showConfirm(
      `${userName} kullanıcısını silmek istediğinize emin misiniz? Bu işlem geri alınamaz ve kullanıcının tüm etkinlik kayıtlarını silecektir.`,
      async () => {
        setLoadingScreen(true);
        try {
          const res = await fetchWithAuth(`/admin/users/${userId}`, {
            method: 'DELETE'
          });
          const data = await res.json();
          if (res.ok) {
            showNotification(data.message || 'Kullanıcı silindi.', 'success');
            loadDashboardData(false);
          } else {
            showNotification(data.message || 'Kullanıcı silinemedi.', 'error');
          }
        } catch (error) {
          showNotification('Bağlantı hatası oluştu.', 'error');
        } finally {
          setLoadingScreen(false);
        }
      }
    );
  };

  // CSV Dışa Aktar
  const handleExportCSV = async () => {
    try {
      showNotification('Rapor hazırlanıyor, lütfen bekleyin...', 'info');
      const response = await fetch(`http://127.0.0.1:5000/api/reports/export-csv`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (!response.ok) throw new Error('Rapor indirilemedi');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `gencihh_rapor_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      showNotification('Rapor başarıyla indirildi.', 'success');
    } catch (err) {
      showNotification('Rapor indirme hatası.', 'error');
    }
  };

  // Yeni Rutin Ekleme
  const handleCreateRoutine = async (e) => {
    e.preventDefault();
    if (!newRoutine.title.trim()) {
      showNotification('Lütfen rutin başlığı yazın.', 'warning');
      return;
    }

    setLoadingScreen(true);
    try {
      const res = await fetchWithAuth('/admin/routines', {
        method: 'POST',
        body: JSON.stringify({
          unit: newRoutine.unit,
          title: newRoutine.title,
          dayOfWeek: parseInt(newRoutine.dayOfWeek)
        })
      });
      const data = await res.json();
      if (res.ok) {
        showNotification(data.message, 'success');
        setNewRoutine({ ...newRoutine, title: '' });
        loadDashboardData(false);
      } else {
        showNotification(data.message, 'error');
      }
    } catch (error) {
      showNotification('Rutin eklenirken hata oluştu.', 'error');
    } finally {
      setLoadingScreen(false);
    }
  };

  // Rutin Silme
  const handleDeleteRoutine = (id) => {
    showConfirm(
      'Bu rutin görevi silmek istediğinize emin misiniz?',
      async () => {
        setLoadingScreen(true);
        try {
          const res = await fetchWithAuth(`/admin/routines/${id}`, {
            method: 'DELETE'
          });
          const data = await res.json();
          if (res.ok) {
            showNotification(data.message, 'success');
            loadDashboardData(false);
          } else {
            showNotification(data.message, 'error');
          }
        } catch (error) {
          showNotification('Rutin silinirken hata oluştu.', 'error');
        } finally {
          setLoadingScreen(false);
        }
      }
    );
  };

  // Manuel Denetim Çalıştırma (Pasiflik & Aylık Şampiyon)
  const handleRunAudit = async () => {
    setLoadingScreen(true);
    try {
      const res = await fetchWithAuth('/admin/run-audit', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        showNotification(data.message, 'success');
        loadDashboardData(false);
      } else {
        showNotification(data.message, 'error');
      }
    } catch (error) {
      showNotification('Denetim çalıştırılırken hata oluştu.', 'error');
    } finally {
      setLoadingScreen(false);
    }
  };

  // --- GRAFİK VERİLERİ HAZIRLAMA ---

  // 1. Haftalık Puan Trendi Grafiği
  const prepareTrendChartData = () => {
    if (chartWeeksData.length === 0) return { labels: [], datasets: [] };

    const labels = chartWeeksData.map(w => w.label);
    
    const getUnitColor = (index) => {
      const colors = [
        '#5b8036', '#3b82f6', '#f59e0b', '#ef4444', 
        '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', 
        '#06b6d4', '#6366f1', '#84cc16', '#a855f7'
      ];
      return colors[index % colors.length];
    };

    const datasets = validUnits.map((unit, index) => {
      const dataPoints = chartWeeksData.map(w => w.pointsMap[unit] || 0);
      return {
        label: unit,
        data: dataPoints,
        borderColor: getUnitColor(index),
        backgroundColor: 'transparent',
        tension: 0.3,
        borderWidth: 2,
        pointRadius: 3
      };
    });

    return { labels, datasets };
  };

  const getUnitPresidentName = (unitName) => {
    const president = allUsers.find(u => u.assignedUnit === unitName);
    return president ? ` (${president.fullName})` : '';
  };

  // 2. Rutin Başarı Oranı Grafiği
  const prepareSuccessRateChartData = () => {
    const topPerformers = performance.slice(0, 8);
    const labels = topPerformers.map(p => p.unit);
    const data = topPerformers.map(p => p.routineSuccessRate);

    return {
      labels,
      datasets: [
        {
          label: 'Rutin Başarı Oranı (%)',
          data,
          backgroundColor: 'rgba(91, 128, 54, 0.75)',
          borderColor: '#5b8036',
          borderWidth: 1,
          borderRadius: 6
        }
      ]
    };
  };

  const handleLogout = () => {
    logout();
    showNotification('Oturum kapatıldı.', 'info');
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (profileForm.newPassword && profileForm.newPassword !== profileForm.confirmPassword) {
      showNotification('Yeni şifreler uyuşmuyor.', 'warning');
      return;
    }

    setLoadingScreen(true);
    try {
      const res = await fetchWithAuth('/auth/update-profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: profileForm.phoneNumber,
          currentPassword: profileForm.currentPassword,
          newPassword: profileForm.newPassword
        })
      });
      const data = await res.json();
      if (res.ok) {
        showNotification(data.message, 'success');
        setProfileForm(prev => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }));
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        showNotification(data.message, 'error');
      }
    } catch (err) {
      showNotification('Profil güncellenirken bir hata oluştu.', 'error');
    } finally {
      setLoadingScreen(false);
    }
  };

  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside style={{
        width: isSidebarCollapsed ? '80px' : '280px',
        backgroundColor: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        padding: isSidebarCollapsed ? '30px 10px' : '30px 20px',
        flexShrink: 0,
        position: 'sticky',
        top: 0,
        height: '100vh',
        justifyContent: 'space-between',
        transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1), padding 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative'
      }}>
        {/* Toggle Collapse Button */}
        <button 
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className="btn btn-secondary"
          style={{
            position: 'absolute',
            right: '-12px',
            top: '32px',
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            padding: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-sm)',
            cursor: 'pointer',
            zIndex: 10,
            backgroundColor: 'var(--bg-secondary)',
            color: 'var(--text-primary)',
            fontSize: '12px',
            lineHeight: 1
          }}
          title={isSidebarCollapsed ? "Menüyü Genişlet" : "Menüyü Daralt"}
        >
          {isSidebarCollapsed ? '»' : '«'}
        </button>

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '40px', justifyContent: isSidebarCollapsed ? 'center' : 'flex-start', overflow: 'hidden' }}>
          <img 
            src={logoImg} 
            alt="Logo" 
            style={{ width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0 }} 
          />
          {!isSidebarCollapsed && (
            <div style={{ textAlign: 'left' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '800', fontFamily: 'var(--font-display)', lineHeight: '1.2' }}>Genç İHH</h3>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '600', letterSpacing: '0.5px' }}>SÜPER ADMİN</span>
            </div>
          )}
        </div>

        {/* Menü Linkleri */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, alignItems: isSidebarCollapsed ? 'center' : 'stretch' }}>
          <button 
            onClick={() => triggerTransition(() => setActiveTab('overview'))} 
            className={`btn ${activeTab === 'overview' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ justifyContent: isSidebarCollapsed ? 'center' : 'flex-start', width: '100%', padding: isSidebarCollapsed ? '10px 0' : '10px 16px' }}
            title="Genel Panel"
          >
            <Shield size={18} />
            {!isSidebarCollapsed && <span style={{ marginLeft: '10px' }}>Genel Panel</span>}
          </button>
          <button 
            onClick={() => triggerTransition(() => setActiveTab('presidents'))} 
            className={`btn ${activeTab === 'presidents' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ justifyContent: isSidebarCollapsed ? 'center' : 'flex-start', width: '100%', padding: isSidebarCollapsed ? '10px 0' : '10px 16px' }}
            title="Birim Başkanları"
          >
            <Users size={18} />
            {!isSidebarCollapsed && <span style={{ marginLeft: '10px' }}>Birim Başkanları</span>}
          </button>
          <button 
            onClick={() => triggerTransition(() => setActiveTab('performance'))} 
            className={`btn ${activeTab === 'performance' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ justifyContent: isSidebarCollapsed ? 'center' : 'flex-start', width: '100%', padding: isSidebarCollapsed ? '10px 0' : '10px 16px' }}
            title="Performans Raporları"
          >
            <BarChart2 size={18} />
            {!isSidebarCollapsed && <span style={{ marginLeft: '10px' }}>Performans Raporları</span>}
          </button>
          <button 
            onClick={() => triggerTransition(() => setActiveTab('routines'))} 
            className={`btn ${activeTab === 'routines' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ justifyContent: isSidebarCollapsed ? 'center' : 'flex-start', width: '100%', padding: isSidebarCollapsed ? '10px 0' : '10px 16px' }}
            title="Rutin Görev Takvimi"
          >
            <Calendar size={18} />
            {!isSidebarCollapsed && <span style={{ marginLeft: '10px' }}>Rutin Görev Takvimi</span>}
          </button>
          <button 
            onClick={() => triggerTransition(() => setActiveTab('audits'))} 
            className={`btn ${activeTab === 'audits' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ justifyContent: isSidebarCollapsed ? 'center' : 'flex-start', width: '100%', padding: isSidebarCollapsed ? '10px 0' : '10px 16px' }}
            title="Denetim & Pasiflik"
          >
            <Bell size={18} />
            {!isSidebarCollapsed && <span style={{ marginLeft: '10px' }}>Denetim & Pasiflik</span>}
          </button>
          <button 
            onClick={() => triggerTransition(() => setActiveTab('gallery'))} 
            className={`btn ${activeTab === 'gallery' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ justifyContent: isSidebarCollapsed ? 'center' : 'flex-start', width: '100%', padding: isSidebarCollapsed ? '10px 0' : '10px 16px' }}
            title="Etkinlik Medyası"
          >
            <ImageIcon size={18} />
            {!isSidebarCollapsed && <span style={{ marginLeft: '10px' }}>Etkinlik Medyası</span>}
          </button>
          <button 
            onClick={() => triggerTransition(() => setActiveTab('system'))} 
            className={`btn ${activeTab === 'system' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ justifyContent: isSidebarCollapsed ? 'center' : 'flex-start', width: '100%', padding: isSidebarCollapsed ? '10px 0' : '10px 16px' }}
            title="Sistem & Ayarlar"
          >
            <Settings size={18} />
            {!isSidebarCollapsed && <span style={{ marginLeft: '10px' }}>Sistem Yönetimi</span>}
          </button>
        </nav>

        {/* Profil ve Çıkış */}
        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '20px', display: 'flex', flexDirection: 'column', gap: '10px', alignItems: isSidebarCollapsed ? 'center' : 'stretch' }}>
          <div 
            onClick={() => triggerTransition(() => setActiveTab('profile'))}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '10px', 
              justifyContent: isSidebarCollapsed ? 'center' : 'flex-start', 
              overflow: 'hidden', 
              width: '100%', 
              cursor: 'pointer',
              padding: '6px',
              borderRadius: 'var(--radius-md)',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            title="Hesabım"
          >
            <div style={{
              width: '36px', height: '36px', borderRadius: 'var(--radius-full)', backgroundColor: 'var(--bg-tertiary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', flexShrink: 0
            }}>
              {user?.fullName[0]}
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

          <button onClick={handleLogout} className="btn btn-secondary" style={{ width: '100%', padding: isSidebarCollapsed ? '10px 0' : '10px 16px', justifyContent: isSidebarCollapsed ? 'center' : 'flex-start', gap: '8px' }} title="Çıkış Yap">
            <LogOut size={16} />
            {!isSidebarCollapsed && <span>Çıkış Yap</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        {/* Top Header */}
        <header style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem'
        }}>
          <div style={{ textAlign: 'left' }}>
            <h1 style={{ fontSize: '26px', fontWeight: '800', fontFamily: 'var(--font-display)' }}>
              {activeTab === 'overview' && 'Yönetim Paneli'}
              {activeTab === 'presidents' && 'Birim Başkanları Listesi'}
              {activeTab === 'performance' && 'Birim Başarı ve KPI Raporları'}
              {activeTab === 'routines' && 'Rutin Görev Takvimi Yönetimi'}
              {activeTab === 'audits' && 'Sistem Denetimi ve Pasiflik Uyarıları'}
              {activeTab === 'gallery' && 'Etkinlik Medyası'}
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
              Sistem verileri gerçek zamanlı olarak sunulmaktadır.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              onClick={handleRunAudit} 
              className="btn btn-secondary"
              title="Manuel denetim çalıştır"
            >
              <RefreshCw size={16} />
              Denetle
            </button>
            <button 
              onClick={toggleTheme}
              className="btn btn-secondary"
              style={{ borderRadius: 'var(--radius-full)', padding: '10px' }}
            >
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>
          </div>
        </header>

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Stats Cards */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '1.5rem'
            }}>
              <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div style={{ padding: '12px', backgroundColor: 'rgba(91, 128, 54, 0.1)', color: '#5b8036', borderRadius: 'var(--radius-md)' }}>
                  <Users size={24} />
                </div>
                <div style={{ textAlign: 'left' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Aktif Birim Başkanları</span>
                  <h2 style={{ fontSize: '24px', fontWeight: '800' }}>{stats.totalPresidents}</h2>
                </div>
              </div>
              <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div style={{ padding: '12px', backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', borderRadius: 'var(--radius-md)' }}>
                  <UserCheck size={24} />
                </div>
                <div style={{ textAlign: 'left' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Onay Bekleyenler</span>
                  <h2 style={{ fontSize: '24px', fontWeight: '800' }}>{stats.pendingApprovals}</h2>
                </div>
              </div>
              <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div style={{ padding: '12px', backgroundColor: 'rgba(91, 128, 54, 0.1)', color: '#5b8036', borderRadius: 'var(--radius-md)' }}>
                  <CheckSquare size={24} />
                </div>
                <div style={{ textAlign: 'left' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Toplam Kanıtlı Etkinlik</span>
                  <h2 style={{ fontSize: '24px', fontWeight: '800' }}>{stats.totalEvents}</h2>
                </div>
              </div>
              {(() => {
                const monthlyChamp = leaderboard.monthly && leaderboard.monthly.length > 0 && leaderboard.monthly[0].points > 0 
                  ? leaderboard.monthly[0] 
                  : null;
                
                if (monthlyChamp) {
                  return (
                    <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '15px', background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(91, 128, 54, 0.05) 100%)', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                      <div style={{ padding: '12px', backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', borderRadius: 'var(--radius-md)' }}>
                        <Award size={24} />
                      </div>
                      <div style={{ textAlign: 'left', overflow: 'hidden' }}>
                        <span style={{ fontSize: '11px', color: '#f59e0b', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '4px' }}>🏆 AYIN LİDERİ</span>
                        <h2 style={{ fontSize: '14px', fontWeight: '800', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', margin: '2px 0 0 0' }} title={`${monthlyChamp.unit}${getUnitPresidentName(monthlyChamp.unit)}`}>
                          {monthlyChamp.unit}{getUnitPresidentName(monthlyChamp.unit)}
                        </h2>
                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{monthlyChamp.points} Puan</span>
                      </div>
                    </div>
                  );
                } else {
                  return (
                    <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                      <div style={{ padding: '12px', backgroundColor: 'rgba(91, 128, 54, 0.1)', color: '#5b8036', borderRadius: 'var(--radius-md)' }}>
                        <Award size={24} />
                      </div>
                      <div style={{ textAlign: 'left' }}>
                        <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Ayın Şampiyonu</span>
                        <h2 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-muted)' }}>Belirlenmedi</h2>
                      </div>
                    </div>
                  );
                }
              })()}
            </div>

            {/* Main Overview Layout Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '2fr 1fr',
              gap: '2.5rem'
            }}>
              {/* Left Column: Approvals and Charts */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                {/* Pending Approvals Panel */}
                <div className="card" style={{ textAlign: 'left' }}>
                  <h3 style={{ fontSize: '18px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <UserCheck size={20} style={{ color: 'var(--status-warning)' }} /> Onay Bekleyen Birim Başkanları
                  </h3>
                  
                  {pendingUsers.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Onay veya birim ataması bekleyen yeni üye yok.</p>
                  ) : (
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                            <th style={{ padding: '10px', textAlign: 'left' }}>İsim Soyisim</th>
                            <th style={{ padding: '10px', textAlign: 'left' }}>E-posta</th>
                            <th style={{ padding: '10px', textAlign: 'left' }}>Telefon</th>
                            <th style={{ padding: '10px', textAlign: 'left' }}>Birim Ata</th>
                            <th style={{ padding: '10px', textAlign: 'right' }}>İşlem</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pendingUsers.map(u => (
                            <tr key={u.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                              <td style={{ padding: '12px 10px', fontWeight: '600' }}>{u.fullName}</td>
                              <td style={{ padding: '12px 10px', color: 'var(--text-secondary)' }}>{u.email}</td>
                              <td style={{ padding: '12px 10px', color: 'var(--text-secondary)' }}>{u.phoneNumber || 'Belirtilmedi'}</td>
                              <td style={{ padding: '12px 10px' }}>
                                <select 
                                  value={selectedUnits[u.id] || ''} 
                                  onChange={(e) => setSelectedUnits({ ...selectedUnits, [u.id]: e.target.value })}
                                  className="form-control"
                                  style={{ padding: '4px 8px', fontSize: '13px' }}
                                >
                                  <option value="">Seçiniz...</option>
                                  {validUnits.map(unit => (
                                    <option key={unit} value={unit}>{unit}</option>
                                  ))}
                                </select>
                              </td>
                              <td style={{ padding: '12px 10px', textAlign: 'right' }}>
                                <button onClick={() => handleAssignUnit(u.id)} className="btn btn-primary" style={{ padding: '4px 12px', fontSize: '12px' }}>
                                  Birim Ata & Onayla
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Performance Charts */}
                <div className="card" style={{ textAlign: 'left' }}>
                  <h3 style={{ fontSize: '18px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <TrendingUp size={20} /> Son 4 Haftalık Puan Gelişim Trendi
                  </h3>
                  <div style={{ height: '300px', position: 'relative' }}>
                    {chartWeeksData.length > 0 ? (
                      <Line 
                        data={prepareTrendChartData()} 
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: { legend: { display: true, position: 'bottom', labels: { boxWidth: 10, font: { size: 10 }, color: theme === 'dark' ? '#94a3b8' : '#475569' } } },
                          scales: {
                            y: { grid: { color: theme === 'dark' ? '#1f2937' : '#e2e8f0' }, ticks: { color: theme === 'dark' ? '#64748b' : '#94a3b8' } },
                            x: { grid: { color: theme === 'dark' ? '#1f2937' : '#e2e8f0' }, ticks: { color: theme === 'dark' ? '#64748b' : '#94a3b8' } }
                          }
                        }} 
                      />
                    ) : (
                      <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                        Grafik çizmek için yeterli veri bulunamadı.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column: Leaderboard Widget */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                <div className="card" style={{ textAlign: 'left', minHeight: '400px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h3 style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Award size={20} style={{ color: 'var(--status-warning)' }} /> Liderlik Tablosu
                    </h3>
                  </div>

                  {/* Leaderboard Tabs */}
                  <div style={{ display: 'flex', gap: '5px', backgroundColor: 'var(--bg-tertiary)', padding: '4px', borderRadius: 'var(--radius-sm)', marginBottom: '1.25rem' }}>
                    <button 
                      onClick={() => setActiveLeaderboardTab('weekly')} 
                      className="btn" 
                      style={{
                        flex: 1, padding: '6px', fontSize: '12px',
                        backgroundColor: activeLeaderboardTab === 'weekly' ? 'var(--bg-secondary)' : 'transparent',
                        color: activeLeaderboardTab === 'weekly' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                        boxShadow: activeLeaderboardTab === 'weekly' ? 'var(--shadow-sm)' : 'none'
                      }}
                    >Haftalık</button>
                    <button 
                      onClick={() => setActiveLeaderboardTab('monthly')} 
                      className="btn" 
                      style={{
                        flex: 1, padding: '6px', fontSize: '12px',
                        backgroundColor: activeLeaderboardTab === 'monthly' ? 'var(--bg-secondary)' : 'transparent',
                        color: activeLeaderboardTab === 'monthly' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                        boxShadow: activeLeaderboardTab === 'monthly' ? 'var(--shadow-sm)' : 'none'
                      }}
                    >Aylık</button>
                    <button 
                      onClick={() => setActiveLeaderboardTab('overall')} 
                      className="btn" 
                      style={{
                        flex: 1, padding: '6px', fontSize: '12px',
                        backgroundColor: activeLeaderboardTab === 'overall' ? 'var(--bg-secondary)' : 'transparent',
                        color: activeLeaderboardTab === 'overall' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                        boxShadow: activeLeaderboardTab === 'overall' ? 'var(--shadow-sm)' : 'none'
                      }}
                    >Genel</button>
                  </div>

                  <div className="leaderboard-list">
                    {leaderboard[activeLeaderboardTab]?.map((item, idx) => (
                      <div key={item.unit} className="leaderboard-item">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span className={`leaderboard-rank rank-${idx + 1}`} style={{
                            backgroundColor: idx === 0 ? '#fef3c7' : idx === 1 ? '#f1f5f9' : idx === 2 ? '#ffedd5' : 'transparent',
                            color: idx === 0 ? '#d97706' : idx === 1 ? '#475569' : idx === 2 ? '#c2410c' : 'var(--text-secondary)',
                          }}>
                            {idx + 1}
                          </span>
                          <span style={{ fontWeight: '600', fontSize: '14px' }}>{item.unit}{getUnitPresidentName(item.unit)}</span>
                        </div>
                        <span style={{ fontWeight: '800', color: 'var(--accent-primary)', fontSize: '15px' }}>
                          {item.points} Puan
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB: PRESIDENTS (Birim Başkanları Yönetimi) */}
        {activeTab === 'presidents' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div className="card" style={{ textAlign: 'left' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Users size={20} /> Sistemdeki Birim Başkanları ve Yöneticiler
                </h3>
                <span style={{ fontSize: '13px', fontWeight: '600', backgroundColor: 'var(--accent-light)', color: 'var(--accent-primary)', padding: '4px 10px', borderRadius: '12px' }}>
                  Toplam {allUsers.length} Üye
                </span>
              </div>

              {allUsers.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                  <Users size={48} style={{ opacity: 0.3, marginBottom: '15px' }} />
                  <p>Sistemde henüz kayıtlı üye bulunmuyor.</p>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table className="table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 'bold' }}>
                        <th style={{ padding: '12px' }}>Ad Soyad</th>
                        <th style={{ padding: '12px' }}>E-posta</th>
                        <th style={{ padding: '12px' }}>Telefon</th>
                        <th style={{ padding: '12px' }}>Yetki / Rol</th>
                        <th style={{ padding: '12px' }}>Atandığı Birim</th>
                        <th style={{ padding: '12px' }}>E-posta Doğrulama</th>
                        <th style={{ padding: '12px' }}>Kayıt Tarihi</th>
                        <th style={{ padding: '12px', textAlign: 'right' }}>İşlem</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allUsers.map((u) => (
                        <tr key={u.id} style={{ borderBottom: '1px solid var(--border-color)', fontSize: '14px' }}>
                          <td style={{ padding: '12px', fontWeight: '700', color: 'var(--text-primary)' }}>{u.fullName}</td>
                          <td style={{ padding: '12px', color: 'var(--text-secondary)' }}>{u.email}</td>
                          <td style={{ padding: '12px', color: 'var(--text-secondary)' }}>{u.phoneNumber || <span style={{ color: 'var(--text-muted)' }}>Belirtilmedi</span>}</td>
                          <td style={{ padding: '12px' }}>
                            <span style={{
                              padding: '4px 8px',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: 'bold',
                              backgroundColor: u.role === 'SUPER_ADMIN' ? 'rgba(91, 128, 54, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                              color: u.role === 'SUPER_ADMIN' ? '#5b8036' : '#3b82f6'
                            }}>
                              {u.role === 'SUPER_ADMIN' ? 'Süper Admin' : 'Birim Başkanı'}
                            </span>
                          </td>
                          <td style={{ padding: '12px', fontWeight: '600' }}>
                            {u.assignedUnit || <span style={{ color: 'var(--text-muted)' }}>Atanmadı</span>}
                          </td>
                          <td style={{ padding: '12px' }}>
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '12px',
                              color: u.isEmailVerified ? '#5b8036' : 'var(--text-muted)'
                            }}>
                              <Check size={16} style={{ display: u.isEmailVerified ? 'inline' : 'none' }} />
                              {u.isEmailVerified ? 'Doğrulandı' : 'Doğrulanmadı'}
                            </span>
                          </td>
                          <td style={{ padding: '12px', color: 'var(--text-muted)', fontSize: '13px' }}>
                            {new Date(u.createdAt).toLocaleDateString('tr-TR')}
                          </td>
                          <td style={{ padding: '12px', textAlign: 'right' }}>
                            <button
                              onClick={() => handleDeleteUser(u.id, u.fullName)}
                              className="btn btn-secondary"
                              style={{ padding: '6px', color: '#ef4444', borderColor: 'transparent', backgroundColor: 'transparent' }}
                              title="Kullanıcıyı Sil"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: PERFORMANCE REPORT (KPIs) */}
        {activeTab === 'performance' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '24px', fontWeight: '800' }}>Performans ve Liderlik Raporları</h2>
              <button onClick={handleExportCSV} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Download size={18} /> Tüm Etkinlikleri CSV İndir
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
              {/* KPI Description */}
              <div className="card" style={{ textAlign: 'left' }}>
                <h3 style={{ fontSize: '18px', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Award size={20} /> Performans Metrikleri Nasıl Hesaplanır?
                </h3>
                <ul style={{ paddingLeft: '20px', fontSize: '14px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <li><strong>Rutin Başarı Oranı (%):</strong> Birimin son 30 gün içinde yapması planlanan (takvimdeki rutin günlerine göre hesaplanan) toplam rutin derslerin, kanıt girilerek tamamlanan derslere oranıdır.</li>
                  <li><strong>Ekstra Efor Skoru:</strong> Birimlerin rutin dışı yaptıkları her ekstra faaliyet (kamp, ziyaret vb.) için aldıkları toplam ekstra puanlardır. Teşkilatın hareket kabiliyetini gösterir.</li>
                  <li><strong>Zamanlama Algoritması:</strong> Rutin etkinlik gününde veya bir gün sonrasında girilirse <strong>50 Puan</strong>, daha geç girilirse <strong>25 Puan</strong> kazandırır.</li>
                </ul>
              </div>

              {/* KPI Graph Chart */}
              <div className="card" style={{ textAlign: 'left' }}>
                <h3 style={{ fontSize: '18px', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <TrendingUp size={20} /> Birimlerin Rutin Görev Başarı Oranları (%)
                </h3>
                <div style={{ height: '180px', position: 'relative' }}>
                  {performance.length > 0 ? (
                    <Bar 
                      data={prepareSuccessRateChartData()} 
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { display: false } },
                        scales: {
                          y: { min: 0, max: 100, ticks: { color: theme === 'dark' ? '#64748b' : '#94a3b8' }, grid: { color: theme === 'dark' ? '#1f2937' : '#e2e8f0' } },
                          x: { ticks: { color: theme === 'dark' ? '#64748b' : '#94a3b8' }, grid: { display: false } }
                        }
                      }}
                    />
                  ) : (
                    <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                      Yükleniyor...
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Performance KPI Table */}
            <div className="card" style={{ textAlign: 'left' }}>
              <h3 style={{ fontSize: '18px', marginBottom: '1.5rem' }}>Birim Performans Detayları (Son 30 Gün)</h3>
              
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                      <th style={{ padding: '12px 10px', textAlign: 'left' }}>Birim Başkanlığı</th>
                      <th style={{ padding: '12px 10px', textAlign: 'center' }}>Planlanan Rutin</th>
                      <th style={{ padding: '12px 10px', textAlign: 'center' }}>Tamamlanan Rutin</th>
                      <th style={{ padding: '12px 10px', textAlign: 'center' }}>Rutin Başarı Oranı</th>
                      <th style={{ padding: '12px 10px', textAlign: 'center' }}>Ekstra Efor Skoru</th>
                      <th style={{ padding: '12px 10px', textAlign: 'center' }}>Toplam Etkinlik</th>
                    </tr>
                  </thead>
                  <tbody>
                    {performance.map(p => (
                      <tr key={p.unit} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '14px 10px', fontWeight: '700' }}>{p.unit}{getUnitPresidentName(p.unit)}</td>
                        <td style={{ padding: '14px 10px', textAlign: 'center', color: 'var(--text-secondary)' }}>{p.routinesPlanned}</td>
                        <td style={{ padding: '14px 10px', textAlign: 'center', color: 'var(--text-secondary)' }}>{p.routinesCompleted}</td>
                        <td style={{ padding: '14px 10px', textAlign: 'center' }}>
                          <span style={{
                            padding: '4px 10px', borderRadius: 'var(--radius-full)', fontWeight: 'bold', fontSize: '12px',
                            backgroundColor: p.routineSuccessRate >= 80 ? 'rgba(91, 128, 54, 0.1)' : p.routineSuccessRate >= 50 ? 'rgba(245, 158, 11, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                            color: p.routineSuccessRate >= 80 ? 'var(--status-success)' : p.routineSuccessRate >= 50 ? 'var(--status-warning)' : 'var(--status-danger)',
                          }}>
                            %{p.routineSuccessRate}
                          </span>
                        </td>
                        <td style={{ padding: '14px 10px', textAlign: 'center', fontWeight: 'bold', color: 'var(--accent-primary)' }}>
                          +{p.extraEffortScore} P
                        </td>
                        <td style={{ padding: '14px 10px', textAlign: 'center', fontWeight: '600' }}>{p.totalEvents}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: ROUTINES (RUTİN GÖREV TAKVİMİ) */}
        {activeTab === 'routines' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2.5rem' }}>
            {/* Add New Routine Card */}
            <div className="card" style={{ textAlign: 'left', height: 'fit-content' }}>
              <h3 style={{ fontSize: '18px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Calendar size={20} /> Yeni Rutin Görev Ekle
              </h3>

              <form onSubmit={handleCreateRoutine}>
                <div className="form-group">
                  <label className="form-label">Sorumlu Birim</label>
                  <select 
                    value={newRoutine.unit}
                    onChange={(e) => setNewRoutine({ ...newRoutine, unit: e.target.value })}
                    className="form-control"
                    style={{ width: '100%' }}
                  >
                    {validUnits.map(unit => (
                      <option key={unit} value={unit}>{unit}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Ders/Görev Başlığı</label>
                  <input 
                    type="text"
                    required
                    placeholder="Örn: Haftalık Tefsir Dersi"
                    value={newRoutine.title}
                    onChange={(e) => setNewRoutine({ ...newRoutine, title: e.target.value })}
                    className="form-control"
                    style={{ width: '100%' }}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '20px' }}>
                  <label className="form-label">Görev Günü</label>
                  <select 
                    value={newRoutine.dayOfWeek}
                    onChange={(e) => setNewRoutine({ ...newRoutine, dayOfWeek: e.target.value })}
                    className="form-control"
                    style={{ width: '100%' }}
                  >
                    <option value="1">Pazartesi</option>
                    <option value="2">Salı</option>
                    <option value="3">Çarşamba</option>
                    <option value="4">Perşembe</option>
                    <option value="5">Cuma</option>
                    <option value="6">Cumartesi</option>
                    <option value="7">Pazar</option>
                  </select>
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                  Rutin Planı Ekle
                </button>
              </form>
            </div>

            {/* Routines List Table */}
            <div className="card" style={{ textAlign: 'left' }}>
              <h3 style={{ fontSize: '18px', marginBottom: '1.5rem' }}>Sistemdeki Rutin Görev Planları</h3>

              {routines.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Sistemde kayıtlı rutin görev bulunamadı.</p>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                        <th style={{ padding: '10px', textAlign: 'left' }}>Birim</th>
                        <th style={{ padding: '10px', textAlign: 'left' }}>Görev Başlığı</th>
                        <th style={{ padding: '10px', textAlign: 'center' }}>Plan Günü</th>
                        <th style={{ padding: '10px', textAlign: 'right' }}>İşlem</th>
                      </tr>
                    </thead>
                    <tbody>
                      {routines.map(r => (
                        <tr key={r.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                          <td style={{ padding: '12px 10px', fontWeight: '700' }}>
                            {r.unit}{getUnitPresidentName(r.unit)}
                          </td>
                          <td style={{ padding: '12px 10px' }}>{r.title}</td>
                          <td style={{ padding: '12px 10px', textAlign: 'center' }}>
                            <span style={{
                              padding: '2px 8px', borderRadius: '4px', backgroundColor: 'var(--bg-tertiary)', fontSize: '12px', fontWeight: '600'
                            }}>
                              {daysMap[r.dayOfWeek]}
                            </span>
                          </td>
                          <td style={{ padding: '12px 10px', textAlign: 'right' }}>
                            <button 
                              onClick={() => handleDeleteRoutine(r.id)}
                              className="btn btn-secondary" 
                              style={{ padding: '6px', color: 'var(--status-danger)', border: 'none', background: 'transparent' }}
                              title="Sil"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: AUDITS (SİSTEM UYARILARI & CRON) */}
        {activeTab === 'audits' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Cron info header */}
            <div className="card" style={{ textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <Bell size={20} /> Otomatik Uyarılar ve Denetim Sistemi (Cron Jobs)
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                  Sistem arka planda her gün pasiflik kontrolü yapar. Eğer bir birim başkanı 2 haftadır etkinlik kanıtı girmemişse buraya kırmızı uyarı kaydı düşer.
                  Ayrıca her ay sonu "Ayın Şampiyonu" otomatik olarak burada ilan edilir.
                </p>
              </div>
            </div>

            {/* Audit Logs list */}
            <div className="card" style={{ textAlign: 'left' }}>
              <h3 style={{ fontSize: '18px', marginBottom: '1.5rem' }}>Denetim ve Pasiflik Kayıtları</h3>

              {audits.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Denetim günlüğü henüz boş.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {audits.map(log => (
                    <div 
                      key={log.id} 
                      style={{
                        padding: '12px 16px',
                        borderRadius: 'var(--radius-md)',
                        borderLeft: '5px solid',
                        borderColor: log.logType === 'WARNING' ? 'var(--status-danger)' : log.message.includes('🏆') ? 'var(--status-warning)' : 'var(--accent-primary)',
                        backgroundColor: log.logType === 'WARNING' ? 'rgba(239, 68, 68, 0.05)' : log.message.includes('🏆') ? 'rgba(245, 158, 11, 0.05)' : 'var(--bg-tertiary)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '14px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {log.logType === 'WARNING' ? (
                          <AlertTriangle size={18} style={{ color: 'var(--status-danger)', flexShrink: 0 }} />
                        ) : (
                          <CheckSquare size={18} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
                        )}
                        <span style={{ fontWeight: '500', color: 'var(--text-primary)' }}>{log.message}</span>
                      </div>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{log.createdAt}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB: SİSTEM YÖNETİMİ */}
        {activeTab === 'system' && (
          <SystemSettingsPanel validUnits={validUnits} loadDashboardData={loadDashboardData} />
        )}

        {/* TAB: ETKİNLİK MEDYASI */}
        {activeTab === 'gallery' && (
          <EventMediaGallery eventsGallery={eventsGallery} setPreviewImage={setPreviewImage} />
        )}

        {/* TAB: PROFILE (HESABIM) */}
        {activeTab === 'profile' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '600px', margin: '0 auto', textAlign: 'left' }}>
            <div className="card" style={{ padding: '30px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <User size={20} style={{ color: 'var(--accent-primary)' }} /> Hesap Bilgileri
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '25px', paddingBottom: '20px', borderBottom: '1px solid var(--border-color)' }}>
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Adı Soyadı</label>
                  <p style={{ fontSize: '15px', fontWeight: '700', margin: '2px 0 0 0' }}>{user?.fullName}</p>
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>E-posta Adresi</label>
                  <p style={{ fontSize: '15px', fontWeight: '700', margin: '2px 0 0 0' }}>{user?.email}</p>
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Görevi / Birimi</label>
                  <p style={{ fontSize: '15px', fontWeight: '700', margin: '2px 0 0 0' }}>{user?.assignedUnit || 'Süper Yönetici'}</p>
                </div>
              </div>

              <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div className="form-group">
                  <label className="form-label">Telefon Numarası</label>
                  <input
                    type="tel"
                    required
                    className="form-control"
                    placeholder="Örn: 05551234567"
                    value={profileForm.phoneNumber}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, phoneNumber: e.target.value }))}
                  />
                </div>

                <div style={{ marginTop: '10px', paddingTop: '20px', borderTop: '1px solid var(--border-color)' }}>
                  <h4 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '15px' }}>Şifre Değiştir</h4>
                  
                  <div className="form-group" style={{ marginBottom: '15px' }}>
                    <label className="form-label">Mevcut Şifre</label>
                    <input
                      type="password"
                      placeholder="••••••"
                      className="form-control"
                      value={profileForm.currentPassword}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                    <div className="form-group">
                      <label className="form-label">Yeni Şifre</label>
                      <input
                        type="password"
                        placeholder="En az 6 karakter"
                        className="form-control"
                        value={profileForm.newPassword}
                        onChange={(e) => setProfileForm(prev => ({ ...prev, newPassword: e.target.value }))}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Yeni Şifre (Tekrar)</label>
                      <input
                        type="password"
                        placeholder="Şifreyi onaylayın"
                        className="form-control"
                        value={profileForm.confirmPassword}
                        onChange={(e) => setProfileForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>

                <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-end', padding: '10px 24px', marginTop: '10px', cursor: 'pointer' }}>
                  Değişiklikleri Kaydet
                </button>
              </form>
            </div>
          </div>
        )}
      </main>

      {/* Image Lightbox Modal */}
      {previewImage && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 999999,
          animation: 'fadeIn 0.2s ease-out forwards'
        }}>
          <div style={{
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-xl)',
            padding: '25px',
            maxWidth: '600px',
            width: '90%',
            textAlign: 'center',
            position: 'relative',
            animation: 'scaleInConfirm 0.25s cubic-bezier(0.34, 1.56, 0.64, 1) forwards'
          }}>
            <button
              onClick={() => setPreviewImage(null)}
              style={{
                position: 'absolute',
                top: '15px',
                right: '15px',
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '5px'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
            >
              <X size={20} />
            </button>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ImageIcon size={18} /> Etkinlik Kanıtı
              </h3>
            </div>
            
            <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', backgroundColor: '#000', borderRadius: 'var(--radius-md)', marginBottom: '15px' }}>
              <img 
                src={`http://127.0.0.1:5000${previewImage.url}`} 
                alt="Kanıt Önizleme" 
                style={{
                  maxWidth: '100%',
                  maxHeight: '60vh',
                  objectFit: 'contain'
                }}
              />
            </div>
            
            <div style={{ backgroundColor: 'var(--bg-tertiary)', padding: '15px', borderRadius: 'var(--radius-md)', marginBottom: '15px' }}>
              <h4 style={{ margin: '0 0 8px 0', color: 'var(--accent-primary)', fontSize: '16px' }}>{previewImage.title}</h4>
              <p style={{ fontSize: '14px', color: 'var(--text-primary)', margin: '0 0 12px 0', lineHeight: 1.5 }}>
                {previewImage.description || 'Açıklama bulunmuyor.'}
              </p>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px', marginTop: '15px', paddingTop: '15px', borderTop: '1px solid var(--border-color)' }}>
                <div>
                  <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Birim</span>
                  <strong style={{ fontSize: '13px' }}>{previewImage.unit}</strong>
                </div>
                <div>
                  <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Etkinlik Tipi</span>
                  <span style={{ 
                    display: 'inline-block',
                    padding: '2px 8px', 
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    marginTop: '2px',
                    backgroundColor: previewImage.type === 'ROUTINE' ? 'rgba(91, 128, 54, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                    color: previewImage.type === 'ROUTINE' ? 'var(--status-success)' : 'var(--status-warning)'
                  }}>
                    {previewImage.type === 'ROUTINE' ? 'Rutin Görev' : 'Ekstra Etkinlik'}
                  </span>
                </div>
                <div>
                  <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Kazanılan Puan</span>
                  <strong style={{ fontSize: '14px', color: 'var(--accent-primary)' }}>+{previewImage.points}</strong>
                </div>
                <div>
                  <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Tarih</span>
                  <strong style={{ fontSize: '13px' }}>{previewImage.date}</strong>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setPreviewImage(null)}
                className="btn btn-secondary"
                style={{ padding: '8px 16px', fontSize: '13px', cursor: 'pointer' }}
              >
                Kapat
              </button>
              <a
                href={`http://127.0.0.1:5000${previewImage.url}`}
                download={`kanit_${previewImage.unit.replace(/\s+/g, '_')}.jpg`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary"
                style={{
                  padding: '8px 16px',
                  fontSize: '13px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  textDecoration: 'none',
                  cursor: 'pointer'
                }}
              >
                <Download size={16} /> Resmi İndir
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
