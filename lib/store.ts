// Acceso a datos. Usa Supabase si SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY están
// definidos; si no, un almacenamiento en memoria (solo para pruebas locales).
import 'server-only';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { config } from './config';
import type { Player } from './types';

export interface NewPlayer {
  nombre: string;
  email: string;
  telefono: string;
  sede: string;
  oso_nombre: string;
  look: string;
}

export interface Store {
  getPlayer(id: string): Promise<Player | null>;
  getPlayerByEmail(email: string): Promise<Player | null>;
  createPlayer(p: NewPlayer): Promise<Player>;
  updatePlayer(id: string, patch: Partial<Player>): Promise<Player>;
  logAnswer(a: { player_id: string; trivia: number; question: number; option_idx: number; correct: boolean }): Promise<void>;
  topBySede(sede: string, limit: number): Promise<Player[]>;
  rankInSede(player: Player): Promise<number>;
  sedeTotals(): Promise<{ sede: string; puntos: number; jugadores: number }[]>;
}

/* ───────────────────────── Supabase ───────────────────────── */

class SupabaseStore implements Store {
  private db: SupabaseClient;
  constructor(url: string, key: string) {
    this.db = createClient(url, key, { auth: { persistSession: false } });
  }
  async getPlayer(id: string) {
    const { data, error } = await this.db.from('players').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    return (data as Player) ?? null;
  }
  async getPlayerByEmail(email: string) {
    const { data, error } = await this.db.from('players').select('*').eq('email', email).maybeSingle();
    if (error) throw error;
    return (data as Player) ?? null;
  }
  async createPlayer(p: NewPlayer) {
    const { data, error } = await this.db.from('players').insert(p).select('*').single();
    if (error) throw error;
    return data as Player;
  }
  async updatePlayer(id: string, patch: Partial<Player>) {
    const { data, error } = await this.db
      .from('players')
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw error;
    return data as Player;
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
    return (data as Player[]) ?? [];
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
    return (data as { sede: string; puntos: number; jugadores: number }[]) ?? [];
  }
}

/* ───────────────────────── Memoria ───────────────────────── */

const g = globalThis as unknown as { __polarMem?: { players: Map<string, Player> } };
const mem = (g.__polarMem ??= { players: new Map<string, Player>() });

class MemoryStore implements Store {
  async getPlayer(id: string) {
    return mem.players.get(id) ?? null;
  }
  async getPlayerByEmail(email: string) {
    for (const p of mem.players.values()) if (p.email === email) return p;
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
      last_completed_at: null,
      created_at: now,
      updated_at: now,
    };
    mem.players.set(player.id, player);
    return player;
  }
  async updatePlayer(id: string, patch: Partial<Player>) {
    const cur = mem.players.get(id);
    if (!cur) throw new Error('Jugador no encontrado');
    const next = { ...cur, ...patch, updated_at: new Date().toISOString() };
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
    const map = new Map<string, { sede: string; puntos: number; jugadores: number }>();
    for (const p of mem.players.values()) {
      const row = map.get(p.sede) ?? { sede: p.sede, puntos: 0, jugadores: 0 };
      row.puntos += p.puntos;
      row.jugadores += 1;
      map.set(p.sede, row);
    }
    return [...map.values()];
  }
}

let store: Store | null = null;

export function getStore(): Store {
  if (store) return store;
  if (config.supabaseUrl && config.supabaseKey) {
    store = new SupabaseStore(config.supabaseUrl, config.supabaseKey);
  } else {
    console.warn('[store] Sin Supabase configurado: usando memoria (solo pruebas).');
    store = new MemoryStore();
  }
  return store;
}
