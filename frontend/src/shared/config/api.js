/** Central API address and uploaded-asset URL helpers. */
const configuredApiUrl = import.meta.env.VITE_API_URL?.trim() || '/api';

export const API_URL = configuredApiUrl.replace(/\/$/, '');

export function getAssetUrl(assetPath) {
  if (!assetPath) return '';
  if (/^https?:\/\//i.test(assetPath)) return assetPath;
  const apiUrl = new URL(API_URL, window.location.origin);
  return new URL(assetPath, apiUrl.origin).toString();
}
