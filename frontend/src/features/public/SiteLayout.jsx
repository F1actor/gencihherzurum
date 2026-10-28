import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, MapPin, Phone } from 'lucide-react';
import logoImg from '../../assets/logo.jpg';

export function PageLink({ to, children, className = '', onClick }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  function handleClick(event) {
    event.preventDefault();
    onClick?.();
    if (window.location.pathname === to) return;
    setLoading(true);
    window.setTimeout(() => {
      navigate(to);
      setLoading(false);
    }, 380);
  }
  return <>
    <Link to={to} onClick={handleClick} className={className}>{children}</Link>
    {loading && <div className="page-loader" role="status" aria-label="Sayfa yükleniyor"><img src={logoImg} alt="" /></div>}
  </>;
}

export default function SiteLayout({ children }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);

  return <div className="site-shell">
    <header className="site-header">
      <div className="site-header-inner">
        <PageLink to="/" className="site-brand" onClick={closeMenu}>
          <img src={logoImg} alt="Genç İHH Erzurum" />
          <span><strong>GENÇ İHH</strong><small>ERZURUM</small></span>
        </PageLink>
        <button type="button" className="site-menu-toggle" aria-label="Menüyü aç" aria-expanded={menuOpen} onClick={() => setMenuOpen(value => !value)}>
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
        <nav className={`site-nav ${menuOpen ? 'is-open' : ''}`} aria-label="Ana menü">
          <PageLink to="/hakkimizda" onClick={closeMenu}>Kurumsal</PageLink>
          <PageLink to="/calismalarimiz" onClick={closeMenu}>Çalışmalarımız</PageLink>
          <PageLink to="/basarilarimiz" onClick={closeMenu}>Başarılarımız</PageLink>
          <PageLink to="/haberler" onClick={closeMenu}>Haberler</PageLink>
          <PageLink to="/basvuru" onClick={closeMenu}>Muhabbet Okulu</PageLink>
          <PageLink to="/gonullu" className="site-nav-action" onClick={closeMenu}>Gönüllü Ol</PageLink>
          <PageLink to="/yonetim" className="site-nav-login" onClick={closeMenu}>Giriş Yap</PageLink>
        </nav>
      </div>
    </header>
    {children}
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div><div className="site-footer-brand"><img src={logoImg} alt="" /><strong>Genç İHH Erzurum</strong></div><p>İyiliği büyüten, sorumluluk alan ve üreten gençlerin yanında.</p></div>
        <div><h2>İletişim</h2><p><MapPin size={18} /> Yakutiye / Erzurum</p><p><Phone size={18} /> <a href="tel:+905436142525">0 (543) 614 25 25</a></p></div>
        <div><h2>Hızlı bağlantılar</h2><PageLink to="/haberler">Haberler</PageLink><PageLink to="/basvuru">Yaz Okulu Başvuru</PageLink><PageLink to="/yonetim">Yetkili Girişi</PageLink></div>
      </div>
      <p className="site-copyright">© {new Date().getFullYear()} Genç İHH Erzurum. Tüm hakları saklıdır.</p>
    </footer>
  </div>;
}
