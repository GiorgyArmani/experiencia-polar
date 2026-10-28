// Configuración del juego leída del entorno (solo servidor).
import type { Sede } from '@/shared/types';
import { LOCALIDADES } from './localidades';

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
  // Sin SEDES: las 130 localidades de Empresas Polar (lib/localidades.ts).
  return list.length ? list : LOCALIDADES;
}

export const config = {
  // Dominio público del servidor: va dentro del QR impreso (<APP_URL>/q/POLAR).
  // Si falta o es localhost, el QR usa el dominio de la petición (lib/appUrl.ts).
  appUrl: (process.env.APP_URL ?? '').trim().replace(/\/$/, ''),
  mode: (process.env.GAME_MODE === 'schedule' ? 'schedule' : 'demo') as GameMode,
  demoWaitSeconds: Math.max(1, Number(process.env.DEMO_WAIT_SECONDS ?? 10)),
  windows: parseWindows(process.env.TRIVIA_WINDOWS),
  // Puntos máximos por respuesta correcta (si responde rápido); baja hasta la mitad si tarda.
  pointsPerCorrect: Math.max(0, Number(process.env.POINTS_PER_CORRECT ?? 100)),
  // Última estación (la más difícil): puntos que resta cada respuesta incorrecta. 0 = no resta.
  wrongPenaltyLast: Math.max(0, Number(process.env.WRONG_PENALTY_LAST ?? 50)),
  // Segundos entre el escaneo y el arranque del reloj: la animación de carga (~2 s) + el mapa (tu ícono camina a la estación).
  introSeconds: Math.min(15, Math.max(0, Number(process.env.INTRO_SECONDS ?? 8))),
  // Contrarreloj: segundos para responder TODA la trivia.
  triviaSeconds: Math.max(10, Number(process.env.TRIVIA_SECONDS ?? 60)),
  sedes: parseSedes(process.env.SEDES),
  // TEMPORAL (pruebas, mientras la UEP envía la nómina): cualquier cédula puede entrar.
  // Poner NOMINA_OBLIGATORIA=true para exigir que la cédula esté en la tabla `nomina`.
  nominaObligatoria: process.env.NOMINA_OBLIGATORIA === 'true',
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
