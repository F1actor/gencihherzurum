/** Central API address and uploaded-asset URL helpers. */
const configuredApiUrl = import.meta.env.VITE_API_URL?.trim() || '/api';

export const API_URL = configuredApiUrl.replace(/\/$/, '');

export function getAssetUrl(assetPath) {
  if (!assetPath) return '';
  if (/^https?:\/\//i.test(assetPath)) return assetPath;
  const apiUrl = new URL(API_URL, window.location.origin);
  return new URL(assetPath, apiUrl.origin).toString();
}

/**
 * Sunucu yanıtını güvenli bir şekilde JSON olarak ayrıştırır.
 * Sunucu kapalıyken (502, 503 Bad Gateway gibi HTML dönüldüğünde)
 * 'Unexpected token <' gibi çirkin hatalar yerine temiz Türkçe mesaj fırlatır.
 */
export async function safeJson(response) {
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      return await response.json();
    } catch {
      // Hatalı JSON gövdesi
    }
  }

  if (response.status === 502 || response.status === 503 || response.status === 504) {
    throw new Error('Sunucuya şu anda ulaşılamıyor (Sunucu kapalı veya bakımda). Lütfen daha sonra tekrar deneyiniz.');
  }
  if (response.status === 429) {
    throw new Error('Çok fazla istek gönderildi. Lütfen bir süre sonra tekrar deneyiniz.');
  }
  if (response.status === 404) {
    throw new Error('İstenen servis veya kaynak bulunamadı (404).');
  }
  throw new Error(`Sunucu ile iletişim kurulamadı (Durum: ${response.status}).`);
}
