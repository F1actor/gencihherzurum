import React from 'react';
import { Users, Award, TrendingUp, CheckSquare, Bell, Calendar } from 'lucide-react';

/**
 * StatsOverview — Genel bakış istatistik kartları bileşeni.
 */
export default function StatsOverview({ stats, recentEvents, chartWeeksData, validUnits }) {
  const statCards = [
    { label: 'Aktif Birim Başkanı', value: stats.totalPresidents, icon: <Users size={22} />, color: '#5b8036' },
    { label: 'Onay Bekleyen', value: stats.pendingApprovals, icon: <Bell size={22} />, color: '#f59e0b' },
    { label: 'Toplam Etkinlik', value: stats.totalEvents, icon: <CheckSquare size={22} />, color: '#3b82f6' },
  ];

  return (
    <div id="overview-stats-content">
      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        {statCards.map((card, i) => (
          <div key={i} className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: `4px solid ${card.color}` }}>
            <div style={{ backgroundColor: `${card.color}18`, color: card.color, borderRadius: 'var(--radius-md)', padding: '12px', display: 'flex' }}>
              {card.icon}
            </div>
            <div>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '500' }}>{card.label}</p>
              <h2 style={{ fontSize: '28px', fontWeight: '800', color: card.color, lineHeight: 1 }}>{card.value}</h2>
            </div>
          </div>
        ))}
      </div>

      {/* Son Etkinlikler */}
      <div className="card">
        <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Calendar size={18} /> Son Eklenen Etkinlikler
        </h3>
        {recentEvents.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Henüz etkinlik yok.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {recentEvents.map(ev => (
              <div key={ev.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
                <div>
                  <p style={{ fontWeight: '600', fontSize: '14px' }}>{ev.title}</p>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{ev.unit} · {ev.presidentName}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{
                    fontSize: '12px', fontWeight: '700', padding: '3px 10px', borderRadius: 'var(--radius-full)',
                    backgroundColor: ev.type === 'ROUTINE' ? 'rgba(91,128,54,0.12)' : ev.type === 'TARGET' ? 'rgba(59,130,246,0.12)' : 'rgba(245,158,11,0.12)',
                    color: ev.type === 'ROUTINE' ? '#5b8036' : ev.type === 'TARGET' ? '#3b82f6' : '#f59e0b'
                  }}>
                    +{ev.pointsEarned} puan
                  </span>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{ev.eventDate}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
