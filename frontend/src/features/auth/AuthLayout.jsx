import React, { useState, useEffect } from 'react';
import { Moon, Sun } from 'lucide-react';
import { useAuth } from '../../shared/context/AuthContext';
import logoImg from '../../assets/logo.jpg';

const backgroundImages = [
  '/images/dogu.jpeg',
  '/images/dortsehit.jpeg',
  '/images/gazze.jpeg',
  '/images/gencihh.jpeg',
  '/images/sugibiaziz.jpeg',
  '/images/yuruyus.jpeg',
  '/images/çocuk.jpeg'
];

export default function AuthLayout({ children, title, subtitle }) {
  const { theme, toggleTheme } = useAuth();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % backgroundImages.length);
    }, 4000); // Change image every 4 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-primary)' }}>
      {/* Left Side: Image Slider (Hidden on small screens) */}
      <div 
        className="auth-slider" 
        style={{ 
          flex: 1, 
          position: 'relative', 
          overflow: 'hidden', 
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          color: 'white',
          padding: '2rem',
          textAlign: 'center'
        }}
      >
        {backgroundImages.map((src, idx) => (
          <div
            key={src}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundImage: `url(${src})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              opacity: idx === currentImageIndex ? 1 : 0,
              transition: 'opacity 1.5s ease-in-out',
              zIndex: 1
            }}
          />
        ))}
        {/* Dark Green Gradient Overlay for Logo Color Branding */}
        <div 
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.7) 0%, rgba(15, 23, 42, 0.8) 100%)',
            zIndex: 2
          }}
        />
        
        {/* Overlay Content */}
        <div style={{ position: 'relative', zIndex: 3, maxWidth: '500px' }}>
          <img 
            src={logoImg} 
            alt="Genç İHH" 
            style={{ width: '120px', height: '120px', borderRadius: '50%', marginBottom: '20px', border: '4px solid white', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }} 
          />
          <h1 style={{ fontSize: '36px', fontWeight: '800', marginBottom: '10px', textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>Genç İHH Erzurum</h1>
          <p style={{ fontSize: '18px', fontWeight: '500', opacity: 0.9, textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>
            Teşkilat Takip Platformu'na Hoş Geldiniz. Etkinliklerinizi yönetin, performansınızı takip edin.
          </p>
        </div>
      </div>

      {/* Right Side: Form Content */}
      <div 
        className="auth-content" 
        style={{ 
          width: '100%', 
          maxWidth: '500px', 
          display: 'flex', 
          flexDirection: 'column', 
          justifyContent: 'center', 
          alignItems: 'center',
          padding: '40px',
          position: 'relative'
        }}
      >
        <button 
          onClick={toggleTheme}
          className="btn btn-secondary"
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            borderRadius: 'var(--radius-full)',
            padding: '10px',
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'transparent',
            border: '1px solid var(--border-color)'
          }}
        >
          {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
        </button>

        <div style={{ width: '100%' }}>
          <div style={{ marginBottom: '30px', textAlign: 'center' }}>
            {/* Mobile Logo Fallback */}
            <div className="mobile-logo" style={{ display: 'none', marginBottom: '20px' }}>
              <img 
                src={logoImg} 
                alt="Genç İHH" 
                style={{ width: '80px', height: '80px', borderRadius: '50%' }} 
              />
            </div>
            <h2 style={{ fontSize: '28px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '8px' }}>
              {title}
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>
              {subtitle}
            </p>
          </div>

          {children}
        </div>
      </div>
      <style>{`
        @media (max-width: 900px) {
          .auth-slider {
            display: none !important;
          }
          .auth-content {
            max-width: 100% !important;
            padding: 20px !important;
            margin: 0 auto;
          }
          .mobile-logo {
            display: flex !important;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
}
