'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function SSOVerifyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
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
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;

        // 1. Get CSRF Token and initialize session
        const csrfRes = await fetch(`${apiUrl}/auth/csrf`, {
          method: 'GET',
          headers: { 'Accept': 'application/json' },
          credentials: 'include' 
        });
        
        let csrfToken = '';
        if (csrfRes.ok) {
           const csrfData = await csrfRes.json();
           csrfToken = csrfData.data?.csrfToken || '';
        }

        // 2. Exchange token for session
        const response = await fetch(`${apiUrl}/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-CSRF-TOKEN': csrfToken,
          },
          credentials: 'include', // Ensure browser saves the HttpOnly session cookie
          body: JSON.stringify({
            ssoToken: actualToken,
            appId: appId,
          }),
        });

        const data = await response.json();

        if (response.ok && data.success) {
          // Redirect to the main application, session is handled by HttpOnly cookie
          router.replace('/');
        } else {
          setError(data.message || 'Gagal memverifikasi token SSO.');
        }
      } catch (err) {
        console.error('SSO Verification Error:', err);
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
