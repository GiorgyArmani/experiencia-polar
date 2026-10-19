// Banco de preguntas. SOLO se importa en el servidor (API routes):
// el navegador nunca recibe cuál es la respuesta correcta.
//
// Cada estación es un nivel del mapa. A cada jugador le tocan QUESTIONS_PER_TRIVIA preguntas
// al azar del banco de su estación (si el banco tiene menos, le tocan todas).
// `correct` es el índice de la opción correcta (las preguntas de verdadero/falso tienen 2 opciones).
import { ESTACIONES } from '@/shared/estaciones';

export interface Question {
  text: string;
  options: string[]; // 2 a 4
  correct: number;
}

export interface Trivia {
  id: number; // 1..4
  title: string;
  /** Banco de la estación: de aquí salen las preguntas de cada jugador. */
  bank: Question[];
}

/** Preguntas que responde cada jugador en cada estación. */
export const QUESTIONS_PER_TRIVIA = 3;

const q = (text: string, options: string[], correct: number): Question => ({ text, options, correct });
const VF = ['Verdadero', 'Falso'];

const BANKS: Record<number, Question[]> = {
  // Estación 1 · Plataforma UEP (banco completo, enviado por la UEP)
  1: [
    q('¿Sabes en qué año nació la Universidad Empresas Polar?', ['2021', '2022', '2023', '2024'], 1),
    q('¿Recuerdas en qué año se estrenó la app de la UEP?', ['2022', '2023', '2024', '2025'], 3),
    q(
      '¿Cuál es el objetivo principal de la plataforma de la Universidad Empresas Polar?',
      [
        'Tu formación integral y el desarrollo de competencias requeridas en tu rol',
        'Gestionar exclusivamente la nómina y beneficios de los colaboradores',
        'Evaluar el desempeño anual de los trabajadores',
        'Ofrecer eventos de entretenimiento presenciales para la organización',
      ],
      0,
    ),
    q(
      '¿Cuántas líneas educativas contempla el Modelo de Aprendizaje propio de la UEP?',
      ['2 líneas educativas', '3 líneas educativas', '4 líneas educativas', '5 líneas educativas'],
      1,
    ),
    q(
      '¿Qué busca desarrollar la Línea Individual del Modelo de Aprendizaje?',
      [
        'Capacidades específicas y especializadas por área',
        'Capacidades asociadas a la ejecución del rol en la organización',
        'Habilidades humanas y comportamientos de Gente Polar',
        'Entrenamiento exclusivo de directivos y gerentes',
      ],
      2,
    ),
    q(
      'Si la Línea Individual desarrolla capacidades humanas… ¿qué capacidades aborda la Línea Organizacional?',
      [
        'Capacidades técnicas específicas de cada área operativa',
        'Capacidades asociadas a la ejecución del rol dentro de la organización',
        'Habilidades exclusivamente académicas y teóricas',
        'Competencias en idiomas extranjeros',
      ],
      1,
    ),
    q(
      '¿Cuál es el enfoque principal de la Línea Técnica especializada?',
      [
        'Habilidades humanas de liderazgo y empatía',
        'Capacidades asociadas únicamente al clima organizacional',
        'Capacidades específicas y especializadas requeridas por el área a la que perteneces',
        'Integración y convivencia corporativa',
      ],
      2,
    ),
    q(
      '¿Quiénes tienen acceso a la plataforma de la Universidad Empresas Polar?',
      [
        'Únicamente el personal directivo y gerencial',
        'Todos los trabajadores de la organización',
        'Solo los trabajadores del área técnica',
        'Exclusivamente los empleados de nuevo ingreso',
      ],
      1,
    ),
    q(
      '¿Qué modalidades de formación te ofrece la UEP?',
      ['Únicamente presenciales', 'Únicamente virtuales', 'Exclusivamente guías impresas', 'Tanto presenciales como virtuales'],
      3,
    ),
    q(
      '¿Sabes qué ventaja de conexión te da la app de la UEP?',
      [
        'Requiere conexión a internet por fibra óptica',
        'Solo funciona con la red interna de la empresa',
        'Permite usar algunos recursos sin conexión (offline)',
        'Funciona únicamente con mensajes de texto (SMS)',
      ],
      2,
    ),
  ],
  // Estación 2 · Biblioteca UEP (la UEP enviará más preguntas)
  2: [
    q(
      '¿En qué fecha sumamos la Biblioteca UEP a nuestro ecosistema de aprendizaje?',
      ['Marzo de 2025', 'Noviembre de 2024', 'Enero de 2023', 'Julio de 2024'],
      1,
    ),
    q(
      '¿Qué hace únicos a los contenidos de la Biblioteca UEP?',
      [
        'Solo tiene documentos en PDF y en español',
        'Ofrece recursos exclusivamente impresos',
        'Maneja recursos en distintos idiomas y formatos',
        'Solo se puede consultar en horario de oficina',
      ],
      2,
    ),
  ],
  // Estación 3 · Unidad Móvil (la UEP enviará más preguntas)
  3: [
    q('¿En qué mes y año arrancó motores la Unidad Móvil de la UEP?', ['Febrero de 2026', 'Marzo de 2026', 'Abril de 2026', 'Mayo de 2025'], 1),
    q('¿Cuál fue la primera planta que visitó la UEP Móvil?', ['Caucagua', 'San Joaquín', 'Turmero', 'San Pedro'], 0),
    q('La Unidad Móvil puede operar con energía fotovoltaica.', VF, 0),
    q('La Unidad Móvil tiene características sustentables.', VF, 0),
    q('En su primera gira, la Unidad Móvil recorrió más de 4.000 kilómetros.', VF, 0),
  ],
  // Estación 4 · Líneas educativas: PENDIENTE. La UEP aún no envía estas preguntas.
  4: Array.from({ length: QUESTIONS_PER_TRIVIA }, (_, i) =>
    q(`[Pregunta ${i + 1} de la estación 4 · pendiente]`, ['[Opción 1] (correcta)', '[Opción 2]', '[Opción 3]', '[Opción 4]'], 0),
  ),
};

export const TRIVIAS: Trivia[] = ESTACIONES.map((e) => ({ id: e.id, title: e.nombre, bank: BANKS[e.id] ?? [] }));

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
