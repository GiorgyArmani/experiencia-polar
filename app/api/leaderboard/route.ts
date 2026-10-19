import type { LeaderboardResponse, LeaderRow, Player } from '@/shared/types';
import { config, sedeByCode, sedeByName } from '@/lib/config';
import { computeStatus } from '@/lib/game';
import { error, json } from '@/lib/http';
import { currentPlayer } from '@/lib/session';
import { getStore } from '@/lib/store';

export const dynamic = 'force-dynamic';

const TOP = 10;

function row(p: Player, rank: number, meId: string | undefined): LeaderRow {
  return {
    rank,
    apodo: p.oso_nombre,
    icono: p.avatar,
    puntos: p.puntos,
    graduado: p.completed.length > 0 && computeStatus(p).phase === 'final',
    isMe: p.id === meId,
  };
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const me = await currentPlayer();
  // ?sede= acepta el código (CCS) o el nombre ("Sede Caracas"); sin parámetro, la sede del jugador.
  const param = url.searchParams.get('sede');
  const sede = param ? (sedeByCode(param) ?? sedeByName(param))?.name : me?.sede;
  if (param && !sede) return error('Localidad desconocida', 404);

  const store = getStore();
  try {
    const topPlayers = sede ? await store.topBySede(sede, TOP) : [];
    // Rango por puntos (empates comparten puesto, igual que rankInSede).
    const top = topPlayers.map((p) => row(p, topPlayers.filter((o) => o.puntos > p.puntos).length + 1, me?.id));

    let mine: LeaderRow | null = null;
    if (me && me.sede === sede) mine = row(me, await store.rankInSede(me), me.id);

    const totals = await store.sedeTotals();
    const sedes = config.sedes
      .map((s) => {
        const t = totals.find((x) => x.sede === s.name);
        return { sede: s.name, code: s.code, puntos: Number(t?.puntos ?? 0), jugadores: Number(t?.jugadores ?? 0) };
      })
      // Son 130 localidades: solo se listan las que ya tienen jugadores (y la del jugador).
      .filter((s) => s.jugadores > 0 || s.sede === me?.sede)
      .sort((a, b) => b.puntos - a.puntos)
      .map((s, i) => ({ ...s, rank: i + 1, isMine: s.sede === me?.sede }));

    const res: LeaderboardResponse = { sede: sede ?? null, top, me: mine, sedes };
    return json(res);
  } catch (e) {
    console.error('[leaderboard]', e);
    return error('No pudimos cargar el ranking', 500);
  }
}
