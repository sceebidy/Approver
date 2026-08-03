const BACKEND_URL = process.env.BACKEND_URL || "http://127.0.0.1:8000";

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${BACKEND_URL}/api/:path*`,
      },
      // Proxy /sanctum/csrf-cookie agar browser melihatnya sebagai same-origin
      // sehingga cookie XSRF-TOKEN ter-set dengan benar
      {
        source: "/sanctum/:path*",
        destination: `${BACKEND_URL}/sanctum/:path*`,
      },
    ];
  },

  async headers() {
    return [
      {
        // Teruskan header referrer ke backend agar Sanctum bisa verifikasi stateful domain
        source: "/(api|sanctum)/:path*",
        headers: [
          { key: "X-Forwarded-Host", value: "localhost:3000" },
        ],
      },
    ];
  },
};

export default nextConfig;