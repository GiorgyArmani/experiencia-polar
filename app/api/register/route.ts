import { config } from '@/lib/config';
import { error, json, meResponse } from '@/lib/http';
import { LOOKS } from '@/lib/looks';
import { setPlayerCookie } from '@/lib/session';
import { getStore } from '@/lib/store';

export const dynamic = 'force-dynamic';

const clean = (v: unknown, max = 80) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return error('Solicitud inválida');
  }

  const nombre = clean(body.nombre);
  const email = clean(body.email, 120).toLowerCase();
  const telefono = clean(body.telefono, 30);
  const sede = clean(body.sede);
  const oso_nombre = clean(body.osoNombre, 24);
  const look = clean(body.look, 20);

  if (!oso_nombre) return error('Ponle nombre a tu oso');
  if (!LOOKS.some((l) => l.id === look)) return error('Elige un look para tu oso');
  if (nombre.length < 3) return error('Escribe tu nombre y apellido');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return error('Revisa tu correo');
  if (telefono.replace(/\D/g, '').length < 7) return error('Revisa tu teléfono');
  if (!config.sedes.includes(sede)) return error('Selecciona tu sede');

  const store = getStore();
  try {
    // Si el correo ya existe, recuperamos su partida en este teléfono.
    const existing = await store.getPlayerByEmail(email);
    if (existing) {
      setPlayerCookie(existing.id);
      return json({ ...meResponse(existing), recovered: true });
    }
    const player = await store.createPlayer({ nombre, email, telefono, sede, oso_nombre, look });
    setPlayerCookie(player.id);
    return json({ ...meResponse(player), recovered: false });
  } catch (e) {
    console.error('[register]', e);
    return error('No pudimos registrarte. Intenta de nuevo.', 500);
  }
}
