'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { LeaderboardResponse, LeaderRow } from '@/shared/types';
import { BearSvg } from '@/components/BearSvg';

function Face({ row, size, className = '' }: { row: LeaderRow; size: number; className?: string }) {
  return (
    <span className={`block overflow-hidden rounded-full bg-polar-sky ${className}`} style={{ width: size, height: size }}>
      <BearSvg avatar={row.avatar} graduado={row.graduado} crop="head" className="h-full w-full" />
    </span>
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

  return (
    <main className="mx-auto flex min-h-[100dvh] w-full max-w-[440px] flex-col bg-polar-ice font-figtree text-[#0E1B33]">
      <div className="flex flex-col gap-4 rounded-b-[32px] bg-polar-navy px-[18px] pb-[22px] pt-5 text-white">
        <div className="flex items-center gap-3">
          <Link href="/jugar" aria-label="Volver al juego" className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-polar-navy-2">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M15 6l-6 6 6 6" />
            </svg>
          </Link>
          <div className="flex flex-col">
            <h1 className="font-display text-[28px] font-extrabold leading-none">Ranking</h1>
            <span className="text-sm text-[#CFE0F7]">
              {tab === 'sede' ? data?.sede ?? 'Tu sede' : 'Sedes por puntos acumulados'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-1.5 rounded-[14px] bg-polar-navy-2 p-1" role="tablist">
          {(['sede', 'general'] as const).map((t) => (
            <button
              key={t}
              role="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              className={`h-11 rounded-[11px] text-[15px] font-bold ${tab === t ? 'bg-white text-polar-navy' : 'text-white'}`}
            >
              {t === 'sede' ? 'Mi sede' : 'Todas las sedes'}
            </button>
          ))}
        </div>

        {tab === 'sede' && (
          <div className="grid grid-cols-3 items-end gap-2.5 pt-1.5">
            {podium.map((row, i) => {
              const place = i === 1 ? 1 : i === 0 ? 2 : 3;
              const h = place === 1 ? 'h-[88px] bg-polar-clay text-polar-navy text-[32px]' : place === 2 ? 'h-[60px] bg-polar-navy-2 text-[26px]' : 'h-[46px] bg-polar-navy-2 text-2xl';
              const size = place === 1 ? 84 : 70;
              return (
                <div key={place} className="flex flex-col items-center gap-1.5">
                  {row ? (
                    <Face row={row} size={size} className={`border-[3px] ${place === 1 ? 'border-polar-clay' : 'border-[#CFE0F7]'}`} />
                  ) : (
                    <span className="rounded-full border-[3px] border-dashed border-[#CFE0F7]/60" style={{ width: size, height: size }} />
                  )}
                  <span className="max-w-full truncate text-sm font-extrabold">{row?.osoNombre ?? '—'}</span>
                  <div className={`flex w-full items-center justify-center rounded-t-[14px] font-display font-extrabold ${h}`}>{place}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {error && <p className="mx-[18px] mt-4 rounded-xl bg-white p-3 text-sm font-semibold">{error}</p>}

      {tab === 'sede' ? (
        <ol className="flex flex-col gap-2 px-[18px] pt-4">
          {rest.map((r, i) => (
            <Row key={i} row={r} />
          ))}
          {data && top.length === 0 && <li className="rounded-2xl bg-white p-4 text-center font-semibold">Aún no hay puntos en esta sede. ¡Sé el primero!</li>}
        </ol>
      ) : (
        <ol className="flex flex-col gap-2 px-[18px] pt-4">
          {(data?.sedes ?? []).map((s) => (
            <li
              key={s.sede}
              className={`flex min-h-14 items-center gap-3 rounded-2xl px-3.5 py-2 ${s.isMine ? 'border-[2.5px] border-polar-clay bg-[#FFF1E6]' : 'bg-white'}`}
            >
              <span className="w-7 text-center font-extrabold text-polar-slate">{s.rank}</span>
              <span className="flex-1 text-base font-bold">{s.sede}</span>
              <span className="text-sm text-polar-slate">{s.jugadores} jug.</span>
              <span className="font-bold text-polar-navy">{s.puntos} pts</span>
            </li>
          ))}
        </ol>
      )}

      {tab === 'sede' && data?.me && (
        <div className="mt-auto px-[18px] pb-6 pt-3">
          <div className="flex items-center gap-3 rounded-[18px] border-[2.5px] border-polar-clay bg-[#FFF1E6] py-2.5 pl-2.5 pr-3.5">
            <span className="w-7 text-center font-extrabold text-polar-navy">#{data.me.rank}</span>
            <Face row={data.me} size={44} />
            <span className="flex-1 text-[17px] font-extrabold">
              {data.me.osoNombre} <span className="text-sm font-semibold text-polar-slate">(tú)</span>
            </span>
            <span className="font-extrabold text-polar-navy">{data.me.puntos} pts</span>
          </div>
        </div>
      )}
    </main>
  );
}

function Row({ row }: { row: LeaderRow }) {
  return (
    <li className={`flex min-h-14 items-center gap-3 rounded-2xl py-2 pl-2.5 pr-3.5 ${row.isMe ? 'border-[2.5px] border-polar-clay bg-[#FFF1E6]' : 'bg-white'}`}>
      <span className="w-7 text-center font-extrabold text-polar-slate">{row.rank}</span>
      <Face row={row} size={40} />
      <span className="flex-1 text-base font-bold">{row.osoNombre}</span>
      <span className="font-bold text-polar-navy">{row.puntos} pts</span>
    </li>
  );
}
