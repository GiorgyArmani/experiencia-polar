// "Ya tengo cuenta": recupera la sesión en otro navegador o teléfono solo con la cédula.
import type { RegisterResponse } from '@/shared/types';
import { error, json, meResponse } from '@/lib/http';
import { setPlayerCookie } from '@/lib/session';
import { getStore } from '@/lib/store';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const { cedula } = (await req.json().catch(() => ({}))) as { cedula?: unknown };
  const digits = typeof cedula === 'string' ? cedula.replace(/\D/g, '') : '';
  if (digits.length < 5 || digits.length > 10) return error('Revisa tu cédula');

  try {
    const player = await getStore().getPlayerByCedula(digits);
    if (!player) return error('No encontramos esa cédula. Si es tu primera vez, regístrate.', 404);
    setPlayerCookie(player.id);
    const res: RegisterResponse = { ...meResponse(player), recovered: true, token: player.id };
    return json(res);
  } catch (e) {
    console.error('[login]', e);
    return error('No pudimos entrar. Intenta de nuevo.', 500);
  }
}
