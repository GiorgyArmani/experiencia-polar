// Configuración del juego leída del entorno (solo servidor).
import type { Sede } from '@/shared/types';

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

/** `CCS:Sede Caracas,VAL:Sede Valencia` → [{ code: 'CCS', name: 'Sede Caracas' }, …] */
function parseSedes(raw: string | undefined): Sede[] {
  const list = (raw ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((item) => {
      const i = item.indexOf(':');
      if (i < 0) return null;
      const code = item.slice(0, i).trim().toUpperCase();
      const name = item.slice(i + 1).trim();
      return code && name ? { code, name } : null;
    })
    .filter((s): s is Sede => s !== null);
  if (raw && !list.length) console.error('[config] SEDES debe tener el formato CODIGO:Nombre,CODIGO:Nombre');
  return list.length ? list : [{ code: 'DEMO', name: '[Sede demo]' }];
}

export const config = {
  // Dominio público del servidor: va dentro del QR impreso (<APP_URL>/q/POLAR).
  appUrl: (process.env.APP_URL || 'https://experiencia-polar.vercel.app').replace(/\/$/, ''),
  mode: (process.env.GAME_MODE === 'schedule' ? 'schedule' : 'demo') as GameMode,
  demoWaitSeconds: Math.max(1, Number(process.env.DEMO_WAIT_SECONDS ?? 10)),
  windows: parseWindows(process.env.TRIVIA_WINDOWS),
  pointsPerCorrect: Math.max(0, Number(process.env.POINTS_PER_CORRECT ?? 100)),
  sedes: parseSedes(process.env.SEDES),
  demoTools: process.env.NEXT_PUBLIC_DEMO === 'true',
  // Base de datos: DATABASE_URL (Postgres en Dokploy, o la cadena de conexión de Supabase)
  // tiene prioridad; si no, SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY; si no, memoria.
  databaseUrl: process.env.DATABASE_URL ?? '',
  supabaseUrl: process.env.SUPABASE_URL ?? '',
  supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
};

export function sedeByCode(code: string | null | undefined): Sede | undefined {
  if (!code) return undefined;
  return config.sedes.find((s) => s.code === code.toUpperCase());
}

export function sedeByName(name: string | null | undefined): Sede | undefined {
  return config.sedes.find((s) => s.name === name);
}
