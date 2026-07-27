'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { refreshCsrfCookie } from '@/lib/csrf';

export default function SSOVerifyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [error, setError] = useState<string | null>(null);
  // Guard: cegah double-invoke dari React StrictMode di development
  const hasVerified = useRef(false);

  useEffect(() => {
    // React StrictMode di dev me-mount komponen dua kali — guard ini memastikan
    // token SSO (single-use) hanya dipakai sekali
    if (hasVerified.current) return;
    hasVerified.current = true;

    const verifyToken = async () => {
      // Sometimes useSearchParams can be empty on first mount during static generation,
      // fallback to native window.location.search to guarantee we get it on the client
      const urlParams = new URLSearchParams(window.location.search);
      const actualToken = token || urlParams.get('token');

      if (!actualToken) {
        setError(`Token tidak ditemukan di URL. (URL: ${window.location.href})`);
        return;
      }

      try {
        const appId = process.env.NEXT_PUBLIC_APP_ID;
        const apiUrl = "/api";

        // 1. Get CSRF cookie and initialize session
        const xsrfToken = await refreshCsrfCookie();

        // 2. Exchange token for session
        const response = await fetch(`${apiUrl}/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-XSRF-TOKEN': xsrfToken,
          },
          credentials: 'include', // Ensure browser saves the HttpOnly session cookie
          body: JSON.stringify({
            ssoToken: actualToken,
            appId: appId,
          }),
        });

        const data = await response.json();
        console.log('[SSO Verify] Response from /api/auth/login:', { status: response.status, ok: response.ok, data });

        if (response.ok && data.success) {
          console.log('[SSO Verify] Login sukses! Melakukan full page redirect ke dashboard (/)');
          // Gunakan window.location.href alih-alih router.replace
          // agar browser melakukan hard refresh dan membawa cookie session baru ke Middleware
          window.location.href = '/';
        } else {
          console.error('[SSO Verify] Login gagal:', data.message);
          setError(data.message || 'Gagal memverifikasi token SSO.');
        }
      } catch (err) {
        console.error('[SSO Verify] Exception during verification:', err);
        setError('Terjadi kesalahan saat memverifikasi SSO.');
      }
    };

    verifyToken();
  }, [token, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-md text-center">
        {error ? (
          <div>
            <h2 className="text-xl font-semibold text-red-600 mb-4">Autentikasi Gagal</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => window.location.href = process.env.NEXT_PUBLIC_PORTAL_LOGIN_URL || '/'}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Kembali ke Portal
            </button>
          </div>
        ) : (
          <div>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-800">Memverifikasi Sesi...</h2>
            <p className="text-gray-500 mt-2">Mohon tunggu sebentar.</p>
          </div>
        )}
      </div>
    </div>
  );
}
