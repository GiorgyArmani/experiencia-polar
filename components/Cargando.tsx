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

// Colores del loader de la UEP (loader.svg): azules y gris claro.
const CIAN = '#009FDA';
const CELESTE = '#49BBED';
const AZUL = '#00338D';
const MARINO = '#003F72';
const GRIS = '#E5E5E5';

/** Anillos punteados (recreados de loader.svg): radio, color, grosor, patrón de trazos, segundos por vuelta (negativo = al revés). */
const ANILLOS: { r: number; c: string; w: number; dash: string; s: number }[] = [
  { r: 47, c: GRIS, w: 1.4, dash: '120 20 60 30', s: 12 },
  { r: 44, c: MARINO, w: 1.6, dash: '46 30 10 40 70 24', s: -8 },
  { r: 39, c: CIAN, w: 1.8, dash: '14 10 26 16 8 20', s: 6 },
  { r: 34, c: AZUL, w: 2, dash: '50 12 24 18', s: -4.5 },
  { r: 29, c: GRIS, w: 1.4, dash: '30 10 60 14', s: 7 },
  { r: 25, c: MARINO, w: 2, dash: '40 8 16 10', s: 3.4 },
  { r: 20, c: CIAN, w: 2.2, dash: '34 8 18 6', s: -2.8 },
  { r: 15, c: CELESTE, w: 1.8, dash: '20 6', s: 2.2 },
  { r: 10, c: GRIS, w: 1.4, dash: '60 4', s: -5 },
];

/** Sobre fondo oscuro, los azules oscuros se pasan a blanco para que se vean. */
const enOscuro = (c: string) => (c === MARINO || c === AZUL ? '#FFFFFF' : c === GRIS ? 'rgba(255,255,255,0.35)' : c);

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
          stroke={light ? a.c : enOscuro(a.c)}
          strokeWidth={a.w}
          strokeDasharray={a.dash}
          strokeLinecap="round"
          style={{
            transformOrigin: '50px 50px',
            animation: `spin-ring ${Math.abs(a.s)}s linear infinite ${a.s < 0 ? 'reverse' : 'normal'}`,
          }}
        />
      ))}
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
  const colores = [MARINO, CIAN, AZUL, CELESTE, CIAN];
  return (
    <div className={`flex w-[160px] flex-col gap-[5px] ${className}`} aria-hidden>
      {colores.map((c, i) => (
        <span key={i} className="block h-[3px] overflow-hidden rounded-full bg-polar-navy/10">
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
      <Anillos size={150} />
      <Franjas />
      <span className="text-sm font-extrabold uppercase tracking-[0.18em] text-polar-navy">{texto}</span>
    </div>
  );
}
