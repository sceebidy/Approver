import { Suspense } from 'react';
import SSOVerifyContent from './verify-content';

function VerifyFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-md text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-800">Memverifikasi Sesi...</h2>
        <p className="text-gray-500 mt-2">Mohon tunggu sebentar.</p>
      </div>
    </div>
  );
}

export default function SSOVerifyPage() {
  return (
    <Suspense fallback={<VerifyFallback />}>
      <SSOVerifyContent />
    </Suspense>
  );
}