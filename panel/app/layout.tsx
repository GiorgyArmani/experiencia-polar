import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Panel de premiación · Experiencia UEP',
  robots: { index: false, follow: false },
  // El mismo ícono de la Experiencia UEP (copia de public/icon.png del juego).
  icons: { icon: '/icon.png', apple: '/icon.png' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
