import React, { useState, useEffect } from 'react';
import { Target, CheckCircle, Trash2 } from 'lucide-react';
import { useAuth } from '../../shared/context/AuthContext';
import { useNotification } from '../../shared/context/NotificationContext';

export default function MonthlyGoalsPanel({ validUnits }) {
  const { fetchWithAuth, setLoadingScreen } = useAuth();
  const { showNotification, showConfirm } = useNotification();

  const [targets, setTargets] = useState([]);
  const [newTarget, setNewTarget] = useState({ 
    unit: '', 
    month: new Date().toISOString().slice(0, 7), 
    targetName: '', 
    targetPoints: 0 
  });

  useEffect(() => {
    fetchTargets();
  }, []);

  const fetchTargets = async () => {
    try {
      const res = await fetchWithAuth('/system/targets');
      if (res.ok) setTargets(await res.json());
    } catch (e) { console.error(e); }
  };

  const handleSetTarget = async (e) => {
    e.preventDefault();
    setLoadingScreen(true);
    try {
      const res = await fetchWithAuth('/system/targets', {
        method: 'POST',
        body: JSON.stringify(newTarget)
      });
      if (res.ok) {
        showNotification('Hedef kaydedildi.', 'success');
        setNewTarget({ ...newTarget, targetName: '', targetPoints: 0 });
        fetchTargets();
      } else {
        const d = await res.json();
        showNotification(d.message, 'error');
      }
    } catch (e) { showNotification('Hata.', 'error'); }
    setLoadingScreen(false);
  };

  const handleDeleteTarget = async (id) => {
    showConfirm('Bu aylık hedefi silmek istediğinize emin misiniz?', async () => {
      setLoadingScreen(true);
      try {
        const res = await fetchWithAuth(`/system/targets/${id}`, { method: 'DELETE' });
        if (res.ok) {
          showNotification('Aylık hedef silindi.', 'success');
          fetchTargets();
        } else {
          showNotification('Hedef silinemedi.', 'error');
        }
      } catch (e) {
        showNotification('Hata oluştu.', 'error');
      }
      setLoadingScreen(false);
    });
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
      <div className="card" style={{ textAlign: 'left' }}>
        <h3 style={{ fontSize: '18px', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Target size={20} color="var(--accent-primary)" />
          Aylık Görev Belirle
        </h3>
        <form onSubmit={handleSetTarget} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div>
            <label className="form-label">Ay (YYYY-MM)</label>
            <input required type="month" className="form-control" value={newTarget.month} onChange={e => setNewTarget({...newTarget, month: e.target.value})} />
          </div>
          <div>
            <label className="form-label">Birim</label>
            <select required className="form-control" value={newTarget.unit} onChange={e => setNewTarget({...newTarget, unit: e.target.value})}>
              <option value="">Seçiniz...</option>
              {validUnits.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Hedeflenen Etkinlik Adı</label>
            <input required type="text" className="form-control" value={newTarget.targetName} onChange={e => setNewTarget({...newTarget, targetName: e.target.value})} placeholder="Örn: Kardeşlik Kampı" />
          </div>
          <div>
            <label className="form-label">Bu Etkinliğin Puanı</label>
            <input required type="number" min="0" className="form-control" value={newTarget.targetPoints} onChange={e => setNewTarget({...newTarget, targetPoints: parseInt(e.target.value)})} />
          </div>
          <button type="submit" className="btn btn-primary"><CheckCircle size={16} /> Hedefi Kaydet</button>
        </form>
      </div>
      <div className="card" style={{ textAlign: 'left' }}>
        <h3 style={{ fontSize: '18px', marginBottom: '1rem' }}>Tüm Hedefler</h3>
        <div style={{ overflowX: 'auto' }}>
          <table className="table" style={{ width: '100%', fontSize: '14px', minWidth: '500px' }}>
            <thead>
              <tr>
                <th>Ay</th>
                <th>Birim</th>
                <th>Hedef Etkinlik</th>
                <th>Puan</th>
                <th style={{ textAlign: 'center' }}>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {targets.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>Henüz hedef belirlenmemiş.</td>
                </tr>
              ) : (
                targets.map(t => (
                  <tr key={t.id}>
                    <td>{t.month}</td>
                    <td>{t.unit}</td>
                    <td>{t.targetName}</td>
                    <td>{t.targetPoints} P</td>
                    <td style={{ textAlign: 'center' }}>
                      <button 
                        onClick={() => handleDeleteTarget(t.id)} 
                        className="btn btn-icon text-danger" 
                        title="Hedefi Sil"
                        style={{ background: 'transparent', padding: '5px' }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
