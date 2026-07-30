import React, { useState } from 'react';
import { CheckSquare, Plus, Trash2, RefreshCw } from 'lucide-react';

const daysMap = { 1: 'Pazartesi', 2: 'Salı', 3: 'Çarşamba', 4: 'Perşembe', 5: 'Cuma', 6: 'Cumartesi', 7: 'Pazar' };

/**
 * RoutineManager — Rutin görev yönetim bileşeni.
 */
export default function RoutineManager({ routines, validUnits, onCreate, onDelete }) {
  const [newRoutine, setNewRoutine] = useState({ unit: validUnits[0] || '', title: '', dayOfWeek: '1' });
  const [loading, setLoading] = useState(false);

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    await onCreate(newRoutine);
    setNewRoutine(prev => ({ ...prev, title: '' }));
    setLoading(false);
  };

  // Update unit default when validUnits loads
  React.useEffect(() => {
    if (validUnits.length > 0 && !newRoutine.unit) {
      setNewRoutine(prev => ({ ...prev, unit: validUnits[0] }));
    }
  }, [validUnits]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* New Routine Form */}
      <div className="card">
        <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Plus size={16} /> Yeni Rutin Görev Ekle
        </h3>
        <form onSubmit={handleCreate} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <select
            className="form-select"
            value={newRoutine.unit}
            onChange={e => setNewRoutine(p => ({ ...p, unit: e.target.value }))}
            style={{ flex: '1', minWidth: '160px', padding: '8px 12px', fontSize: '13px' }}
            required
          >
            {validUnits.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
          <input
            className="form-input"
            type="text"
            placeholder="Görev başlığı..."
            value={newRoutine.title}
            onChange={e => setNewRoutine(p => ({ ...p, title: e.target.value }))}
            style={{ flex: '2', minWidth: '200px', padding: '8px 12px', fontSize: '13px' }}
            required
          />
          <select
            className="form-select"
            value={newRoutine.dayOfWeek}
            onChange={e => setNewRoutine(p => ({ ...p, dayOfWeek: e.target.value }))}
            style={{ flex: '1', minWidth: '130px', padding: '8px 12px', fontSize: '13px' }}
          >
            {Object.entries(daysMap).map(([v, label]) => (
              <option key={v} value={v}>{label}</option>
            ))}
          </select>
          <button type="submit" className="btn btn-primary" disabled={loading} style={{ padding: '8px 20px', fontSize: '13px', gap: '6px' }}>
            {loading ? <RefreshCw size={14} className="spin" /> : <Plus size={14} />}
            Ekle
          </button>
        </form>
      </div>

      {/* Routines List */}
      <div className="card">
        <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckSquare size={16} /> Mevcut Rutin Görevler
        </h3>
        {routines.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Henüz rutin görev tanımlanmamış.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {routines.map(r => (
              <div key={r.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
                <div>
                  <p style={{ fontWeight: '600', fontSize: '14px' }}>{r.title}</p>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{r.unit} · {daysMap[r.dayOfWeek]}</p>
                </div>
                <button onClick={() => onDelete(r.id, r.title)} className="btn btn-secondary" style={{ padding: '6px 10px', color: '#ef4444' }}>
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
