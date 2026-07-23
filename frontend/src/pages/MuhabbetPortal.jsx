import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Calendar, Coffee, PlayCircle } from 'lucide-react';

export default function MuhabbetPortal() {
  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/muhabbet/menus`)
      .then(res => res.json())
      .then(data => {
        setMenus(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      <header style={{ padding: '20px 5%', backgroundColor: 'var(--card-bg)', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
        <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', color: 'var(--text-secondary)', textDecoration: 'none' }}>
          <ArrowLeft size={20} /> Ana Sayfaya Dön
        </Link>
      </header>

      <div style={{ flex: 1, padding: '40px 5%', maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h2 style={{ fontSize: '2.5rem', fontWeight: '800', color: 'var(--accent-primary)' }}>Günlük Menü ve Etkinlikler</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
            Muhabbet Okulu öğrencilerimizin gün gün yemek menüsü ve etkinlik programı.
          </p>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>Yükleniyor...</div>
        ) : menus.length === 0 ? (
          <div className="card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            Henüz eklenmiş bir menü bulunmamaktadır.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
            {menus.map(menu => (
              <div key={menu.id} className="card" style={{ padding: '25px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingBottom: '15px', borderBottom: '1px solid var(--border-color)' }}>
                  <div style={{ padding: '10px', backgroundColor: 'var(--bg-primary)', borderRadius: '10px', color: 'var(--text-secondary)' }}>
                    <Calendar size={20} />
                  </div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '700' }}>
                    {new Date(menu.menuDate).toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </h3>
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', color: '#f59e0b' }}>
                    <Coffee size={18} />
                    <h4 style={{ margin: 0, fontWeight: '600' }}>Öğle Yemeği</h4>
                  </div>
                  <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                    {menu.foodItems}
                  </p>
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', color: '#3b82f6' }}>
                    <PlayCircle size={18} />
                    <h4 style={{ margin: 0, fontWeight: '600' }}>Etkinlikler</h4>
                  </div>
                  <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                    {menu.activities}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
