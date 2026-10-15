'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { primerNombre } from '@/lib/frases';
import { voiceFor } from '@/lib/sfx';
import { DEFAULT_AVATAR } from '@/shared/avatar';
import type { PublicPlayer } from '@/shared/types';
import { AvatarSvg } from '@/components/AvatarSvg';
import { Speech } from '@/components/Talk';
import { Screen } from '@/components/ui';

const PASOS = [
  { t: 'Escanea el QR', d: 'Es el mismo código en todas las estaciones. Cada escaneo te lleva al siguiente paso.' },
  { t: 'Responde contra reloj', d: 'Son 3 preguntas por trivia y tienes 1 minuto para todas. Mientras más rápido aciertes, más puntos sumas para tu localidad.' },
  { t: '¡Ojo con la última!', d: 'La Trivia 4 es la más difícil: cada respuesta incorrecta resta puntos.' },
  { t: 'Espera la próxima trivia', d: 'Cada trivia abre en su horario. Vuelve al mismo QR cuando abra.' },
  { t: 'Sube en el ranking', d: 'Al terminar las 4 trivias, mira cómo quedó tu localidad.' },
];

export default function Instrucciones() {
  // undefined = cargando; null = sin registro.
  const [player, setPlayer] = useState<PublicPlayer | null | undefined>(undefined);

  useEffect(() => {
    api
      .me()
      .then((r) => setPlayer(r.player))
      .catch(() => setPlayer(null));
  }, []);

  const saludo = player ? `¡Hola, ${primerNombre(player.nombre)}! Así se juega:` : '¡Hola! Así se juega:';

  return (
    <Screen>
      <div className="flex flex-1 flex-col justify-center px-5 pt-[max(24px,4dvh)]">
        <h1 className="title-display text-center text-[clamp(34px,11vw,44px)] leading-none text-white [text-shadow:0_4px_0_#004572]">
          Instrucciones
        </h1>

        {/* El avatar y su globo, lado a lado: el texto nunca lo tapa. */}
        <div className="mt-[max(16px,2.5dvh)] flex items-center gap-3">
          <div className="aspect-[216/300] h-[clamp(110px,17dvh,150px)] shrink-0 overflow-hidden rounded-[20px] border-4 border-white bg-polar-sky px-1 pt-2">
            <AvatarSvg avatar={player?.avatar ?? DEFAULT_AVATAR} mood="feliz" className="h-full w-full" title="Tu avatar" />
          </div>
          <div className="relative min-w-0 flex-1">
            {player !== undefined && <Speech text={saludo} voice={voiceFor(player?.apodo ?? '')} className="text-[15px]" />}
            {/* Colita del globo apuntando al avatar. */}
            <span
              className="absolute -left-[7px] top-5 h-3.5 w-3.5 rotate-45 border-b-[3px] border-l-[3px] border-polar-ink bg-white"
              aria-hidden
            />
          </div>
        </div>

        <ol className="mt-[max(16px,2.5dvh)] flex flex-col gap-2.5 pb-4">
          {PASOS.map((p, i) => (
            <li key={p.t} className="flex gap-3 rounded-2xl bg-white px-4 py-3 text-polar-ink">
              <span className="font-display flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-polar-yellow text-xl text-polar-navy">
                {i + 1}
              </span>
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="text-base font-bold leading-tight text-polar-navy">{p.t}</span>
                <span className="text-sm leading-snug text-polar-muted">{p.d}</span>
              </div>
            </li>
          ))}
        </ol>
      </div>

      {/* Siempre a mano: fijo abajo aunque la lista no quepa en pantallas bajas. */}
      <div className="sticky bottom-0 bg-gradient-to-t from-polar-blue from-70% to-transparent px-5 pb-[max(16px,env(safe-area-inset-bottom))] pt-5">
        <Link href="/jugar" className="btn-game w-full">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3" />
          </svg>
          Empezar a buscar
        </Link>
      </div>
    </Screen>
  );
}
