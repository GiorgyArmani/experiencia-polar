// Tipos compartidos entre servidor y cliente.

export interface Player {
  id: string;
  nombre: string;
  email: string;
  telefono: string;
  sede: string;
  oso_nombre: string;
  look: string;
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

/** Lo que el navegador ve del jugador (sin email ni teléfono). */
export interface PublicPlayer {
  id: string;
  nombre: string;
  sede: string;
  osoNombre: string;
  look: string;
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
  sedes: string[];
  demoTools: boolean;
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
  look: string;
  puntos: number;
  isMe: boolean;
}

export interface SedeRow {
  rank: number;
  sede: string;
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
