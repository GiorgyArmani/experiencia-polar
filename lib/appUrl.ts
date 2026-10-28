// Dominio público que va dentro del QR impreso (<APP_URL>/q/POLAR).
// Sale de la variable APP_URL. Si no está o apunta a localhost (típico al desplegar en Docker/Dokploy),
// se usa el dominio por el que llegó la petición (cabeceras del proxy), nunca un dominio fijo en el código.
import { headers } from 'next/headers';
import { config } from '@/lib/config';

const LOCAL = /^(localhost|127\.|0\.0\.0\.0|\[::1\])/i;

function hostOf(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return '';
  }
}

export async function publicAppUrl(): Promise<string> {
  if (config.appUrl && !LOCAL.test(hostOf(config.appUrl))) return config.appUrl;

  const h = await headers();
  const host = (h.get('x-forwarded-host') ?? h.get('host') ?? '').split(',')[0].trim();
  if (host && !LOCAL.test(host)) {
    const proto = (h.get('x-forwarded-proto') ?? 'https').split(',')[0].trim();
    return `${proto}://${host}`;
  }
  // Solo en desarrollo local: no hay dominio público que usar.
  return config.appUrl || `http://${host || 'localhost:3000'}`;
}
