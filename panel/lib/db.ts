// Lectura de la base del juego (SOLO lectura: el panel nunca escribe).
// Usa DATABASE_URL (Postgres directo) o, si no hay, SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY.
// Recomendado: DATABASE_URL con un usuario de Postgres de solo lectura (ver README del panel).
import 'server-only';
import { createClient } from '@supabase/supabase-js';
import postgres from 'postgres';
import { BANCOS } from './preguntas';
import type { Conteo, Datos, DatosReporte, Fila, Respuesta } from './tipos';

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
// Semilla fija: los mismos participantes en cada recarga (el panel se actualiza cada 30 s).
const DEMO_INICIO = Date.parse('2026-10-20T12:00:00Z');
let demoCache: Row[] | null = null;

function filasDePrueba(): Row[] {
  if (demoCache) return demoCache;
  let seed = 20261025;
  const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
  const pick = <T,>(a: T[]) => a[Math.floor(rnd() * a.length)];

  const lugares: [string, string, number][] = [
    // [localidad, estado, peso: cuánta gente juega ahí]
    ['ADC LA URBINA', 'Miranda', 9], ['AG. CATIA', 'Distrito Capital', 7], ['AG. LA YAGUARA', 'Distrito Capital', 6],
    ['ADC VALENCIA', 'Carabobo', 8], ['AG. GUACARA', 'Carabobo', 4], ['AG. BEJUMA', 'Carabobo', 2],
    ['ADC MARACAIBO', 'Zulia', 8], ['AG. LAGUNILLAS', 'Zulia', 3], ['ADC BARQUISIMET', 'Lara', 6],
    ['AG. CARORA', 'Lara', 2], ['ADC BARCELONA', 'Anzoátegui', 5], ['AG. EL TIGRE', 'Anzoátegui', 3],
    ['AG. ANACO', 'Anzoátegui', 2], ['ADC PTO ORDAZ', 'Bolívar', 5], ['AG. CDA BOLIVAR', 'Bolívar', 3],
    ['ADC MÉRIDA', 'Mérida', 4], ['AG. EL VIGIA', 'Mérida', 2], ['AG. CUMANA', 'Sucre', 3],
    ['AG. CARUPANO', 'Sucre', 2], ['AG ACARIGUA', 'Portuguesa', 3], ['AG. GUANARE', 'Portuguesa', 2],
    ['AG. BARINAS', 'Barinas', 3], ['AG. CORO', 'Falcón', 3], ['AG. LA GUAIRA', 'La Guaira', 3],
    ['AG. LA VICTORIA', 'Aragua', 4], ['AG SAN FELIPE', 'Yaracuy', 2], ['AG. CALABOZO', 'Guárico', 2],
    ['AG SAN FERNANDO', 'Apure', 1], ['AG. GUASDUALITO', 'Apure', 1], ['AG. GUARENAS', 'Miranda', 4],
  ];
  const bolsa = lugares.flatMap((l) => Array<typeof l>(l[2]).fill(l));
  const nombres = ['María', 'José', 'Ana', 'Carlos', 'Luisa', 'Pedro', 'Carmen', 'Luis', 'Yusmary', 'Jesús', 'Daniela',
    'Miguel', 'Andreína', 'Rafael', 'Gabriela', 'Jorge', 'Yelitza', 'Francisco', 'Rosa', 'Alejandro', 'Mariela',
    'Ángel', 'Desirée', 'Héctor', 'Oriana', 'Wilmer', 'Yorman', 'Génesis', 'Eduardo', 'Valentina'];
  const apellidos = ['Pérez', 'Rodríguez', 'González', 'Hernández', 'Martínez', 'Gómez', 'Díaz', 'Torres', 'Rojas',
    'Ramírez', 'Mendoza', 'Castillo', 'Medina', 'Suárez', 'Contreras', 'Briceño', 'Guerrero', 'Marcano', 'Rivas',
    'Salazar', 'Villarroel', 'Parra', 'Colmenares', 'Chacón', 'Quintero'];

  const N = 320;
  const usadas = new Set<string>();
  demoCache = Array.from({ length: N }, (_, i) => {
    const [sede, estado] = pick(bolsa);
    let cedula: string;
    do cedula = String(Math.floor(6_000_000 + rnd() * 26_000_000));
    while (usadas.has(cedula));
    usadas.add(cedula);

    // Distribución: ~15 % solo se registró, el resto avanza; ~35 % termina las 4 estaciones.
    const r = rnd();
    const niveles = i < 4 ? TOTAL_NIVELES : r < 0.15 ? 0 : r < 0.3 ? 1 : r < 0.48 ? 2 : r < 0.65 ? 3 : TOTAL_NIVELES;
    let puntos = 0;
    let tiempo = 0;
    for (let n = 0; n < niveles; n++) {
      const habilidad = 0.45 + rnd() * 0.55;
      puntos += Math.round((5 * 100 * habilidad) / 10) * 10; // 5 preguntas, hasta 100 c/u
      tiempo += Math.floor(18_000 + rnd() * 42_000); // 18 s a 60 s por estación
    }
    // Empates a propósito en la punta, para ver el desempate por tiempo.
    if (i < 4) puntos = 1980;
    const registrado = DEMO_INICIO + Math.floor(rnd() * 30 * 3600_000);
    return {
      cedula: i === 7 ? null : cedula, // uno sin cédula, para ver cómo se muestra
      nombre: `${pick(nombres)} ${pick(apellidos)}`,
      sede,
      estado: i === 11 ? null : estado, // uno sin estado
      puntos,
      tiempo_ms: i % 41 === 5 ? null : tiempo, // algunos sin tiempo (jugaron antes de que se guardara)
      completed: Array.from({ length: niveles }, (_, n) => n + 1),
      last_completed_at: niveles ? new Date(registrado + niveles * 3 * 3600_000).toISOString() : null,
      created_at: new Date(registrado).toISOString(),
    };
  });
  return demoCache;
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
    // "Pruebas" es la localidad de quien entró sin estar en la nómina (cuentas de prueba): no compite.
    .filter((f) => f.localidad !== 'Pruebas')
    // Orden de premiación: más puntos; a igual puntaje, menos tiempo.
    // Sin tiempo registrado (jugó antes de que se guardara) va después de quien sí lo tiene.
    .sort((a, b) => b.puntos - a.puntos || orden(a) - orden(b));
  return { rows, totalNiveles: TOTAL_NIVELES, generadoAt: new Date().toISOString() };
}

// ---------- Respuestas por estación ----------

type RowResp = {
  cedula: string | null;
  nombre: string;
  sede: string;
  trivia: number;
  question: number;
  option_idx: number;
  correct: boolean;
  created_at: string | Date;
};

/** Respuestas inventadas para PANEL_DATOS_PRUEBA: 3 preguntas por nivel completado, unas más difíciles que otras. */
function respuestasDePrueba(): RowResp[] {
  let seed = 777;
  const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
  const out: RowResp[] = [];
  for (const p of filasDePrueba()) {
    for (const trivia of p.completed ?? []) {
      const banco = BANCOS[trivia] ?? [];
      const ids = banco.map((_, i) => i).sort(() => rnd() - 0.5).slice(0, 3);
      for (const question of ids) {
        const preg = banco[question];
        const dificultad = ((question * 37 + trivia * 11) % 60) / 100; // 0 a 0,6
        const correct = rnd() > dificultad;
        const otras = preg.options.map((_, i) => i).filter((i) => i !== preg.correct);
        const option_idx = correct ? preg.correct : otras[rnd() < 0.6 ? 0 : Math.floor(rnd() * otras.length)];
        out.push({ cedula: p.cedula, nombre: p.nombre, sede: p.sede, trivia, question, option_idx, correct, created_at: p.last_completed_at ?? p.created_at });
      }
    }
  }
  return out;
}

async function leerRespuestasCrudas(): Promise<RowResp[]> {
  if (process.env.PANEL_DATOS_PRUEBA === 'true') return respuestasDePrueba();
  const url = process.env.DATABASE_URL;
  if (url) {
    const sql = (g.__panelSql ??= postgres(url, { max: 3, prepare: false, idle_timeout: 30 }));
    return (await sql.unsafe(
      `select p.cedula, p.nombre, p.sede, a.trivia, a.question, a.option_idx, a.correct, a.created_at
       from answers a join players p on p.id = a.player_id
       order by a.created_at`,
    )) as unknown as RowResp[];
  }
  const sbUrl = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!sbUrl || !key) throw new Error('Falta DATABASE_URL o SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY');
  const db = createClient(sbUrl, key, { auth: { persistSession: false } });
  type SbRow = Omit<RowResp, 'cedula' | 'nombre' | 'sede'> & { players: { cedula: string | null; nombre: string; sede: string } | null };
  const out: RowResp[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await db
      .from('answers')
      .select('trivia, question, option_idx, correct, created_at, players!inner(cedula, nombre, sede)')
      .order('id')
      .range(from, from + 999);
    if (error) throw error;
    for (const r of (data ?? []) as unknown as SbRow[]) {
      if (r.players) out.push({ ...r, ...r.players });
    }
    if (!data || data.length < 1000) return out;
  }
}

/** Todas las respuestas, sin las cuentas de prueba (localidad "Pruebas"). */
export async function leerRespuestas(): Promise<Respuesta[]> {
  return (await leerRespuestasCrudas())
    .filter((r) => r.sede !== 'Pruebas')
    .map((r) => ({
      cedula: r.cedula ?? '',
      nombre: r.nombre,
      localidad: r.sede,
      trivia: Number(r.trivia),
      pregunta: Number(r.question),
      opcion: Number(r.option_idx),
      correcta: Boolean(r.correct),
      at: iso(r.created_at)!,
    }));
}

/** Lo que necesita el reporte: conteos por localidad / estación / pregunta / opción, y participantes por localidad. */
export async function leerReporte(): Promise<DatosReporte> {
  const mapa = new Map<string, Conteo>();
  const jugadores = new Map<string, Set<string>>();
  for (const r of await leerRespuestas()) {
    const k = `${r.localidad}|${r.trivia}|${r.pregunta}|${r.opcion}`;
    const c = mapa.get(k);
    if (c) c.n++;
    else mapa.set(k, { localidad: r.localidad, trivia: r.trivia, pregunta: r.pregunta, opcion: r.opcion, n: 1 });
    let set = jugadores.get(r.localidad);
    if (!set) jugadores.set(r.localidad, (set = new Set()));
    set.add(r.cedula || r.nombre);
  }
  const participantes = Object.fromEntries([...jugadores].map(([l, set]) => [l, set.size]));
  return { conteos: [...mapa.values()], participantes, generadoAt: new Date().toISOString() };
}
