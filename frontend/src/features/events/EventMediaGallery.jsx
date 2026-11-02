import React, { useMemo, useState } from 'react';
import { BellRing, CalendarDays, ChevronDown, ChevronRight, Folder, Image as ImageIcon, Search, Trash2, Users } from 'lucide-react';
import { useNotification } from '../../shared/context/NotificationContext';
import { getAssetUrl } from '../../shared/config/api';

const isNewMedia = (createdAt) => {
  if (!createdAt) return false;
  const raw = String(createdAt);
  const created = new Date(raw.includes('T') ? raw : `${raw.replace(' ', 'T')}Z`);
  return Number.isFinite(created.getTime()) && Date.now() - created.getTime() < 24 * 60 * 60 * 1000;
};

const formatDateTime = (value) => {
  if (!value) return 'Bilinmiyor';
  const raw = String(value);
  const date = new Date(raw.includes('T') ? raw : `${raw.replace(' ', 'T')}Z`);
  return Number.isFinite(date.getTime())
    ? date.toLocaleString('tr-TR', { dateStyle: 'medium', timeStyle: 'short' })
    : value;
};

export default function EventMediaGallery({ eventsGallery = [], setPreviewImage, onDeleteEvent }) {
  const [gallerySearch, setGallerySearch] = useState('');
  const [galleryTypeFilter, setGalleryTypeFilter] = useState('ALL');
  const [openFolders, setOpenFolders] = useState({});
  const { showConfirm } = useNotification();

  const filtered = useMemo(() => eventsGallery.filter((event) => {
    if (!event.proofImagePath) return false;
    const search = gallerySearch.trim().toLocaleLowerCase('tr-TR');
    const matchesSearch = !search || [event.title, event.description, event.unit, event.presidentName]
      .filter(Boolean)
      .some((value) => String(value).toLocaleLowerCase('tr-TR').includes(search));
    return matchesSearch && (galleryTypeFilter === 'ALL' || event.type === galleryTypeFilter);
  }), [eventsGallery, gallerySearch, galleryTypeFilter]);

  const folders = useMemo(() => {
    const grouped = filtered.reduce((result, event) => {
      const unit = event.unit || 'Birimi belirtilmemiş';
      result[unit] ||= [];
      result[unit].push(event);
      return result;
    }, {});
    return Object.entries(grouped).sort(([first], [second]) => first.localeCompare(second, 'tr'));
  }, [filtered]);

  const newMediaCount = filtered.filter((event) => isNewMedia(event.createdAt)).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {newMediaCount > 0 && (
        <div className="media-new-alert" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', borderRadius: 'var(--radius-md)', background: 'rgba(245, 158, 11, 0.12)', border: '1px solid rgba(245, 158, 11, 0.42)', color: '#9a5a00', fontWeight: 700 }}>
          <BellRing size={19} /> Son 24 saatte <strong>{newMediaCount}</strong> yeni fotoğraf eklendi.
        </div>
      )}

      <div className="card" style={{ padding: '16px 20px', textAlign: 'left' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: '1 1 240px' }}>
            <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
            <input type="text" placeholder="Birim, etkinlik, açıklama veya gönderen ara..." value={gallerySearch} onChange={(event) => setGallerySearch(event.target.value)} className="form-control" style={{ paddingLeft: '32px', fontSize: '13px', height: '42px' }} />
          </div>
          <select value={galleryTypeFilter} onChange={(event) => setGalleryTypeFilter(event.target.value)} className="form-control" style={{ fontSize: '13px', height: '42px', width: 'auto' }}>
            <option value="ALL">Tüm türler</option><option value="ROUTINE">Rutin görev</option><option value="EXTRA">Ekstra etkinlik</option><option value="TARGET">Aylık hedef</option>
          </select>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)', marginLeft: 'auto' }}><strong style={{ color: 'var(--accent-primary)' }}>{filtered.length}</strong> fotoğraf · <strong>{folders.length}</strong> birim klasörü</span>
        </div>
      </div>

      {folders.length === 0 ? (
        <div className="card" style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--text-muted)' }}><ImageIcon size={48} style={{ opacity: 0.25, marginBottom: '12px' }} /><p style={{ margin: 0 }}>Aramanıza uygun fotoğraflı etkinlik bulunamadı.</p></div>
      ) : folders.map(([unit, events]) => {
        const isOpen = openFolders[unit] !== false;
        const unitNewCount = events.filter((event) => isNewMedia(event.createdAt)).length;
        return <section key={unit} className="card" style={{ padding: 0, overflow: 'hidden', textAlign: 'left' }}>
          <button type="button" onClick={() => setOpenFolders((current) => ({ ...current, [unit]: !isOpen }))} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '16px 20px', border: 0, background: 'var(--bg-tertiary)', color: 'var(--text-primary)', cursor: 'pointer', textAlign: 'left' }}>
            {isOpen ? <ChevronDown size={19} /> : <ChevronRight size={19} />}<Folder size={20} style={{ color: 'var(--accent-primary)' }} /><strong style={{ fontSize: '15px' }}>{unit}</strong><span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>({events.length} fotoğraf)</span>
            {unitNewCount > 0 && <span className="media-new-badge" style={{ marginLeft: 'auto', background: '#dc2626', color: '#fff', borderRadius: '999px', padding: '3px 8px', fontSize: '11px', fontWeight: 800 }}>{unitNewCount} yeni</span>}
          </button>
          {isOpen && <div style={{ padding: '16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(285px, 1fr))', gap: '14px' }}>
            {events.map((event) => <article key={event.id} style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', overflow: 'hidden', background: 'var(--bg-secondary)', position: 'relative' }}>
              {isNewMedia(event.createdAt) && <span className="media-new-badge" style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 1, background: '#dc2626', color: '#fff', borderRadius: '999px', padding: '4px 9px', fontSize: '11px', fontWeight: 800 }}>YENİ</span>}
              <button type="button" onClick={() => setPreviewImage({ ...event })} style={{ display: 'block', width: '100%', padding: 0, border: 0, background: '#111', cursor: 'pointer' }} title="Fotoğrafı incele"><img src={getAssetUrl(event.proofImagePath)} alt={`${event.unit} - ${event.title}`} style={{ display: 'block', width: '100%', height: '185px', objectFit: 'cover' }} /></button>
              <div style={{ padding: '14px' }}>
                <h4 style={{ margin: '0 0 6px', fontSize: '15px' }}>{event.title}</h4><p style={{ minHeight: '38px', margin: '0 0 12px', color: 'var(--text-secondary)', fontSize: '13px', lineHeight: 1.45 }}>{event.description || 'Açıklama girilmedi.'}</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', paddingTop: '10px', borderTop: '1px solid var(--border-color)', fontSize: '12px', color: 'var(--text-secondary)' }}>
                  <span style={{ display: 'flex', gap: '5px', alignItems: 'center' }}><Users size={14} /> {event.participantCount || 0} katılımcı</span><span style={{ display: 'flex', gap: '5px', alignItems: 'center' }}><CalendarDays size={14} /> {event.eventDate}</span>
                  <span style={{ gridColumn: '1 / -1' }}>Gönderen: <strong style={{ color: 'var(--text-primary)' }}>{event.presidentName || 'Bilinmiyor'}</strong></span><span style={{ gridColumn: '1 / -1' }}>Yükleme: {formatDateTime(event.createdAt)}</span>
                </div>
                {onDeleteEvent && <button type="button" className="btn btn-secondary" style={{ width: '100%', marginTop: '12px', color: 'var(--status-danger)', justifyContent: 'center' }} onClick={() => showConfirm('Bu etkinlik kaydını silmek istediğinize emin misiniz?', () => onDeleteEvent(event.id))}><Trash2 size={15} /> Kaydı sil</button>}
              </div>
            </article>)}
          </div>}
        </section>;
      })}
      <style>{`@keyframes mediaPulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: .65; transform: scale(1.03); } } .media-new-alert, .media-new-badge { animation: mediaPulse 1.4s ease-in-out infinite; }`}</style>
    </div>
  );
}
