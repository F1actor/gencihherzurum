import React, { useEffect, useState } from 'react';
import { API_URL } from '../../shared/config/api';

export default function VolunteerApplications() {
  const [applications, setApplications] = useState([]);
  const [status, setStatus] = useState('loading');
  useEffect(() => {
    const controller = new AbortController();
    fetch(`${API_URL}/volunteers`, { headers: { Authorization: `Bearer ${localStorage.getItem('gencihh_token')}` }, signal: controller.signal })
      .then(response => { if (!response.ok) throw new Error(); return response.json(); })
      .then(data => { setApplications(data); setStatus('ready'); })
      .catch(error => { if (error.name !== 'AbortError') setStatus('error'); });
    return () => controller.abort();
  }, []);
  if (status === 'loading') return <p>Başvurular yükleniyor...</p>;
  if (status === 'error') return <p role="alert">Başvurular yüklenemedi. Lütfen tekrar deneyin.</p>;
  if (!applications.length) return <p>Henüz gönüllü başvurusu yok.</p>;
  return <div style={{ overflowX: 'auto' }}><table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
    <thead><tr>{['İsim Soyisim', 'Telefon', 'Üniversite', 'Fakülte', 'Sınıf', 'Başvuru Tarihi'].map(label => <th key={label} style={{ padding: 12, borderBottom: '1px solid var(--border-color)' }}>{label}</th>)}</tr></thead>
    <tbody>{applications.map(item => <tr key={item.id}>{[item.fullName, item.phoneNumber, item.university, item.faculty, item.grade, new Date(item.createdAt).toLocaleDateString('tr-TR')].map((value, index) => <td key={index} style={{ padding: 12, borderBottom: '1px solid var(--border-color)' }}>{value}</td>)}</tr>)}</tbody>
  </table></div>;
}
