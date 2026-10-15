import { isValidAvatar, parseAvatar } from '@/shared/avatar';
import type { RegisterResponse } from '@/shared/types';
import { sedeByCode, sedeByName } from '@/lib/config';
import { error, json, meResponse } from '@/lib/http';
import { setPlayerCookie } from '@/lib/session';
import { getStore } from '@/lib/store';

export const dynamic = 'force-dynamic';

const clean = (v: unknown, max = 80) => (typeof v === 'string' ? v.trim().replace(/\s+/g, ' ').slice(0, max) : '');
/** "V-12.345.678" → "12345678" */
const soloDigitos = (v: string) => v.replace(/\D/g, '');
/** Para comparar nombres sin importar mayúsculas ni acentos. */
const norm = (v: string) => v.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return error('Solicitud inválida');
  }

  const nombre = clean(body.nombre);
  const cedula = soloDigitos(clean(body.cedula, 20));
  const email = clean(body.email, 120).toLowerCase() || null;
  // La app envía el código de la localidad elegida; la web envía el nombre.
  const sede = sedeByCode(clean(body.sedeCode, 40)) ?? sedeByName(clean(body.sede));
  const oso_nombre = clean(body.apodo, 24);

  if (!oso_nombre) return error('Escribe tu apodo para el ranking');
  if (!isValidAvatar(body.avatar)) return error('Termina de crear tu avatar');
  if (nombre.split(' ').length < 2 || nombre.length < 5) return error('Escribe tu nombre completo');
  if (cedula.length < 5 || cedula.length > 10) return error('Revisa tu cédula');
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return error('Revisa tu correo (o déjalo vacío)');
  if (!sede) return error('Elige tu localidad');

  const store = getStore();
  try {
    // Si la cédula ya existe y el primer nombre coincide, recuperamos su partida en este dispositivo.
    const existing = await store.getPlayerByCedula(cedula);
    if (existing) {
      if (norm(existing.nombre).split(' ')[0] !== norm(nombre).split(' ')[0]) {
        return error('Esa cédula ya está registrada. Toca «Entra con tu cédula» para recuperar tu partida.', 409);
      }
      setPlayerCookie(existing.id);
      const res: RegisterResponse = { ...meResponse(existing), recovered: true, token: existing.id };
      return json(res);
    }
    const player = await store.createPlayer({
      nombre,
      cedula,
      email,
      telefono: null,
      sede: sede.name,
      oso_nombre,
      avatar: parseAvatar(body.avatar),
    });
    setPlayerCookie(player.id);
    const res: RegisterResponse = { ...meResponse(player), recovered: false, token: player.id };
    return json(res);
  } catch (e) {
    // Dos registros simultáneos con la misma cédula (o el mismo correo): el índice único gana.
    const msg = String((e as Error)?.message);
    if (/duplicate|unique/i.test(msg)) {
      return error(/email/i.test(msg) ? 'Ese correo ya está registrado' : 'Esa cédula ya está registrada', 409);
    }
    console.error('[register]', e);
    return error('No pudimos registrarte. Intenta de nuevo.', 500);
  }
}
