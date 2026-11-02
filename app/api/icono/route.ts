// Primera vez: después de entrar con la cédula, el jugador elige su ícono (símbolo + color).
import { isValidIcono, parseIcono } from '@/shared/icono';
import { error, json, meResponse } from '@/lib/http';
import { currentPlayer } from '@/lib/session';
import { getStore } from '@/lib/store';

import { CONCURSO_TERMINADO, MSG_TERMINADO } from '@/shared/cierre';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  if (CONCURSO_TERMINADO) return error(MSG_TERMINADO, 403);
  const p = await currentPlayer();
  if (!p) return error('Entra con tu cédula primero', 401);
  const { icono } = (await req.json().catch(() => ({}))) as { icono?: unknown };
  if (!isValidIcono(icono)) return error('Elige tu ícono');
  try {
    const updated = await getStore().updatePlayer(p.id, { avatar: parseIcono(icono) });
    return json(meResponse(updated ?? p));
  } catch (e) {
    console.error('[icono]', e);
    return error('No pudimos guardar tu ícono. Intenta de nuevo.', 500);
  }
}
