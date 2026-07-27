/**
 * CSRF / XSRF helper untuk Laravel Sanctum stateful authentication.
 *
 * Gunakan `getXsrfToken()` untuk membaca nilai cookie XSRF-TOKEN yang sudah ada.
 * Gunakan `refreshCsrfCookie()` untuk memperbarui cookie sebelum request penting.
 */

/**
 * Membaca nilai XSRF-TOKEN dari document.cookie.
 * Laravel meng-URL-encode nilai cookie, sehingga perlu di-decode.
 */
export function getXsrfToken(): string {
  if (typeof document === 'undefined') return '';
  const match = document.cookie
    .split('; ')
    .find((c) => c.startsWith('XSRF-TOKEN='));
  if (!match) return '';
  return decodeURIComponent(match.split('=').slice(1).join('='));
}

/**
 * Memanggil GET /sanctum/csrf-cookie agar Laravel menyetel (atau memperbarui)
 * cookie XSRF-TOKEN dan laravel_session di browser.
 * Kembalikan nilai token terbaru setelah refresh.
 */
export async function refreshCsrfCookie(): Promise<string> {
  // Gunakan path relatif `/sanctum/csrf-cookie` agar melewati Next.js proxy
  // (bukan fetch langsung ke localhost:8000 yang cross-origin).
  // Proxy dikonfigurasi di next.config.mjs → /sanctum/* → http://127.0.0.1:8000/sanctum/*
  await fetch('/sanctum/csrf-cookie', {
    method: 'GET',
    headers: { Accept: 'application/json' },
    credentials: 'include',
  });

  return getXsrfToken();
}
