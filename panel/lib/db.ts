// Lectura de la base del juego (SOLO lectura: el panel nunca escribe).
// Usa DATABASE_URL (Postgres directo) o, si no hay, SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY.
// Recomendado: DATABASE_URL con un usuario de Postgres de solo lectura (ver README del panel).
import 'server-only';
import { createClient } from '@supabase/supabase-js';
import postgres from 'postgres';
import type { Datos, Fila } from './tipos';

const COLS = 'cedula, nombre, sede, estado, puntos, tiempo_ms, completed, last_completed_at, created_at';
export const TOTAL_NIVELES = Number(process.env.TOTAL_NIVELES ?? 4);

type Row = {
  cedula: string | null;
  nombre: string;
  sede: string;
  estado: string | null;
  puntos: number;
  tiempo_ms: number | null;
  completed: number[] | null;
  last_completed_at: string | Date | null;
  created_at: string | Date;
};

const iso = (v: string | Date | null) => (v ? new Date(v).toISOString() : null);

function toFila(r: Row): Fila {
  const niveles = (r.completed ?? []).length;
  return {
    cedula: r.cedula ?? '',
    nombre: r.nombre,
    localidad: r.sede,
    estado: r.estado ?? null,
    puntos: Number(r.puntos ?? 0),
    tiempoMs: Number(r.tiempo_ms ?? 0),
    niveles,
    terminado: niveles >= TOTAL_NIVELES,
    ultimoNivelAt: iso(r.last_completed_at),
    registradoAt: iso(r.created_at)!,
  };
}

const g = globalThis as unknown as { __panelSql?: postgres.Sql };

/** PANEL_DATOS_PRUEBA=true: participantes inventados para ver el panel sin base de datos (solo pruebas locales). */
function filasDePrueba(): Row[] {
  const lugares: [string, string][] = [
    ['SUC. VALENCIA', 'Carabobo'], ['AG. CATIA', 'Distrito Capital'], ['ADC MARACAIBO', 'Zulia'],
    ['ADC BARQUISIMET', 'Lara'], ['AG. CUMANA', 'Sucre'], ['ADC LA URBINA', 'Miranda'],
  ];
  const nombres = ['María Pérez', 'José Rodríguez', 'Ana González', 'Carlos Hernández', 'Luisa Martínez', 'Pedro Gómez', 'Carmen Díaz', 'Luis Torres'];
  return Array.from({ length: 140 }, (_, i) => {
    const [sede, estado] = lugares[i % lugares.length];
    const niveles = (i * 7) % 5;
    return {
      cedula: String(10000000 + i * 7919),
      nombre: `${nombres[i % nombres.length]} ${i + 1}`,
      sede,
      estado,
      puntos: niveles * ((i * 37) % 300),
      tiempo_ms: niveles * (20000 + ((i * 1777) % 40000)),
      completed: Array.from({ length: niveles }, (_, n) => n + 1),
      last_completed_at: niveles ? new Date(Date.now() - i * 60000).toISOString() : null,
      created_at: new Date(Date.now() - i * 120000).toISOString(),
    };
  });
}

async function leerFilas(): Promise<Row[]> {
  if (process.env.PANEL_DATOS_PRUEBA === 'true') return filasDePrueba();
  const url = process.env.DATABASE_URL;
  if (url) {
    const sql = (g.__panelSql ??= postgres(url, { max: 3, prepare: false, idle_timeout: 30 }));
    return (await sql.unsafe(`select ${COLS} from players`)) as unknown as Row[];
  }
  const sbUrl = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!sbUrl || !key) throw new Error('Falta DATABASE_URL o SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY');
  const db = createClient(sbUrl, key, { auth: { persistSession: false } });
  // La API de Supabase devuelve máximo 1.000 filas por consulta: se pide por páginas.
  const out: Row[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await db.from('players').select(COLS).order('created_at').range(from, from + 999);
    if (error) throw error;
    out.push(...((data ?? []) as Row[]));
    if (!data || data.length < 1000) return out;
  }
}

const orden = (f: Fila) => f.tiempoMs || Number.MAX_SAFE_INTEGER;

export async function leerDatos(): Promise<Datos> {
  const rows = (await leerFilas())
    .map(toFila)
    // Orden de premiación: más puntos; a igual puntaje, menos tiempo.
    // Sin tiempo registrado (jugó antes de que se guardara) va después de quien sí lo tiene.
    .sort((a, b) => b.puntos - a.puntos || orden(a) - orden(b));
  return { rows, totalNiveles: TOTAL_NIVELES, generadoAt: new Date().toISOString() };
}
