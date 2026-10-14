// Contrato de la API: lo comparten el servidor (Next.js), la web y la app nativa (Expo).
import type { Avatar } from './avatar';

export interface Sede {
  code: string; // va en el QR: https://experienciapolar.aulaciete.com/q/<code>
  name: string;
}

export interface Player {
  id: string;
  nombre: string;
  email: string;
  telefono: string;
  sede: string; // nombre de la sede
  oso_nombre: string;
  avatar: Avatar;
  puntos: number;
  completed: number[];
  current_trivia: number | null;
  current_question: number;
  missed: boolean;
  trivia_puntos: number; // puntos de la trivia en curso o la última terminada
  last_completed_at: string | null;
  created_at: string;
  updated_at: string;
}

/** Lo que el cliente ve del jugador (sin email ni teléfono). */
export interface PublicPlayer {
  nombre: string;
  sede: string;
  osoNombre: string;
  avatar: Avatar;
  puntos: number;
  completed: number[];
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
  recovered: boolean;
  /** Para la app nativa: se envía como `Authorization: Bearer <token>`. La web usa cookie. */
  token: string;
}

/** Respuesta de /api/qr: a qué sede pertenece un QR (para el onboarding). */
export interface QrResponse {
  sede: Sede;
}

export interface AnswerResponse {
  correct: boolean;
  pointsEarned: number;
  triviaDone: boolean;
  triviaPoints: number;
  player: PublicPlayer;
  status: GameStatus;
  question: QuestionView | null;
}

export interface LeaderRow {
  rank: number;
  osoNombre: string;
  avatar: Avatar;
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
