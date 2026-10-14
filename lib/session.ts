// Sesión mínima: una cookie httpOnly con el id (UUID) del jugador.
import 'server-only';
import { cookies } from 'next/headers';
import { getStore } from './store';
import type { Player } from './types';

const COOKIE = 'polar_player';
const MAX_AGE = 60 * 60 * 24 * 60; // 60 días

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
  const id = cookies().get(COOKIE)?.value;
  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) return null;
  try {
    return await getStore().getPlayer(id);
  } catch (e) {
    console.error('[session]', e);
    return null;
  }
}
