// Banco de preguntas. SOLO se importa en el servidor (API routes):
// el navegador nunca recibe cuál es la respuesta correcta.
//
// 40 preguntas: 10 por estación (la 4 es la más difícil). A cada jugador le tocan
// QUESTIONS_PER_TRIVIA preguntas al azar del banco de su estación (12 en total).
// Reemplaza los textos entre corchetes por las preguntas reales.
// `correct` es el índice (0-3) de la opción correcta.

export interface Question {
  text: string;
  options: [string, string, string, string];
  correct: 0 | 1 | 2 | 3;
}

export interface Trivia {
  id: number; // 1..4
  title: string;
  /** Banco de la estación: de aquí salen las preguntas de cada jugador. */
  bank: Question[];
}

function placeholder(trivia: number, q: number): Question {
  return {
    text: `[Pregunta ${q} de la estación ${trivia}]`,
    options: ['[Opción 1] (correcta)', '[Opción 2]', '[Opción 3]', '[Opción 4]'],
    correct: 0,
  };
}

const BANK_PER_TRIVIA = 10;
/** Preguntas que responde cada jugador en cada estación. */
export const QUESTIONS_PER_TRIVIA = 3;

export const TRIVIAS: Trivia[] = [1, 2, 3, 4].map((id) => ({
  id,
  title: `Trivia ${id}`,
  bank: Array.from({ length: BANK_PER_TRIVIA }, (_, i) => placeholder(id, i + 1)),
}));

export const TOTAL_TRIVIAS = TRIVIAS.length;

export function getTrivia(id: number): Trivia | undefined {
  return TRIVIAS.find((t) => t.id === id);
}

/** Sortea las preguntas de un jugador para una estación: índices del banco, sin repetir. */
export function drawQuestions(t: Trivia): number[] {
  const idx = t.bank.map((_, i) => i);
  for (let i = idx.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [idx[i], idx[j]] = [idx[j], idx[i]];
  }
  return idx.slice(0, Math.min(QUESTIONS_PER_TRIVIA, idx.length));
}

/**
 * Índices del banco que le tocaron al jugador. Si no hay sorteo guardado (partidas de antes del cambio),
 * usa las primeras del banco.
 */
export function questionIdsFor(t: Trivia, ids: number[] | null | undefined): number[] {
  const valid = (ids ?? []).filter((i) => Number.isInteger(i) && i >= 0 && i < t.bank.length);
  return valid.length ? valid : t.bank.slice(0, QUESTIONS_PER_TRIVIA).map((_, i) => i);
}
