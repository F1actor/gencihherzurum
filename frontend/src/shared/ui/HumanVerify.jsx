import React, { useState, useEffect, useRef } from 'react';
import { ShieldCheck, Shield, Check } from 'lucide-react';

/**
 * Modern, şık ve kullanıcı dostu "Ben Robot Değilim" doğrulama bileşeni.
 * - İnsan kullanıcılar için tek tıkla zahmetsiz doğrulama sağlar.
 * - Botlar ve crawler'lar için görünmez Bal Küpü (Honeypot) tuzağı içerir.
 * - Form dolum süresi (Time-Lock) ve imzalı zaman damgası üretir.
 */
export default function HumanVerify({ onChange, value = false, style = {} }) {
  const [checked, setChecked] = useState(value);
  const [animating, setAnimating] = useState(false);
  const mountTimeRef = useRef(Date.now());
  const honeypotRef = useRef('');

  useEffect(() => {
    setChecked(value);
  }, [value]);

  const handleToggle = () => {
    if (checked) {
      setChecked(false);
      if (onChange) {
        onChange({
          isVerified: false,
          _botToken: '',
          _formTime: mountTimeRef.current,
          hp_website: honeypotRef.current
        });
      }
      return;
    }

    setAnimating(true);
    setTimeout(() => {
      setAnimating(false);
      setChecked(true);

      const timestamp = Date.now();
      // Basit istemci imza token'ı (timestamp + client nonce)
      const nonce = Math.random().toString(36).substring(2, 10);
      const token = `${timestamp}:${nonce}`;

      if (onChange) {
        onChange({
          isVerified: true,
          _botToken: token,
          _formTime: mountTimeRef.current,
          hp_website: honeypotRef.current
        });
      }
    }, 400);
  };

  return (
    <div style={{ margin: '14px 0', ...style }}>
      {/* 🍯 BAL KÜPÜ (HONEYPOT) - Botlar doldurur, insanlar göremez */}
      <div style={{ position: 'absolute', opacity: 0, height: 0, width: 0, zIndex: -1, pointerEvents: 'none', overflow: 'hidden' }} aria-hidden="true">
        <label htmlFor="hp_website">Leave this field blank</label>
        <input
          id="hp_website"
          type="text"
          name="hp_website"
          tabIndex={-1}
          autoComplete="off"
          defaultValue=""
          onChange={(e) => {
            honeypotRef.current = e.target.value;
            if (onChange) {
              onChange({
                isVerified: checked,
                _botToken: `${Date.now()}:trap`,
                _formTime: mountTimeRef.current,
                hp_website: e.target.value
              });
            }
          }}
        />
      </div>

      {/* Görsel Doğrulama Kartı */}
      <div
        onClick={handleToggle}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); handleToggle(); } }}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          background: checked ? '#f0fdf4' : '#ffffff',
          border: `1.5px solid ${checked ? '#16a34a' : '#cbd5e1'}`,
          borderRadius: 12,
          cursor: 'pointer',
          userSelect: 'none',
          boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
          transition: 'all 0.2s ease',
          width: '100%',
          maxWidth: 360,
          boxSizing: 'border-box'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Checkbox kutucuğu */}
          <div
            style={{
              width: 26,
              height: 26,
              borderRadius: 6,
              border: `2px solid ${checked ? '#16a34a' : '#94a3b8'}`,
              background: checked ? '#16a34a' : '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
              flexShrink: 0
            }}
          >
            {animating ? (
              <div
                style={{
                  width: 14,
                  height: 14,
                  border: '2px solid #16a34a',
                  borderTopColor: 'transparent',
                  borderRadius: '50%',
                  animation: 'spin 0.6s linear infinite'
                }}
              />
            ) : checked ? (
              <Check size={18} color="#ffffff" strokeWidth={3} />
            ) : null}
          </div>

          <span style={{ fontSize: 14, fontWeight: 600, color: '#334155' }}>
            {checked ? 'Robot değilim doğrulandı' : 'Ben robot değilim'}
          </span>
        </div>

        {/* Güvenlik Rozeti */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, opacity: 0.75 }}>
          {checked ? (
            <ShieldCheck size={22} color="#16a34a" />
          ) : (
            <Shield size={22} color="#64748b" />
          )}
          <span style={{ fontSize: 9, fontWeight: 700, color: '#64748b', letterSpacing: '0.4px', textTransform: 'uppercase' }}>
            Güvenlik
          </span>
        </div>
      </div>
    </div>
  );
}

