import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Heart } from 'lucide-react';
import { API_URL } from '../../shared/config/api';

const fields = [
  { name: 'fullName', label: 'İsim Soyisim', maxLength: 255, autoComplete: 'name' },
  { name: 'phoneNumber', label: 'Telefon Numarası', type: 'tel', maxLength: 50, autoComplete: 'tel' },
  { name: 'university', label: 'Üniversite', maxLength: 255 },
  { name: 'faculty', label: 'Fakülte', maxLength: 255 },
  { name: 'grade', label: 'Sınıf', maxLength: 100 },
];

export default function VolunteerApply() {
  const [form, setForm] = useState({ fullName: '', phoneNumber: '', university: '', faculty: '', grade: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_URL}/volunteers`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Başvuru gönderilemedi.');
      setSuccess(true);
    } catch (err) {
      setError(err.message === 'Failed to fetch' ? 'Sunucuya ulaşılamadı. Lütfen daha sonra tekrar deneyin.' : err.message);
    } finally { setLoading(false); }
  }

  const inputStyle = { width: '100%', boxSizing: 'border-box', padding: '13px 15px', border: '1px solid #cbd5e1', borderRadius: '10px', fontSize: '1rem', background: 'white', color: '#1e293b' };
  return (
    <main style={{ minHeight: '100vh', background: '#f8fafc', color: '#1e293b', fontFamily: 'var(--font-sans)', padding: '24px 20px 60px' }}>
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: '#475569', textDecoration: 'none', fontWeight: 600 }}><ArrowLeft size={20} /> Ana Sayfaya Dön</Link>
        <section style={{ marginTop: 40, padding: '32px', borderRadius: 20, background: 'white', boxShadow: '0 12px 40px rgba(15,23,42,0.08)' }}>
          <Heart size={32} color="var(--accent-primary)" />
          <h1 style={{ margin: '14px 0 8px', fontSize: '2rem' }}>Gönüllü Ol</h1>
          {success ? <p role="status">Başvurunuz alındı. Teşekkür ederiz!</p> : <>
            <p style={{ color: '#64748b', lineHeight: 1.6 }}>Genç İHH Erzurum gönüllüsü olmak için bilgilerinizi doldurun.</p>
            <form onSubmit={submit} style={{ display: 'grid', gap: 18, marginTop: 24 }}>
              {fields.map(field => <label key={field.name} style={{ display: 'grid', gap: 7, fontWeight: 600 }}>{field.label}
                <input {...field} type={field.type || 'text'} required value={form[field.name]} onChange={event => setForm({ ...form, [field.name]: event.target.value })} style={inputStyle} />
              </label>)}
              {error && <p role="alert" style={{ color: '#b91c1c', margin: 0 }}>{error}</p>}
              <button disabled={loading} type="submit" style={{ border: 0, borderRadius: 10, padding: 15, background: 'var(--accent-primary)', color: 'white', fontSize: '1rem', fontWeight: 700, cursor: 'pointer' }}>{loading ? 'Gönderiliyor...' : 'Başvuruyu Gönder'}</button>
            </form>
          </>}
        </section>
      </div>
    </main>
  );
}
