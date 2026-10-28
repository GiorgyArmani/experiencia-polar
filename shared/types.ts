// Contrato de la API: lo comparten el servidor (Next.js), la web y la app nativa (Expo).
import type { Icono } from './icono';

export interface Sede {
  code: string; // ?sede=<code> en el leaderboard
  name: string;
}

export interface Player {
  id: string;
  nombre: string; // nombre completo
  cedula: string; // identifica al jugador (solo dígitos); con ella recupera su partida en otro teléfono
  email: string | null; // opcional: no todos tienen correo corporativo
  telefono: string | null; // ya no se pide (versiones anteriores)
  sede: string; // nombre de la localidad (viene de la nómina de UEP)
  estado: string | null; // estado de Venezuela (viene de la nómina de UEP)
  oso_nombre: string; // apodo que sale en el ranking (la columna conserva su nombre de cuando había un oso)
  avatar: Icono; // ícono del jugador (la columna conserva el nombre "avatar")
  puntos: number;
  completed: number[];
  current_trivia: number | null;
  current_question: number;
  question_ids: number[]; // preguntas del banco que le tocaron en la trivia en curso (sorteadas al escanear)
  missed: boolean; // sin uso desde que la trivia es contrarreloj (fallar pasa a la siguiente)
  trivia_puntos: number; // puntos de la trivia en curso o la última terminada
  trivia_started_at: string | null; // arranca el reloj de la trivia (al escanear)
  question_started_at: string | null; // cuándo vio la pregunta actual (para el puntaje por rapidez)
  last_completed_at: string | null;
  tiempo_ms: number; // tiempo total jugando los niveles (desempate para la premiación)
  created_at: string;
  updated_at: string;
}

/** Lo que el cliente ve del jugador (sin email ni teléfono). */
export interface PublicPlayer {
  nombre: string;
  sede: string;
  apodo: string;
  icono: Icono;
  puntos: number;
  completed: number[];
  triviaPuntos: number; // puntos de la trivia en curso o la última terminada
}

export type Phase =
  | 'scan' // hay una trivia abierta: buscar el QR
  | 'playing' // ya escaneó y está respondiendo
  | 'locked' // esperando que abra la próxima trivia
  | 'final'; // terminó (o ya no quedan trivias)

export interface GameStatus {
  phase: Phase;
  trivia: number | null; // trivia abierta o en curso, o la próxima que abrirá
  opensAt: string | null; // si está bloqueada, cuándo abre
  closesAt: string | null; // si está abierta, hasta cuándo
  deadline: string | null; // jugando: hasta cuándo hay para terminar la trivia (contrarreloj)
  startsAt: string | null; // jugando: cuándo arranca el reloj (antes se muestra el mapa)
  limitSeconds: number; // tiempo total de cada trivia
  wrongPenalty: number; // puntos que resta cada incorrecta en la trivia abierta o en curso (0 = no resta)
  totalTrivias: number;
  serverNow: string;
}

export interface QuestionView {
  trivia: number;
  index: number; // 0-based
  total: number;
  text: string;
  options: string[];
}

export interface MeResponse {
  player: PublicPlayer | null;
  status: GameStatus | null;
  question: QuestionView | null;
  sedes: Sede[];
  demoTools: boolean;
}

export interface RegisterResponse extends MeResponse {
  recovered: boolean; // false = primera vez (el cliente lo lleva a elegir su ícono)
  /** Para la app nativa: se envía como `Authorization: Bearer <token>`. La web usa cookie. */
  token: string;
}

/** Respuesta de /api/qr: el QR es válido; el jugador elige su sede en el onboarding. */
export interface QrResponse {
  sedes: Sede[];
}

/** Cuánto se muestra el aviso de correcta/incorrecta tras responder. El reloj del nivel se pausa mientras tanto. */
export const FEEDBACK_MS = 7000;

export interface AnswerResponse {
  correct: boolean;
  correctOption: number; // índice de la opción correcta (se revela solo después de responder)
  explanation: string | null; // respuesta clave que envía la UEP (si la hay)
  pointsEarned: number;
  triviaDone: boolean;
  triviaPoints: number;
  player: PublicPlayer;
  status: GameStatus;
  question: QuestionView | null;
}

export interface LeaderRow {
  rank: number;
  apodo: string;
  icono: Icono;
  puntos: number;
  graduado: boolean;
  isMe: boolean;
}

export interface SedeRow {
  rank: number;
  sede: string;
  code: string;
  puntos: number;
  jugadores: number;
  isMine: boolean;
}

export interface LeaderboardResponse {
  sede: string | null;
  top: LeaderRow[];
  me: LeaderRow | null;
  sedes: SedeRow[];
}

