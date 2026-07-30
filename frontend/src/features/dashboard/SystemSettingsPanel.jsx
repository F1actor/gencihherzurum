import React, { useState, useEffect } from 'react';
import { Megaphone, Target, Award, ArrowRightLeft, Plus, Trash2, CheckCircle } from 'lucide-react';
import { useAuth } from '../../shared/context/AuthContext';
import { useNotification } from '../../shared/context/NotificationContext';

export default function SystemSettingsPanel({ validUnits, loadDashboardData }) {
  const { fetchWithAuth, setLoadingScreen } = useAuth();
  const { showNotification, showConfirm } = useNotification();

  const [activeSubTab, setActiveSubTab] = useState('announcements'); // announcements, targets, champions, transfer
  
  // Data states
  const [announcements, setAnnouncements] = useState([]);
  const [champions, setChampions] = useState([]);
  const [unitHistory, setUnitHistory] = useState([]);
  
  // Form states
  const [newAnnouncement, setNewAnnouncement] = useState({ title: '', body: '', targetUnit: '' });
  const [newChampion, setNewChampion] = useState({ month: new Date().toISOString().slice(0, 7), unit: '', presidentName: '', points: 0 });
  const [transferData, setTransferData] = useState({ oldUserId: '', newUserId: '', unit: '', reason: '' });
  
  const [presidents, setPresidents] = useState([]);

  useEffect(() => {
    fetchPresidents();
    if (activeSubTab === 'announcements') fetchAnnouncements();
    if (activeSubTab === 'champions') fetchChampions();
    if (activeSubTab === 'transfer') fetchUnitHistory();
  }, [activeSubTab]);

  const fetchPresidents = async () => {
    try {
      const res = await fetchWithAuth('/admin/users');
      const data = await res.json();
      // Tüm rollerdeki (UNIT_PRESIDENT, SUPER_ADMIN, MUHABBET_TEACHER) atanmış kullanıcılar + PENDING
      setPresidents(data.filter(u => u.assignedUnit || u.role === 'PENDING'));
    } catch (e) {
      console.error(e);
    }
  };

  const fetchAnnouncements = async () => {
    try {
      const res = await fetchWithAuth('/system/announcements');
      if (res.ok) setAnnouncements(await res.json());
    } catch (e) { console.error(e); }
  };


  const fetchChampions = async () => {
    try {
      const res = await fetchWithAuth('/system/champions');
      if (res.ok) setChampions(await res.json());
    } catch (e) { console.error(e); }
  };

  const fetchUnitHistory = async () => {
    try {
      const res = await fetchWithAuth('/system/unit-history');
      if (res.ok) setUnitHistory(await res.json());
    } catch (e) { console.error(e); }
  };

  // --- ANNOUNCEMENT HANDLERS ---
  const handleCreateAnnouncement = async (e) => {
    e.preventDefault();
    setLoadingScreen(true);
    try {
      const res = await fetchWithAuth('/system/announcements', {
        method: 'POST',
        body: JSON.stringify(newAnnouncement)
      });
      if (res.ok) {
        showNotification('Duyuru oluşturuldu.', 'success');
        setNewAnnouncement({ title: '', body: '', targetUnit: '' });
        fetchAnnouncements();
      } else {
        const d = await res.json();
        showNotification(d.message, 'error');
      }
    } catch (e) { showNotification('Hata.', 'error'); }
    setLoadingScreen(false);
  };

  const handleDeleteAnnouncement = async (id) => {
    showConfirm('Silmek istediğinize emin misiniz?', async () => {
      setLoadingScreen(true);
      try {
        const res = await fetchWithAuth(`/system/announcements/${id}`, { method: 'DELETE' });
        if (res.ok) {
          showNotification('Duyuru silindi.', 'success');
          fetchAnnouncements();
        }
      } catch (e) { showNotification('Hata.', 'error'); }
      setLoadingScreen(false);
    });
  };


  // --- CHAMPION HANDLERS ---
  const handleAddChampion = async (e) => {
    e.preventDefault();
    setLoadingScreen(true);
    try {
      const res = await fetchWithAuth('/system/champions', {
        method: 'POST',
        body: JSON.stringify(newChampion)
      });
      if (res.ok) {
        showNotification('Şampiyon kaydedildi.', 'success');
        setNewChampion({ ...newChampion, unit: '', presidentName: '', points: 0 });
        fetchChampions();
      } else {
        const d = await res.json();
        showNotification(d.message, 'error');
      }
    } catch (e) { showNotification('Hata.', 'error'); }
    setLoadingScreen(false);
  };

  // --- TRANSFER HANDLERS ---
  const handleTransferUnit = async (e) => {
    e.preventDefault();

    if (transferData.oldUserId && transferData.oldUserId === transferData.newUserId) {
      showNotification('Devreden ve devralan kişi aynı olamaz!', 'warning');
      return;
    }

    if (transferData.oldUserId) {
      const oldUser = presidents.find(p => p.id.toString() === transferData.oldUserId.toString());
      if (oldUser && oldUser.assignedUnit !== transferData.unit) {
        showNotification(`Devreden kişi (${oldUser.fullName}) ${transferData.unit} başkanı değil!`, 'warning');
        return;
      }
    }

    setLoadingScreen(true);
    try {
      const res = await fetchWithAuth('/system/transfer-unit', {
        method: 'POST',
        body: JSON.stringify(transferData)
      });
      if (res.ok) {
        showNotification('Birim devredildi.', 'success');
        setTransferData({ oldUserId: '', newUserId: '', unit: '', reason: '' });
        fetchUnitHistory();
        fetchPresidents();
        loadDashboardData(true);
      } else {
        const d = await res.json();
        showNotification(d.message, 'error');
      }
    } catch (e) { showNotification('Hata.', 'error'); }
    setLoadingScreen(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', gap: '10px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', overflowX: 'auto' }}>
        <button className={`btn ${activeSubTab === 'announcements' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveSubTab('announcements')}>
          <Megaphone size={16} /> Duyurular
        </button>
        <button className={`btn ${activeSubTab === 'champions' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveSubTab('champions')}>
          <Award size={16} /> Şampiyonlar Arşivi
        </button>
        <button className={`btn ${activeSubTab === 'transfer' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveSubTab('transfer')}>
          <ArrowRightLeft size={16} /> Birim Devri & Geçmiş
        </button>
      </div>

      {/* DUYURULAR */}
      {activeSubTab === 'announcements' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
          <div className="card" style={{ textAlign: 'left' }}>
            <h3 style={{ fontSize: '18px', marginBottom: '1rem' }}>Yeni Duyuru Ekle</h3>
            <form onSubmit={handleCreateAnnouncement} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div>
                <label className="form-label">Başlık</label>
                <input required type="text" className="form-control" value={newAnnouncement.title} onChange={e => setNewAnnouncement({...newAnnouncement, title: e.target.value})} />
              </div>
              <div>
                <label className="form-label">İçerik</label>
                <textarea required className="form-control" rows="4" value={newAnnouncement.body} onChange={e => setNewAnnouncement({...newAnnouncement, body: e.target.value})} />
              </div>
              <div>
                <label className="form-label">Hedef Birim (Opsiyonel - Boşsa Herkes)</label>
                <select className="form-control" value={newAnnouncement.targetUnit} onChange={e => setNewAnnouncement({...newAnnouncement, targetUnit: e.target.value})}>
                  <option value="">-- Tüm Birimler --</option>
                  {validUnits.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
              <button type="submit" className="btn btn-primary"><Plus size={16} /> Yayınla</button>
            </form>
          </div>
          <div className="card" style={{ textAlign: 'left' }}>
            <h3 style={{ fontSize: '18px', marginBottom: '1rem' }}>Aktif Duyurular</h3>
            {announcements.length === 0 ? <p className="text-muted">Aktif duyuru yok.</p> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {announcements.map(a => (
                  <div key={a.id} style={{ padding: '15px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-tertiary)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <h4 style={{ margin: 0, fontSize: '16px', color: 'var(--accent-primary)' }}>{a.title}</h4>
                      <button className="btn btn-danger" style={{ padding: '4px 8px' }} onClick={() => handleDeleteAnnouncement(a.id)}>Sil</button>
                    </div>
                    <p style={{ margin: '0 0 10px 0', fontSize: '14px', whiteSpace: 'pre-wrap' }}>{a.body}</p>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      Hedef: {a.targetUnit || 'Tümü'} | Tarih: {new Date(a.createdAt).toLocaleString('tr-TR')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ŞAMPİYONLAR ARŞİVİ */}
      {activeSubTab === 'champions' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
          <div className="card" style={{ textAlign: 'left' }}>
            <h3 style={{ fontSize: '18px', marginBottom: '1rem' }}>Şampiyon Ekle (Manuel Geçmiş)</h3>
            <form onSubmit={handleAddChampion} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div>
                <label className="form-label">Ay (YYYY-MM)</label>
                <input required type="month" className="form-control" value={newChampion.month} onChange={e => setNewChampion({...newChampion, month: e.target.value})} />
              </div>
              <div>
                <label className="form-label">Birim</label>
                <select required className="form-control" value={newChampion.unit} onChange={e => setNewChampion({...newChampion, unit: e.target.value})}>
                  <option value="">Seçiniz...</option>
                  {validUnits.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Başkan Adı</label>
                <input required type="text" className="form-control" value={newChampion.presidentName} onChange={e => setNewChampion({...newChampion, presidentName: e.target.value})} />
              </div>
              <div>
                <label className="form-label">Puan</label>
                <input required type="number" min="0" className="form-control" value={newChampion.points} onChange={e => setNewChampion({...newChampion, points: parseInt(e.target.value)})} />
              </div>
              <button type="submit" className="btn btn-primary"><Plus size={16} /> Şampiyon Ekle</button>
            </form>
          </div>
          <div className="card" style={{ textAlign: 'left' }}>
            <h3 style={{ fontSize: '18px', marginBottom: '1rem' }}>Şampiyonlar Arşivi</h3>
            <table className="table" style={{ width: '100%', fontSize: '14px' }}>
              <thead>
                <tr>
                  <th>Ay</th>
                  <th>Birim</th>
                  <th>Başkan</th>
                  <th>Puan</th>
                </tr>
              </thead>
              <tbody>
                {champions.map(c => (
                  <tr key={c.id}>
                    <td>{c.month}</td>
                    <td>{c.unit}</td>
                    <td>{c.presidentName}</td>
                    <td>{c.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* BİRİM DEVRİ */}
      {activeSubTab === 'transfer' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
          <div className="card" style={{ textAlign: 'left' }}>
            <h3 style={{ fontSize: '18px', marginBottom: '1rem' }}>Birimi Devret</h3>
            <form onSubmit={handleTransferUnit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div>
                <label className="form-label">Eski Başkan (Görevi Bırakan)</label>
                <select className="form-control" value={transferData.oldUserId} onChange={e => setTransferData({...transferData, oldUserId: e.target.value})}>
                  <option value="">-- Yok --</option>
                  {presidents.filter(p => p.assignedUnit).map(p => (
                    <option key={p.id} value={p.id}>{p.fullName} ({p.assignedUnit})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="form-label">Yeni Başkan (Görevi Devralan)</label>
                <select required className="form-control" value={transferData.newUserId} onChange={e => setTransferData({...transferData, newUserId: e.target.value})}>
                  <option value="">Seçiniz...</option>
                  {presidents.map(p => (
                    <option key={p.id} value={p.id}>{p.fullName} {p.assignedUnit ? `(${p.assignedUnit})` : '(Bekliyor)'}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="form-label">Devredilen Birim</label>
                <select required className="form-control" value={transferData.unit} onChange={e => setTransferData({...transferData, unit: e.target.value})}>
                  <option value="">Seçiniz...</option>
                  {validUnits.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Devir Nedeni / Açıklama</label>
                <input type="text" className="form-control" placeholder="Örn: Mezuniyet, İstifa..." value={transferData.reason} onChange={e => setTransferData({...transferData, reason: e.target.value})} />
              </div>
              <button type="submit" className="btn btn-primary"><ArrowRightLeft size={16} /> Devri Gerçekleştir</button>
            </form>
          </div>
          <div className="card" style={{ textAlign: 'left' }}>
            <h3 style={{ fontSize: '18px', marginBottom: '1rem' }}>Birim Başkanlığı Geçmişi</h3>
            <div style={{ overflowX: 'auto' }}>
              <table className="table" style={{ width: '100%', fontSize: '14px' }}>
                <thead>
                  <tr>
                    <th>Birim</th>
                    <th>Başkan</th>
                    <th>Başlangıç</th>
                    <th>Bitiş</th>
                    <th>Neden</th>
                  </tr>
                </thead>
                <tbody>
                  {unitHistory.map(h => (
                    <tr key={h.id}>
                      <td>{h.unit}</td>
                      <td>{h.fullName}</td>
                      <td>{h.startDate}</td>
                      <td>{h.endDate || 'Devam Ediyor'}</td>
                      <td>{h.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
