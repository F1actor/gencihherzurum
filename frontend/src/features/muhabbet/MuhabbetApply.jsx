import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Send, AlertCircle, Phone, ChevronDown, X, GraduationCap, Loader } from 'lucide-react';
import logoImg from '../../assets/logo.jpg';
import { API_URL } from '../../shared/config/api';

export default function MuhabbetApply() {
  const [formData, setFormData] = useState({
    childName: '',
    parentName: '',
    address: '',
    phoneNumber: '',
    grade: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // Modal state
  const [isGradeModalOpen, setIsGradeModalOpen] = useState(false);

  useEffect(() => {
    // Check if applications are open
    fetch(`${API_URL}/muhabbet/settings`)
      .then(res => res.json())
      .then(data => {
        setIsOpen(data.isApplicationsOpen === true);
      })
      .catch(() => {}); // fallback to open
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleGradeSelect = (selectedGrade) => {
    setFormData({ ...formData, grade: selectedGrade });
    setIsGradeModalOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.grade) {
      setError('Lütfen bir sınıf seçiniz.');
      return;
    }
    
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_URL}/muhabbet/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || 'Başvuru başarısız oldu.');
      }
      
      setSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const gradeOptions = [
    {
      level: 'İlkokul',
      grades: ['1. Sınıfa Geçen', '2. Sınıfa Geçen', '3. Sınıfa Geçen', '4. Sınıfa Geçen']
    },
    {
      level: 'Ortaokul',
      grades: ['5. Sınıfa Geçen', '6. Sınıfa Geçen', '7. Sınıfa Geçen']
      // 8. sınıfa geçen yok (7'den 8'e geçenler alınmıyor)
    },
    {
      level: 'Lise',
      grades: ['9. Sınıfa Geçen', '10. Sınıfa Geçen', '11. Sınıfa Geçen']
      // 12. sınıfa geçen yok (11'den 12'ye geçenler alınmıyor)
    }
  ];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#f8fafc', color: '#1e293b', fontFamily: 'var(--font-sans)' }}>
      <header style={{ padding: '20px 5%', backgroundColor: '#ffffff', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', position: 'sticky', top: 0, zIndex: 100 }}>
        <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', color: '#475569', textDecoration: 'none', fontWeight: '600', transition: 'color 0.3s' }} onMouseEnter={e => e.target.style.color='var(--accent-primary)'} onMouseLeave={e => e.target.style.color='#475569'}>
          <ArrowLeft size={20} /> Ana Sayfaya Dön
        </Link>
      </header>

      <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '60px 20px', position: 'relative' }}>
        
        {/* Background blobs for premium look */}
        <div style={{ position: 'absolute', top: '10%', left: '10%', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(91,128,54,0.15) 0%, transparent 70%)', borderRadius: '50%', filter: 'blur(30px)', zIndex: 0 }}></div>
        <div style={{ position: 'absolute', bottom: '10%', right: '10%', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(59,130,246,0.1) 0%, transparent 70%)', borderRadius: '50%', filter: 'blur(40px)', zIndex: 0 }}></div>

        <div style={{ width: '100%', maxWidth: '650px', backgroundColor: '#ffffff', padding: '50px', borderRadius: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.08)', position: 'relative', zIndex: 10 }}>
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <img src={logoImg} alt="Logo" style={{ width: '70px', height: '70px', borderRadius: '50%', marginBottom: '20px', boxShadow: '0 10px 20px rgba(91,128,54,0.2)' }} />
            <h2 style={{ fontSize: '2rem', fontWeight: '800', color: '#1e293b', margin: 0, letterSpacing: '-0.5px' }}>Muhabbet Okulu Kayıt</h2>
            <p style={{ color: '#64748b', marginTop: '10px', fontSize: '1.05rem' }}>Geleceğin nesillerini hep birlikte inşa edelim.</p>
          </div>

          {!isOpen ? (
            <div style={{ padding: '30px', backgroundColor: 'rgba(239, 68, 68, 0.05)', color: '#ef4444', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '20px', border: '1px solid rgba(239, 68, 68, 0.1)' }}>
              <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: '15px', borderRadius: '50%' }}>
                <AlertCircle size={32} />
              </div>
              <p style={{ margin: 0, fontWeight: '600', fontSize: '1.1rem', lineHeight: '1.5' }}>Şu anda başvurularımız kapalıdır.<br/>İlginiz için teşekkür ederiz.</p>
            </div>
          ) : success ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', animation: 'fadeIn 0.5s ease-out' }}>
              <div style={{ width: '90px', height: '90px', backgroundColor: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 25px' }}>
                <Send size={45} />
              </div>
              <h3 style={{ fontSize: '1.8rem', marginBottom: '15px', color: '#15803d', fontWeight: '800' }}>Başvurunuz Alındı!</h3>
              <p style={{ color: '#64748b', marginBottom: '35px', lineHeight: '1.7', fontSize: '1.1rem' }}>
                Muhabbet Okulu başvurunuz tarafımıza başarıyla ulaşmıştır. Değerlendirme süreci tamamlandıktan sonra sizinle iletişime geçeceğiz.
              </p>
              <Link to="/" style={{ 
                display: 'inline-block', backgroundColor: 'var(--accent-primary)', color: 'white', 
                padding: '14px 30px', borderRadius: '30px', fontWeight: '700', textDecoration: 'none',
                boxShadow: '0 10px 20px rgba(91,128,54,0.3)', transition: 'transform 0.3s'
              }} onMouseEnter={e => e.target.style.transform='translateY(-2px)'} onMouseLeave={e => e.target.style.transform='translateY(0)'}>
                Ana Sayfaya Dön
              </Link>
            </div>
          ) : (
            <>
              <div style={{ padding: '20px', backgroundColor: '#f8fafc', borderRadius: '16px', marginBottom: '35px', display: 'flex', alignItems: 'flex-start', gap: '15px', borderLeft: '4px solid var(--accent-primary)' }}>
                <Phone size={24} color="var(--accent-primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
                <p style={{ margin: 0, fontSize: '0.95rem', color: '#475569', lineHeight: '1.6' }}>
                  Yaz okulumuzun kayıt ücreti ve ödeme detayları hakkında bilgi almak için lütfen <strong>0 (543) 614 25 25</strong> numaralı dernek hattımızdan bize ulaşın.
                </p>
              </div>

              {error && (
                <div style={{ padding: '15px 20px', backgroundColor: 'rgba(239, 68, 68, 0.05)', color: '#ef4444', borderRadius: '12px', marginBottom: '25px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <AlertCircle size={20} /> {error}
                </div>
              )}

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontWeight: '600', color: '#334155', fontSize: '0.95rem' }}>Çocuğun Adı Soyadı</label>
                  <input type="text" name="childName" required value={formData.childName} onChange={handleChange} style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '1rem', outline: 'none', transition: 'border-color 0.3s' }} onFocus={e => e.target.style.borderColor='var(--accent-primary)'} onBlur={e => e.target.style.borderColor='#cbd5e1'} placeholder="Örn: Ahmet Yılmaz" disabled={loading} />
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontWeight: '600', color: '#334155', fontSize: '0.95rem' }}>Veli Adı Soyadı</label>
                  <input type="text" name="parentName" required value={formData.parentName} onChange={handleChange} style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '1rem', outline: 'none', transition: 'border-color 0.3s' }} onFocus={e => e.target.style.borderColor='var(--accent-primary)'} onBlur={e => e.target.style.borderColor='#cbd5e1'} placeholder="Örn: Mehmet Yılmaz" disabled={loading} />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontWeight: '600', color: '#334155', fontSize: '0.95rem' }}>İletişim Numarası (WhatsApp)</label>
                  <input type="tel" name="phoneNumber" required value={formData.phoneNumber} onChange={handleChange} style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '1rem', outline: 'none', transition: 'border-color 0.3s' }} onFocus={e => e.target.style.borderColor='var(--accent-primary)'} onBlur={e => e.target.style.borderColor='#cbd5e1'} placeholder="Örn: 05xx xxx xx xx" disabled={loading} />
                </div>

                {/* Custom Grade Selector using Modal */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontWeight: '600', color: '#334155', fontSize: '0.95rem' }}>Kaçıncı Sınıf</label>
                  <div 
                    onClick={() => !loading && setIsGradeModalOpen(true)}
                    style={{ 
                      width: '100%', padding: '14px 16px', borderRadius: '12px', border: '1px solid #cbd5e1', 
                      fontSize: '1rem', backgroundColor: '#fff', cursor: loading ? 'not-allowed' : 'pointer',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      color: formData.grade ? '#1e293b' : '#94a3b8'
                    }}
                  >
                    {formData.grade ? formData.grade : 'Sınıf Seçmek İçin Tıklayın...'}
                    <ChevronDown size={20} color="#94a3b8" />
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontWeight: '600', color: '#334155', fontSize: '0.95rem' }}>Açık Adres</label>
                  <textarea name="address" required value={formData.address} onChange={handleChange} style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '1rem', outline: 'none', transition: 'border-color 0.3s', resize: 'vertical', minHeight: '100px' }} onFocus={e => e.target.style.borderColor='var(--accent-primary)'} onBlur={e => e.target.style.borderColor='#cbd5e1'} placeholder="Mahalle, Sokak, No..." disabled={loading}></textarea>
                </div>

                <button type="submit" disabled={loading} style={{ 
                  marginTop: '15px', padding: '16px', backgroundColor: loading ? '#94a3b8' : 'var(--accent-primary)', 
                  color: 'white', borderRadius: '12px', fontSize: '1.1rem', fontWeight: '700', 
                  border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                  boxShadow: loading ? 'none' : '0 10px 25px rgba(91,128,54,0.3)',
                  transition: 'transform 0.3s, background-color 0.3s',
                  display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px'
                }}
                onMouseEnter={e => !loading && (e.target.style.transform='translateY(-2px)')}
                onMouseLeave={e => !loading && (e.target.style.transform='translateY(0)')}
                >
                  {loading ? (
                     <><Loader size={20} className="spin" /> Kaydediliyor...</>
                  ) : (
                    'Başvuruyu Tamamla'
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </div>

      {/* Grade Selection Modal */}
      {isGradeModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(15, 23, 42, 0.6)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px', backdropFilter: 'blur(5px)' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '24px', width: '100%', maxWidth: '600px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', animation: 'slideUp 0.3s ease-out' }}>
            
            <div style={{ padding: '25px 30px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: '800', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <GraduationCap size={24} color="var(--accent-primary)" /> Sınıf Seçimi
              </h3>
              <button onClick={() => setIsGradeModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: '5px', display: 'flex' }} onMouseEnter={e => e.currentTarget.style.color='#ef4444'} onMouseLeave={e => e.currentTarget.style.color='#64748b'}>
                <X size={24} />
              </button>
            </div>

            <div style={{ padding: '30px', overflowY: 'auto' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                {gradeOptions.map((group, idx) => (
                  <div key={idx}>
                    <h4 style={{ margin: '0 0 15px 0', color: 'var(--accent-primary)', fontSize: '1.1rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' }}>
                      {group.level}
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px' }}>
                      {group.grades.map(g => (
                        <button
                          key={g}
                          onClick={() => handleGradeSelect(g)}
                          style={{
                            padding: '14px', borderRadius: '12px', border: '2px solid #e2e8f0',
                            backgroundColor: formData.grade === g ? 'rgba(91,128,54,0.1)' : '#ffffff',
                            borderColor: formData.grade === g ? 'var(--accent-primary)' : '#e2e8f0',
                            color: formData.grade === g ? 'var(--accent-primary)' : '#475569',
                            fontSize: '1rem', fontWeight: '600', cursor: 'pointer',
                            transition: 'all 0.2s', textAlign: 'center'
                          }}
                          onMouseEnter={e => {
                            if(formData.grade !== g) {
                              e.currentTarget.style.borderColor = '#cbd5e1';
                              e.currentTarget.style.backgroundColor = '#f8fafc';
                            }
                          }}
                          onMouseLeave={e => {
                            if(formData.grade !== g) {
                              e.currentTarget.style.borderColor = '#e2e8f0';
                              e.currentTarget.style.backgroundColor = '#ffffff';
                            }
                          }}
                        >
                          {g}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: '25px', padding: '15px', backgroundColor: '#f8fafc', borderRadius: '12px', color: '#64748b', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                <span>Not: Yeni eğitim yılında okuyacağı (geçeceği) sınıfı seçiniz. 7'den 8'e ve 11'den 12'ye geçen öğrenciler kabul edilmemektedir.</span>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Basic Keyframe Styles */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          100% { transform: rotate(360deg); }
        }
      `}} />
    </div>
  );
}
