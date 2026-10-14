import { isValidAvatar, parseAvatar } from '@/shared/avatar';
import type { RegisterResponse } from '@/shared/types';
import { sedeByCode, sedeByName } from '@/lib/config';
import { error, json, meResponse } from '@/lib/http';
import { setPlayerCookie } from '@/lib/session';
import { getStore } from '@/lib/store';

export const dynamic = 'force-dynamic';

const clean = (v: unknown, max = 80) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const digits = (v: string) => v.replace(/\D/g, '');

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
  // La app envía el código de sede leído del QR; la web puede enviar el nombre.
  const sede = sedeByCode(clean(body.sedeCode, 24)) ?? sedeByName(clean(body.sede));
  const oso_nombre = clean(body.osoNombre, 24);

  if (!oso_nombre) return error('Ponle nombre a tu oso');
  if (!isValidAvatar(body.avatar)) return error('Termina de vestir a tu oso');
  if (nombre.length < 3) return error('Escribe tu nombre y apellido');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return error('Revisa tu correo');
  if (digits(telefono).length < 7) return error('Revisa tu teléfono');
  if (!sede) return error('Escanea el QR de tu sede para registrarte');

  const store = getStore();
  try {
    // Si el correo ya existe y el teléfono coincide, recuperamos su partida en este dispositivo.
    const existing = await store.getPlayerByEmail(email);
    if (existing) {
      if (digits(existing.telefono) !== digits(telefono)) {
        return error('Ese correo ya está registrado con otro teléfono', 409);
      }
      setPlayerCookie(existing.id);
      const res: RegisterResponse = { ...meResponse(existing), recovered: true, token: existing.id };
      return json(res);
    }
    const player = await store.createPlayer({
      nombre,
      email,
      telefono,
      sede: sede.name,
      oso_nombre,
      avatar: parseAvatar(body.avatar),
    });
    setPlayerCookie(player.id);
    const res: RegisterResponse = { ...meResponse(player), recovered: false, token: player.id };
    return json(res);
  } catch (e) {
    // Dos registros simultáneos con el mismo correo: el índice único gana.
    if (/duplicate|unique/i.test(String((e as Error)?.message))) return error('Ese correo ya está registrado', 409);
    console.error('[register]', e);
    return error('No pudimos registrarte. Intenta de nuevo.', 500);
  }
}
