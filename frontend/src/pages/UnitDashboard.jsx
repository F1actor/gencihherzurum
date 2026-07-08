import React, { useState, useEffect } from 'react';
import { User, LogOut, CheckCircle, Clock, Calendar, History, Image as ImageIcon, X, Download, PlusCircle, Award, Loader, Moon, Sun, ListFilter } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import logoImg from '../assets/logo.jpg';
import EventMediaGallery from '../components/EventMediaGallery';

const daysMap = {
  1: 'Pazartesi',
  2: 'Salı',
  3: 'Çarşamba',
  4: 'Perşembe',
  5: 'Cuma',
  6: 'Cumartesi',
  7: 'Pazar'
};

export default function UnitDashboard() {
  const { user, logout, theme, toggleTheme, fetchWithAuth, setLoadingScreen, triggerTransition } = useAuth();
  const { showNotification } = useNotification();
  
  // Veri Durumları
  const [myRoutines, setMyRoutines] = useState([]);
  const [myEvents, setMyEvents] = useState([]);
  const [leaderboard, setLeaderboard] = useState({ weekly: [], monthly: [], overall: [] });
  const [stats, setStats] = useState({ points: 0, rank: 0, count: 0 });

  // Form Durumları
  const [type, setType] = useState('ROUTINE');
  const [routineId, setRoutineId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const getLocalDateString = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const [eventDate, setEventDate] = useState(getLocalDateString());
  const [proofImage, setProofImage] = useState(null);
  
  // İşlem Durumları
  const [formLoading, setFormLoading] = useState(false);
  const [activeLeaderboardTab, setActiveLeaderboardTab] = useState('weekly');
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'profile'
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [unreadAnnouncementCount, setUnreadAnnouncementCount] = useState(0);
  const [missingRoutines, setMissingRoutines] = useState([]);
  const [profileForm, setProfileForm] = useState({
    phoneNumber: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Duyuru ve Hedef Durumları
  const [announcements, setAnnouncements] = useState([]);
  const [target, setTarget] = useState(null);

  // Etkinlik Medyası (Tanıtım ve Medya Başkanı için)
  const [eventsGallery, setEventsGallery] = useState([]);
  const [previewImage, setPreviewImage] = useState(null);

  useEffect(() => {
    if (user) {
      setProfileForm(prev => ({ ...prev, phoneNumber: user.phoneNumber || '' }));
      if (user.assignedUnit === 'Tanıtım ve Medya Başkanı') {
        setActiveTab('gallery');
      }
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    setLoadingScreen(true);
    try {
      // API call'ları paralelleştir
      const [routinesRes, eventsRes, reportRes, announcementsRes, targetRes] = await Promise.all([
        fetchWithAuth('/events/my-routines'),
        fetchWithAuth('/events/my-events'),
        fetchWithAuth('/reports/leaderboard'),
        fetchWithAuth('/system/announcements/unit'),
        fetchWithAuth('/system/targets/unit')
      ]);

      let routinesData = [];
      if (routinesRes.ok) {
        routinesData = await routinesRes.json();
        setMyRoutines(routinesData);
      }
      
      let eventsData = [];
      if (eventsRes.ok) {
        eventsData = await eventsRes.json();
        setMyEvents(eventsData);
        const totalPoints = eventsData.reduce((sum, e) => sum + e.pointsEarned, 0);
        setStats(prev => ({ ...prev, points: totalPoints, count: eventsData.length }));
      }

      if (reportRes.ok) {
        const reportData = await reportRes.json();
        setLeaderboard(reportData);
        const rank = reportData.overall.findIndex(item => item.unit === user?.assignedUnit) + 1;
        setStats(prev => ({ ...prev, rank: rank || '-' }));
      }

      if (announcementsRes.ok) {
        const ann = await announcementsRes.json();
        setAnnouncements(ann);
        // Okunmamış sayısını hesapla (localStorage'dan okunmuş ID'leri al)
        const readIds = JSON.parse(localStorage.getItem('readAnnouncements') || '[]');
        const unread = ann.filter(a => !readIds.includes(a.id));
        setUnreadAnnouncementCount(unread.length);
      }
      if (targetRes.ok) setTarget(await targetRes.json());

      // Rutin hatırlatma: Bu haftanın rutin günleri ile karşılaştır
      if (routinesRes.ok) {
        const routines = routinesData; // Önceki json datasını kullan
        setMyRoutines(routines);

        if (eventsRes.ok) {
          const today = new Date();
          const startOfWeek = new Date(today);
          const dayOfWeek = today.getDay();
          const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
          startOfWeek.setDate(diff);
          startOfWeek.setHours(0, 0, 0, 0);
          const weekStart = startOfWeek.toISOString().split('T')[0];

          // Haftalık mevcut etkinlikleri al (zaten eventsData yüklü)
          const eventsDataForCheck = eventsData;

          const missing = [];
          for (const r of routines) {
            const routineJsDay = r.dayOfWeek === 7 ? 0 : r.dayOfWeek;
            const routineDayDate = new Date(startOfWeek);
            routineDayDate.setDate(startOfWeek.getDate() + (routineJsDay === 0 ? 6 : routineJsDay - 1));
            if (routineDayDate < today) {
              const done = eventsDataForCheck.some(ev => ev.routineId === r.id && ev.eventDate >= weekStart);
              if (!done) missing.push(r);
            }
          }
          setMissingRoutines(missing);
        }
      }

      if (user?.assignedUnit === 'Tanıtım ve Medya Başkanı') {
        const allEventsRes = await fetchWithAuth('/events/all');
        if (allEventsRes.ok) setEventsGallery(await allEventsRes.json());
      }

    } catch (error) {
      console.error('Birim paneli veri yükleme hatası:', error);
      showNotification('Veriler yüklenirken bir hata oluştu.', 'error');
    } finally {
      setLoadingScreen(false);
    }
  };

  // Rutin seçimi değiştiğinde başlığı otomatik güncelle
  const handleRoutineChange = (e) => {
    const rId = e.target.value;
    setRoutineId(rId);
    const selected = myRoutines.find(r => r.id.toString() === rId);
    if (selected) {
      setTitle(selected.title);
    }
  };

  // Resim Seçimi
  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setProofImage(e.target.files[0]);
    }
  };

  // Etkinlik Gönderimi
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (type === 'ROUTINE' && !routineId) {
      showNotification('Lütfen tamamladığınız rutin dersi seçin.', 'warning');
      return;
    }
    if (type === 'TARGET' && (!target || !target.id)) {
      showNotification('Bu ay için atanmış bir aylık hedefiniz bulunmuyor.', 'warning');
      return;
    }
    if (!title.trim()) {
      showNotification('Lütfen etkinlik başlığını girin.', 'warning');
      return;
    }
    if (!proofImage) {
      showNotification('Lütfen etkinliğe ait resim kanıtı yükleyin.', 'warning');
      return;
    }

    setFormLoading(true);
    setLoadingScreen(true);
    try {
      const formData = new FormData();
      formData.append('type', type);
      formData.append('title', title);
      formData.append('description', description);
      formData.append('eventDate', eventDate);
      if (type === 'ROUTINE') {
        formData.append('routineId', routineId);
      }
      if (type === 'TARGET') {
        formData.append('targetId', target.id);
      }
      formData.append('proofImage', proofImage);

      const res = await fetchWithAuth('/events', {
        method: 'POST',
        body: formData
      });

      const data = await res.json();
      if (res.ok) {
        showNotification(`Etkinlik başarıyla kaydedildi! +${data.event.pointsEarned} Puan kazandınız.`, 'success');
        
        // Form sıfırlama
        setDescription('');
        setProofImage(null);
        const fileInput = document.getElementById('proofImageInput');
        if (fileInput) fileInput.value = '';

        if (type === 'EXTRA') {
          setTitle('');
        }

        // Verileri tekrar yükle
        loadDashboardData();
      } else {
        showNotification(data.message || 'Hata oluştu.', 'error');
      }
    } catch (err) {
      console.error('Gönderim hatası:', err);
      showNotification('Bağlantı hatası oluştu.', 'error');
    } finally {
      setFormLoading(false);
      setLoadingScreen(false);
    }
  };

  const handleDeleteEvent = async (eventId) => {
    showConfirm('Bu etkinliği silmek istediğinize emin misiniz? (Sadece 24 saat içinde eklenen etkinlikleri silebilirsiniz)', async () => {
      setLoadingScreen(true);
      try {
        const res = await fetchWithAuth(`/events/${eventId}`, { method: 'DELETE' });
        const data = await res.json();
        if (res.ok) {
          showNotification('Etkinlik başarıyla silindi.', 'success');
          loadDashboardData();
        } else {
          showNotification(data.message || 'Silinemedi.', 'error');
        }
      } catch (err) {
        showNotification('Bağlantı hatası.', 'error');
      } finally {
        setLoadingScreen(false);
      }
    });
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '45px', justifyContent: isSidebarCollapsed ? 'center' : 'flex-start', overflow: 'hidden' }}>
          <img 
            src={logoImg} 
            alt="Logo" 
            style={{ width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0 }} 
          />
          {!isSidebarCollapsed && (
            <div style={{ textAlign: 'left' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '800', fontFamily: 'var(--font-display)', lineHeight: '1.2' }}>Genç İHH</h3>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '600', letterSpacing: '0.3px', textTransform: 'uppercase' }}>Birim Başkanı</span>
            </div>
          )}
        </div>

        {/* Menü Linkleri */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, alignItems: isSidebarCollapsed ? 'center' : 'stretch' }}>
          {/* Birim Etiketi */}
          {!isSidebarCollapsed && (
            <div style={{
              backgroundColor: 'var(--accent-light)',
              color: 'var(--accent-primary)',
              padding: '10px 12px',
              borderRadius: 'var(--radius-md)',
              fontSize: '13px',
              fontWeight: '700',
              marginBottom: '15px',
              textAlign: 'center',
              border: '1px solid rgba(91, 128, 54, 0.2)',
              whiteSpace: 'nowrap',
              textOverflow: 'ellipsis',
              overflow: 'hidden'
            }} title={user?.assignedUnit || 'Birim Atanmadı'}>
              {user?.assignedUnit || 'Birim Atanmadı'}
            </div>
          )}


          {user?.assignedUnit === 'Tanıtım ve Medya Başkanı' && (
            <button 
              onClick={() => triggerTransition(() => setActiveTab('gallery'))} 
              className={`btn ${activeTab === 'gallery' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ justifyContent: isSidebarCollapsed ? 'center' : 'flex-start', width: '100%', padding: isSidebarCollapsed ? '10px 0' : '10px 16px', marginTop: '10px', backgroundColor: activeTab === 'gallery' ? 'var(--accent-primary)' : 'rgba(91, 128, 54, 0.1)', color: activeTab === 'gallery' ? '#fff' : 'var(--accent-primary)' }}
              title="Etkinlik Medyası"
            >
              <ImageIcon size={18} />
              {!isSidebarCollapsed && <span style={{ marginLeft: '10px' }}>Etkinlik Medyası</span>}
            </button>
          )}

          <button 
            onClick={() => { triggerTransition(() => setActiveTab('dashboard')); 
              // Duyuruları okunmuş işaretle
              const ids = announcements.map(a => a.id);
              localStorage.setItem('readAnnouncements', JSON.stringify(ids));
              setUnreadAnnouncementCount(0);
            }} 
            className={`btn ${activeTab === 'dashboard' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ justifyContent: isSidebarCollapsed ? 'center' : 'flex-start', width: '100%', padding: isSidebarCollapsed ? '10px 0' : '10px 16px', position: 'relative', marginTop: '10px' }}
            title="Ana Sayfa"
          >
            <Calendar size={18} />
            {!isSidebarCollapsed && <span style={{ marginLeft: '10px' }}>Ana Sayfa</span>}
            {unreadAnnouncementCount > 0 && (
              <span style={{
                position: 'absolute', top: '6px', right: '8px',
                backgroundColor: '#ef4444', color: 'white',
                borderRadius: '50%', width: '18px', height: '18px',
                fontSize: '10px', fontWeight: 'bold',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>{unreadAnnouncementCount}</span>
            )}
          </button>

          {/* Haftalık Rutinler Kartı */}
          {!isSidebarCollapsed && (
            <div style={{
              padding: '12px',
              backgroundColor: 'var(--bg-tertiary)',
              borderRadius: 'var(--radius-md)',
              textAlign: 'left',
              fontSize: '13px',
              color: 'var(--text-secondary)',
              marginTop: '20px'
            }}>
              <h4 style={{ color: 'var(--text-primary)', marginBottom: '8px', fontSize: '13px' }}>Haftalık Rutinleriniz:</h4>
              {myRoutines.length === 0 ? (
                <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Rutin tanımlanmamış.</p>
              ) : (
                <ul style={{ paddingLeft: '15px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  {myRoutines.map(r => (
                    <li key={r.id} style={{ fontSize: '12px' }}>
                      <strong>{daysMap[r.dayOfWeek]}:</strong> {r.title}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
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
              {activeTab === 'dashboard' ? `${user?.assignedUnit} Paneli` : activeTab === 'gallery' ? 'Etkinlik Medyası' : 'Hesabım'}
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
              {activeTab === 'dashboard' ? 'Etkinliklerinizi ve haftalık hedeflerinizi buradan takip edin.' : activeTab === 'gallery' ? 'Birimlerden gelen etkinlik medyalarını inceleyin.' : 'Hesap bilgilerinizi ve şifrenizi buradan güncelleyebilirsiniz.'}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              onClick={toggleTheme}
              className="btn btn-secondary"
              style={{ borderRadius: 'var(--radius-full)', padding: '10px' }}
            >
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>
          </div>
        </header>

        {activeTab === 'dashboard' && (
          <>
            {/* Eksik Rutin Uyarı Bannerı */}
            {missingRoutines.length > 0 && (
              <div style={{
                backgroundColor: 'rgba(245, 158, 11, 0.1)',
                border: '1px solid rgba(245, 158, 11, 0.4)',
                borderRadius: 'var(--radius-md)',
                padding: '12px 16px',
                marginBottom: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                textAlign: 'left'
              }}>
                <span style={{ fontSize: '20px' }}>⚠️</span>
                <div>
                  <strong style={{ color: '#d97706', fontSize: '14px' }}>Bu hafta tamamlanmamış rutin göreviniz var!</strong>
                  <p style={{ margin: '2px 0 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
                    {missingRoutines.map(r => r.title).join(', ')} — Gecikmeli de olsa kaydedebilirsiniz.
                  </p>
                </div>
              </div>
            )}

            {/* Duyurular ve Hedefler Banner Alanı */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
              {/* Hedef Kartı */}
              {target ? (
                <div className="card" style={{ background: 'linear-gradient(135deg, rgba(91,128,54,0.1) 0%, rgba(245,158,11,0.05) 100%)', border: '1px solid var(--accent-primary)', textAlign: 'left' }}>
                  <h3 style={{ fontSize: '16px', color: 'var(--accent-primary)', marginBottom: '10px' }}>🎯 Bu Ayki Hedefler ({target.month})</h3>
                  <div style={{ display: 'flex', gap: '20px', fontSize: '14px' }}>
                    <div>
                      <span style={{ color: 'var(--text-secondary)' }}>Rutin Görevler</span>
                      <strong style={{ display: 'block', fontSize: '18px' }}>{target.routineTarget} Puan</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-secondary)' }}>Ekstra Etkinlikler</span>
                      <strong style={{ display: 'block', fontSize: '18px' }}>{target.extraTarget} Puan</strong>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="card" style={{ border: '1px dashed var(--border-color)', textAlign: 'left', backgroundColor: 'transparent' }}>
                  <h3 style={{ fontSize: '16px', color: 'var(--text-secondary)', marginBottom: '5px' }}>🎯 Bu Ayki Hedefler</h3>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Henüz sizin biriminiz için belirlenmiş bir aylık hedef bulunmamaktadır.</p>
                </div>
              )}

              {/* Duyurular Kartı */}
              {announcements.length > 0 ? (
                <div className="card" style={{ background: 'var(--bg-tertiary)', borderLeft: '4px solid var(--accent-primary)', textAlign: 'left' }}>
                  <h3 style={{ fontSize: '16px', marginBottom: '10px', color: 'var(--text-primary)' }}>📢 Son Duyuru</h3>
                  <h4 style={{ fontSize: '15px', color: 'var(--accent-primary)', margin: '0 0 5px 0' }}>{announcements[0].title}</h4>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, whiteSpace: 'pre-wrap' }}>{announcements[0].body}</p>
                </div>
              ) : (
                <div className="card" style={{ border: '1px dashed var(--border-color)', textAlign: 'left', backgroundColor: 'transparent' }}>
                  <h3 style={{ fontSize: '16px', color: 'var(--text-secondary)', marginBottom: '5px' }}>📢 Duyurular</h3>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Mevcut yeni bir duyuru bulunmuyor.</p>
                </div>
              )}
            </div>

            {/* Stats Cards Widgets */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2rem'
        }}>
          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ padding: '12px', backgroundColor: 'rgba(91, 128, 54, 0.1)', color: '#5b8036', borderRadius: 'var(--radius-md)' }}>
              <Award size={24} />
            </div>
            <div style={{ textAlign: 'left' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Birim Toplam Puanı</span>
              <h2 style={{ fontSize: '24px', fontWeight: '800' }}>{stats.points}</h2>
            </div>
          </div>
          
          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ padding: '12px', backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', borderRadius: 'var(--radius-md)' }}>
              <ListFilter size={24} />
            </div>
            <div style={{ textAlign: 'left' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Haftalık Sıralama</span>
              <h2 style={{ fontSize: '24px', fontWeight: '800' }}>{stats.rank === 1 ? '1. 🏆' : `${stats.rank}.`}</h2>
            </div>
          </div>

          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ padding: '12px', backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', borderRadius: 'var(--radius-md)' }}>
              <PlusCircle size={24} />
            </div>
            <div style={{ textAlign: 'left' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Toplam Yapılan Etkinlik</span>
              <h2 style={{ fontSize: '24px', fontWeight: '800' }}>{stats.count}</h2>
            </div>
          </div>
        </div>

        {/* Main Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1.2fr 1fr',
          gap: '2.5rem'
        }}>
          {/* Left Column: Form and History */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            {/* Event Log Form */}
            <div className="card" style={{ textAlign: 'left' }}>
              <h3 style={{ fontSize: '18px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <PlusCircle size={20} /> Etkinlik ve Kanıt Giriş Formu
              </h3>

              <form onSubmit={handleSubmit}>
                {/* Tür Seçimi */}
                <div className="form-group">
                  <label className="form-label">Etkinlik Türü</label>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button 
                      type="button" 
                      onClick={() => {
                        setType('ROUTINE');
                        if (myRoutines.length > 0) {
                          setRoutineId(myRoutines[0].id.toString());
                          setTitle(myRoutines[0].title);
                        } else {
                          setRoutineId('');
                          setTitle('');
                        }
                      }}
                      className={`btn ${type === 'ROUTINE' ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ flex: 1, padding: '10px' }}
                    >
                      Planlanmış Rutin Ders
                    </button>
                    <button 
                      type="button" 
                      onClick={() => {
                        setType('EXTRA');
                        setRoutineId('');
                        setTitle('');
                      }}
                      className={`btn ${type === 'EXTRA' ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ flex: 1, padding: '10px' }}
                    >
                      Ekstra Faaliyet (+20 Puan)
                    </button>
                    <button 
                      type="button" 
                      onClick={() => {
                        setType('TARGET');
                        setRoutineId('');
                        setTitle(target ? target.targetName : '');
                      }}
                      className={`btn ${type === 'TARGET' ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ flex: 1, padding: '10px' }}
                    >
                      Aylık Hedef Etkinliği
                    </button>
                  </div>
                </div>

                {/* Aylık Hedef Bilgisi */}
                {type === 'TARGET' && (
                  <div className="form-group">
                    <label className="form-label">Bu Ayki Hedef Etkinlik</label>
                    {(!target || !target.id) ? (
                      <div style={{ fontSize: '13px', color: 'var(--status-danger)', padding: '10px', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)' }}>
                        Biriminiz için bu ay tanımlanmış bir hedef etkinlik bulunmamaktadır.
                      </div>
                    ) : (
                      <div style={{ fontSize: '14px', color: 'var(--accent-primary)', padding: '10px', backgroundColor: 'rgba(91, 128, 54, 0.1)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(91, 128, 54, 0.2)' }}>
                        <strong>{target.targetName}</strong> (+{target.targetPoints} Puan)
                      </div>
                    )}
                  </div>
                )}

                {/* Rutin Seçim Dropdown */}
                {type === 'ROUTINE' && (
                  <div className="form-group">
                    <label className="form-label">Tamamlanan Ders/Program</label>
                    {myRoutines.length === 0 ? (
                      <div style={{ fontSize: '13px', color: 'var(--status-danger)', padding: '10px', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)' }}>
                        Biriminiz için tanımlanmış rutin görev bulunmamaktadır. Ekstra faaliyet olarak ekleyebilirsiniz.
                      </div>
                    ) : (
                      <select 
                        value={routineId} 
                        onChange={handleRoutineChange}
                        className="form-control"
                        style={{ width: '100%' }}
                      >
                        {myRoutines.map(r => (
                          <option key={r.id} value={r.id}>{r.title} ({daysMap[r.dayOfWeek]})</option>
                        ))}
                      </select>
                    )}
                  </div>
                )}

                {/* Başlık (Eğer ekstra ise düzenlenebilir) */}
                <div className="form-group">
                  <label className="form-label">Etkinlik Başlığı</label>
                  <input 
                    type="text"
                    required
                    placeholder={type === 'ROUTINE' ? 'Rutin adı otomatik seçilir' : type === 'TARGET' ? 'Aylık hedef etkinliği adı otomatik seçilir' : 'Örn: Okul Ziyareti, Piknik Buluşması vb.'}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    disabled={type === 'ROUTINE' || type === 'TARGET'}
                    className="form-control"
                    style={{ width: '100%' }}
                  />
                </div>

                {/* Açıklama */}
                <div className="form-group">
                  <label className="form-label">Etkinlik Detayları / Açıklama</label>
                  <textarea 
                    placeholder="Etkinlikte neler yapıldı, kaç kişi katıldı?"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="form-control"
                    rows={3}
                    style={{ width: '100%', resize: 'vertical', fontFamily: 'inherit' }}
                  />
                </div>

                {/* Tarih */}
                <div className="form-group">
                  <label className="form-label">Gerçekleşme Tarihi</label>
                  <input 
                    type="date"
                    required
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="form-control"
                    style={{ width: '100%' }}
                  />
                  {type === 'ROUTINE' && (
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                      <Clock size={12} /> Zamanında girişler 50, gecikmeli girişler (tarihten 2+ gün sonra) 25 puandır.
                    </span>
                  )}
                </div>

                {/* Kanıt Resim Yükleme */}
                <div className="form-group" style={{ marginBottom: '25px' }}>
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ImageIcon size={16} /> Fotoğraf Kanıtı (Görsel kanıt yüklemek zorunludur)
                  </label>
                  <input 
                    type="file"
                    id="proofImageInput"
                    required
                    accept="image/*"
                    onChange={handleImageChange}
                    className="form-control"
                    style={{ width: '100%' }}
                  />
                </div>

                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  disabled={formLoading || (type === 'ROUTINE' && myRoutines.length === 0)}
                  style={{ width: '100%', gap: '8px' }}
                >
                  {formLoading ? <Loader className="animate-spin" size={18} /> : 'Etkinliği Kaydet ve Kanıt Gönder'}
                </button>
              </form>
            </div>
          </div>

          {/* Right Column: Leaderboard stand */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div className="card" style={{ textAlign: 'left' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Award size={20} className="text-yellow" /> Haftalık Teşkilat Sıralaması
                </h3>
              </div>

              {/* Leaderboard Tabs */}
              <div style={{ display: 'flex', gap: '4px', backgroundColor: 'var(--bg-tertiary)', padding: '4px', borderRadius: 'var(--radius-sm)', marginBottom: '1.25rem' }}>
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
                  <div 
                    key={item.unit} 
                    className="leaderboard-item"
                    style={{
                      border: item.unit === user.assignedUnit ? '2px solid var(--accent-primary)' : '1px solid var(--border-color)',
                      backgroundColor: item.unit === user.assignedUnit ? 'var(--accent-light)' : 'var(--bg-secondary)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span className={`leaderboard-rank rank-${idx + 1}`} style={{
                        backgroundColor: idx === 0 ? '#fef3c7' : idx === 1 ? '#f1f5f9' : idx === 2 ? '#ffedd5' : 'transparent',
                        color: idx === 0 ? '#d97706' : idx === 1 ? '#475569' : idx === 2 ? '#c2410c' : 'var(--text-secondary)',
                      }}>
                        {idx + 1}
                      </span>
                      <span style={{ fontWeight: '600', fontSize: '14px' }}>
                        {item.unit} {item.unit === user.assignedUnit && '(Siz)'}
                      </span>
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

        {/* Full-width Row: Past Events History Log */}
        <div className="card" style={{ textAlign: 'left', marginTop: '2.5rem' }}>
          <h3 style={{ fontSize: '18px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <History size={20} /> Biriminizin Etkinlik Giriş Geçmişi
          </h3>

          {myEvents.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Henüz bir etkinlik kaydetmediniz.</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
              {myEvents.filter(Boolean).map(event => (
                <div key={event.id || Math.random()} className="card" style={{ padding: '15px', display: 'flex', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', gap: '15px', flex: 1, overflow: 'hidden' }}>
                    {event.proofImagePath ? (
                      <img 
                        src={`http://localhost:5000${event.proofImagePath}`} 
                        alt="Kanıt Görsel" 
                        style={{ width: '80px', height: '80px', borderRadius: 'var(--radius-sm)', objectFit: 'cover', flexShrink: 0 }} 
                      />
                    ) : (
                      <div style={{
                        width: '80px', height: '80px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--bg-tertiary)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', color: 'var(--text-muted)', flexShrink: 0
                      }}>Kanıt Yok</div>
                    )}
                    <div style={{ textAlign: 'left', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                      <span style={{
                        backgroundColor: event.type === 'ROUTINE' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(91, 128, 54, 0.1)',
                        color: event.type === 'ROUTINE' ? '#3b82f6' : '#5b8036',
                        padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold', display: 'inline-block', marginBottom: '4px', alignSelf: 'flex-start'
                      }}>
                        {event.type === 'ROUTINE' ? 'Rutin Görev' : 'Ekstra Görev'}
                      </span>
                      <h4 style={{ fontSize: '14px', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', margin: '0 0 2px 0' }}>{event.title}</h4>
                      <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '0 0 4px 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {event.description || 'Açıklama girilmedi.'}
                      </p>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: 'auto' }}>Tarih: {event.eventDate}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'space-between', paddingLeft: '10px', flexShrink: 0 }}>
                    {event.type === 'ROUTINE' ? (
                      <span style={{
                        fontSize: '10px', fontWeight: '700',
                        color: event.pointsEarned === 50 ? 'var(--status-success)' : 'var(--status-warning)'
                      }}>
                        {event.pointsEarned === 50 ? 'Zamanında' : 'Gecikmeli'}
                      </span>
                    ) : <span></span>}
                    <div style={{ fontWeight: '800', color: 'var(--accent-primary)', fontSize: '15px' }}>
                      +{event.pointsEarned} P
                    </div>
                    {/* Silme Butonu - 24 saat kontrolü */}
                    {(() => {
                      const createdAt = new Date(event.createdAt);
                      const diffHours = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);
                      const canDelete = diffHours <= 24;
                      return (
                        <button 
                          onClick={() => canDelete && handleDeleteEvent(event.id)}
                          className="btn"
                          title={canDelete ? 'Etkinliği iptal et' : '24 saat geçtiğinden silinemez'}
                          style={{ 
                            padding: '4px 8px', fontSize: '11px', 
                            backgroundColor: canDelete ? 'rgba(239, 68, 68, 0.1)' : 'rgba(148, 163, 184, 0.1)', 
                            color: canDelete ? 'var(--status-danger)' : 'var(--text-muted)',
                            cursor: canDelete ? 'pointer' : 'not-allowed',
                            opacity: canDelete ? 1 : 0.5
                          }}
                        >
                          {canDelete ? 'İptal Et' : 'Süre Doldu'}
                        </button>
                      );
                    })()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        </>
        )}

        {/* TAB: GALLERY (ETKİNLİK MEDYASI) */}
        {activeTab === 'gallery' && (
          <div className="card" style={{ padding: '20px', minHeight: '500px', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)' }}>
            <EventMediaGallery eventsGallery={eventsGallery} setPreviewImage={setPreviewImage} />
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
                  <p style={{ fontSize: '15px', fontWeight: '700', margin: '2px 0 0 0' }}>{user?.assignedUnit || 'Birim Atanmadı'}</p>
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

            {/* KVKK Bilgi Kartı */}
            <div className="card" style={{ padding: '25px', textAlign: 'left', borderLeft: '4px solid var(--accent-primary)' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                🔒 Kişisel Veri Koruma (KVKK)
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                Ad-soyad, e-posta ve telefon bilgileriniz ile etkinlik kanıt görselleriniz; Genç İHH Erzurum tarafından 
                <strong> yalnızca teşkilat takip ve performans değerlendirme </strong> amacıyla işlenmektedir. 
                Verileriniz üçüncü taraflarla paylaşılmaz ve şifreleriniz kriptolu olarak saklanır. 
                6698 sayılı KVKK kapsamında veri silme veya düzeltme talepleriniz için birim yöneticinizle iletişime geçebilirsiniz.
              </p>
            </div>
          </div>
        )}

        {/* TAB: ETKİNLİK MEDYASI (YALNIZCA MEDYA BAŞKANI) */}
        {activeTab === 'gallery' && user?.assignedUnit === 'Tanıtım ve Medya Başkanı' && (
          <EventMediaGallery eventsGallery={eventsGallery} setPreviewImage={setPreviewImage} />
        )}
      </main>

      {/* Resim İnceleme Modalı */}
      {previewImage && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.9)', zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
        }}>
          <div className="card" style={{ maxWidth: '900px', width: '100%', backgroundColor: 'var(--bg-primary)', overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
            <div style={{ padding: '15px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--bg-secondary)' }}>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ImageIcon size={18} style={{ color: 'var(--accent-primary)' }} /> Kanıt Görseli İncelemesi
              </h3>
              <button
                onClick={() => setPreviewImage(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '5px' }}
              >
                <X size={20} />
              </button>
            </div>
            
            <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
              <div style={{ backgroundColor: '#000', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
                <img
                  src={`http://localhost:5000${previewImage.url}`}
                  alt="Büyük Kanıt"
                  style={{ maxWidth: '100%', maxHeight: '60vh', objectFit: 'contain', display: 'block' }}
                />
              </div>
              
              <div style={{ padding: '20px' }}>
                <h4 style={{ margin: '0 0 10px 0', fontSize: '18px', fontWeight: '800' }}>{previewImage.title}</h4>
                
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
                      backgroundColor: previewImage.type === 'ROUTINE' ? 'rgba(59, 130, 246, 0.1)' : previewImage.type === 'TARGET' ? 'rgba(139, 92, 246, 0.1)' : 'rgba(91, 128, 54, 0.1)',
                      color: previewImage.type === 'ROUTINE' ? '#3b82f6' : previewImage.type === 'TARGET' ? '#8b5cf6' : '#5b8036',
                      fontWeight: '600'
                    }}>
                      {previewImage.type === 'ROUTINE' ? 'Rutin Görev' : previewImage.type === 'TARGET' ? 'Aylık Hedef' : 'Ekstra Etkinlik'}
                    </span>
                  </div>
                  <div>
                    <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Tarih</span>
                    <strong style={{ fontSize: '13px' }}>{previewImage.date}</strong>
                  </div>
                </div>
              </div>

              <div style={{ padding: '15px 20px', display: 'flex', gap: '12px', justifyContent: 'flex-end', borderTop: '1px solid var(--border-color)' }}>
                <button
                  onClick={() => setPreviewImage(null)}
                  className="btn btn-secondary"
                  style={{ padding: '8px 16px', fontSize: '13px', cursor: 'pointer' }}
                >
                  Kapat
                </button>
                <a
                  href={`http://localhost:5000${previewImage.url}`}
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
        </div>
      )}
    </div>
  );
}
