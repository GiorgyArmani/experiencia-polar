import { computeStatus, finishPatch, playerQuestions, questionView, speedPoints, toPublic, wrongPenalty } from '@/lib/game';
import { error, json } from '@/lib/http';
import { currentPlayer } from '@/lib/session';
import { getStore } from '@/lib/store';
import type { AnswerResponse, Player } from '@/shared/types';

export const dynamic = 'force-dynamic';

// Contrarreloj: correcta = puntos según rapidez (de 100 a 50); incorrecta = 0, salvo en la última estación,
// donde resta WRONG_PENALTY_LAST (sin bajar el total del jugador de 0). En ambos casos pasa a la siguiente.
export async function POST(req: Request) {
  // currentPlayer ya cerró la trivia si se le acabó el tiempo.
  const p = await currentPlayer();
  if (!p) return error('Regístrate primero', 401);
  if (!p.current_trivia) return error('Esta trivia ya terminó. Escanea el QR para la siguiente.', 409);

  const { option, index } = (await req.json().catch(() => ({}))) as { option?: number; index?: number };
  if (typeof option !== 'number' || option < 0 || option > 3) return error('Respuesta inválida');
  // Evita respuestas duplicadas (doble toque o pestaña vieja).
  if (typeof index === 'number' && index !== p.current_question) return error('Esa pregunta ya fue respondida', 409);

  const pq = playerQuestions(p);
  const bankIndex = pq?.ids[p.current_question];
  const q = pq && bankIndex !== undefined ? pq.trivia.bank[bankIndex] : undefined;
  if (!pq || bankIndex === undefined || !q) return error('Pregunta no encontrada', 404);
  const trivia = pq.trivia;

  const now = new Date();
  const correct = option === q.correct;
  const pointsEarned = correct ? speedPoints(p, now) : -Math.min(wrongPenalty(trivia.id), p.puntos);
  const scored = { puntos: p.puntos + pointsEarned, trivia_puntos: (p.trivia_puntos ?? 0) + pointsEarned };
  const nextIndex = p.current_question + 1;
  const triviaDone = nextIndex >= pq.ids.length;
  const patch: Partial<Player> = triviaDone
    ? finishPatch(p, scored)
    : { ...scored, current_question: nextIndex, question_started_at: now.toISOString() };

  // Solo aplica si sigue en esta misma pregunta: un doble toque no suma dos veces.
  const store = getStore();
  const updated = await store.updatePlayer(p.id, patch, {
    current_trivia: p.current_trivia,
    current_question: p.current_question,
  });
  if (!updated) return error('Esa pregunta ya fue respondida', 409);
  await store.logAnswer({
    player_id: p.id,
    trivia: trivia.id,
    question: bankIndex, // índice en el banco de la estación (no el orden en que le salió)
    option_idx: option,
    correct,
  });

  const res: AnswerResponse = {
    correct,
    pointsEarned,
    triviaDone,
    triviaPoints: updated.trivia_puntos ?? 0,
    player: toPublic(updated),
    status: computeStatus(updated),
    question: questionView(updated),
  };
  return json(res);
}
