// Solo para pruebas: adelanta el reloj del jugador para abrir la próxima trivia.
import { config } from '@/lib/config';
import { error, json, meResponse } from '@/lib/http';
import { currentPlayer } from '@/lib/session';
import { getStore } from '@/lib/store';

export const dynamic = 'force-dynamic';

export async function POST() {
  if (!config.demoTools || config.mode !== 'demo') return error('No disponible', 404);
  const p = await currentPlayer();
  if (!p) return error('Regístrate primero', 401);
  const past = new Date(Date.now() - (config.demoWaitSeconds + 1) * 1000).toISOString();
  const updated = await getStore().updatePlayer(p.id, { last_completed_at: past });
  return json(meResponse(updated));
}
