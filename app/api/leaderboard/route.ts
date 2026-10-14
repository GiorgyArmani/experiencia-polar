import { config } from '@/lib/config';
import { error, json } from '@/lib/http';
import { currentPlayer } from '@/lib/session';
import { getStore } from '@/lib/store';
import type { LeaderboardResponse, LeaderRow } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const me = await currentPlayer();
  const sede = url.searchParams.get('sede') ?? me?.sede ?? null;
  if (sede && !config.sedes.includes(sede)) return error('Sede desconocida', 404);

  const store = getStore();
  try {
    const topPlayers = sede ? await store.topBySede(sede, 8) : [];
    const top: LeaderRow[] = topPlayers.map((p, i) => ({
      rank: i + 1,
      osoNombre: p.oso_nombre,
      look: p.look,
      puntos: p.puntos,
      isMe: p.id === me?.id,
    }));

    let mine: LeaderRow | null = null;
    if (me && me.sede === sede) {
      mine = { rank: await store.rankInSede(me), osoNombre: me.oso_nombre, look: me.look, puntos: me.puntos, isMe: true };
    }

    const totals = await store.sedeTotals();
    const sedes = config.sedes
      .map((s) => {
        const t = totals.find((x) => x.sede === s);
        return { sede: s, puntos: Number(t?.puntos ?? 0), jugadores: Number(t?.jugadores ?? 0) };
      })
      .sort((a, b) => b.puntos - a.puntos)
      .map((s, i) => ({ ...s, rank: i + 1, isMine: s.sede === me?.sede }));

    const res: LeaderboardResponse = { sede, top, me: mine, sedes };
    return json(res);
  } catch (e) {
    console.error('[leaderboard]', e);
    return error('No pudimos cargar el ranking', 500);
  }
}
