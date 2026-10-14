import { config } from '@/lib/config';
import { computeStatus, questionView, toPublic } from '@/lib/game';
import { error, json } from '@/lib/http';
import { currentPlayer } from '@/lib/session';
import { getStore } from '@/lib/store';
import { getTrivia } from '@/lib/trivias';
import type { AnswerResponse, Player } from '@/shared/types';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const p = await currentPlayer();
  if (!p) return error('Regístrate primero', 401);
  if (!p.current_trivia) return error('Escanea el QR para empezar la trivia', 409);

  const { option, index } = (await req.json().catch(() => ({}))) as { option?: number; index?: number };
  if (typeof option !== 'number' || option < 0 || option > 3) return error('Respuesta inválida');
  // Evita respuestas duplicadas (doble toque o pestaña vieja).
  if (typeof index === 'number' && index !== p.current_question) return error('Esa pregunta ya fue respondida', 409);

  const trivia = getTrivia(p.current_trivia);
  const q = trivia?.questions[p.current_question];
  if (!trivia || !q) return error('Pregunta no encontrada', 404);

  const store = getStore();
  const correct = option === q.correct;
  let patch: Partial<Player>;
  let pointsEarned = 0;
  let triviaDone = false;

  if (!correct) {
    // Puede reintentar, pero esa pregunta ya no suma puntos.
    patch = { missed: true };
  } else {
    pointsEarned = p.missed ? 0 : config.pointsPerCorrect;
    const triviaPuntos = (p.trivia_puntos ?? 0) + pointsEarned;
    const nextIndex = p.current_question + 1;
    if (nextIndex >= trivia.questions.length) {
      triviaDone = true;
      patch = {
        puntos: p.puntos + pointsEarned,
        trivia_puntos: triviaPuntos,
        completed: [...new Set([...(p.completed ?? []), trivia.id])].sort((a, b) => a - b),
        current_trivia: null,
        current_question: 0,
        missed: false,
        last_completed_at: new Date().toISOString(),
      };
    } else {
      patch = { puntos: p.puntos + pointsEarned, trivia_puntos: triviaPuntos, current_question: nextIndex, missed: false };
    }
  }

  // Solo aplica si sigue en esta misma pregunta: un doble toque no suma dos veces.
  const updated = await store.updatePlayer(p.id, patch, {
    current_trivia: p.current_trivia,
    current_question: p.current_question,
  });
  if (!updated) return error('Esa pregunta ya fue respondida', 409);
  await store.logAnswer({
    player_id: p.id,
    trivia: trivia.id,
    question: p.current_question,
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
