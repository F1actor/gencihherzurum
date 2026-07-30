import React, { useState } from 'react';
import { Users, CheckSquare, AlertTriangle, UserCheck, Shield, Trash2, RefreshCw } from 'lucide-react';

/**
 * UserManagement — Kullanıcı listesi ve birim atama bileşeni.
 */
export default function UserManagement({
  pendingUsers, allUsers, validUnits,
  onAssign, onDelete, onRefresh,
  selectedUnits, setSelectedUnits
}) {
  const [activeSubTab, setActiveSubTab] = useState('pending'); // 'pending' | 'all'
  const [loadingUserId, setLoadingUserId] = useState(null);

  const handleAssign = async (userId) => {
    if (!selectedUnits[userId]) return;
    setLoadingUserId(userId);
    await onAssign(userId, selectedUnits[userId]);
    setLoadingUserId(null);
  };

  const handleDelete = async (userId, fullName) => {
    await onDelete(userId, fullName);
  };

  const subTabs = [
    { key: 'pending', label: `Bekleyenler (${pendingUsers.length})` },
    { key: 'all', label: `Tüm Kullanıcılar (${allUsers.length})` }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
        {subTabs.map(t => (
          <button key={t.key} onClick={() => setActiveSubTab(t.key)} className={`btn ${activeSubTab === t.key ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '8px 16px', fontSize: '13px' }}>
            {t.label}
          </button>
        ))}
        <button onClick={onRefresh} className="btn btn-secondary" style={{ marginLeft: 'auto', gap: '6px', padding: '8px 16px', fontSize: '13px' }}>
          <RefreshCw size={14} /> Yenile
        </button>
      </div>

      {activeSubTab === 'pending' && (
        <div className="card">
          <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={16} style={{ color: '#f59e0b' }} /> Atama Bekleyen Üyeler
          </h3>
          {pendingUsers.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Atama bekleyen üye bulunmuyor.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {pendingUsers.map(u => (
                <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', padding: '12px', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ flex: 1, minWidth: '180px' }}>
                    <p style={{ fontWeight: '600', fontSize: '14px' }}>{u.fullName}</p>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{u.email}</p>
                  </div>
                  <select
                    className="form-select"
                    value={selectedUnits[u.id] || ''}
                    onChange={e => setSelectedUnits(prev => ({ ...prev, [u.id]: e.target.value }))}
                    style={{ flex: 1, minWidth: '180px', padding: '8px 12px', fontSize: '13px' }}
                  >
                    <option value="">Birim Seç...</option>
                    {validUnits.map(unit => <option key={unit} value={unit}>{unit}</option>)}
                  </select>
                  <button
                    className="btn btn-primary"
                    onClick={() => handleAssign(u.id)}
                    disabled={!selectedUnits[u.id] || loadingUserId === u.id}
                    style={{ padding: '8px 16px', fontSize: '13px', gap: '6px' }}
                  >
                    {loadingUserId === u.id ? <RefreshCw size={14} className="spin" /> : <UserCheck size={14} />}
                    Ata
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeSubTab === 'all' && (
        <div className="card">
          <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={16} /> Tüm Kullanıcılar
          </h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-color)', textAlign: 'left' }}>
                  <th style={{ padding: '8px 12px', color: 'var(--text-secondary)', fontWeight: '600' }}>Ad Soyad</th>
                  <th style={{ padding: '8px 12px', color: 'var(--text-secondary)', fontWeight: '600' }}>E-posta</th>
                  <th style={{ padding: '8px 12px', color: 'var(--text-secondary)', fontWeight: '600' }}>Birim</th>
                  <th style={{ padding: '8px 12px', color: 'var(--text-secondary)', fontWeight: '600' }}>Rol</th>
                  <th style={{ padding: '8px 12px', color: 'var(--text-secondary)', fontWeight: '600' }}></th>
                </tr>
              </thead>
              <tbody>
                {allUsers.map(u => (
                  <tr key={u.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '10px 12px', fontWeight: '600' }}>{u.fullName}</td>
                    <td style={{ padding: '10px 12px', color: 'var(--text-secondary)' }}>{u.email}</td>
                    <td style={{ padding: '10px 12px' }}>{u.assignedUnit || '—'}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{
                        fontSize: '11px', fontWeight: '700', padding: '3px 8px', borderRadius: 'var(--radius-full)',
                        backgroundColor: u.role === 'SUPER_ADMIN' ? 'rgba(91,128,54,0.12)' : u.role === 'PENDING' ? 'rgba(245,158,11,0.12)' : 'rgba(59,130,246,0.12)',
                        color: u.role === 'SUPER_ADMIN' ? '#5b8036' : u.role === 'PENDING' ? '#f59e0b' : '#3b82f6'
                      }}>
                        {u.role}
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <button onClick={() => handleDelete(u.id, u.fullName)} className="btn btn-secondary" style={{ padding: '6px 10px', color: '#ef4444' }}>
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
