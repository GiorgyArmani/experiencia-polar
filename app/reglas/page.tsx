'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { primerNombre } from '@/lib/frases';
import type { PublicPlayer } from '@/shared/types';
import { Screen } from '@/components/ui';

// Textos cortos: todo debe verse en una pantalla de teléfono sin desplazarse (si no cabe, se desplaza en vez de recortarse).
const PASOS = [
  { t: 'Escanea el QR', d: 'Es el mismo en todas las estaciones y te lleva al siguiente nivel.' },
  { t: 'Recorre los 4 niveles', d: 'Cada estación es un nivel del mapa.' },
  { t: 'Responde contra reloj', d: 'Son 3 preguntas por nivel y tienes un minuto para contestarlas. Mientras más rápido aciertes, más puntos sumas.' },
  { t: '¡Ojo con el último!', d: 'En el Nivel 4, cada respuesta incorrecta resta puntos.' },
  { t: 'Espera el próximo nivel', d: 'Cada nivel abre en su horario. Vuelve al mismo QR.' },
  { t: 'Sube en el ranking', d: 'Completa los 4 niveles y mira cómo quedó tu localidad.' },
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
    <Screen className="overflow-x-hidden">
      <div className="flex flex-1 flex-col justify-center px-[clamp(16px,5vw,24px)] pt-[max(16px,3dvh)]">
        <h1 className="title-display text-center text-[clamp(28px,min(10vw,5dvh),40px)] leading-none text-polar-navy">
          Instrucciones
        </h1>

        <p className="mt-[1dvh] min-h-[1.4em] text-center text-[clamp(14px,2.2dvh,17px)] font-bold text-polar-steel">{player !== undefined && saludo}</p>

        <ol className="mt-[1.2dvh] flex flex-col gap-[min(8px,1dvh)]">
          {PASOS.map((p, i) => (
            <li key={p.t} className="card-uep flex items-center gap-3 rounded-[18px] px-3.5 py-[min(10px,1.2dvh)] text-polar-ink">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] border-2 border-polar-navy bg-[#9ED8FF] text-base font-bold text-polar-navy">
                {i + 1}
              </span>
              <div className="flex min-w-0 flex-col">
                <span className="text-[clamp(14px,2.1dvh,16px)] font-bold leading-tight text-polar-navy">{p.t}</span>
                <span className="text-[clamp(12px,1.85dvh,14px)] leading-snug text-polar-muted">{p.d}</span>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <div className="shrink-0 px-5 pb-[max(14px,env(safe-area-inset-bottom))] pt-[min(14px,1.8dvh)]">
        <Link href="/jugar" className="btn-uep w-full">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3" />
          </svg>
          Empezar a buscar
        </Link>
      </div>
    </Screen>
  );
}
