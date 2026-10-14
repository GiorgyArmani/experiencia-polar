// Sesión mínima: el id (UUID aleatorio, nunca se publica) del jugador.
// La web lo guarda en una cookie httpOnly; la app nativa lo envía como `Authorization: Bearer <id>`.
import 'server-only';
import { cookies, headers } from 'next/headers';
import { getStore } from './store';
import type { Player } from '@/shared/types';

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
  const bearer = /^Bearer\s+(.+)$/i.exec(headers().get('authorization') ?? '')?.[1];
  const id = bearer ?? cookies().get(COOKIE)?.value;
  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) return null;
  try {
    return await getStore().getPlayer(id);
  } catch (e) {
    console.error('[session]', e);
    return null;
  }
}
