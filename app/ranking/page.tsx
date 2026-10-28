'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { LeaderboardResponse, LeaderRow } from '@/shared/types';
import { PlayerIcon } from '@/components/PlayerIcon';
import { Screen } from '@/components/ui';

function Face({ row, size, className = '' }: { row: LeaderRow; size: number; className?: string }) {
  return (
    <PlayerIcon icono={row.icono} size={size} className={className} title={row.apodo} />
  );
}

export default function Ranking() {
  const [tab, setTab] = useState<'sede' | 'general'>('sede');
  const [data, setData] = useState<LeaderboardResponse | null>(null);
  const [error, setError] = useState('');

  const [sedeParam, setSedeParam] = useState<string | undefined>(undefined);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // En pantallas públicas (leaderboardpolar.aulaciete.com) se pasa ?sede=CODIGO (o el nombre).
    const s = new URLSearchParams(window.location.search).get('sede') ?? undefined;
    setSedeParam(s);
    setReady(true);
  }, []);

  const load = useCallback(() => {
    if (!ready) return;
    api
      .leaderboard(sedeParam)
      .then((r) => {
        setData(r);
        setError('');
        if (!r.sede) setTab('general');
      })
      .catch((e) => setError(e.message));
  }, [ready, sedeParam]);

  useEffect(() => {
    load();
    const id = setInterval(load, 15000); // se actualiza solo
    return () => clearInterval(id);
  }, [load]);

  const top = data?.top ?? [];
  const podium = [top[1], top[0], top[2]];
  const rest = top.slice(3, 10);

  const sedeReal = data?.sede && data.sede !== 'Pruebas' ? data.sede : null;
  const subtitulo = tab === 'sede' ? sedeReal : 'Localidades por puntos acumulados';

  return (
    <Screen className="overflow-x-hidden text-polar-navy">
      <div className="flex flex-col gap-4 px-[18px] pb-2 pt-5">
        <div className="flex items-center gap-3">
          <Link
            href="/jugar"
            aria-label="Volver al juego"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] border-2 border-polar-navy bg-white text-polar-navy shadow-[0_3px_8px_rgba(14,12,78,0.2)]"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M15 6l-6 6 6 6" />
            </svg>
          </Link>
          {/* Fondo blanco para que los arcos no crucen el título. */}
          <div className="flex min-w-0 flex-col rounded-[16px] bg-white px-3 py-1.5 shadow-[0_4px_14px_rgba(14,12,78,0.15)]">
            <h1 className="title-display text-[clamp(32px,10vw,40px)] leading-none">Ranking</h1>
            {/* "Pruebas" es la localidad temporal de quien no está en la nómina: no se muestra. */}
            {subtitulo && <span className="truncate text-sm font-bold text-polar-blue">{subtitulo}</span>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-1.5 rounded-full border-2 border-polar-navy bg-white p-1" role="tablist">
          {(['sede', 'general'] as const).map((t) => (
            <button
              key={t}
              role="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              className={`h-10 rounded-full text-[15px] font-bold transition-colors ${tab === t ? 'bg-polar-steel text-white' : 'text-polar-navy'}`}
            >
              {t === 'sede' ? 'Mi localidad' : 'Todas'}
            </button>
          ))}
        </div>

        {tab === 'sede' && (
          <div className="card-uep grid grid-cols-3 items-end gap-2.5 px-3 pb-3 pt-4">
            {podium.map((row, i) => {
              const place = i === 1 ? 1 : i === 0 ? 2 : 3;
              const h = place === 1 ? 'h-[84px] bg-polar-yellow text-[34px]' : place === 2 ? 'h-[60px] bg-[#9ED8FF] text-[28px]' : 'h-[46px] bg-[#9ED8FF] text-[24px]';
              const size = place === 1 ? 80 : 64;
              return (
                <div key={place} className="flex min-w-0 flex-col items-center gap-1.5">
                  {row ? (
                    <Face row={row} size={size} className={`border-[3px] shadow-[0_4px_10px_rgba(14,12,78,0.25)] ${place === 1 ? 'border-polar-yellow' : 'border-white'}`} />
                  ) : (
                    <span className="rounded-full border-[3px] border-dashed border-polar-steel/40" style={{ width: size, height: size }} />
                  )}
                  <span className="max-w-full truncate text-sm font-bold">{row?.apodo ?? '—'}</span>
                  <span className="text-xs font-bold text-polar-steel">{row ? `${row.puntos} pts` : ' '}</span>
                  <div className={`flex w-full items-center justify-center rounded-[14px] border-2 border-polar-navy font-display text-polar-navy ${h}`}>{place}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {error && <p className="mx-[18px] mt-3 rounded-[16px] bg-polar-navy p-3 text-sm font-bold text-white">{error}</p>}

      {tab === 'sede' ? (
        <ol className="flex flex-col gap-2 px-[18px] pt-3">
          {rest.map((r, i) => (
            <Row key={i} row={r} />
          ))}
          {data && top.length === 0 && <li className="card-uep p-4 text-center font-bold">Aún no hay puntos en esta localidad. ¡Sé el primero!</li>}
        </ol>
      ) : (
        <ol className="flex flex-col gap-2 px-[18px] pt-3">
          {(data?.sedes ?? []).map((s) => (
            <li
              key={s.sede}
              className={`flex min-h-14 items-center gap-3 rounded-[18px] px-3.5 py-2 shadow-[0_4px_12px_rgba(14,12,78,0.12)] ${
                s.isMine ? 'border-2 border-polar-steel bg-polar-lav' : 'bg-white'
              }`}
            >
              <span className="w-7 text-center font-display text-xl text-polar-steel">{s.rank}</span>
              <span className="min-w-0 flex-1 text-base font-bold">{s.sede}</span>
              <span className="text-sm text-polar-muted">{s.jugadores} jug.</span>
              <span className="font-display text-lg text-polar-steel">{s.puntos}</span>
            </li>
          ))}
        </ol>
      )}

      {tab === 'sede' && data?.me && (
        <div className="sticky bottom-0 mt-auto px-[18px] pb-[max(16px,env(safe-area-inset-bottom))] pt-3">
          <div className="flex items-center gap-3 rounded-[18px] border-2 border-polar-steel bg-polar-lav py-2.5 pl-2.5 pr-3.5 shadow-[0_6px_16px_rgba(14,12,78,0.2)]">
            <span className="w-8 text-center font-display text-xl text-polar-steel">{data.me.rank}</span>
            <Face row={data.me} size={44} />
            <span className="min-w-0 flex-1 truncate text-[17px] font-bold">
              {data.me.apodo} <span className="text-sm font-semibold text-polar-muted">(tú)</span>
            </span>
            <span className="font-display text-xl text-polar-steel">{data.me.puntos}</span>
          </div>
        </div>
      )}
    </Screen>
  );
}

function Row({ row }: { row: LeaderRow }) {
  return (
    <li
      className={`flex min-h-14 items-center gap-3 rounded-[18px] py-2 pl-2.5 pr-3.5 shadow-[0_4px_12px_rgba(14,12,78,0.12)] ${
        row.isMe ? 'border-2 border-polar-steel bg-polar-lav' : 'bg-white'
      }`}
    >
      <span className="w-7 text-center font-display text-xl text-polar-steel">{row.rank}</span>
      <Face row={row} size={40} />
      <span className="min-w-0 flex-1 truncate text-base font-bold">{row.apodo}</span>
      <span className="font-display text-lg text-polar-steel">{row.puntos}</span>
    </li>
  );
}
