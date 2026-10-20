// Acceso solo con la cédula. Si ya jugó, recupera su partida; si es la primera vez y está en la nómina de UEP,
// se crea su partida con el nombre, la localidad y el estado de la nómina (no se le pide nada más).
import { DEFAULT_ICONO } from '@/shared/icono';
import type { RegisterResponse } from '@/shared/types';
import { config } from '@/lib/config';
import { error, json, meResponse } from '@/lib/http';
import { setPlayerCookie } from '@/lib/session';
import { getStore } from '@/lib/store';

export const dynamic = 'force-dynamic';

/** Para comparar sin importar mayúsculas, acentos ni espacios de más. */
const norm = (v: string) => v.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim().toLowerCase();

/** "MARIA JOSE PEREZ" → "Maria Jose Perez" (la nómina puede venir en mayúsculas). */
function titulo(v: string) {
  const t = v.replace(/\s+/g, ' ').trim();
  if (t !== t.toUpperCase()) return t;
  return t.toLowerCase().replace(/(^|\s)(\p{L})/gu, (_, s, c) => s + c.toUpperCase());
}

/** Nombre que sale en el ranking: "María Pérez Gómez" → "María P." */
function apodoDe(nombre: string) {
  const [primero, segundo] = nombre.split(' ');
  return (segundo ? `${primero} ${segundo[0]}.` : primero).slice(0, 24);
}

export async function POST(req: Request) {
  const { cedula } = (await req.json().catch(() => ({}))) as { cedula?: unknown };
  const digits = typeof cedula === 'string' ? cedula.replace(/\D/g, '') : '';
  if (digits.length < 5 || digits.length > 10) return error('Revisa tu cédula');

  const store = getStore();
  try {
    const existing = await store.getPlayerByCedula(digits);
    if (existing) {
      setPlayerCookie(existing.id);
      const res: RegisterResponse = { ...meResponse(existing), recovered: true, token: existing.id };
      return json(res);
    }

    const persona = await store.getNomina(digits);
    if (!persona) return error('No encontramos esa cédula. Revisa el número y vuelve a intentarlo.', 404);

    const nombre = titulo(persona.nombre);
    // Si la localidad de la nómina coincide con una del listado, se usa ese nombre exacto (el del ranking).
    const sede = config.sedes.find((s) => norm(s.name) === norm(persona.localidad))?.name ?? persona.localidad.trim();
    const player = await store.createPlayer({
      nombre,
      cedula: digits,
      email: null,
      telefono: null,
      sede,
      estado: persona.estado?.trim() || null,
      oso_nombre: apodoDe(nombre),
      avatar: DEFAULT_ICONO,
    });
    setPlayerCookie(player.id);
    const res: RegisterResponse = { ...meResponse(player), recovered: false, token: player.id };
    return json(res);
  } catch (e) {
    // Dos entradas simultáneas con la misma cédula: el índice único gana; la otra recupera la partida.
    if (/duplicate|unique/i.test(String((e as Error)?.message))) {
      const p = await store.getPlayerByCedula(digits).catch(() => null);
      if (p) {
        setPlayerCookie(p.id);
        return json<RegisterResponse>({ ...meResponse(p), recovered: true, token: p.id });
      }
    }
    console.error('[login]', e);
    return error('No pudimos entrar. Intenta de nuevo.', 500);
  }
}
