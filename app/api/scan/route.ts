import { checkScan, computeStatus } from '@/lib/game';
import { error, json, meResponse } from '@/lib/http';
import { currentPlayer } from '@/lib/session';
import { getStore } from '@/lib/store';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const p = await currentPlayer();
  if (!p) return error('Regístrate primero', 401);

  const { value } = (await req.json().catch(() => ({}))) as { value?: string };
  if (typeof value !== 'string') return error('Ese no es un QR de la Experiencia Polar');
  const check = checkScan(p, value);
  if (!check.ok) return error(check.error);

  const status = computeStatus(p);
  if (status.phase === 'playing') return json(meResponse(p));
  if (status.phase === 'locked') return error('Esta trivia todavía no abre', 409);
  if (status.phase === 'final' || !status.trivia) return error('Ya completaste todas las trivias', 409);

  const updated = await getStore().updatePlayer(
    p.id,
    { current_trivia: status.trivia, current_question: 0, missed: false, trivia_puntos: 0 },
    { current_trivia: null },
  );
  // Si otro escaneo simultáneo ya abrió la trivia, devolvemos el estado actual.
  return json(meResponse(updated ?? (await getStore().getPlayer(p.id))));
}
