import React from 'react';
import { Award, TrendingUp } from 'lucide-react';

/**
 * Leaderboard — Liderlik tablosu bileşeni (Haftalık, Aylık, Genel).
 */
export default function Leaderboard({ leaderboard, activeTab, setActiveTab }) {
  const tabs = [
    { key: 'weekly', label: 'Haftalık' },
    { key: 'monthly', label: 'Aylık' },
    { key: 'overall', label: 'Genel' }
  ];

  const current = leaderboard[activeTab] || [];

  const medalColors = ['#f59e0b', '#9ca3af', '#b45309'];
  const medalEmojis = ['🥇', '🥈', '🥉'];

  return (
    <div className="card">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '10px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Award size={18} /> Liderlik Tablosu
        </h3>
        <div style={{ display: 'flex', gap: '6px' }}>
          {tabs.map(t => (
            <button
              key={t.key}
              className={`btn ${activeTab === t.key ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '6px 14px', fontSize: '12px', fontWeight: '600' }}
              onClick={() => setActiveTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {current.length === 0 ? (
        <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Henüz veri yok.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {current.map((item, idx) => (
            <div
              key={item.unit}
              style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '10px 14px',
                backgroundColor: idx < 3 ? `${medalColors[idx]}10` : 'var(--bg-tertiary)',
                borderRadius: 'var(--radius-md)',
                border: idx < 3 ? `1px solid ${medalColors[idx]}30` : '1px solid transparent',
                transition: 'transform 0.2s'
              }}
            >
              <span style={{ fontSize: '18px', width: '28px', textAlign: 'center', flexShrink: 0 }}>
                {medalEmojis[idx] || `${idx + 1}.`}
              </span>
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: '600', fontSize: '14px' }}>{item.unit}</p>
                <div style={{
                  height: '4px', borderRadius: '99px',
                  backgroundColor: 'var(--border-color)', marginTop: '4px', overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${current[0]?.points > 0 ? (item.points / current[0].points) * 100 : 0}%`,
                    height: '100%',
                    backgroundColor: idx < 3 ? medalColors[idx] : 'var(--accent-primary)',
                    borderRadius: '99px', transition: 'width 0.6s ease'
                  }} />
                </div>
              </div>
              <span style={{ fontWeight: '800', fontSize: '16px', color: idx < 3 ? medalColors[idx] : 'var(--text-primary)', flexShrink: 0 }}>
                {item.points} <span style={{ fontSize: '11px', fontWeight: '500', color: 'var(--text-muted)' }}>puan</span>
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
