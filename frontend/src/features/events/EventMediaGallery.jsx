import React, { useState } from 'react';
import { Search, Image as ImageIcon, Trash2 } from 'lucide-react';
import { useNotification } from '../../shared/context/NotificationContext';
import { getAssetUrl } from '../../shared/config/api';

export default function EventMediaGallery({ eventsGallery, setPreviewImage, onDeleteEvent }) {
  const [gallerySearch, setGallerySearch] = useState('');
  const [galleryTypeFilter, setGalleryTypeFilter] = useState('ALL');
  const [galleryProofFilter, setGalleryProofFilter] = useState('WITH_PROOF');
  const { showConfirm } = useNotification();

  const filtered = eventsGallery.filter(ev => {
    const searchLower = gallerySearch.toLowerCase();
    const matchSearch = !gallerySearch ||
      ev.title.toLowerCase().includes(searchLower) ||
      ev.unit.toLowerCase().includes(searchLower) ||
      ev.presidentName?.toLowerCase().includes(searchLower);
    const matchType = galleryTypeFilter === 'ALL' || ev.type === galleryTypeFilter;
    const matchProof = galleryProofFilter === 'ALL'
      ? true
      : galleryProofFilter === 'WITH_PROOF'
        ? !!ev.proofImagePath
        : !ev.proofImagePath;
    return matchSearch && matchType && matchProof;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Filter Bar */}
      <div className="card" style={{ padding: '16px 20px', textAlign: 'left' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Search */}
          <div style={{ position: 'relative', flex: '1 1 220px' }}>
            <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
            <input
              type="text"
              placeholder="Başlık, birim veya kişi ara..."
              value={gallerySearch}
              onChange={e => setGallerySearch(e.target.value)}
              className="form-control"
              style={{ paddingLeft: '32px', fontSize: '13px', height: '42px' }}
            />
          </div>

          {/* Type Filter */}
          <select
            value={galleryTypeFilter}
            onChange={e => setGalleryTypeFilter(e.target.value)}
            className="form-control"
            style={{ fontSize: '13px', height: '42px', width: 'auto', minWidth: '145px', flexShrink: 0 }}
          >
            <option value="ALL">Tüm Türler</option>
            <option value="ROUTINE">Yalnızca Rutin</option>
            <option value="EXTRA">Yalnızca Ekstra</option>
          </select>

          {/* Proof Filter */}
          <select
            value={galleryProofFilter}
            onChange={e => setGalleryProofFilter(e.target.value)}
            className="form-control"
            style={{ fontSize: '13px', height: '42px', width: 'auto', minWidth: '145px', flexShrink: 0 }}
          >
            <option value="ALL">Tüm Kayıtlar</option>
            <option value="WITH_PROOF">Fotoğraflı</option>
            <option value="WITHOUT_PROOF">Fotoğrafsız</option>
          </select>

          <span style={{ fontSize: '13px', color: 'var(--text-muted)', marginLeft: 'auto' }}>
            <strong style={{ color: 'var(--accent-primary)' }}>{filtered.length}</strong> kayıt gösteriliyor
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ textAlign: 'left', padding: 0, overflow: 'hidden' }}>
        {filtered.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <ImageIcon size={48} style={{ opacity: 0.2, marginBottom: '15px', display: 'block', margin: '0 auto 15px' }} />
            <p>Gösterilecek etkinlik kaydı bulunamadı.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--bg-tertiary)', borderBottom: '2px solid var(--border-color)' }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '700', color: 'var(--text-secondary)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Fotoğraf</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '700', color: 'var(--text-secondary)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Etkinlik</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '700', color: 'var(--text-secondary)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Gönderen</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '700', color: 'var(--text-secondary)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Birim</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: '700', color: 'var(--text-secondary)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Tür</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: '700', color: 'var(--text-secondary)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Tarih</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: '700', color: 'var(--text-secondary)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Puan</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: '700', color: 'var(--text-secondary)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>İşlem</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((ev, idx) => (
                  <tr
                    key={ev.id}
                    style={{
                      borderBottom: '1px solid var(--border-color)',
                      backgroundColor: idx % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.015)',
                      transition: 'background-color 0.15s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = idx % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.015)'}
                  >
                    {/* Thumbnail */}
                    <td style={{ padding: '10px 16px' }}>
                      {ev.proofImagePath ? (
                        <img
                          src={getAssetUrl(ev.proofImagePath)}
                          alt="Kanıt"
                          style={{
                            width: '64px', height: '64px', objectFit: 'cover',
                            borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                            border: '2px solid var(--border-color)',
                            transition: 'transform 0.2s, border-color 0.2s'
                          }}
                          onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.borderColor = 'var(--accent-primary)'; }}
                          onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.borderColor = 'var(--border-color)'; }}
                          onClick={() => setPreviewImage({ url: ev.proofImagePath, title: ev.title, unit: ev.unit, sender: ev.presidentName, date: ev.eventDate })}
                        />
                      ) : (
                        <div style={{
                          width: '64px', height: '64px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--bg-tertiary)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: 'var(--text-muted)'
                        }}>Yok</div>
                      )}
                    </td>
                    {/* Event Info */}
                    <td style={{ padding: '12px 16px' }}>
                      <h4 style={{ margin: '0 0 4px 0', fontSize: '14px', color: 'var(--text-primary)' }}>{ev.title}</h4>
                      <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {ev.description || 'Açıklama yok'}
                      </p>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '13px', fontWeight: '500' }}>{ev.presidentName || 'Bilinmiyor'}</td>
                    <td style={{ padding: '12px 16px', fontSize: '13px' }}>{ev.unit}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <span style={{
                        backgroundColor: ev.type === 'ROUTINE' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(91, 128, 54, 0.1)',
                        color: ev.type === 'ROUTINE' ? '#3b82f6' : '#5b8036',
                        padding: '4px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold', display: 'inline-block'
                      }}>
                        {ev.type === 'ROUTINE' ? 'Rutin Görev' : 'Ekstra Görev'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center', fontSize: '13px', color: 'var(--text-secondary)' }}>{ev.eventDate}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'center', fontWeight: '700', color: 'var(--accent-primary)' }}>+{ev.pointsEarned} P</td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', alignItems: 'center' }}>
                        {ev.proofImagePath && (
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '6px 12px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                            onClick={() => setPreviewImage({ url: ev.proofImagePath, title: ev.title, unit: ev.unit, sender: ev.presidentName, date: ev.eventDate })}
                          >
                            İncele
                          </button>
                        )}
                        {onDeleteEvent && (
                          <button
                            className="btn btn-icon"
                            style={{ background: 'transparent', padding: '6px' }}
                            title="Etkinliği Sil"
                            onClick={() => {
                              showConfirm('Bu etkinliği ve kazandırdığı puanı silmek istediğinize emin misiniz?', () => {
                                onDeleteEvent(ev.id);
                              });
                            }}
                          >
                            <Trash2 size={16} className="text-danger" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
