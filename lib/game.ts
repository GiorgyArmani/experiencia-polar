// Reglas del juego. Todo se decide en el servidor con la hora del servidor,
// así nadie avanza cambiando la hora del teléfono.
import 'server-only';
import { getTrivia, TOTAL_TRIVIAS } from './trivias';
import { isExperienceQr } from '@/shared/qr';
import type { GameStatus, Player, PublicPlayer, QuestionView } from '@/shared/types';
import { config } from './config';
import { getStore } from './store';

export function toPublic(p: Player): PublicPlayer {
  return {
    nombre: p.nombre,
    sede: p.sede,
    osoNombre: p.oso_nombre,
    avatar: p.avatar,
    puntos: p.puntos,
    completed: p.completed ?? [],
  };
}

/** Siguiente trivia que el jugador no ha completado (1..4) o null si terminó. */
function nextTrivia(p: Player): number | null {
  for (let i = 1; i <= TOTAL_TRIVIAS; i++) if (!p.completed.includes(i)) return i;
  return null;
}

export function computeStatus(p: Player, now = new Date()): GameStatus {
  const base = { totalTrivias: TOTAL_TRIVIAS, serverNow: now.toISOString() };

  if (p.current_trivia) {
    return { ...base, phase: 'playing', trivia: p.current_trivia, opensAt: null, closesAt: closesAtFor(p.current_trivia) };
  }

  const next = nextTrivia(p);
  if (next === null) return { ...base, phase: 'final', trivia: null, opensAt: null, closesAt: null };

  if (config.mode === 'demo') {
    // La primera trivia está abierta; cada siguiente abre N segundos después de terminar la anterior.
    if (!p.last_completed_at || next === 1) {
      return { ...base, phase: 'scan', trivia: next, opensAt: null, closesAt: null };
    }
    const opens = new Date(new Date(p.last_completed_at).getTime() + config.demoWaitSeconds * 1000);
    if (now < opens) return { ...base, phase: 'locked', trivia: next, opensAt: opens.toISOString(), closesAt: null };
    return { ...base, phase: 'scan', trivia: next, opensAt: null, closesAt: null };
  }

  // Modo horario: cada trivia tiene su ventana. Si una ventana ya cerró sin jugarla, se salta.
  for (let t = next; t <= TOTAL_TRIVIAS; t++) {
    if (p.completed.includes(t)) continue;
    const w = config.windows[t - 1];
    if (!w) continue;
    const opens = new Date(w.opensAt);
    const closes = new Date(w.closesAt);
    if (now >= closes) continue;
    if (now < opens) return { ...base, phase: 'locked', trivia: t, opensAt: w.opensAt, closesAt: w.closesAt };
    return { ...base, phase: 'scan', trivia: t, opensAt: null, closesAt: w.closesAt };
  }
  return { ...base, phase: 'final', trivia: null, opensAt: null, closesAt: null };
}

function closesAtFor(trivia: number): string | null {
  if (config.mode !== 'schedule') return null;
  return config.windows[trivia - 1]?.closesAt ?? null;
}

export function questionView(p: Player): QuestionView | null {
  if (!p.current_trivia) return null;
  const t = getTrivia(p.current_trivia);
  if (!t) return null;
  const q = t.questions[p.current_question];
  if (!q) return null;
  return {
    trivia: t.id,
    index: p.current_question,
    total: t.questions.length,
    text: q.text,
    options: [...q.options],
  };
}

export type ScanResult = { ok: true; player: Player } | { ok: false; error: string; status: number };

/** Escaneo del QR por un jugador registrado: abre la trivia disponible según su progreso. */
export async function scanQr(p: Player): Promise<ScanResult> {
  const status = computeStatus(p);
  if (status.phase === 'playing') return { ok: true, player: p };
  if (status.phase === 'locked') return { ok: false, error: 'Esta trivia todavía no abre', status: 409 };
  if (status.phase === 'final' || !status.trivia) return { ok: false, error: 'Ya completaste todas las trivias', status: 409 };

  const store = getStore();
  const updated = await store.updatePlayer(
    p.id,
    { current_trivia: status.trivia, current_question: 0, missed: false, trivia_puntos: 0 },
    { current_trivia: null },
  );
  // Si otro escaneo simultáneo ya abrió la trivia, devolvemos el estado actual.
  return { ok: true, player: updated ?? (await store.getPlayer(p.id)) ?? p };
}
