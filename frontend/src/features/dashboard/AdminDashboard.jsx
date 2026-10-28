import React, { useState, useEffect } from 'react';
import { useAuth } from '../../shared/context/AuthContext';
import { useNotification } from '../../shared/context/NotificationContext';
import { 
  Users, Award, CheckSquare, Bell, Calendar, LogOut, Moon, Sun, 
  User, UserCheck, AlertTriangle, Shield, Check, Trash2, RefreshCw, BarChart2, TrendingUp, X, Download, Image as ImageIcon, Filter, Search, Settings, Target 
} from 'lucide-react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import logoImg from '../../assets/logo.jpg';
import Sidebar from './components/Sidebar';
import StatsOverview from './components/StatsOverview';
import Leaderboard from './components/Leaderboard';
import UserManagement from './components/UserManagement';
import RoutineManager from './components/RoutineManager';
import AuditLog from './components/AuditLog';
import EventMediaGallery from '../events/EventMediaGallery';
import SystemSettingsPanel from './SystemSettingsPanel';
import MonthlyGoalsPanel from '../reports/MonthlyGoalsPanel';
import AnnualReportPanel from '../reports/AnnualReportPanel';
import PerformancePanel from '../reports/PerformancePanel';
import MonthlyReportPanel from '../reports/MonthlyReportPanel';
import MuhabbetAdminPanel from '../muhabbet/MuhabbetAdminPanel';
import VolunteerApplications from '../public/VolunteerApplications';
import { SiteContentManager } from '../public/PublicPosts';
import { API_URL, getAssetUrl } from '../../shared/config/api';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend);

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
  const [activeTab, setActiveTab] = useState(user?.role === 'MUHABBET_COORDINATOR' ? 'muhabbet' : 'overview'); // 'overview', 'reports', 'tasks', etc.
  const [activeReportTab, setActiveReportTab] = useState('performance'); // 'performance', 'monthly', 'annual'
  const [activeTaskTab, setActiveTaskTab] = useState('routines'); // 'routines', 'targets'

  // Sistem Verileri
  const [validUnits, setValidUnits] = useState([]);

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
  const [selectedRoles, setSelectedRoles] = useState({});
  const [newRoutine, setNewRoutine] = useState({ unit: '', title: '', dayOfWeek: '1' });
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

      // 9. Sistem Birimleri
      const unitsRes = await fetchWithAuth('/system/units');
      if (unitsRes.ok) {
        const unitsData = await unitsRes.json();
        const unitsArray = unitsData.map(u => u.name);
        setValidUnits(unitsArray);
        setNewRoutine(prev => ({ ...prev, unit: prev.unit || unitsArray[0] || '' }));
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
        body: JSON.stringify({ userId, unit, role: selectedRoles[userId] || 'UNIT_PRESIDENT' })
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
      const response = await fetch(`${API_URL}/reports/export-csv`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('gencihh_token')}` }
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

  // Genel Bakış PDF Çıktısı
  const handleExportOverviewPDF = async () => {
    const html2pdf = (await import('html2pdf.js')).default;
    const element = document.getElementById('overview-stats-content');
    if (!element) {
      showNotification('PDF için içerik bulunamadı.', 'error');
      return;
    }
    const opt = {
      margin: 0.5,
      filename: `GenelBakis_Rapor_${new Date().toISOString().split('T')[0]}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, windowWidth: 1200, width: 1200 },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'landscape' }
    };
    showNotification('PDF hazırlanıyor...', 'info');
    html2pdf().set(opt).from(element).save().then(() => {
      showNotification('Genel bakış raporu indirildi.', 'success');
    });
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

  const handleDeleteEvent = async (eventId) => {
    try {
      const res = await fetchWithAuth(`/events/${eventId}`, { method: 'DELETE' });
      if (res.ok) {
        showNotification('Etkinlik kaydı silindi.', 'success');
        loadDashboardData(false);
      } else {
        showNotification('Etkinlik silinemedi.', 'error');
      }
    } catch (e) {
      showNotification('Hata oluştu.', 'error');
    }
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
      <Sidebar
        user={user}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isSidebarCollapsed={isSidebarCollapsed}
        setIsSidebarCollapsed={setIsSidebarCollapsed}
        theme={theme}
        toggleTheme={toggleTheme}
        triggerTransition={triggerTransition}
        handleLogout={handleLogout}
      />

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
              {activeTab === 'volunteers' && 'Gönüllü Başvuruları'}
              {activeTab === 'reports' && 'Raporlar ve Liderlik'}
              {activeTab === 'tasks' && 'Görevler ve Hedefler'}
              {activeTab === 'audits' && 'Sistem Denetimi ve Pasiflik Uyarıları'}
              {activeTab === 'gallery' && 'Etkinlik Medyası'}
              {activeTab === 'publicPosts' && 'Site Fotoğrafları'}
              {activeTab === 'muhabbet' && 'Muhabbet Okulu Yönetimi'}
              {activeTab === 'system' && 'Sistem Ayarları ve Duyurular'}
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
        {activeTab === 'volunteers' && <VolunteerApplications />}
        {activeTab === 'publicPosts' && <SiteContentManager />}
        {activeTab === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Özet Rapor İndir Butonu */}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button 
                onClick={handleExportOverviewPDF}
                className="btn btn-secondary"
                style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444', borderColor: '#ef4444' }}
              >
                <Download size={16} /> Özet Rapor PDF
              </button>
            </div>
            <div id="overview-stats-content" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
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
                                <select
                                  value={selectedRoles[u.id] || 'UNIT_PRESIDENT'}
                                  onChange={(e) => setSelectedRoles({ ...selectedRoles, [u.id]: e.target.value })}
                                  className="form-control"
                                  style={{ padding: '4px 8px', fontSize: '12px', marginTop: '6px' }}
                                >
                                  <option value="UNIT_PRESIDENT">Birim Başkanı</option>
                                  <option value="MUHABBET_COORDINATOR">Yaz Okulu Koordinatörü</option>
                                  <option value="MUHABBET_TEACHER">Yaz Okulu Hocası</option>
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
            </div>{/* end overview-stats-content */}
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
                              backgroundColor: u.role === 'SUPER_ADMIN' ? 'rgba(91, 128, 54, 0.1)' : 
                                               u.role === 'PASSIVE' ? 'rgba(239, 68, 68, 0.1)' :
                                               u.role === 'PENDING' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                              color: u.role === 'SUPER_ADMIN' ? '#5b8036' : 
                                     u.role === 'PASSIVE' ? '#ef4444' :
                                     u.role === 'PENDING' ? '#f59e0b' : '#3b82f6'
                            }}>
                              {u.role === 'SUPER_ADMIN' ? 'Süper Admin' : 
                               u.role === 'PASSIVE' ? 'Pasif (Eski Bşk.)' :
                               u.role === 'PENDING' ? 'Onay Bekliyor' : 'Birim Başkanı'}
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

        {/* TAB 2: RAPORLAR (Performans, Aylık, Yıllık) */}
        {activeTab === 'reports' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ display: 'flex', gap: '5px', backgroundColor: 'var(--bg-tertiary)', padding: '4px', borderRadius: 'var(--radius-sm)' }}>
              <button 
                onClick={() => setActiveReportTab('performance')} 
                className="btn" 
                style={{
                  flex: 1, padding: '10px', fontSize: '14px', fontWeight: 'bold',
                  backgroundColor: activeReportTab === 'performance' ? 'var(--bg-secondary)' : 'transparent',
                  color: activeReportTab === 'performance' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                  boxShadow: activeReportTab === 'performance' ? 'var(--shadow-sm)' : 'none'
                }}
              >Performans Raporları</button>
              <button 
                onClick={() => setActiveReportTab('monthly')} 
                className="btn" 
                style={{
                  flex: 1, padding: '10px', fontSize: '14px', fontWeight: 'bold',
                  backgroundColor: activeReportTab === 'monthly' ? 'var(--bg-secondary)' : 'transparent',
                  color: activeReportTab === 'monthly' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                  boxShadow: activeReportTab === 'monthly' ? 'var(--shadow-sm)' : 'none'
                }}
              >Aylık Raporlar</button>
              <button 
                onClick={() => setActiveReportTab('annual')} 
                className="btn" 
                style={{
                  flex: 1, padding: '10px', fontSize: '14px', fontWeight: 'bold',
                  backgroundColor: activeReportTab === 'annual' ? 'var(--bg-secondary)' : 'transparent',
                  color: activeReportTab === 'annual' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                  boxShadow: activeReportTab === 'annual' ? 'var(--shadow-sm)' : 'none'
                }}
              >Yıllık Raporlar</button>
            </div>

            {activeReportTab === 'performance' && (
              <PerformancePanel 
                performance={performance}
                theme={theme}
                getUnitPresidentName={getUnitPresidentName}
                prepareSuccessRateChartData={prepareSuccessRateChartData}
                handleExportCSV={handleExportCSV}
              />
            )}
            
            {activeReportTab === 'monthly' && (
              <MonthlyReportPanel 
                theme={theme}
                getUnitPresidentName={getUnitPresidentName}
              />
            )}

            {activeReportTab === 'annual' && (
              <AnnualReportPanel />
            )}
          </div>
        )}

        {/* TAB 3: GÖREVLER (Rutin Görevler, Aylık Görevler) */}
        {activeTab === 'tasks' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ display: 'flex', gap: '5px', backgroundColor: 'var(--bg-tertiary)', padding: '4px', borderRadius: 'var(--radius-sm)' }}>
              <button 
                onClick={() => setActiveTaskTab('routines')} 
                className="btn" 
                style={{
                  flex: 1, padding: '10px', fontSize: '14px', fontWeight: 'bold',
                  backgroundColor: activeTaskTab === 'routines' ? 'var(--bg-secondary)' : 'transparent',
                  color: activeTaskTab === 'routines' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                  boxShadow: activeTaskTab === 'routines' ? 'var(--shadow-sm)' : 'none'
                }}
              >Rutin Görevler</button>
              <button 
                onClick={() => setActiveTaskTab('targets')} 
                className="btn" 
                style={{
                  flex: 1, padding: '10px', fontSize: '14px', fontWeight: 'bold',
                  backgroundColor: activeTaskTab === 'targets' ? 'var(--bg-secondary)' : 'transparent',
                  color: activeTaskTab === 'targets' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                  boxShadow: activeTaskTab === 'targets' ? 'var(--shadow-sm)' : 'none'
                }}
              >Aylık Görevler</button>
            </div>

            {activeTaskTab === 'routines' && (
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

            {activeTaskTab === 'targets' && (
              <MonthlyGoalsPanel validUnits={validUnits} />
            )}
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

        {/* MIGRATED TO TASKS TAB */}

        {/* TAB 9: SYSTEM */}
        {activeTab === 'system' && (
          <SystemSettingsPanel validUnits={validUnits} loadDashboardData={loadDashboardData} />
        )}

        {/* TAB: MUHABBET OKULU */}
        {activeTab === 'muhabbet' && (
          <div className="card" style={{ padding: '20px', minHeight: '500px', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)' }}>
            <MuhabbetAdminPanel allUsers={allUsers} />
          </div>
        )}

        {/* TAB 10: GALLERY */}
        {activeTab === 'gallery' && (
          <div className="card" style={{ padding: '20px', minHeight: '500px', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)' }}>
            <EventMediaGallery eventsGallery={eventsGallery} setPreviewImage={setPreviewImage} onDeleteEvent={handleDeleteEvent} />
          </div>
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

        {/* MIGRATED TO REPORTS TAB */}
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
                src={getAssetUrl(previewImage.url)}
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
                href={getAssetUrl(previewImage.url)}
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
