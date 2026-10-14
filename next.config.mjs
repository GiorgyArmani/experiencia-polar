/** @type {import('next').NextConfig} */
const nextConfig = {
  // "standalone" genera un servidor Node mínimo para Docker (Dokploy).
  // En Vercel se ignora sin problema.
  output: 'standalone',
  reactStrictMode: true,
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          // La cámara solo se pide desde nuestro propio dominio.
          { key: 'Permissions-Policy', value: 'camera=(self)' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ];
  },
};

export default nextConfig;
