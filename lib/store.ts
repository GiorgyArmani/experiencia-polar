// Acceso a datos. Orden de preferencia:
//   1. DATABASE_URL  → Postgres directo (Dokploy, o la cadena de conexión de Supabase)
//   2. SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY → API de Supabase
//   3. Nada → memoria (solo pruebas locales)
import 'server-only';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import postgres from 'postgres';
import { parseAvatar, type Avatar } from '@/shared/avatar';
import type { Player } from '@/shared/types';
import { config } from './config';

export interface NewPlayer {
  nombre: string;
  cedula: string;
  email: string | null;
  telefono: string | null;
  sede: string;
  oso_nombre: string;
  avatar: Avatar;
}

/** Condición para actualizar: si el jugador ya no está en ese estado, no se toca (evita dobles toques). */
export interface Expect {
  current_trivia: number | null;
  current_question?: number;
}

export interface SedeTotal {
  sede: string;
  puntos: number;
  jugadores: number;
}

export interface Store {
  getPlayer(id: string): Promise<Player | null>;
  getPlayerByCedula(cedula: string): Promise<Player | null>;
  createPlayer(p: NewPlayer): Promise<Player>;
  /** Devuelve null si `expect` no se cumple. */
  updatePlayer(id: string, patch: Partial<Player>, expect?: Expect): Promise<Player | null>;
  logAnswer(a: { player_id: string; trivia: number; question: number; option_idx: number; correct: boolean }): Promise<void>;
  topBySede(sede: string, limit: number): Promise<Player[]>;
  rankInSede(player: Player): Promise<number>;
  sedeTotals(): Promise<SedeTotal[]>;
}

const UPDATABLE = [
  'puntos',
  'completed',
  'current_trivia',
  'current_question',
  'missed',
  'trivia_puntos',
  'trivia_started_at',
  'question_started_at',
  'last_completed_at',
] as const satisfies readonly (keyof Player)[];

function pickPatch(patch: Partial<Player>) {
  const out: Record<string, unknown> = {};
  for (const k of UPDATABLE) if (k in patch) out[k] = patch[k];
  return out;
}

function fromRow(row: Record<string, unknown> | null | undefined): Player | null {
  if (!row) return null;
  return {
    ...(row as unknown as Player),
    avatar: parseAvatar(row.avatar),
    completed: (row.completed as number[] | null) ?? [],
    last_completed_at: iso(row.last_completed_at),
    trivia_started_at: iso(row.trivia_started_at),
    question_started_at: iso(row.question_started_at),
  };
}

function iso(v: unknown): string | null {
  return v ? new Date(v as string).toISOString() : null;
}

/* ───────────────────────── Postgres (Dokploy / Supabase) ───────────────────────── */

class PostgresStore implements Store {
  private sql: postgres.Sql;
  constructor(url: string) {
    // prepare:false para funcionar también detrás del pooler de Supabase (pgbouncer).
    this.sql = postgres(url, { max: Number(process.env.DATABASE_POOL ?? 10), prepare: false, idle_timeout: 30 });
  }
  async getPlayer(id: string) {
    const [row] = await this.sql`select * from players where id = ${id}`;
    return fromRow(row);
  }
  async getPlayerByCedula(cedula: string) {
    const [row] = await this.sql`select * from players where cedula = ${cedula}`;
    return fromRow(row);
  }
  async createPlayer(p: NewPlayer) {
    const [row] = await this.sql`
      insert into players (nombre, cedula, email, telefono, sede, oso_nombre, avatar)
      values (${p.nombre}, ${p.cedula}, ${p.email}, ${p.telefono}, ${p.sede}, ${p.oso_nombre}, ${this.sql.json(p.avatar as never)})
      returning *`;
    return fromRow(row)!;
  }
  async updatePlayer(id: string, patch: Partial<Player>, expect?: Expect) {
    const values = { ...pickPatch(patch), updated_at: new Date() };
    const sql = this.sql;
    const cond = expect
      ? sql`and current_trivia is not distinct from ${expect.current_trivia}
            ${expect.current_question !== undefined ? sql`and current_question = ${expect.current_question}` : sql``}`
      : sql``;
    const [row] = await sql`update players set ${sql(values)} where id = ${id} ${cond} returning *`;
    return fromRow(row);
  }
  async logAnswer(a: { player_id: string; trivia: number; question: number; option_idx: number; correct: boolean }) {
    try {
      await this.sql`insert into answers ${this.sql(a)}`;
    } catch (e) {
      console.error('[store] logAnswer', (e as Error).message);
    }
  }
  async topBySede(sede: string, limit: number) {
    const rows = await this.sql`
      select * from players where sede = ${sede}
      order by puntos desc, last_completed_at asc nulls last
      limit ${limit}`;
    return rows.map((r) => fromRow(r)!);
  }
  async rankInSede(player: Player) {
    const [{ n }] = await this.sql`select count(*)::int as n from players where sede = ${player.sede} and puntos > ${player.puntos}`;
    return n + 1;
  }
  async sedeTotals() {
    const rows = await this.sql`select sede, coalesce(sum(puntos), 0)::int as puntos, count(*)::int as jugadores from players group by sede`;
    return rows as unknown as SedeTotal[];
  }
}

/* ───────────────────────── Supabase (API REST) ───────────────────────── */

class SupabaseStore implements Store {
  private db: SupabaseClient;
  constructor(url: string, key: string) {
    this.db = createClient(url, key, { auth: { persistSession: false } });
  }
  async getPlayer(id: string) {
    const { data, error } = await this.db.from('players').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    return fromRow(data);
  }
  async getPlayerByCedula(cedula: string) {
    const { data, error } = await this.db.from('players').select('*').eq('cedula', cedula).maybeSingle();
    if (error) throw error;
    return fromRow(data);
  }
  async createPlayer(p: NewPlayer) {
    const { data, error } = await this.db.from('players').insert(p).select('*').single();
    if (error) throw error;
    return fromRow(data)!;
  }
  async updatePlayer(id: string, patch: Partial<Player>, expect?: Expect) {
    let q = this.db
      .from('players')
      .update({ ...pickPatch(patch), updated_at: new Date().toISOString() })
      .eq('id', id);
    if (expect) {
      q = expect.current_trivia === null ? q.is('current_trivia', null) : q.eq('current_trivia', expect.current_trivia);
      if (expect.current_question !== undefined) q = q.eq('current_question', expect.current_question);
    }
    const { data, error } = await q.select('*').maybeSingle();
    if (error) throw error;
    return fromRow(data);
  }
  async logAnswer(a: { player_id: string; trivia: number; question: number; option_idx: number; correct: boolean }) {
    const { error } = await this.db.from('answers').insert(a);
    if (error) console.error('[store] logAnswer', error.message);
  }
  async topBySede(sede: string, limit: number) {
    const { data, error } = await this.db
      .from('players')
      .select('*')
      .eq('sede', sede)
      .order('puntos', { ascending: false })
      .order('last_completed_at', { ascending: true, nullsFirst: false })
      .limit(limit);
    if (error) throw error;
    return (data ?? []).map((r) => fromRow(r)!);
  }
  async rankInSede(player: Player) {
    const { count, error } = await this.db
      .from('players')
      .select('id', { count: 'exact', head: true })
      .eq('sede', player.sede)
      .gt('puntos', player.puntos);
    if (error) throw error;
    return (count ?? 0) + 1;
  }
  async sedeTotals() {
    const { data, error } = await this.db.rpc('sede_totals');
    if (error) throw error;
    return (data as SedeTotal[]) ?? [];
  }
}

/* ───────────────────────── Memoria ───────────────────────── */

const g = globalThis as unknown as { __polarMem?: { players: Map<string, Player> } };
const mem = (g.__polarMem ??= { players: new Map<string, Player>() });

class MemoryStore implements Store {
  async getPlayer(id: string) {
    return mem.players.get(id) ?? null;
  }
  async getPlayerByCedula(cedula: string) {
    for (const p of mem.players.values()) if (p.cedula === cedula) return p;
    return null;
  }
  async createPlayer(p: NewPlayer) {
    const now = new Date().toISOString();
    const player: Player = {
      id: crypto.randomUUID(),
      ...p,
      puntos: 0,
      completed: [],
      current_trivia: null,
      current_question: 0,
      missed: false,
      trivia_puntos: 0,
      trivia_started_at: null,
      question_started_at: null,
      last_completed_at: null,
      created_at: now,
      updated_at: now,
    };
    mem.players.set(player.id, player);
    return player;
  }
  async updatePlayer(id: string, patch: Partial<Player>, expect?: Expect) {
    const cur = mem.players.get(id);
    if (!cur) return null;
    if (expect) {
      if (cur.current_trivia !== expect.current_trivia) return null;
      if (expect.current_question !== undefined && cur.current_question !== expect.current_question) return null;
    }
    const next = { ...cur, ...pickPatch(patch), updated_at: new Date().toISOString() } as Player;
    mem.players.set(id, next);
    return next;
  }
  async logAnswer() {}
  private sorted(list: Player[]) {
    return list.sort(
      (a, b) =>
        b.puntos - a.puntos ||
        (a.last_completed_at ?? '9999').localeCompare(b.last_completed_at ?? '9999'),
    );
  }
  async topBySede(sede: string, limit: number) {
    return this.sorted([...mem.players.values()].filter((p) => p.sede === sede)).slice(0, limit);
  }
  async rankInSede(player: Player) {
    return [...mem.players.values()].filter((p) => p.sede === player.sede && p.puntos > player.puntos).length + 1;
  }
  async sedeTotals() {
    const map = new Map<string, SedeTotal>();
    for (const p of mem.players.values()) {
      const row = map.get(p.sede) ?? { sede: p.sede, puntos: 0, jugadores: 0 };
      row.puntos += p.puntos;
      row.jugadores += 1;
      map.set(p.sede, row);
    }
    return [...map.values()];
  }
}

const gs = globalThis as unknown as { __polarStore?: Store };

export function getStore(): Store {
  if (gs.__polarStore) return gs.__polarStore;
  if (config.databaseUrl) {
    gs.__polarStore = new PostgresStore(config.databaseUrl);
  } else if (config.supabaseUrl && config.supabaseKey) {
    gs.__polarStore = new SupabaseStore(config.supabaseUrl, config.supabaseKey);
  } else {
    console.warn('[store] Sin base de datos configurada: usando memoria (solo pruebas).');
    gs.__polarStore = new MemoryStore();
  }
  return gs.__polarStore;
}
