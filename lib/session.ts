// Sesión mínima: el id (UUID aleatorio, nunca se publica) del jugador.
// La web lo guarda en una cookie httpOnly; la app nativa lo envía como `Authorization: Bearer <id>`.
import 'server-only';
import { cookies, headers } from 'next/headers';
import { settleTimeUp } from './game';
import { getStore } from './store';
import type { Player } from '@/shared/types';

const COOKIE = 'polar_player';
// Sin contraseñas: el jugador queda logueado para siempre en su navegador.
// 400 días es el máximo que aceptan los navegadores; /api/me la renueva en cada visita.
const MAX_AGE = 60 * 60 * 24 * 400;

export function setPlayerCookie(id: string) {
  cookies().set(COOKIE, id, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: MAX_AGE,
  });
}

export function clearPlayerCookie() {
  cookies().delete(COOKIE);
}

export async function currentPlayer(): Promise<Player | null> {
  const bearer = /^Bearer\s+(.+)$/i.exec(headers().get('authorization') ?? '')?.[1];
  const id = bearer ?? cookies().get(COOKIE)?.value;
  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) return null;
  try {
    const p = await getStore().getPlayer(id);
    // Si se le acabó el tiempo de la trivia, se cierra aquí (cualquier petición lo detecta).
    return p ? await settleTimeUp(p) : null;
  } catch (e) {
    console.error('[session]', e);
    return null;
  }
}
