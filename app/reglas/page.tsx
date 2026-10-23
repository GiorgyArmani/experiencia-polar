'use client';

import Link from 'next/link';
import { Screen } from '@/components/ui';

// Textos cortos: todo debe verse en una pantalla de teléfono sin desplazarse (si no cabe, se desplaza en vez de recortarse).
const PASOS = [
  { t: 'Escanea el QR', d: 'Usa el mismo código para acceder a todos los niveles.' },
  { t: 'Supera los 4 niveles', d: 'Cada estación abre en su horario y tienes un minuto para contestar. ¡Responde rápido para sumar más puntos!' },
  { t: '¡Cuidado en el Nivel 4!', d: 'Aquí las respuestas incorrectas restan puntos.' },
  { t: 'Sube en el ranking', d: 'Suma puntos y consulta la posición de tu localidad.' },
];

export default function Instrucciones() {
  return (
    <Screen className="overflow-x-hidden">
      <div className="flex flex-1 flex-col justify-center px-[clamp(16px,5vw,24px)] pt-[max(16px,3dvh)]">
        {/* Fondo blanco para que el título no se pierda sobre los arcos de colores. */}
        <h1 className="title-display self-center rounded-full bg-white px-6 py-2 text-center text-[clamp(28px,min(10vw,5dvh),40px)] leading-none text-polar-navy shadow-[0_4px_14px_rgba(14,12,78,0.15)]">
          Instrucciones
        </h1>

        {/* Mismo estilo que el botón de abajo: fondo azul y letras blancas, con aire entre bloques. */}
        <ol className="mt-[clamp(14px,2.5dvh,22px)] flex flex-col gap-[clamp(10px,1.8dvh,16px)]">
          {PASOS.map((p, i) => (
            <li
              key={p.t}
              className="flex items-center gap-3 rounded-[18px] bg-polar-steel px-4 py-[clamp(9px,1.4dvh,13px)] text-white shadow-[0_4px_10px_rgba(14,12,78,0.28)]"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-base font-bold text-polar-steel">
                {i + 1}
              </span>
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="text-[clamp(14px,2.1dvh,16px)] font-bold leading-tight">{p.t}</span>
                <span className="text-[clamp(12px,1.85dvh,14px)] leading-snug text-white/90">{p.d}</span>
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
