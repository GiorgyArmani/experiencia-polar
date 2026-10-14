// Configuración del juego leída del entorno (solo servidor).

export type GameMode = 'demo' | 'schedule';

export interface Window {
  opensAt: string; // ISO 8601
  closesAt: string;
}

function parseWindows(raw: string | undefined): Window[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed as Window[];
  } catch {
    console.error('[config] TRIVIA_WINDOWS no es JSON válido; se ignora.');
  }
  return [];
}

function parseList(raw: string | undefined, fallback: string[]): string[] {
  const list = (raw ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  return list.length ? list : fallback;
}

export const config = {
  mode: (process.env.GAME_MODE === 'schedule' ? 'schedule' : 'demo') as GameMode,
  demoWaitSeconds: Math.max(1, Number(process.env.DEMO_WAIT_SECONDS ?? 10)),
  windows: parseWindows(process.env.TRIVIA_WINDOWS),
  pointsPerCorrect: Math.max(0, Number(process.env.POINTS_PER_CORRECT ?? 100)),
  qrValue: (process.env.NEXT_PUBLIC_QR_VALUE ?? '').trim(),
  demoTools: process.env.NEXT_PUBLIC_DEMO === 'true',
  sedes: parseList(process.env.SEDES, ['[Sede 1]', '[Sede 2]', '[Sede 3]']),
  supabaseUrl: process.env.SUPABASE_URL ?? '',
  supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
};
