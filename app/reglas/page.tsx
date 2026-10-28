'use client';

import Link from 'next/link';
import { Screen } from '@/components/ui';

// Textos cortos: todo debe verse en una pantalla de teléfono sin desplazarse (si no cabe, se desplaza en vez de recortarse).
const PASOS = [
  { icono: '/iconos/paso-1.png', t: 'Escanea el QR', d: 'Usa el mismo código para acceder a todos los niveles.' },
  { icono: '/iconos/paso-2.png', t: 'Supera los 4 niveles', d: 'Cada estación abre en su horario y tienes un minuto para contestar. ¡Responde rápido para sumar más puntos!' },
  { icono: '/iconos/paso-3.png', t: '¡Cuidado en el Nivel 4!', d: 'Aquí las respuestas incorrectas restan puntos.' },
  { icono: '/iconos/paso-4.png', t: 'Sube en el ranking', d: 'Suma puntos y consulta la posición de tu localidad.' },
];

export default function Instrucciones() {
  return (
    <Screen className="overflow-x-hidden">
      <div className="flex flex-1 flex-col justify-center px-[clamp(16px,5vw,24px)] pt-[max(16px,3dvh)]">
        {/* Solo el título va resaltado en azul; los pasos van en blanco. */}
        <h1 className="title-display self-center rounded-full bg-polar-blue px-6 py-2 text-center text-[clamp(28px,min(10vw,5dvh),40px)] leading-none text-white shadow-[0_4px_14px_rgba(14,12,78,0.25)]">
          Instrucciones
        </h1>

        {/* Pasos en tarjetas blancas con letra azul oscuro; cada uno con su ícono de la acción. */}
        <ol className="mt-[clamp(14px,2.5dvh,22px)] flex flex-col gap-[clamp(10px,1.8dvh,16px)]">
          {PASOS.map((p) => (
            <li
              key={p.t}
              className="flex items-center gap-3 rounded-[18px] border-2 border-polar-navy/15 bg-white px-4 py-[clamp(9px,1.4dvh,13px)] text-polar-navy shadow-[0_4px_10px_rgba(14,12,78,0.15)]"
            >
              {/* El PNG es de líneas negras: se usa como máscara para pintarlo del azul de la UEP. */}
              <span
                aria-hidden
                className="h-[clamp(36px,5.5dvh,44px)] w-[clamp(36px,5.5dvh,44px)] shrink-0 bg-polar-blue"
                style={{ mask: `url('${p.icono}') center / contain no-repeat`, WebkitMask: `url('${p.icono}') center / contain no-repeat` }}
              />
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="text-[clamp(14px,2.1dvh,16px)] font-medium leading-tight">{p.t}</span>
                <span className="text-[clamp(12px,1.85dvh,14px)] leading-snug">{p.d}</span>
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
