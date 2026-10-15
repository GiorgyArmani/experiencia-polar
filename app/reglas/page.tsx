'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { DEFAULT_AVATAR } from '@/shared/avatar';
import type { PublicPlayer } from '@/shared/types';
import { BearSvg } from '@/components/BearSvg';
import { Logos, Screen } from '@/components/ui';

const REGLAS = [
  { t: 'Busca el QR de la Experiencia UEP', d: 'Es el mismo código en todas las estaciones. Escanéalo con la cámara de tu teléfono: cada escaneo te lleva al siguiente paso.' },
  { t: 'Responde contra reloj', d: 'Tienes 1 minuto para toda la trivia. Mientras más rápido aciertes, más puntos sumas para tu localidad.' },
  { t: 'Espera la próxima trivia', d: 'Cada trivia abre en su horario. Vuelve al mismo QR cuando abra.' },
  { t: 'Sube en el ranking', d: 'Al terminar las 4 trivias se revela el ranking de tu localidad.' },
];

export default function Reglas() {
  const [player, setPlayer] = useState<PublicPlayer | null>(null);

  useEffect(() => {
    api.me().then((r) => setPlayer(r.player)).catch(() => {});
  }, []);

  return (
    <Screen>
      <h1 className="mx-9 mt-14 flex h-[45px] items-center rounded-full bg-polar-yellow px-6 text-lg font-extrabold text-polar-navy">Instrucciones</h1>

      <div className="mx-9 mt-5 rounded-[20px] bg-white px-[22px] py-5 text-polar-ink">
        <div className="flex items-center gap-3.5 border-b border-[#E3E3E3] pb-3.5">
          <div className="relative flex h-[120px] w-[83px] shrink-0 items-end overflow-hidden rounded-[20px] border-[3px] border-polar-blue bg-polar-sky">
            <BearSvg avatar={player?.avatar ?? DEFAULT_AVATAR} className="w-full" title={player?.osoNombre ?? 'Tu oso'} />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[13px] font-semibold text-[#5A5A5A]">{player ? `${player.osoNombre} te acompaña` : 'Tu oso te acompaña'}</span>
            <span className="text-[22px] font-black leading-tight">Así se juega</span>
          </div>
        </div>
        <ol className="pt-1.5">
          {REGLAS.map((r, i) => (
            <li key={r.t} className={`flex gap-3.5 py-3 ${i < REGLAS.length - 1 ? 'border-b border-[#EFEFEF]' : ''}`}>
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-polar-lav font-extrabold text-polar-lav-ink">{i + 1}</span>
              <div className="flex flex-col gap-0.5">
                <span className="text-base font-bold">{r.t}</span>
                <span className="text-sm leading-snug text-polar-muted">{r.d}</span>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <div className="mx-9 mt-auto pt-5">
        <Link href="/jugar" className="btn-game w-full">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3" />
          </svg>
          Empezar a buscar
        </Link>
      </div>
      <Logos className="mt-2 pb-4" />
    </Screen>
  );
}
