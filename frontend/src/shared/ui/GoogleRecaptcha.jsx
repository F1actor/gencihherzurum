import React, { useEffect, useRef, useState } from 'react';

/**
 * Resmi Google reCAPTCHA v2 ("Ben robot değilim" onay kutusu ve puzzle) bileşeni.
 * Google API script'ini otomatik olarak Türkçe dil desteğiyle yükler.
 */
export default function GoogleRecaptcha({ onChange, onExpired, style = {} }) {
  const containerRef = useRef(null);
  const widgetIdRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // VITE_RECAPTCHA_SITE_KEY env değişkeninden okunur
  const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY || '';

  useEffect(() => {
    if (!siteKey) {
      console.warn('Google reCAPTCHA: VITE_RECAPTCHA_SITE_KEY çevre değişkeni tanımlanmamış.');
      return;
    }

    const scriptId = 'google-recaptcha-v2-script';

    const renderWidget = () => {
      if (!window.grecaptcha || !window.grecaptcha.render || !containerRef.current) return;
      if (widgetIdRef.current !== null) return; // Zaten render edilmiş

      try {
        widgetIdRef.current = window.grecaptcha.render(containerRef.current, {
          sitekey: siteKey,
          callback: (token) => {
            if (onChange) onChange(token);
          },
          'expired-callback': () => {
            if (onExpired) onExpired();
            if (onChange) onChange('');
          },
          'error-callback': () => {
            if (onChange) onChange('');
          }
        });
        setIsLoaded(true);
      } catch (err) {
        // Geliştirme ortamında çift render durumunu tolere et
      }
    };

    // Script zaten varsa doğrudan render et
    if (window.grecaptcha && window.grecaptcha.render) {
      renderWidget();
      return;
    }

    // Script yoksa dinamik olarak yükle
    let script = document.getElementById(scriptId);
    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://www.google.com/recaptcha/api.js?onload=onGoogleRecaptchaLoad&render=explicit&hl=tr';
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }

    window.onGoogleRecaptchaLoad = () => {
      renderWidget();
    };

    // Zaman aşımı koruması: Script geç yüklenirse kontrol et
    const interval = setInterval(() => {
      if (window.grecaptcha && window.grecaptcha.render) {
        clearInterval(interval);
        renderWidget();
      }
    }, 300);

    return () => {
      clearInterval(interval);
    };
  }, [siteKey]);

  if (!siteKey) {
    return (
      <div style={{
        padding: '10px 14px',
        backgroundColor: '#fef3c7',
        border: '1px solid #f59e0b',
        borderRadius: 8,
        fontSize: 12,
        color: '#92400e',
        margin: '12px 0',
        ...style
      }}>
        ⚠️ <strong>Google reCAPTCHA:</strong> Site anahtarı (<code>VITE_RECAPTCHA_SITE_KEY</code>) henüz girilmemiş.
      </div>
    );
  }

  return (
    <div style={{ margin: '14px 0', minHeight: 78, display: 'flex', justifyContent: 'center', ...style }}>
      <div ref={containerRef} />
    </div>
  );
}
