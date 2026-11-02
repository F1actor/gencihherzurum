import React from 'react';
import { ShieldCheck } from 'lucide-react';

export default function KvkkConsent({ checked, onChange, style }) {
  return <label style={{ display: 'flex', gap: 10, padding: 14, borderRadius: 11, background: '#f8fafc', lineHeight: 1.55, fontSize: 13, color: '#475569', ...style }}>
    <input required type="checkbox" checked={checked} onChange={onChange} style={{ marginTop: 3, flexShrink: 0 }} />
    <span><ShieldCheck size={16} aria-hidden="true" style={{ verticalAlign: 'middle', marginRight: 5, color: '#166534' }} /><a href="/kvkk" target="_blank" rel="noopener noreferrer" style={{ color: '#166534', fontWeight: 800, textDecoration: 'underline' }}>KVKK Genel Aydınlatma Metni'ni</a>{' '}okudum ve anladım.</span>
  </label>;
}
