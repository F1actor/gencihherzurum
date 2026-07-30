import React from 'react';
import { Bell } from 'lucide-react';

/**
 * AuditLog — Sistem denetim günlüğü bileşeni.
 */
export default function AuditLog({ audits, onRunAudit }) {
  const logTypeColors = {
    SYSTEM: { bg: 'rgba(91,128,54,0.1)', color: '#5b8036', label: 'SİSTEM' },
    WARNING: { bg: 'rgba(245,158,11,0.1)', color: '#f59e0b', label: 'UYARI' },
    PASSIVE: { bg: 'rgba(239,68,68,0.1)', color: '#ef4444', label: 'PASİF' },
    INFO: { bg: 'rgba(59,130,246,0.1)', color: '#3b82f6', label: 'BİLGİ' }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Bell size={18} /> Denetim & Pasiflik Günlüğü
        </h3>
        <button onClick={onRunAudit} className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '13px', gap: '8px' }}>
          Manuel Denetim Çalıştır
        </button>
      </div>

      <div className="card">
        {audits.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Henüz denetim kaydı yok.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '600px', overflowY: 'auto' }}>
            {audits.map(a => {
              const typeStyle = logTypeColors[a.logType] || logTypeColors.INFO;
              return (
                <div key={a.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '10px 14px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-tertiary)' }}>
                  <span style={{
                    fontSize: '10px', fontWeight: '700', padding: '3px 8px', borderRadius: 'var(--radius-full)',
                    backgroundColor: typeStyle.bg, color: typeStyle.color, flexShrink: 0, marginTop: '2px'
                  }}>
                    {typeStyle.label}
                  </span>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{a.message}</p>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{a.createdAt}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
