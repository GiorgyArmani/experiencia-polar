// Fondo de arcos concéntricos (Elementos EP), recreado de "ELEMENTOS POLAR fondo.svg" (lienzo de 810×1440):
// 9 semicírculos arriba a la izquierda (azul rey → cian) y 9 abajo a la derecha (lima → amarillo → acero),
// con los colores de la paleta aprobada por la UEP (sin magenta ni rosado).
// Dibujado en código para no cargar el SVG original (450 KB) en cada pantalla. Va detrás del contenido.
// Animado (estilo tecnológico): segmentos de luz que recorren cada arco y un vaivén lento de cada grupo.
import { useId } from 'react';

/** Radios de los 9 arcos (unidades del lienzo original). */
const RADIOS = Array.from({ length: 9 }, (_, i) => 330 + i * 14);
const CAJA_W = 460;
const CAJA_H = 910;
const CY = CAJA_H / 2;

/** `portada`: los arcos de arriba se corren hacia la esquina para no chocar con el logo (pedido UEP). */
export function Arcos({ className = '', portada = false }: { className?: string; portada?: boolean }) {
  const uid = useId().replace(/:/g, '');
  const izq = `arcos-izq-${uid}`;
  const der = `arcos-der-${uid}`;
  return (
    <div className={`pointer-events-none absolute inset-0 -z-10 overflow-hidden ${className}`} aria-hidden>
      {/* Arriba a la izquierda: media luna que sale del borde izquierdo */}
      <svg viewBox={`0 0 ${CAJA_W} ${CAJA_H}`} className={`absolute left-0 top-0 w-[57%] ${portada ? '-translate-x-[30%] -translate-y-[30%]' : ''}`}>
        <defs>
          <linearGradient id={izq} x1="0" y1="0" x2="0" y2={CAJA_H} gradientUnits="userSpaceOnUse">
            <stop offset="0.15" stopColor="#0351A3" />
            <stop offset="0.5" stopColor="#008CFD" />
            <stop offset="0.85" stopColor="#00C3DA" />
          </linearGradient>
        </defs>
        <g className="arcos-vaiven" style={{ transformOrigin: `0px ${CY}px` }}>
          {RADIOS.map((r, i) => (
            <Arco key={r} d={`M0 ${CY - r} A${r} ${r} 0 0 1 0 ${CY + r}`} stroke={`url(#${izq})`} i={i} />
          ))}
        </g>
      </svg>
      {/* Abajo a la derecha: media luna que sale del borde derecho */}
      <svg viewBox={`0 0 ${CAJA_W} ${CAJA_H}`} className="absolute bottom-0 right-0 w-[57%]">
        <defs>
          <linearGradient id={der} x1="0" y1="0" x2="0" y2={CAJA_H} gradientUnits="userSpaceOnUse">
            <stop offset="0.15" stopColor="#DEDE00" />
            <stop offset="0.5" stopColor="#FFCC53" />
            <stop offset="0.85" stopColor="#4587C5" />
          </linearGradient>
        </defs>
        <g className="arcos-vaiven arcos-vaiven-inverso" style={{ transformOrigin: `${CAJA_W}px ${CY}px` }}>
          {RADIOS.map((r, i) => (
            <Arco key={r} d={`M${CAJA_W} ${CY - r} A${r} ${r} 0 0 0 ${CAJA_W} ${CY + r}`} stroke={`url(#${der})`} i={i} reverso />
          ))}
        </g>
      </svg>
    </div>
  );
}

/**
 * Un arco: la línea tenue de base y encima un segmento de luz que la recorre.
 * Cada arco tiene su propio ritmo y retraso, alternando el sentido, para que el conjunto se vea vivo.
 */
function Arco({ d, stroke, i, reverso = false }: { d: string; stroke: string; i: number; reverso?: boolean }) {
  const dur = 5 + ((i * 7) % 5) * 0.9; // 5 a 8.6 s
  const sentido = (i % 2 === 0) !== reverso ? 'normal' : 'reverse';
  return (
    <>
      <path d={d} fill="none" stroke={stroke} strokeWidth="4" opacity="0.45" />
      <path
        d={d}
        pathLength={100}
        fill="none"
        stroke={stroke}
        strokeWidth="5"
        strokeLinecap="round"
        strokeDasharray="18 82"
        className="arco-luz"
        style={{ animationDuration: `${dur}s`, animationDelay: `${-i * 1.3}s`, animationDirection: sentido }}
      />
    </>
  );
}
