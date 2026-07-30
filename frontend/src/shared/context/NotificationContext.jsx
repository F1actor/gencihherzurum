import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, AlertCircle, Info, X, AlertTriangle } from 'lucide-react';

const NotificationContext = createContext(null);

export const useNotification = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const [confirmState, setConfirmState] = useState({
    isOpen: false,
    message: '',
    onConfirm: null,
    onCancel: null
  });

  // Toast Ekleme
  const showNotification = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    // 3.5 saniye sonra otomatik temizle
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 4000);
  }, []);

  // Toast Kaldırma
  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showConfirm = useCallback((message, onConfirm, onCancel) => {
    setConfirmState({
      isOpen: true,
      message,
      onConfirm: () => {
        if (onConfirm) onConfirm();
        setConfirmState(prev => ({ ...prev, isOpen: false }));
      },
      onCancel: () => {
        if (onCancel) onCancel();
        setConfirmState(prev => ({ ...prev, isOpen: false }));
      }
    });
  }, []);

  return (
    <NotificationContext.Provider value={{ showNotification, showConfirm }}>
      {children}
      
      {/* Toast Bildirim Konteyneri */}
      <div style={{
        position: 'fixed',
        top: '24px',
        right: '24px',
        zIndex: 99999,
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        maxWidth: '380px',
        width: '100%'
      }}>
        {toasts.map((toast) => {
          // Toast Türüne Göre Renkler ve İkonlar
          let icon = <Info size={20} />;
          let bgColor = 'var(--bg-secondary)';
          let borderColor = 'var(--border-color)';
          let iconColor = 'var(--text-secondary)';
          let barColor = 'var(--border-color)';

          if (toast.type === 'success') {
            icon = <CheckCircle size={20} />;
            bgColor = 'var(--bg-secondary)';
            borderColor = 'rgba(91, 128, 54, 0.2)';
            iconColor = '#5b8036'; // Kurumsal yeşil
            barColor = '#5b8036';
          } else if (toast.type === 'error' || toast.type === 'danger') {
            icon = <AlertCircle size={20} />;
            bgColor = 'var(--bg-secondary)';
            borderColor = 'rgba(239, 68, 68, 0.2)';
            iconColor = 'var(--status-danger)';
            barColor = 'var(--status-danger)';
          } else if (toast.type === 'warning') {
            icon = <AlertTriangle size={20} />;
            bgColor = 'var(--bg-secondary)';
            borderColor = 'rgba(245, 158, 11, 0.2)';
            iconColor = 'var(--status-warning)';
            barColor = 'var(--status-warning)';
          }

          return (
            <div
              key={toast.id}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                padding: '16px',
                backgroundColor: bgColor,
                color: 'var(--text-primary)',
                borderRadius: 'var(--radius-md)',
                border: `1px solid ${borderColor}`,
                boxShadow: 'var(--shadow-lg)',
                position: 'relative',
                overflow: 'hidden',
                animation: 'slideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards'
              }}
            >
              {/* Sol Renkli Çizgi */}
              <div style={{
                position: 'absolute',
                left: 0,
                top: 0,
                bottom: 0,
                width: '4px',
                backgroundColor: barColor
              }} />

              {/* İkon */}
              <div style={{ color: iconColor, flexShrink: 0, marginTop: '2px' }}>
                {icon}
              </div>

              {/* İçerik */}
              <div style={{ flex: 1, textAlign: 'left', fontSize: '14px', fontWeight: '500', lineHeight: '1.4', paddingRight: '12px' }}>
                {toast.message}
              </div>

              {/* Kapat Butonu */}
              <button
                onClick={() => removeToast(toast.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '2px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  outline: 'none',
                  transition: 'color var(--transition-fast)'
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
              >
                <X size={16} />
              </button>
            </div>
          );
        })}
      </div>

      {/* Custom Confirmation Dialog Overlay */}
      {confirmState.isOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 999999,
          animation: 'fadeIn 0.2s ease-out forwards'
        }}>
          <div style={{
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-xl)',
            padding: '30px',
            maxWidth: '400px',
            width: '90%',
            textAlign: 'center',
            animation: 'scaleInConfirm 0.25s cubic-bezier(0.34, 1.56, 0.64, 1) forwards'
          }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              color: '#ef4444',
              marginBottom: '18px'
            }}>
              <AlertTriangle size={28} />
            </div>
            
            <h3 style={{
              fontSize: '17px',
              fontWeight: '800',
              color: 'var(--text-primary)',
              margin: '0 0 10px 0',
              fontFamily: 'var(--font-display)'
            }}>
              Emin misiniz?
            </h3>
            
            <p style={{
              fontSize: '14px',
              color: 'var(--text-secondary)',
              margin: '0 0 24px 0',
              lineHeight: '1.5',
              fontWeight: '500'
            }}>
              {confirmState.message}
            </p>
            
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={confirmState.onCancel}
                className="btn btn-secondary"
                style={{ flex: 1, padding: '10px 16px', fontSize: '14px', cursor: 'pointer' }}
              >
                Vazgeç
              </button>
              <button
                onClick={confirmState.onConfirm}
                className="btn"
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  fontSize: '14px',
                  backgroundColor: '#ef4444',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                Evet, Sil
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Keyframe Stili */}
      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%) translateY(-10px);
            opacity: 0;
          }
          to {
            transform: translateX(0) translateY(0);
            opacity: 1;
          }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleInConfirm {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </NotificationContext.Provider>
  );
};
