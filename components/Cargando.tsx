// Animaciones de carga con los elementos gráficos del Juego Aniversario UEP (Elementos EP):
// anillos concéntricos punteados que giran, un destello radial y franjas de líneas.
// Dibujados en SVG (livianos y nítidos en cualquier pantalla).
'use client';

import { useEffect, useState } from 'react';

/** Duración mínima de cada carga, para que la animación se alcance a ver aunque el servidor responda rápido. */
export const CARGA_MIN_MS = { pantalla: 1800, escaneo: 2200 };

/** `true` cuando ya pasaron `ms` desde que se montó el componente. */
export function useTiempoMinimo(ms: number) {
  const [listo, setListo] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setListo(true), ms);
    return () => clearTimeout(t);
  }, [ms]);
  return listo;
}

const INDIGO = '#0E0C4E';
const REY = '#0351A3';
const BRILLANTE = '#008CFD';
const CIAN = '#00C3DA';
const LIMA = '#DEDE00';
const AMARILLO = '#FFCC53';
const ROJO = '#E8303A';

/** Anillos: radio, color, grosor, patrón de trazos, segundos por vuelta (negativo = al revés). */
const ANILLOS: { r: number; c: string; w: number; dash: string; s: number }[] = [
  { r: 47, c: ROJO, w: 1.6, dash: '70 30 120 40', s: 9 },
  { r: 43, c: LIMA, w: 1.6, dash: '50 20 30 60 90 25', s: -7 },
  { r: 38, c: CIAN, w: 2.4, dash: '8 6 22 10 6 14', s: 5 },
  { r: 33, c: INDIGO, w: 2.2, dash: '60 14 30 20', s: -4 },
  { r: 28, c: BRILLANTE, w: 2.6, dash: '12 8 28 8', s: 3.2 },
  { r: 23, c: REY, w: 2.2, dash: '40 10 20 12', s: -2.6 },
  { r: 18, c: CIAN, w: 1.8, dash: '6 5', s: 2 },
  { r: 12, c: ROJO, w: 2.2, dash: '50 12', s: -3 },
];

/** Anillos que giran: la animación de carga principal. */
export function Anillos({ size = 140, light = true, className = '' }: { size?: number; light?: boolean; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className} aria-hidden>
      {ANILLOS.map((a, i) => (
        <circle
          key={i}
          cx="50"
          cy="50"
          r={a.r}
          fill="none"
          stroke={!light && a.c === INDIGO ? '#FFFFFF' : a.c}
          strokeWidth={a.w}
          strokeDasharray={a.dash}
          strokeLinecap="round"
          style={{
            transformOrigin: '50px 50px',
            animation: `spin-ring ${Math.abs(a.s)}s linear infinite ${a.s < 0 ? 'reverse' : 'normal'}`,
          }}
        />
      ))}
      <circle cx="50" cy="50" r="4" fill={AMARILLO} style={{ transformOrigin: '50px 50px', animation: 'pulse-dot 1.2s ease-in-out infinite' }} />
    </svg>
  );
}

/** Destello radial (rehilete): para cargas cortas dentro de un botón o junto a un texto. */
export function Destello({ size = 22, color = CIAN, className = '' }: { size?: number; color?: string; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={`animate-spin-slow ${className}`} aria-hidden>
      {Array.from({ length: 16 }, (_, i) => (
        <path key={i} d="M12 12 L13.1 1.5 L10.9 1.5 Z" fill={color} transform={`rotate(${i * 22.5} 12 12)`} />
      ))}
    </svg>
  );
}

/** Franjas de líneas que se "llenan" de izquierda a derecha, como las de la línea gráfica. */
export function Franjas({ className = '' }: { className?: string }) {
  const colores = [AMARILLO, BRILLANTE, CIAN, LIMA, AMARILLO];
  return (
    <div className={`flex w-[160px] flex-col gap-[5px] ${className}`} aria-hidden>
      {colores.map((c, i) => (
        <span key={i} className="block h-[3px] overflow-hidden rounded-full bg-white/15">
          <span
            className="block h-full rounded-full"
            style={{ background: c, animation: `fill-line 1.6s ease-in-out ${i * 0.12}s infinite` }}
          />
        </span>
      ))}
    </div>
  );
}

/** Pantalla de carga completa: anillos, franjas y un texto. */
export function Cargando({ texto = 'Cargando…' }: { texto?: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-5" role="status" aria-live="polite">
      <Anillos size={150} light={false} />
      <Franjas />
      <span className="text-sm font-extrabold uppercase tracking-[0.18em] text-white">{texto}</span>
    </div>
  );
}
