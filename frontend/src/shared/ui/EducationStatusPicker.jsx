import React from 'react';
import { GraduationCap } from 'lucide-react';
import { educationStatuses } from '../config/educationCatalog';

export default function EducationStatusPicker({ value, onChange }) {
  return <div>
    <p style={{ margin: '0 0 9px', fontSize: 14, fontWeight: 800, color: '#334155' }}>Okuma durumu</p>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(185px, 1fr))', gap: 9 }}>
      {educationStatuses.map(([status, label]) => {
        const selected = value === status;
        return <button key={status} type="button" onClick={() => onChange(status)} style={{ minHeight: 52, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 9, textAlign: 'left', border: selected ? '2px solid #166534' : '1px solid #dbe3ec', borderRadius: 11, background: selected ? '#ecfdf3' : '#fff', color: selected ? '#14532d' : '#334155', boxShadow: selected ? '0 5px 15px rgba(22,101,52,.13)' : 'none', cursor: 'pointer', fontSize: 13, fontWeight: selected ? 800 : 650, transition: 'all .18s ease' }}>
          <span style={{ width: 28, height: 28, display: 'grid', placeItems: 'center', flexShrink: 0, borderRadius: 8, background: selected ? '#bbf7d0' : '#f1f5f9' }}><GraduationCap size={16} /></span>{label}
        </button>;
      })}
    </div>
    {!value && <p style={{ margin: '8px 0 0', color: '#64748b', fontSize: 12 }}>Devam etmek için sana uygun durumu seç.</p>}
  </div>;
}
