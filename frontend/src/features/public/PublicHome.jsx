import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Users, MapPin, Phone, ArrowRight, Target, Shield, Heart } from 'lucide-react';
import logoImg from '../../assets/logo.jpg';
import { PublicPosts, InstagramFeed } from './PublicPosts';

export default function PublicHome() {
  useEffect(() => {
    // Reveal animation
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = 1;
          entry.target.style.transform = 'translateY(0)';
        }
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('.reveal').forEach((el) => {
      el.style.opacity = 0;
      el.style.transform = 'translateY(30px)';
      el.style.transition = 'all 0.8s cubic-bezier(0.5, 0, 0, 1)';
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#f8fafc', fontFamily: 'var(--font-sans)', overflowX: 'hidden' }}>
      
      {/* Premium Navbar */}
      <header style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        padding: '15px 8%', 
        backgroundColor: '#ffffff',
        boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
        position: 'sticky',
        top: 0,
        zIndex: 1000
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <img src={logoImg} alt="Genç İHH Logo" style={{ width: '55px', height: '55px', borderRadius: '50%', boxShadow: '0 4px 10px rgba(91,128,54,0.2)' }} />
          <div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: '800', margin: 0, color: '#1e293b', letterSpacing: '-0.5px' }}>GENÇ İHH</h1>
            <span style={{ fontSize: '0.85rem', color: 'var(--accent-primary)', fontWeight: '700', letterSpacing: '2px', textTransform: 'uppercase' }}>Erzurum</span>
          </div>
        </div>
        
        <nav style={{ display: 'flex', gap: '30px', alignItems: 'center' }}>
          <a href="#hakkimizda" style={{ color: '#475569', textDecoration: 'none', fontWeight: '600', transition: 'color 0.3s' }} onMouseEnter={e => e.target.style.color = 'var(--accent-primary)'} onMouseLeave={e => e.target.style.color = '#475569'}>Hakkımızda</a>
          <a href="#vizyon" style={{ color: '#475569', textDecoration: 'none', fontWeight: '600', transition: 'color 0.3s' }} onMouseEnter={e => e.target.style.color = 'var(--accent-primary)'} onMouseLeave={e => e.target.style.color = '#475569'}>Vizyon & Misyon</a>
          <a href="#iletisim" style={{ color: '#475569', textDecoration: 'none', fontWeight: '600', transition: 'color 0.3s' }} onMouseEnter={e => e.target.style.color = 'var(--accent-primary)'} onMouseLeave={e => e.target.style.color = '#475569'}>İletişim</a>
          <Link to="/gonullu" className="btn" style={{ backgroundColor: 'var(--accent-primary)', color: 'white', padding: '10px 24px', borderRadius: '30px', fontWeight: '700', textDecoration: 'none', whiteSpace: 'nowrap' }}>Gönüllü Ol</Link>
          
          <div style={{ display: 'flex', gap: '15px', marginLeft: '-15px' }}>
            <Link to="/basvuru" className="btn" style={{ 
              backgroundColor: 'var(--accent-primary)', 
              color: 'white', 
              padding: '10px 24px', 
              borderRadius: '30px', 
              fontWeight: '700',
              boxShadow: '0 4px 15px rgba(91,128,54,0.3)',
              textDecoration: 'none',
              transition: 'transform 0.3s, box-shadow 0.3s'
            }}
            onMouseEnter={e => { e.target.style.transform = 'translateY(-2px)'; e.target.style.boxShadow = '0 6px 20px rgba(91,128,54,0.4)'; }}
            onMouseLeave={e => { e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = '0 4px 15px rgba(91,128,54,0.3)'; }}
            >
              Yaz Okulu Kayıt
            </Link>
            <Link to="/yonetim" className="btn" style={{ 
              backgroundColor: '#1e293b', 
              color: 'white', 
              padding: '10px 24px', 
              borderRadius: '30px', 
              fontWeight: '700',
              textDecoration: 'none',
              transition: 'background-color 0.3s'
            }}
            onMouseEnter={e => e.target.style.backgroundColor = '#0f172a'}
            onMouseLeave={e => e.target.style.backgroundColor = '#1e293b'}
            >
              Giriş Yap
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section style={{ 
        position: 'relative',
        padding: '140px 8%', 
        overflow: 'hidden',
        backgroundColor: '#0f172a',
        color: 'white'
      }}>
        {/* Abstract Background Shapes */}
        <div style={{ position: 'absolute', top: '-10%', right: '-5%', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(91,128,54,0.4) 0%, transparent 70%)', borderRadius: '50%', filter: 'blur(40px)' }}></div>
        <div style={{ position: 'absolute', bottom: '-20%', left: '-10%', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(37,99,235,0.2) 0%, transparent 70%)', borderRadius: '50%', filter: 'blur(60px)' }}></div>

        <div className="reveal" style={{ position: 'relative', zIndex: 10, maxWidth: '800px' }}>
          <span style={{ display: 'inline-block', padding: '6px 16px', backgroundColor: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '30px', fontSize: '0.9rem', fontWeight: '600', marginBottom: '20px', letterSpacing: '1px' }}>
            2026 YAZ DÖNEMİ KAYITLARI BAŞLADI
          </span>
          <h2 style={{ fontSize: '4rem', fontWeight: '800', marginBottom: '25px', lineHeight: '1.1', letterSpacing: '-1px' }}>
            Muhabbet Okulu ile<br/>
            <span style={{ color: 'var(--accent-primary)', textShadow: '0 0 30px rgba(91,128,54,0.5)' }}>Dolu Dolu Bir Yaz</span>
          </h2>
          <p style={{ fontSize: '1.25rem', color: '#cbd5e1', marginBottom: '40px', lineHeight: '1.7', maxWidth: '650px' }}>
            Kur'an-ı Kerim, Siyer, İlmihal ve Adab-ı Muaşeret eğitimlerinin yanı sıra; sportif faaliyetler ve kültürel gezilerle çocuklarımız eğlenerek öğreniyor.
          </p>
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
            <Link to="/basvuru" style={{ 
              display: 'flex', alignItems: 'center', gap: '10px',
              backgroundColor: 'var(--accent-primary)', color: 'white', 
              padding: '16px 32px', borderRadius: '12px', 
              fontSize: '1.1rem', fontWeight: '700', textDecoration: 'none',
              boxShadow: '0 10px 25px rgba(91,128,54,0.4)',
              transition: 'all 0.3s'
            }}>
              Hemen Kayıt Ol <ArrowRight size={20} />
            </Link>
            <Link to="/muhabbet" style={{ 
              display: 'flex', alignItems: 'center', gap: '10px',
              backgroundColor: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', 
              padding: '16px 32px', borderRadius: '12px', 
              fontSize: '1.1rem', fontWeight: '700', textDecoration: 'none',
              backdropFilter: 'blur(10px)',
              transition: 'all 0.3s'
            }}>
              Menü & Etkinlikler
            </Link>
          </div>
        </div>
      </section>

      {/* Features / Stats */}
      <section className="reveal" style={{ padding: '60px 8%', marginTop: '-50px', position: 'relative', zIndex: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '30px' }}>
          {[
            { icon: <BookOpen size={28} />, title: 'Temel Dini Bilgiler', desc: 'Kur\'an-ı Kerim, Siyer, İlmihal ve Adab-ı Muaşeret', color: '#3b82f6' },
            { icon: <Heart size={28} />, title: 'Kardeşlik ve Ahlak', desc: 'Paylaşmayı, yardımlaşmayı ve güzel ahlakı aşılıyoruz.', color: '#ec4899' },
            { icon: <Target size={28} />, title: 'Sosyal Aktiviteler', desc: 'Piknik, Yüzme, Okçuluk ve Şehir Gezileri', color: '#f59e0b' },
          ].map((feature, i) => (
            <div key={i} style={{ 
              backgroundColor: 'white', padding: '30px', borderRadius: '20px', 
              boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
              border: '1px solid rgba(0,0,0,0.02)',
              transition: 'transform 0.3s'
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-10px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <div style={{ width: '60px', height: '60px', borderRadius: '15px', backgroundColor: `${feature.color}15`, color: feature.color, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                {feature.icon}
              </div>
              <h3 style={{ fontSize: '1.3rem', fontWeight: '800', color: '#1e293b', marginBottom: '10px' }}>{feature.title}</h3>
              <p style={{ color: '#64748b', lineHeight: '1.6' }}>{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* About & Vision */}
      <PublicPosts />
      <InstagramFeed />
      <section id="hakkimizda" className="reveal" style={{ padding: '80px 8%', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '60px', alignItems: 'center' }}>
        <div>
          <span style={{ color: 'var(--accent-primary)', fontWeight: '800', letterSpacing: '2px', textTransform: 'uppercase', fontSize: '0.9rem' }}>Genç İHH Erzurum</span>
          <h2 style={{ fontSize: '2.5rem', fontWeight: '800', color: '#1e293b', margin: '10px 0 30px', lineHeight: '1.2' }}>İyiliğin Geleceği<br/>Gençlerimizin Elinde</h2>
          <p style={{ fontSize: '1.15rem', color: '#475569', lineHeight: '1.8', marginBottom: '20px' }}>
            Genç İHH Erzurum olarak, gençlerimizin ve çocuklarımızın milli ve manevi değerlerine bağlı, donanımlı, merhametli bireyler olarak yetişmelerine katkı sağlamak amacıyla eğitim programları düzenlemekteyiz.
          </p>
          <p style={{ fontSize: '1.15rem', color: '#475569', lineHeight: '1.8' }}>
            Dünyanın neresinde bir mazlum varsa onun yanında durmayı şiar edinen bir nesil yetiştirmek en büyük gayemizdir.
          </p>
        </div>
        <div style={{ position: 'relative' }}>
          <div style={{ position: 'absolute', top: '-20px', left: '-20px', width: '100%', height: '100%', backgroundColor: 'var(--accent-primary)', borderRadius: '24px', opacity: 0.1 }}></div>
          <div style={{ backgroundColor: '#1e293b', padding: '50px', borderRadius: '24px', color: 'white', position: 'relative', zIndex: 2, boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '25px' }}>
              <Shield size={36} color="var(--accent-primary)" />
              <h3 id="vizyon" style={{ fontSize: '1.8rem', margin: 0, fontWeight: '800' }}>Vizyon & Misyon</h3>
            </div>
            <div style={{ marginBottom: '30px' }}>
              <h4 style={{ color: 'var(--accent-primary)', fontSize: '1.1rem', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '1px' }}>Misyonumuz</h4>
              <p style={{ color: '#cbd5e1', lineHeight: '1.7', fontSize: '1.1rem' }}>İyiliğin yeryüzüne yayılması için çalışan, bilinçli ve ahlaklı nesiller yetiştirmek.</p>
            </div>
            <div>
              <h4 style={{ color: 'var(--accent-primary)', fontSize: '1.1rem', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '1px' }}>Vizyonumuz</h4>
              <p style={{ color: '#cbd5e1', lineHeight: '1.7', fontSize: '1.1rem' }}>Erzurum genelinde tüm gençlere ulaşarak, yardımlaşma ve dayanışma şuurunu aşılamak.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="iletisim" style={{ backgroundColor: '#0f172a', padding: '80px 8% 40px', color: 'white', marginTop: 'auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '50px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '60px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '25px' }}>
              <img src={logoImg} alt="Genç İHH Logo" style={{ width: '45px', height: '45px', borderRadius: '50%' }} />
              <h3 style={{ fontSize: '1.5rem', fontWeight: '800', margin: 0, color: 'white' }}>Genç İHH Erzurum</h3>
            </div>
            <p style={{ color: '#94a3b8', lineHeight: '1.7', maxWidth: '350px' }}>
              İyilik her zaman her yerde. Geleceğin iyilik elçilerini yetiştirmek için buradayız.
            </p>
          </div>
          
          <div>
            <h4 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '25px', color: 'white' }}>İletişim Bilgileri</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '15px' }}>
                <MapPin size={22} color="var(--accent-primary)" style={{ flexShrink: 0, marginTop: '3px' }} />
                <span style={{ color: '#cbd5e1', lineHeight: '1.6' }}>Erzurum Genç İHH İl Başkanlığı<br/>Yakutiye / Erzurum</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <Phone size={22} color="var(--accent-primary)" style={{ flexShrink: 0 }} />
                <span style={{ color: '#cbd5e1' }}>0 (543) 614 25 25</span>
              </div>
            </div>
          </div>

          <div>
            <h4 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '25px', color: 'white' }}>Hızlı Bağlantılar</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <Link to="/basvuru" style={{ color: '#cbd5e1', textDecoration: 'none', transition: 'color 0.3s' }} onMouseEnter={e => e.target.style.color = 'var(--accent-primary)'} onMouseLeave={e => e.target.style.color = '#cbd5e1'}>Yaz Okulu Başvuru</Link>
              <Link to="/gonullu" style={{ color: '#cbd5e1', textDecoration: 'none' }}>Gönüllü Ol</Link>
              <Link to="/muhabbet" style={{ color: '#cbd5e1', textDecoration: 'none', transition: 'color 0.3s' }} onMouseEnter={e => e.target.style.color = 'var(--accent-primary)'} onMouseLeave={e => e.target.style.color = '#cbd5e1'}>Muhabbet Okulu Portalı</Link>
              <Link to="/yonetim" style={{ color: '#cbd5e1', textDecoration: 'none', transition: 'color 0.3s' }} onMouseEnter={e => e.target.style.color = 'var(--accent-primary)'} onMouseLeave={e => e.target.style.color = '#cbd5e1'}>Yetkili Girişi</Link>
            </div>
          </div>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '40px', flexWrap: 'wrap', gap: '20px' }}>
          <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0 }}>
            © {new Date().getFullYear()} Genç İHH Erzurum. Tüm hakları saklıdır.
          </p>

        </div>
      </footer>
    </div>
  );
}
