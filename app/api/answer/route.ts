import { computeStatus, deadlineOf, finishPatch, playerQuestions, questionView, speedPoints, toPublic, wrongPenalty } from '@/lib/game';
import { error, json } from '@/lib/http';
import { currentPlayer } from '@/lib/session';
import { getStore } from '@/lib/store';
import { FEEDBACK_MS, type AnswerResponse, type Player } from '@/shared/types';

export const dynamic = 'force-dynamic';

// Contrarreloj: correcta = puntos según rapidez (de 100 a 50); incorrecta = 0, salvo en la última estación,
// donde resta WRONG_PENALTY_LAST (sin bajar el total del jugador de 0). En ambos casos pasa a la siguiente.
export async function POST(req: Request) {
  // currentPlayer ya cerró la trivia si se le acabó el tiempo.
  const p = await currentPlayer();
  if (!p) return error('Regístrate primero', 401);
  if (!p.current_trivia) return error('Esta trivia ya terminó. Escanea el QR para la siguiente.', 409);

  const { option, index } = (await req.json().catch(() => ({}))) as { option?: number; index?: number };
  if (typeof option !== 'number' || !Number.isInteger(option) || option < 0) return error('Respuesta inválida');
  // Evita respuestas duplicadas (doble toque o pestaña vieja).
  if (typeof index === 'number' && index !== p.current_question) return error('Esa pregunta ya fue respondida', 409);

  const pq = playerQuestions(p);
  const bankIndex = pq?.ids[p.current_question];
  const q = pq && bankIndex !== undefined ? pq.trivia.bank[bankIndex] : undefined;
  if (!pq || bankIndex === undefined || !q) return error('Pregunta no encontrada', 404);
  if (option >= q.options.length) return error('Respuesta inválida');
  const trivia = pq.trivia;

  const now = new Date();
  // Mientras se muestra el mapa todavía no se puede responder.
  if (p.current_question === 0 && p.trivia_started_at && now.getTime() < new Date(p.trivia_started_at).getTime() - 500) {
    return error('El nivel aún no empieza', 409);
  }
  const correct = option === q.correct;
  const pointsEarned = correct ? speedPoints(p, now) : -Math.min(wrongPenalty(trivia.id), p.puntos);
  const scored = { puntos: p.puntos + pointsEarned, trivia_puntos: (p.trivia_puntos ?? 0) + pointsEarned };
  const nextIndex = p.current_question + 1;
  const triviaDone = nextIndex >= pq.ids.length;
  // Tras responder se muestra el aviso de correcta/incorrecta (FEEDBACK_MS): el reloj se pausa ese rato,
  // corriendo el arranque del nivel. Si ya estaba en el margen final, no se le regala tiempo.
  const deadline = deadlineOf(p);
  const pause = deadline && now < deadline ? FEEDBACK_MS : 0;
  const shift = (iso: string | null) => (iso ? new Date(new Date(iso).getTime() + pause).toISOString() : iso);
  const patch: Partial<Player> = triviaDone
    ? finishPatch(p, scored)
    : {
        ...scored,
        current_question: nextIndex,
        trivia_started_at: shift(p.trivia_started_at),
        question_started_at: new Date(now.getTime() + pause).toISOString(),
      };

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
    correctOption: q.correct,
    explanation: q.explanation ?? null,
    pointsEarned,
    triviaDone,
    triviaPoints: updated.trivia_puntos ?? 0,
    player: toPublic(updated),
    status: computeStatus(updated),
    question: questionView(updated),
  };
  return json(res);
}
