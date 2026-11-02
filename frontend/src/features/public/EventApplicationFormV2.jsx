import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, CalendarDays, Heart, MapPin } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { API_URL } from '../../shared/config/api';
import { formatPhone, grades, needsEmploymentStatus, needsGrade, needsUniversityDetails, universities } from '../../shared/config/educationCatalog';
import EducationStatusPicker from '../../shared/ui/EducationStatusPicker';
import KvkkConsent from '../../shared/ui/KvkkConsent';

const empty = { fullName: '', phoneNumber: '', educationStatus: '', university: '', faculty: '', department: '', grade: '', employmentStatus: '', kvkkAccepted: false };
const input = { width: '100%', boxSizing: 'border-box', padding: '13px 15px', border: '1px solid #cbd5e1', borderRadius: 10, fontSize: '1rem', background: '#fff', color: '#1e293b' };

export default function EventApplicationFormV2() {
  const { id } = useParams(); const [event, setEvent] = useState(null); const [form, setForm] = useState(empty); const [notice, setNotice] = useState(''); const [loading, setLoading] = useState(false);
  const universityFlow = needsUniversityDetails(form.educationStatus); const employment = needsEmploymentStatus(form.educationStatus); const gradeRequired = needsGrade(form.educationStatus);
  const faculties = useMemo(() => Object.keys(universities[form.university] || {}), [form.university]); const departments = useMemo(() => universities[form.university]?.[form.faculty] || [], [form.university, form.faculty]);
  useEffect(() => { fetch(`${API_URL}/application-events/${id}`).then(async response => { const data = await response.json(); if (!response.ok) throw new Error(data.message); return data; }).then(setEvent).catch(error => setNotice(error.message)); }, [id]);
  const update = changes => setForm(value => ({ ...value, ...changes }));
  const submit = async eventSubmit => { eventSubmit.preventDefault(); setLoading(true); setNotice(''); try { const response = await fetch(`${API_URL}/application-events/${id}/applications`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) }); const data = await response.json(); if (!response.ok) throw new Error(data.message); setNotice('Başvurunuz alındı. Teşekkür ederiz!'); setForm(empty); } catch (error) { setNotice(error.message); } finally { setLoading(false); } };
  if (!event) return <main style={{ padding: 50 }}>{notice || 'Yükleniyor...'}</main>;
  const label = { display: 'grid', gap: 7, fontWeight: 600 };
  const succeeded = notice.startsWith('Başvurunuz');

  return <main style={{ minHeight: '100vh', background: '#f8fafc', color: '#1e293b', fontFamily: 'var(--font-sans)', padding: '24px 20px 60px' }}><div style={{ maxWidth: 600, margin: '0 auto' }}>
    <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: '#475569', textDecoration: 'none', fontWeight: 600 }}><ArrowLeft size={20} /> Ana Sayfaya Dön</Link>
    <section style={{ marginTop: 40, padding: 32, borderRadius: 20, background: '#fff', boxShadow: '0 12px 40px rgba(15,23,42,.08)' }}><Heart size={32} color="var(--accent-primary)" /><h1 style={{ margin: '14px 0 8px', fontSize: '2rem' }}>{event.title}</h1><p style={{ color: '#64748b', lineHeight: 1.6 }}>{event.description}</p><p style={{ color: '#64748b', fontSize: 14, display: 'flex', gap: 12, flexWrap: 'wrap' }}><span><CalendarDays size={15} /> {event.eventDate} {event.eventTime}</span><span><MapPin size={15} /> {event.location}</span></p>
      {succeeded ? <div role="status"><p>{notice}</p><Link to="/" className="btn btn-primary">Ana Sayfaya Dön</Link></div> : <form onSubmit={submit} style={{ display: 'grid', gap: 18, marginTop: 24 }}>
        <label style={label}>İsim Soyisim<input required style={input} value={form.fullName} onChange={eventChange => update({ fullName: eventChange.target.value })} /></label><label style={label}>Telefon Numarası<input required type="tel" inputMode="numeric" style={input} value={form.phoneNumber} onChange={eventChange => update({ phoneNumber: formatPhone(eventChange.target.value) })} /></label>
        <EducationStatusPicker value={form.educationStatus} onChange={educationStatus => update({ educationStatus, university: '', faculty: '', department: '', grade: '', employmentStatus: '' })} />
        {universityFlow && <fieldset style={{ display: 'grid', gap: 14, border: '1px solid #dbe3ec', borderRadius: 12, padding: 18 }}><legend>Üniversite bilgileri</legend><label style={label}>Üniversite<select required style={input} value={form.university} onChange={eventChange => update({ university: eventChange.target.value, faculty: '', department: '' })}><option value="">Seçiniz</option>{Object.keys(universities).map(name => <option key={name}>{name}</option>)}</select></label><label style={label}>Fakülte<select required style={input} value={form.faculty} onChange={eventChange => update({ faculty: eventChange.target.value, department: '' })}><option value="">Seçiniz</option>{faculties.map(name => <option key={name}>{name}</option>)}</select></label><label style={label}>Bölüm<select required style={input} value={form.department} onChange={eventChange => update({ department: eventChange.target.value })}><option value="">Seçiniz</option>{departments.map(name => <option key={name}>{name}</option>)}</select></label>{gradeRequired && <label style={label}>Sınıf<select required style={input} value={form.grade} onChange={eventChange => update({ grade: eventChange.target.value })}><option value="">Seçiniz</option>{grades.map(grade => <option key={grade}>{grade}</option>)}</select></label>}</fieldset>}
        {employment && <div><b>Çalışma durumu</b><div style={{ marginTop: 8, display: 'flex', gap: 8 }}><button type="button" className="btn btn-secondary" onClick={() => update({ employmentStatus: 'EMPLOYED' })}>Aktif çalışıyorum</button><button type="button" className="btn btn-secondary" onClick={() => update({ employmentStatus: 'UNEMPLOYED' })}>Çalışmıyorum</button></div></div>}
        <KvkkConsent checked={form.kvkkAccepted} onChange={eventChange => update({ kvkkAccepted: eventChange.target.checked })} />
        {notice && <p role="alert" style={{ color: '#b91c1c', margin: 0 }}>{notice}</p>}<button disabled={loading} type="submit" style={{ border: 0, borderRadius: 10, padding: 15, background: 'var(--accent-primary)', color: '#fff', fontSize: '1rem', fontWeight: 700, cursor: 'pointer' }}>{loading ? 'Gönderiliyor...' : 'Başvuruyu Gönder'}</button>
      </form>}
    </section>
  </div></main>;
}
