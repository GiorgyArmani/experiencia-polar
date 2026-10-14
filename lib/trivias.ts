// Banco de preguntas. SOLO se importa en el servidor (API routes):
// el navegador nunca recibe cuál es la respuesta correcta.
//
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
  questions: Question[];
}

function placeholder(trivia: number, q: number): Question {
  return {
    text: `[Pregunta ${q} de la trivia ${trivia}]`,
    options: ['[Opción 1] (correcta)', '[Opción 2]', '[Opción 3]', '[Opción 4]'],
    correct: 0,
  };
}

const QUESTIONS_PER_TRIVIA = 5;

export const TRIVIAS: Trivia[] = [1, 2, 3, 4].map((id) => ({
  id,
  title: `Trivia ${id}`,
  questions: Array.from({ length: QUESTIONS_PER_TRIVIA }, (_, i) => placeholder(id, i + 1)),
}));

export const TOTAL_TRIVIAS = TRIVIAS.length;

export function getTrivia(id: number): Trivia | undefined {
  return TRIVIAS.find((t) => t.id === id);
}
