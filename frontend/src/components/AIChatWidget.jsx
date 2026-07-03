import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Bot, User as UserIcon, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';

export default function AIChatWidget() {
  const { user, token } = useAuth();
  const { showNotification } = useNotification();
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [history, setHistory] = useState([
    { role: 'model', content: 'Selamun Aleyküm! Ben Genç İHH Akıllı Asistanıyım. Sistemle veya etkinliklerle ilgili herhangi bir konuda size nasıl yardımcı olabilirim?' }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Otomatik kaydırma
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [history, isOpen]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim() || isLoading) return;

    const userMessage = { role: 'user', content: message };
    setHistory(prev => [...prev, userMessage]);
    setMessage('');
    setIsLoading(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api'}/llm/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          message: userMessage.content,
          history: history.filter(h => h.role !== 'system') // Sadece görünür geçmişi gönder
        })
      });

      const data = await response.json();
      if (response.ok) {
        setHistory(prev => [...prev, { role: 'model', content: data.reply }]);
      } else {
        showNotification(data.message || 'Cevap alınırken hata oluştu', 'error');
        setHistory(prev => [...prev, { role: 'model', content: 'Üzgünüm, şu an bağlantı sorunu yaşıyorum. Lütfen daha sonra tekrar deneyiniz.' }]);
      }
    } catch (error) {
      console.error(error);
      setHistory(prev => [...prev, { role: 'model', content: 'Sunucuya ulaşılamadı. Lütfen yöneticinizle iletişime geçin.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Chat kapalıysa sadece buton göster
  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="btn btn-primary"
        style={{
          position: 'fixed',
          bottom: '30px',
          right: '30px',
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 10px 25px rgba(59, 130, 246, 0.4)',
          zIndex: 9999,
          padding: 0
        }}
        title="Yapay Zeka Asistanı"
      >
        <MessageSquare size={28} />
      </button>
    );
  }

  // Chat açık
  return (
    <div style={{
      position: 'fixed',
      bottom: '30px',
      right: '30px',
      width: '350px',
      height: '500px',
      backgroundColor: 'var(--bg-primary)',
      borderRadius: 'var(--radius-lg)',
      boxShadow: '0 15px 40px rgba(0,0,0,0.2)',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 9999,
      border: '1px solid var(--border-color)',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        backgroundColor: 'var(--accent-primary)',
        color: '#fff',
        padding: '15px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ backgroundColor: 'rgba(255,255,255,0.2)', padding: '6px', borderRadius: '50%' }}>
            <Bot size={20} />
          </div>
          <div>
            <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '800' }}>Akıllı Asistan</h4>
            <span style={{ fontSize: '11px', opacity: 0.8 }}>Genç İHH Erzurum</span>
          </div>
        </div>
        <button 
          onClick={() => setIsOpen(false)}
          style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: '4px' }}
        >
          <X size={20} />
        </button>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1,
        padding: '20px',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '15px',
        backgroundColor: 'var(--bg-secondary)'
      }}>
        {history.map((msg, idx) => (
          <div key={idx} style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>
                {msg.role === 'user' ? 'Siz' : 'Asistan'}
              </span>
            </div>
            <div style={{
              backgroundColor: msg.role === 'user' ? 'var(--accent-primary)' : 'var(--bg-primary)',
              color: msg.role === 'user' ? '#fff' : 'var(--text-primary)',
              padding: '10px 14px',
              borderRadius: '12px',
              borderTopRightRadius: msg.role === 'user' ? '4px' : '12px',
              borderTopLeftRadius: msg.role === 'model' ? '4px' : '12px',
              fontSize: '13px',
              lineHeight: '1.5',
              border: msg.role === 'model' ? '1px solid var(--border-color)' : 'none',
              maxWidth: '85%',
              boxShadow: 'var(--shadow-sm)'
            }}>
              {msg.content.split('\n').map((line, i) => <p key={i} style={{ margin: i === 0 ? 0 : '8px 0 0 0' }}>{line}</p>)}
            </div>
          </div>
        ))}
        {isLoading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-muted)', fontSize: '12px' }}>
            <Loader2 size={14} className="spin" /> <span>Asistan yazıyor...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <div style={{ padding: '15px', backgroundColor: 'var(--bg-primary)', borderTop: '1px solid var(--border-color)' }}>
        <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '10px' }}>
          <input
            type="text"
            placeholder="Mesajınızı yazın..."
            value={message}
            onChange={e => setMessage(e.target.value)}
            className="form-control"
            style={{ flex: 1, padding: '10px 15px', fontSize: '13px', borderRadius: 'var(--radius-full)' }}
            disabled={isLoading}
          />
          <button 
            type="submit"
            className="btn btn-primary"
            style={{ 
              borderRadius: '50%', width: '40px', height: '40px', padding: 0, 
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 
            }}
            disabled={isLoading || !message.trim()}
          >
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}
