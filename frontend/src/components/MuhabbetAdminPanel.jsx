import React, { useState, useEffect } from 'react';
import { Users, Calendar, CheckSquare, Settings, Edit, Trash2, X, UserMinus } from 'lucide-react';
import { useNotification } from '../context/NotificationContext';
import * as XLSX from 'xlsx';
import html2pdf from 'html2pdf.js';

export default function MuhabbetAdminPanel({ allUsers }) {
  const [activeTab, setActiveTab] = useState('applications');
  const [applications, setApplications] = useState([]);
  const [classes, setClasses] = useState([]);
  const [menus, setMenus] = useState([]);
  const [settings, setSettings] = useState({ isApplicationsOpen: true });
  const [loading, setLoading] = useState(false);
  const { showNotification, showConfirm } = useNotification();

  // Modal States
  const [editingApplication, setEditingApplication] = useState(null);
  const [editingClass, setEditingClass] = useState(null);
  const [editingMenu, setEditingMenu] = useState(null);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    const token = localStorage.getItem('gencihh_token');
    const headers = { 'Authorization': `Bearer ${token}` };

    try {
      if (activeTab === 'applications') {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/muhabbet/applications`, { headers });
        if (res.ok) setApplications(await res.json());
      } else if (activeTab === 'classes') {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/muhabbet/classes`, { headers });
        if (res.ok) setClasses(await res.json());
      } else if (activeTab === 'menus') {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/muhabbet/menus`, { headers });
        if (res.ok) setMenus(await res.json());
      } else if (activeTab === 'settings') {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/muhabbet/settings`, { headers });
        if (res.ok) setSettings(await res.json());
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleCreateClass = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const body = {
      name: fd.get('name'),
      ageGroup: fd.get('ageGroup'),
      teacherId: fd.get('teacherId')
    };
    
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/muhabbet/classes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('gencihh_token')}` },
        body: JSON.stringify(body)
      });
      if (res.ok) {
        showNotification('Sınıf oluşturuldu.', 'success');
        e.target.reset();
        fetchData();
      }
    } catch (e) {
      showNotification('Hata oluştu.', 'error');
    }
  };

  const handleAssignClass = async (studentId, classId) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/muhabbet/applications/${studentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('gencihh_token')}` },
        body: JSON.stringify({ classId, status: 'APPROVED' })
      });
      if (res.ok) {
        showNotification('Öğrenci sınıfa atandı.', 'success');
        fetchData();
      }
    } catch (e) {
      showNotification('Hata oluştu.', 'error');
    }
  };

  const handleAddMenu = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const body = {
      menuDate: fd.get('menuDate'),
      foodItems: fd.get('foodItems'),
      activities: fd.get('activities')
    };

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/muhabbet/menus`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('gencihh_token')}` },
        body: JSON.stringify(body)
      });
      if (res.ok) {
        showNotification('Menü eklendi.', 'success');
        e.target.reset();
        fetchData();
      } else {
        const data = await res.json();
        showNotification(data.message || 'Hata oluştu.', 'error');
      }
    } catch (e) {
      showNotification('Hata oluştu.', 'error');
    }
  };

  const toggleApplications = async () => {
    try {
      const newValue = !settings.isApplicationsOpen;
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/muhabbet/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('gencihh_token')}` },
        body: JSON.stringify({ isApplicationsOpen: newValue })
      });
      if (res.ok) {
        setSettings({ isApplicationsOpen: newValue });
        showNotification(newValue ? 'Başvurular açıldı.' : 'Başvurular kapatıldı.', 'success');
      } else {
        const data = await res.json();
        showNotification(data.message || 'Hata oluştu.', 'error');
      }
    } catch (e) {
      showNotification('Hata oluştu.', 'error');
    }
  };

  const handleRemoveFromClass = async (studentId) => {
    showConfirm('Öğrenciyi sınıftan çıkarmak istediğinize emin misiniz?', async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/muhabbet/applications/${studentId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('gencihh_token')}` },
          body: JSON.stringify({ classId: null, status: 'PENDING' })
        });
        if (res.ok) {
          showNotification('Öğrenci sınıftan çıkarıldı.', 'success');
          fetchData();
        }
      } catch (e) { showNotification('Hata oluştu.', 'error'); }
    });
  };

  const handleDeleteApplication = async (studentId) => {
    showConfirm('Öğrenci kaydını tamamen silmek istediğinize emin misiniz? Bu işlem geri alınamaz!', async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/muhabbet/applications/${studentId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${localStorage.getItem('gencihh_token')}` }
        });
        if (res.ok) { showNotification('Öğrenci silindi.', 'success'); fetchData(); }
      } catch (e) { showNotification('Hata oluştu.', 'error'); }
    });
  };

  const handleUpdateApplication = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const body = Object.fromEntries(fd.entries());
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/muhabbet/applications/${editingApplication.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('gencihh_token')}` },
        body: JSON.stringify(body)
      });
      if (res.ok) { showNotification('Öğrenci güncellendi.', 'success'); setEditingApplication(null); fetchData(); }
    } catch (e) { showNotification('Hata oluştu.', 'error'); }
  };

  const handleDeleteClass = async (classId) => {
    showConfirm('Bu sınıfı silmek istediğinize emin misiniz? İçindeki öğrenciler sınıfsız olarak boşa düşecektir!', async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/muhabbet/classes/${classId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${localStorage.getItem('gencihh_token')}` }
        });
        if (res.ok) { showNotification('Sınıf silindi.', 'success'); fetchData(); }
      } catch (e) { showNotification('Hata oluştu.', 'error'); }
    });
  };

  const handleUpdateClass = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const body = Object.fromEntries(fd.entries());
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/muhabbet/classes/${editingClass.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('gencihh_token')}` },
        body: JSON.stringify(body)
      });
      if (res.ok) { showNotification('Sınıf güncellendi.', 'success'); setEditingClass(null); fetchData(); }
    } catch (e) { showNotification('Hata oluştu.', 'error'); }
  };

  const handleDeleteMenu = async (menuId) => {
    showConfirm('Menüyü silmek istediğinize emin misiniz?', async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/muhabbet/menus/${menuId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${localStorage.getItem('gencihh_token')}` }
        });
        if (res.ok) { showNotification('Menü silindi.', 'success'); fetchData(); }
      } catch (e) { showNotification('Hata oluştu.', 'error'); }
    });
  };

  const handleUpdateMenu = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const body = Object.fromEntries(fd.entries());
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/muhabbet/menus/${editingMenu.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('gencihh_token')}` },
        body: JSON.stringify(body)
      });
      if (res.ok) { showNotification('Menü güncellendi.', 'success'); setEditingMenu(null); fetchData(); }
    } catch (e) { showNotification('Hata oluştu.', 'error'); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', gap: '10px' }}>
        <button className={`btn ${activeTab === 'applications' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('applications')}>Başvurular</button>
        <button className={`btn ${activeTab === 'classes' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('classes')}>Sınıflar & Hocalar</button>
        <button className={`btn ${activeTab === 'menus' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('menus')}>Menü & Etkinlikler</button>
        <button className={`btn ${activeTab === 'settings' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('settings')}>Ayarlar</button>
      </div>

      <div className="card" style={{ padding: '20px' }}>
        {loading && <p>Yükleniyor...</p>}
        
        {!loading && activeTab === 'applications' && (
          <div>
            <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Users size={20} className="text-primary" /> Muhabbet Okulu Başvuruları
            </h3>
            <div className="table-responsive">
              <table className="table">
              <thead><tr><th>Çocuk</th><th>Veli</th><th>Telefon</th><th>Adres</th><th>Sınıf Ata</th><th>İşlemler</th></tr></thead>
              <tbody>
                {applications.map(app => (
                  <tr key={app.id}>
                    <td>{app.childName} ({app.grade})</td>
                    <td>{app.parentName}</td>
                    <td>{app.phoneNumber}</td>
                    <td>{app.address}</td>
                    <td>
                      {app.status === 'APPROVED' ? (
                        <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                          <span style={{ color: 'green' }}>Atandı</span>
                          <button onClick={() => handleRemoveFromClass(app.id)} className="btn btn-icon" title="Sınıftan Çıkar" style={{ background: 'transparent', padding: '5px' }}>
                            <UserMinus size={16} className="text-danger" />
                          </button>
                        </div>
                      ) : (
                        <select onChange={(e) => { if(e.target.value) handleAssignClass(app.id, e.target.value) }} className="form-control" style={{ width: 'auto' }}>
                          <option value="">Seçiniz</option>
                          {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '5px' }}>
                        <button onClick={() => setEditingApplication(app)} className="btn btn-icon" title="Düzenle" style={{ background: 'transparent', padding: '5px' }}>
                          <Edit size={16} />
                        </button>
                        <button onClick={() => handleDeleteApplication(app.id)} className="btn btn-icon" title="Sil" style={{ background: 'transparent', padding: '5px' }}>
                          <Trash2 size={16} className="text-danger" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        )}

        {!loading && activeTab === 'classes' && (
          <div>
            <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Settings size={20} className="text-primary" /> Sınıf Oluştur
            </h3>
            <div className="card" style={{ padding: '20px', marginBottom: '30px', backgroundColor: 'var(--bg-tertiary)' }}>
              <form onSubmit={handleCreateClass} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '15px', alignItems: 'end' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Sınıf Adı</label>
                  <input type="text" name="name" placeholder="Örn: Hz. Ebubekir Sınıfı" required className="form-control" />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Yaş Grubu</label>
                  <input type="text" name="ageGroup" placeholder="Örn: 7-9 Yaş" required className="form-control" />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Sınıf Hocası</label>
                  <select name="teacherId" required className="form-control">
                    <option value="">Hoca Seçiniz</option>
                    {allUsers.map(u => (
                      <option key={u.id} value={u.id}>{u.fullName} {u.assignedUnit ? `(${u.assignedUnit})` : ''}</option>
                    ))}
                  </select>
                </div>
                <button type="submit" className="btn btn-primary" style={{ padding: '10px 20px', height: '42px' }}>Oluştur</button>
              </form>
            </div>

            <h3 style={{ marginBottom: '20px' }}>Mevcut Sınıflar</h3>
            <div className="table-responsive">
              <table className="table">
                <thead><tr><th>Sınıf Adı</th><th>Yaş Grubu</th><th>Hocası</th><th>İşlemler</th></tr></thead>
              <tbody>
                {classes.map(c => (
                  <tr key={c.id}>
                    <td>{c.name}</td><td>{c.ageGroup}</td><td>{c.teacherName}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '5px' }}>
                        <button onClick={() => setEditingClass(c)} className="btn btn-icon" title="Düzenle" style={{ background: 'transparent', padding: '5px' }}>
                          <Edit size={16} />
                        </button>
                        <button onClick={() => handleDeleteClass(c.id)} className="btn btn-icon" title="Sil" style={{ background: 'transparent', padding: '5px' }}>
                          <Trash2 size={16} className="text-danger" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        )}

        {!loading && activeTab === 'menus' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Calendar size={20} className="text-primary" /> Günlük Menü Ekle
              </h3>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => {
                  const ws = XLSX.utils.json_to_sheet(menus.map(m => ({ Tarih: m.menuDate, 'Yemek Listesi': m.foodItems, Etkinlikler: m.activities })));
                  const wb = XLSX.utils.book_new();
                  XLSX.utils.book_append_sheet(wb, ws, "Menuler");
                  XLSX.writeFile(wb, "muhabbet_okulu_menuler.xlsx");
                }} className="btn btn-secondary">Toplu Excel İndir</button>
                <button onClick={() => {
                  const element = document.getElementById('menu-list-container');
                  html2pdf().set({ margin: 1, filename: 'muhabbet_okulu_menuler.pdf', html2canvas: { scale: 2 }, jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' } }).from(element).save();
                }} className="btn btn-secondary">Toplu PDF İndir</button>
              </div>
            </div>
            <div className="card" style={{ padding: '20px', marginBottom: '30px', backgroundColor: 'var(--bg-tertiary)' }}>
              <form onSubmit={handleAddMenu} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Tarih</label>
                  <input type="date" name="menuDate" required className="form-control" />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Yemek Listesi</label>
                  <textarea name="foodItems" placeholder="Örn: Çorba, Pilav, Tavuk, Tatlı" required className="form-control" rows="3"></textarea>
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Yapılacak Etkinlikler</label>
                  <textarea name="activities" placeholder="Örn: Siyer Dersi, Yüzme Etkinliği, Okçuluk" required className="form-control" rows="3"></textarea>
                </div>
                <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start', padding: '10px 20px' }}>Menüyü Ekle</button>
              </form>
            </div>

            <h3>Geçmiş Menüler</h3>
            <ul id="menu-list-container" style={{ listStyleType: 'none', padding: 0 }}>
              {menus.map(m => (
                <li key={m.id} style={{ marginBottom: '15px', padding: '15px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <strong style={{ fontSize: '1.2rem', color: 'var(--accent-primary)' }}>{m.menuDate}</strong>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button onClick={() => setEditingMenu(m)} className="btn btn-icon" title="Düzenle" style={{ background: 'transparent', padding: '5px' }}>
                        <Edit size={16} />
                      </button>
                      <button onClick={() => handleDeleteMenu(m.id)} className="btn btn-icon" title="Sil" style={{ background: 'transparent', padding: '5px' }}>
                        <Trash2 size={16} className="text-danger" />
                      </button>
                      <button onClick={() => {
                        const element = document.createElement('div');
                        element.innerHTML = `<h3>${m.menuDate} Muhabbet Okulu Menüsü</h3><p><strong>Yemekler:</strong><br/>${m.foodItems.replace(/\n/g, '<br/>')}</p><p><strong>Etkinlikler:</strong><br/>${m.activities.replace(/\n/g, '<br/>')}</p>`;
                        html2pdf().set({ margin: 1, filename: `menu_${m.menuDate}.pdf` }).from(element).save();
                      }} className="btn" style={{ padding: '4px 8px', fontSize: '12px', border: '1px solid var(--border-color)' }}>PDF İndir</button>
                    </div>
                  </div>
                  <div style={{ marginTop: '10px' }}>
                    <p><strong>Yemekler:</strong> {m.foodItems}</p>
                    <p><strong>Etkinlikler:</strong> {m.activities}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {!loading && activeTab === 'settings' && (
          <div>
            <h3 style={{ marginBottom: '20px' }}>Muhabbet Okulu Ayarları</h3>
            <div className="card" style={{ padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', maxWidth: '400px' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <strong style={{ fontSize: '1.1rem' }}>Başvurular</strong>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  {settings.isApplicationsOpen ? 'Şu anda açık' : 'Şu anda kapalı'}
                </span>
              </div>
              <label className="switch">
                <input 
                  type="checkbox" 
                  checked={settings.isApplicationsOpen} 
                  onChange={toggleApplications} 
                />
                <span className="slider"></span>
              </label>
            </div>
          </div>
        )}
      </div>

      {/* MODALS */}
      {editingApplication && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card" style={{ padding: '20px', width: '100%', maxWidth: '500px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0 }}>Öğrenciyi Düzenle</h3>
              <button onClick={() => setEditingApplication(null)} className="btn btn-icon" style={{ background: 'transparent' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleUpdateApplication} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Çocuğun Adı Soyadı</label>
                <input type="text" name="childName" defaultValue={editingApplication.childName} required className="form-control" />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Veli Adı Soyadı</label>
                <input type="text" name="parentName" defaultValue={editingApplication.parentName} required className="form-control" />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Telefon Numarası</label>
                <input type="text" name="phoneNumber" defaultValue={editingApplication.phoneNumber} required className="form-control" />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Sınıf Kademesi</label>
                <input type="text" name="grade" defaultValue={editingApplication.grade} required className="form-control" />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Adres</label>
                <textarea name="address" defaultValue={editingApplication.address} required className="form-control" rows="2"></textarea>
              </div>
              <input type="hidden" name="classId" value={editingApplication.classId || ''} />
              <input type="hidden" name="status" value={editingApplication.status} />
              <button type="submit" className="btn btn-primary" style={{ padding: '10px', marginTop: '10px' }}>Kaydet</button>
            </form>
          </div>
        </div>
      )}

      {editingClass && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card" style={{ padding: '20px', width: '100%', maxWidth: '500px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0 }}>Sınıfı Düzenle</h3>
              <button onClick={() => setEditingClass(null)} className="btn btn-icon" style={{ background: 'transparent' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleUpdateClass} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Sınıf Adı</label>
                <input type="text" name="name" defaultValue={editingClass.name} required className="form-control" />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Yaş Grubu</label>
                <input type="text" name="ageGroup" defaultValue={editingClass.ageGroup} required className="form-control" />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Sınıf Hocası</label>
                <select name="teacherId" defaultValue={editingClass.teacherId} required className="form-control">
                  <option value="">Hoca Seçiniz</option>
                  {allUsers.map(u => (
                    <option key={u.id} value={u.id}>{u.fullName} {u.assignedUnit ? `(${u.assignedUnit})` : ''}</option>
                  ))}
                </select>
              </div>
              <button type="submit" className="btn btn-primary" style={{ padding: '10px', marginTop: '10px' }}>Kaydet</button>
            </form>
          </div>
        </div>
      )}

      {editingMenu && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card" style={{ padding: '20px', width: '100%', maxWidth: '500px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0 }}>Menüyü Düzenle</h3>
              <button onClick={() => setEditingMenu(null)} className="btn btn-icon" style={{ background: 'transparent' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleUpdateMenu} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Tarih</label>
                <input type="date" name="menuDate" defaultValue={editingMenu.menuDate} required className="form-control" />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Yemek Listesi</label>
                <textarea name="foodItems" defaultValue={editingMenu.foodItems} required className="form-control" rows="3"></textarea>
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Yapılacak Etkinlikler</label>
                <textarea name="activities" defaultValue={editingMenu.activities} required className="form-control" rows="3"></textarea>
              </div>
              <button type="submit" className="btn btn-primary" style={{ padding: '10px', marginTop: '10px' }}>Kaydet</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
