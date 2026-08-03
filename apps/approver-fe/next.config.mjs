/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://127.0.0.1:8000/api/:path*",
      },
      // Proxy /sanctum/csrf-cookie agar browser melihatnya sebagai same-origin
      // (localhost:3000 → 127.0.0.1:8000), sehingga cookie XSRF-TOKEN ter-set dengan benar
      {
        source: "/sanctum/:path*",
        destination: "http://127.0.0.1:8000/sanctum/:path*",
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