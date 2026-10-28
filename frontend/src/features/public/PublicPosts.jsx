import React, { useEffect, useState } from 'react';
import { API_URL, getAssetUrl } from '../../shared/config/api';

const contentCategories = ['Faaliyetler', 'Eğitim', 'Gönüllülük', 'Sosyal Sorumluluk', 'Başarılar', 'Duyurular'];

export function PublicPosts() {
  const [posts, setPosts] = useState([]);
  useEffect(() => {
    const controller = new AbortController();
    fetch(`${API_URL}/public-posts`, { signal: controller.signal }).then(res => res.ok ? res.json() : []).then(setPosts).catch(() => {});
    return () => controller.abort();
  }, []);
  if (!posts.length) return null;
  return <section style={{ padding: '70px 8%', background: '#f8fafc' }}>
    <div style={{ maxWidth: 1200, margin: 'auto' }}>
      <h2 style={{ fontSize: '2.3rem', color: '#1e293b', marginBottom: 10 }}>Çalışmalarımız</h2>
      <p style={{ color: '#64748b', marginBottom: 30 }}>Genç İHH Erzurum'dan kareler</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 250px), 1fr))', gap: 20 }}>
        {posts.map(post => <article key={post.id} style={{ background: 'white', borderRadius: 16, overflow: 'hidden', boxShadow: '0 5px 22px rgba(15,23,42,.08)' }}>
          <img src={getAssetUrl(post.imagePath)} alt={post.caption} loading="lazy" style={{ width: '100%', aspectRatio: '1 / 1', objectFit: 'cover', display: 'block' }} />
          <div style={{ padding: 18 }}><small style={{ color: 'var(--accent-primary)', fontWeight: 700 }}>{post.category || 'Faaliyetler'}</small><p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.5, margin: '8px 0 12px' }}>{post.caption}</p>{post.instagramUrl && <a href={post.instagramUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-primary)', fontWeight: 700 }}>Instagram'da gör</a>}</div>
        </article>)}
      </div>
    </div>
  </section>;
}

export function InstagramFeed() {
  return <section style={{ padding: '70px 8%', background: '#fff' }}><div style={{ maxWidth: 1200, margin: 'auto' }}>
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'end', justifyContent: 'space-between', gap: 18, marginBottom: 28 }}>
      <div><h2 style={{ fontSize: '2.3rem', color: '#1e293b', margin: '0 0 8px' }}>Instagram'da Genç İHH Erzurum</h2><p style={{ color: '#64748b', margin: 0 }}>Etkinliklerimizi ve son paylaşımlarımızı takip edin.</p></div>
      <a href="https://www.instagram.com/erzurumgencihh/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-primary)', fontWeight: 700, textDecoration: 'none' }}>@erzurumgencihh ↗</a>
    </div>
  </div></section>;
}

export function PublicPostsManager() {
  const [posts, setPosts] = useState([]);
  const [caption, setCaption] = useState('');
  const [category, setCategory] = useState('Faaliyetler');
  const [instagramUrl, setInstagramUrl] = useState('');
  const [image, setImage] = useState(null);
  const [fileKey, setFileKey] = useState(0);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(null);
  const auth = () => ({ Authorization: `Bearer ${localStorage.getItem('gencihh_token')}` });
  const load = async () => { const res = await fetch(`${API_URL}/public-posts`); if (!res.ok) throw new Error('Gönderiler yüklenemedi.'); setPosts(await res.json()); };
  useEffect(() => { load().catch(error => setMessage(error.message)); }, []);
  async function submit(event) {
    event.preventDefault(); setBusy(true); setMessage('');
    try {
      const body = new FormData(); body.append('image', image); body.append('caption', caption); body.append('category', category); body.append('instagramUrl', instagramUrl);
      const res = await fetch(`${API_URL}/public-posts`, { method: 'POST', headers: auth(), body });
      const data = await res.json(); if (!res.ok) throw new Error(data.message || 'Fotoğraf yüklenemedi.');
      setCaption(''); setCategory('Faaliyetler'); setInstagramUrl(''); setImage(null); setFileKey(key => key + 1); setMessage('Fotoğraf yayınlandı.'); await load();
    } catch (error) { setMessage(error.message || 'Sunucuya ulaşılamadı.'); } finally { setBusy(false); }
  }
  async function remove(id) {
    if (!window.confirm('Bu gönderiyi ana sayfadan kaldırmak istiyor musunuz?')) return;
    setBusy(true); setMessage('');
    try { const res = await fetch(`${API_URL}/public-posts/${id}`, { method: 'DELETE', headers: auth() }); if (!res.ok) throw new Error('Gönderi kaldırılamadı.'); await load(); setMessage('Gönderi kaldırıldı.'); }
    catch (error) { setMessage(error.message); } finally { setBusy(false); }
  }
  async function saveEdit(event) {
    event.preventDefault(); setBusy(true); setMessage('');
    try {
      const res = await fetch(`${API_URL}/public-posts/${editing.id}`, { method: 'PUT', headers: { ...auth(), 'Content-Type': 'application/json' }, body: JSON.stringify({ caption: editing.caption, category: editing.category || 'Faaliyetler', instagramUrl: editing.instagramUrl || '', displayOrder: Number(editing.displayOrder) }) });
      const data = await res.json(); if (!res.ok) throw new Error(data.message || 'Gönderi güncellenemedi.');
      setEditing(null); await load(); setMessage('Gönderi güncellendi.');
    } catch (error) { setMessage(error.message || 'Sunucuya ulaşılamadı.'); } finally { setBusy(false); }
  }
  return <div style={{ maxWidth: 900 }}>
    <p>Buradan eklenen fotoğraflar ana sayfadaki Çalışmalarımız bölümünde yayınlanır.</p>
    <form onSubmit={submit} className="content-manager-form" style={{ marginBottom: 30 }}>
      <label>Fotoğraf (JPEG, PNG veya WebP; en fazla 5 MB)<input key={fileKey} className="form-control" type="file" accept="image/jpeg,image/png,image/webp" required onChange={e => setImage(e.target.files[0])} /></label>
      <label>Kategori<select className="form-control" value={category} onChange={e => setCategory(e.target.value)}>{contentCategories.map(item => <option key={item} value={item}>{item}</option>)}</select></label>
      <label>Açıklama<textarea className="form-control" required maxLength={1000} value={caption} onChange={e => setCaption(e.target.value)} /></label>
      <label>Instagram gönderi bağlantısı (isteğe bağlı)<input className="form-control" type="url" maxLength={500} placeholder="https://www.instagram.com/p/..." value={instagramUrl} onChange={e => setInstagramUrl(e.target.value)} /></label>
      <button className="btn btn-primary" disabled={busy} type="submit">{busy ? 'İşleniyor...' : 'Fotoğrafı Yayınla'}</button>
    </form>
    {message && <p role="status">{message}</p>}
    <p>Küçük sıra numarasına sahip fotoğraflar önce görünür; eşit sıralarda en yeni fotoğraf öne çıkar.</p>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
      {posts.map(post => <article key={post.id} style={{ border: '1px solid var(--border-color)', borderRadius: 12, overflow: 'hidden' }}><img src={getAssetUrl(post.imagePath)} alt={post.caption} style={{ width: '100%', aspectRatio: '1 / 1', objectFit: 'cover' }} /><div style={{ padding: 12 }}>
        {editing?.id === post.id ? <form onSubmit={saveEdit} className="content-manager-form content-manager-form-compact">
          <label>Açıklama<textarea className="form-control" required maxLength={1000} value={editing.caption} onChange={e => setEditing({ ...editing, caption: e.target.value })} /></label>
          <label>Kategori<select className="form-control" value={editing.category || 'Faaliyetler'} onChange={e => setEditing({ ...editing, category: e.target.value })}>{contentCategories.map(item => <option key={item} value={item}>{item}</option>)}</select></label>
          <label>Instagram bağlantısı<input className="form-control" type="url" maxLength={500} value={editing.instagramUrl || ''} onChange={e => setEditing({ ...editing, instagramUrl: e.target.value })} /></label>
          <label>Sıra<input className="form-control" type="number" min="0" max="100000" required value={editing.displayOrder} onChange={e => setEditing({ ...editing, displayOrder: e.target.value })} /></label>
          <button type="submit" className="btn btn-primary" disabled={busy}>Kaydet</button><button type="button" className="btn btn-secondary" disabled={busy} onClick={() => setEditing(null)}>İptal</button>
        </form> : <><p style={{ whiteSpace: 'pre-wrap' }}>{post.caption}</p><p>Sıra: {post.displayOrder}</p><div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}><button type="button" className="btn btn-secondary" disabled={busy} onClick={() => setEditing({ ...post })}>Düzenle</button><button type="button" className="btn btn-secondary" disabled={busy} onClick={() => remove(post.id)}>Kaldır</button></div></>}
      </div></article>)}
    </div>
  </div>;
}

export function NewsManager() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ title: '', summary: '', body: '', category: 'Faaliyetler' });
  const [coverImage, setCoverImage] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const auth = () => ({ Authorization: `Bearer ${localStorage.getItem('gencihh_token')}` });
  const load = async () => { const response = await fetch(`${API_URL}/news`); if (!response.ok) throw new Error('Haberler yüklenemedi.'); setItems(await response.json()); };
  useEffect(() => { load().catch(error => setMessage(error.message)); }, []);
  async function submit(event) {
    event.preventDefault(); setBusy(true); setMessage('');
    try {
      const body = new FormData();
      body.append('title', form.title); body.append('summary', form.summary); body.append('body', form.body); body.append('category', form.category); body.append('coverImage', coverImage);
      const response = editingId
        ? await fetch(`${API_URL}/news/${editingId}`, { method: 'PUT', headers: { ...auth(), 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
        : await fetch(`${API_URL}/news`, { method: 'POST', headers: auth(), body });
      const data = await response.json(); if (!response.ok) throw new Error(data.message || 'Haber yayınlanamadı.');
      setForm({ title: '', summary: '', body: '', category: 'Faaliyetler' }); setCoverImage(null); setEditingId(null); event.target.reset(); await load(); setMessage(editingId ? 'Haber güncellendi.' : 'Haber yayınlandı.');
    } catch (error) { setMessage(error.message || 'Sunucuya ulaşılamadı.'); } finally { setBusy(false); }
  }
  async function remove(id) {
    if (!window.confirm('Bu haberi kaldırmak istiyor musunuz?')) return;
    setBusy(true); setMessage('');
    try { const response = await fetch(`${API_URL}/news/${id}`, { method: 'DELETE', headers: auth() }); const data = await response.json(); if (!response.ok) throw new Error(data.message || 'Haber kaldırılamadı.'); await load(); setMessage('Haber kaldırıldı.'); }
    catch (error) { setMessage(error.message || 'Sunucuya ulaşılamadı.'); } finally { setBusy(false); }
  }
  async function edit(id) {
    setBusy(true); setMessage('');
    try {
      const response = await fetch(`${API_URL}/news/${id}`); const item = await response.json();
      if (!response.ok) throw new Error(item.message || 'Haber yüklenemedi.');
      setForm({ title: item.title, summary: item.summary, body: item.body, category: item.category }); setCoverImage(null); setEditingId(id);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) { setMessage(error.message || 'Sunucuya ulaşılamadı.'); } finally { setBusy(false); }
  }
  return <div style={{ maxWidth: 1000 }}>
    <p>Bu alandan ana sayfa ve Haberler sayfasında yayımlanacak kurumsal haberleri oluşturabilirsiniz.</p>
    <form onSubmit={submit} className="content-manager-form" style={{ margin: '24px 0 32px' }}>
      <label>Haber başlığı<input className="form-control" required maxLength={200} value={form.title} onChange={event => setForm({ ...form, title: event.target.value })} /></label>
      <label>Kısa özet<input className="form-control" required maxLength={700} value={form.summary} onChange={event => setForm({ ...form, summary: event.target.value })} /></label>
      <label>Kategori<select className="form-control" value={form.category} onChange={event => setForm({ ...form, category: event.target.value })}>{contentCategories.map(item => <option key={item} value={item}>{item}</option>)}</select></label>
      <label>Kapak görseli (JPEG, PNG veya WebP; en fazla 5 MB)<input className="form-control" type="file" required={!editingId} disabled={Boolean(editingId)} accept="image/jpeg,image/png,image/webp" onChange={event => setCoverImage(event.target.files[0])} /></label>
      <label>Haber içeriği<textarea className="form-control" required rows={10} maxLength={20000} value={form.body} onChange={event => setForm({ ...form, body: event.target.value })} /></label>
      <button className="btn btn-primary" type="submit" disabled={busy}>{busy ? 'Kaydediliyor...' : editingId ? 'Değişiklikleri Kaydet' : 'Haberi Yayınla'}</button>
      {editingId && <button className="btn btn-secondary" type="button" disabled={busy} onClick={() => { setEditingId(null); setForm({ title: '', summary: '', body: '', category: 'Faaliyetler' }); }}>İptal</button>}
    </form>
    {message && <p role="status">{message}</p>}
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 16 }}>
      {items.map(item => <article key={item.id} style={{ border: '1px solid var(--border-color)', borderRadius: 12, overflow: 'hidden' }}><img src={getAssetUrl(item.coverImagePath)} alt="" style={{ width: '100%', aspectRatio: '16 / 9', objectFit: 'cover' }} /><div style={{ padding: 14 }}><strong>{item.title}</strong><p style={{ margin: '8px 0' }}>{item.category}</p><div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}><button className="btn btn-secondary" type="button" disabled={busy} onClick={() => edit(item.id)}>Düzenle</button><button className="btn btn-secondary" type="button" disabled={busy} onClick={() => remove(item.id)}>Kaldır</button></div></div></article>)}
    </div>
  </div>;
}

export function SiteContentManager() {
  const [tab, setTab] = useState('news');
  return <div><div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 24 }}><button className={`btn ${tab === 'news' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab('news')}>Haber Yönetimi</button><button className={`btn ${tab === 'photos' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab('photos')}>Site Fotoğrafları</button></div>{tab === 'news' ? <NewsManager /> : <PublicPostsManager />}</div>;
}
