import React, { useState, useEffect } from 'react';
import { useAuth } from '../../shared/context/AuthContext';
import { Calendar, Users, Phone, Save, CheckCircle } from 'lucide-react';

export default function MuhabbetTeacherDashboard({ onBack }) {
  const { user, logout } = useAuth();
  const [classInfo, setClassInfo] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendance, setAttendance] = useState({}); // { studentId: 1 or 0 }
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchClassData();
  }, []);

  const fetchClassData = async () => {
    try {
      const token = localStorage.getItem('gencihh_token');
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/muhabbet/my-class`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setClassInfo(data.classInfo);
        setStudents(data.students);
        
        loadAttendance(data.classInfo.id, date);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadAttendance = async (classId, targetDate) => {
    try {
      const token = localStorage.getItem('gencihh_token');
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/muhabbet/attendance?classId=${classId}&date=${targetDate}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const attObj = {};
        data.forEach(r => { attObj[r.studentId] = r.isPresent; });
        setAttendance(attObj);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleDateChange = (e) => {
    const newDate = e.target.value;
    setDate(newDate);
    setAttendance({});
    if (classInfo) {
      loadAttendance(classInfo.id, newDate);
    }
  };

  const toggleAttendance = (studentId, status) => {
    setAttendance(prev => ({ ...prev, [studentId]: status }));
  };

  const saveAttendance = async () => {
    setSaving(true);
    setSuccess(false);
    try {
      const studentsList = students.map(s => ({
        id: s.id,
        isPresent: attendance[s.id] !== undefined ? attendance[s.id] : 0 // Varsayılan 0
      }));

      const token = localStorage.getItem('gencihh_token');
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/muhabbet/attendance`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ attendanceDate: date, classId: classInfo.id, students: studentsList })
      });
      
      if (res.ok) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const openWhatsApp = (student) => {
    const cleanPhone = student.phoneNumber.replace(/\D/g, '');
    const phone = cleanPhone.length > 10 ? cleanPhone.slice(-10) : cleanPhone;
    const text = encodeURIComponent(`Selamun Aleyküm, Muhabbet Okulu'ndan yazıyoruz. Öğrencimiz ${student.childName} bugün derse katılmadı. Bilginiz dahilinde mi? Hayırlı günler dileriz.`);
    window.open(`https://wa.me/90${phone}?text=${text}`, '_blank');
  };

  if (loading) return <div style={{ padding: '20px' }}>Yükleniyor...</div>;

  if (!classInfo) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h2>Size atanmış bir sınıf bulunamadı.</h2>
        {onBack ? (
          <button onClick={onBack} className="btn btn-secondary" style={{ marginTop: '20px' }}>← Panele Dön</button>
        ) : (
          <button onClick={logout} className="btn btn-secondary" style={{ marginTop: '20px' }}>Çıkış Yap</button>
        )}
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-primary)', padding: '20px', color: 'var(--text-primary)' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', padding: '30px', borderRadius: 'var(--radius-lg)', background: 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)', color: 'white', boxShadow: 'var(--shadow-lg)' }}>
          <div>
            <h1 style={{ fontSize: '2.2rem', fontWeight: '800', margin: 0, letterSpacing: '-0.5px', textShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>Muhabbet Okulu Hoca Paneli</h1>
            <p style={{ color: 'rgba(255,255,255,0.9)', margin: '8px 0 0 0', fontSize: '1.1rem', fontWeight: '500' }}>Hoş geldin, {user.fullName}</p>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {onBack && (
              <button onClick={onBack} className="btn" style={{ background: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.3)', backdropFilter: 'blur(10px)', padding: '10px 16px', fontWeight: '600' }}>
                ← Panele Dön
              </button>
            )}
            <button onClick={logout} className="btn" style={{ background: 'rgba(239, 68, 68, 0.3)', color: 'white', border: '1px solid rgba(239, 68, 68, 0.5)', backdropFilter: 'blur(10px)', padding: '10px 18px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
              Çıkış Yap
            </button>
          </div>
        </header>

        <div className="card" style={{ padding: '25px', marginBottom: '30px', display: 'flex', gap: '25px', alignItems: 'center', borderLeft: '5px solid var(--accent-primary)', boxShadow: 'var(--shadow-md)' }}>
          <div style={{ padding: '20px', backgroundColor: 'var(--accent-primary-alpha)', borderRadius: '50%', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Users size={36} />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.6rem', fontWeight: '700', color: 'var(--text-primary)' }}>{classInfo.name}</h2>
            <div style={{ margin: '10px 0 0 0', color: 'var(--text-secondary)', display: 'flex', gap: '15px', fontSize: '0.95rem' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'var(--bg-secondary)', padding: '6px 12px', borderRadius: '20px', fontWeight: '600', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                Yaş Grubu: <span style={{ color: 'var(--accent-primary)' }}>{classInfo.ageGroup}</span>
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'var(--bg-secondary)', padding: '6px 12px', borderRadius: '20px', fontWeight: '600', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                Öğrenci Sayısı: <span style={{ color: 'var(--accent-primary)' }}>{students.length}</span>
              </span>
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: '0', overflow: 'hidden', boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border-color)' }}>
          <div style={{ padding: '25px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px', backgroundColor: 'var(--bg-secondary)' }}>
            <h3 style={{ margin: 0, fontSize: '1.4rem', display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-primary)' }}>
              <div style={{ padding: '8px', background: 'var(--accent-primary-alpha)', borderRadius: '10px', color: 'var(--accent-primary)', display: 'flex' }}>
                <Calendar size={24} />
              </div>
              Yoklama Listesi
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <label style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Tarih Seçin:</label>
              <input 
                type="date" 
                value={date} 
                onChange={handleDateChange} 
                className="form-input" 
                style={{ width: 'auto', padding: '10px 15px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', fontWeight: '600', color: 'var(--text-primary)', backgroundColor: 'var(--bg-primary)' }} 
              />
            </div>
          </div>

          <div style={{ padding: '25px' }}>
          {students.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-secondary)', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)' }}>
              <Users size={48} style={{ opacity: 0.3, marginBottom: '15px' }} />
              <p style={{ fontSize: '1.1rem', margin: 0 }}>Bu sınıfa henüz kayıtlı öğrenci bulunmuyor.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Öğrenci Adı</th>
                    <th>Veli Bilgisi</th>
                    <th>Durum</th>
                    <th>İşlem</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map(s => {
                    const isPresent = attendance[s.id] === 1;
                    const isAbsent = attendance[s.id] === 0;
                    return (
                      <tr key={s.id}>
                        <td style={{ fontWeight: '600', fontSize: '1.05rem', color: 'var(--text-primary)' }}>{s.childName}</td>
                        <td>
                          <div style={{ fontSize: '0.95rem', fontWeight: '500' }}>{s.parentName}</div>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{s.phoneNumber}</div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '10px' }}>
                            <button 
                              onClick={() => toggleAttendance(s.id, 1)}
                              className="btn" 
                              style={{ 
                                padding: '6px 14px', fontSize: '0.9rem', fontWeight: '600',
                                backgroundColor: isPresent ? '#22c55e' : 'var(--bg-secondary)', 
                                color: isPresent ? 'white' : 'var(--text-primary)',
                                border: `1px solid ${isPresent ? '#22c55e' : 'var(--border-color)'}`,
                                borderRadius: '20px', transition: 'all 0.2s'
                              }}>
                              Geldi
                            </button>
                            <button 
                              onClick={() => toggleAttendance(s.id, 0)}
                              className="btn" 
                              style={{ 
                                padding: '6px 14px', fontSize: '0.9rem', fontWeight: '600',
                                backgroundColor: isAbsent ? '#ef4444' : 'var(--bg-secondary)', 
                                color: isAbsent ? 'white' : 'var(--text-primary)',
                                border: `1px solid ${isAbsent ? '#ef4444' : 'var(--border-color)'}`,
                                borderRadius: '20px', transition: 'all 0.2s'
                              }}>
                              Gelmedi
                            </button>
                          </div>
                        </td>
                        <td>
                          {isAbsent && (
                            <button 
                              onClick={() => openWhatsApp(s)}
                              className="btn" 
                              style={{ padding: '8px 16px', backgroundColor: '#25D366', color: 'white', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', fontWeight: '600', borderRadius: 'var(--radius-md)', border: 'none', boxShadow: '0 2px 4px rgba(37,211,102,0.3)' }}
                              title="Veliye WhatsApp'tan Mesaj Gönder"
                            >
                              <Phone size={16} /> Veliye Sor
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div style={{ marginTop: '30px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '20px', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
            {success && <span style={{ color: '#22c55e', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', animation: 'fadeIn 0.3s ease-out' }}><CheckCircle size={20} /> Yoklama başarıyla kaydedildi!</span>}
            <button onClick={saveAttendance} className="btn btn-primary" disabled={saving || students.length === 0} style={{ padding: '12px 30px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.05rem', fontWeight: '600', boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)' }}>
              <Save size={20} /> {saving ? 'Kaydediliyor...' : 'Yoklamayı Kaydet'}
            </button>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}
