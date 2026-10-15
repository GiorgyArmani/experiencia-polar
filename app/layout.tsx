import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Experiencia UEP',
  description: 'Busca los QR, responde las trivias y suma puntos para tu localidad.',
  icons: { icon: '/icon.png', apple: '/icon.png' },
  appleWebApp: { capable: true, title: 'Experiencia UEP', statusBarStyle: 'default' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#0079C7',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
