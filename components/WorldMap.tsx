'use client';

// Mapa del recorrido (mockup de la UEP): un número 4 grande sobre un plano cuadriculado, con montañas y nubes
// sobrias. Las 4 estaciones (niveles) son círculos numerados sobre el 4 y la meta es una estrella.
// El ícono del jugador camina de una estación a otra.
import { useEffect, useId, useRef, useState } from 'react';
import { ESTACIONES } from '@/shared/estaciones';
import type { Icono } from '@/shared/icono';
import { sfx } from '@/lib/sfx';
import { PlayerIcon } from './PlayerIcon';

const W = 320;
const H = 380;
type Pt = readonly [number, number];

//            2
//          ╱ │
//        ╱   │
//      3 ────┼─ 4 ★
//            │
//            1
//          INICIO
//
/** Paradas del camino: 0 = inicio, 1..4 = estaciones, 5 = meta. */
const STOPS: Pt[] = [
  [204, 352],
  [204, 298],
  [204, 70],
  [64, 240],
  [246, 240],
  [288, 240],
];
export const META = STOPS.length - 1;

/** El trazo del 4: palo, diagonal y barra. */
const CUATRO = `M${STOPS[1][0]} ${STOPS[1][1] + 14} L${STOPS[2][0]} ${STOPS[2][1]} L${STOPS[3][0]} ${STOPS[3][1]} L${STOPS[META][0] - 6} ${STOPS[3][1]}`;

/** Puntos a recorrer para ir de una parada a otra (hacia adelante). */
function route(from: number, to: number): Pt[] {
  return STOPS.slice(from, Math.max(from, to) + 1);
}

const pct = ([x, y]: Pt) => ({ left: `${(x / W) * 100}%`, top: `${(y / H) * 100}%` });

/** Parada donde está el jugador: la última estación terminada (o el inicio). */
export function lastStop(completed: number[]) {
  return completed.length ? Math.max(...completed) : 0;
}

export function WorldMap({
  icono,
  completed,
  current = null,
  from,
  to,
  justCleared,
  graduado = false,
  onArrive,
  className = '',
}: {
  icono: Icono;
  completed: number[];
  /** Estación abierta o en curso (se resalta). */
  current?: number | null;
  /** Desde qué parada camina el ícono (si se omite, aparece directo en `to`). */
  from?: number;
  /** Parada donde termina el ícono. */
  to: number;
  /** Estación recién superada: su círculo aparece con un salto. */
  justCleared?: number;
  graduado?: boolean;
  onArrive?: () => void;
  className?: string;
}) {
  const uid = useId().replace(/:/g, '');
  const start = from ?? to;
  const [pos, setPos] = useState<Pt>(STOPS[start]);
  const [ms, setMs] = useState(0);
  const [walking, setWalking] = useState(false);
  const arrive = useRef(onArrive);
  arrive.current = onArrive;
  const allDone = completed.length >= ESTACIONES.length;

  useEffect(() => {
    const pts = route(start, to);
    setMs(0);
    setPos(pts[0]);
    if (pts.length < 2) {
      arrive.current?.();
      return;
    }
    const timers: ReturnType<typeof setTimeout>[] = [];
    let t = 650; // una pausa para ver el mapa antes de arrancar
    timers.push(setTimeout(() => setWalking(true), t));
    for (let i = 1; i < pts.length; i++) {
      const [ax, ay] = pts[i - 1];
      const [bx, by] = pts[i];
      const dur = Math.max(250, Math.hypot(bx - ax, by - ay) * 6.5);
      const at = t;
      timers.push(
        setTimeout(() => {
          setMs(dur);
          setPos(pts[i]);
        }, at),
      );
      // Pasitos mientras camina.
      for (let s = 0; s < dur; s += 190) timers.push(setTimeout(() => sfx.hover(), at + s));
      t += dur;
    }
    timers.push(
      setTimeout(() => {
        setWalking(false);
        sfx.scan();
        arrive.current?.();
      }, t),
    );
    return () => timers.forEach(clearTimeout);
  }, [start, to]);

  return (
    <div className={`relative mx-auto aspect-[320/380] w-full ${className}`}>
      <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 h-full w-full" role="img" aria-label={describe(completed, current)}>
        <defs>
          <pattern id={`grid-${uid}`} width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M20 0H0V20" fill="none" stroke="#DCE5EF" strokeWidth="1" />
          </pattern>
          <clipPath id={`plano-${uid}`}>
            <rect x="16" y="16" width={W - 32} height={H - 32} rx="20" />
          </clipPath>
        </defs>

        {/* Marco: tarjeta blanca con doble borde fino */}
        <rect x="2" y="2" width={W - 4} height={H - 4} rx="26" fill="#FFFFFF" stroke="#0E0C4E" strokeOpacity="0.55" strokeWidth="1.5" />
        <rect x="16" y="16" width={W - 32} height={H - 32} rx="20" fill={`url(#grid-${uid})`} />

        {/* Montañas y nubes, sobrias y lejos del camino */}
        <g clipPath={`url(#plano-${uid})`}>
          <Montana pts="16,150 16,96 52,60 80,90 104,72 128,124 112,150" luz="52,60 80,90 68,150 40,150" />
          <Montana pts="262,16 304,16 304,140 282,120 252,64" luz="262,16 282,40 270,76 252,64" />
          <Montana pts="16,364 16,300 58,268 104,306 150,364" luz="58,268 104,306 84,364 40,364" />
          <Montana pts="236,364 266,316 290,300 304,320 304,364" luz="266,316 290,300 282,364 252,364" />
          <Nube x={104} y={40} />
          <Nube x={46} y={196} s={0.8} />
          <Nube x={270} y={176} s={0.85} />
          <Nube x={146} y={318} s={0.9} />
        </g>
        <rect x="16" y="16" width={W - 32} height={H - 32} rx="20" fill="none" stroke="#0E0C4E" strokeOpacity="0.55" strokeWidth="1.5" />

        {/* El 4: borde azul y relleno blanco */}
        <path d={CUATRO} fill="none" stroke="#0351A3" strokeWidth="28" strokeLinejoin="miter" strokeLinecap="square" />
        <path d={CUATRO} fill="none" stroke="#FFFFFF" strokeWidth="18" strokeLinejoin="miter" strokeLinecap="square" />

        {/* Inicio: una cápsula bajo el 4 */}
        <path d={`M${STOPS[0][0]} ${STOPS[1][1] + 28} V${STOPS[0][1] - 10}`} stroke="#4587C5" strokeWidth="2" strokeDasharray="3 4" />
        <rect x={STOPS[0][0] - 8} y={STOPS[0][1] - 12} width="16" height="26" rx="8" fill="#FFFFFF" stroke="#4587C5" strokeWidth="2.5" />
        <path d={`M${STOPS[0][0]} ${STOPS[0][1] - 5} v4 M${STOPS[0][0]} ${STOPS[0][1] + 3} v4`} stroke="#4587C5" strokeWidth="2.5" strokeLinecap="round" />

        {/* Estaciones (niveles) */}
        {ESTACIONES.map((e) => {
          const [x, y] = STOPS[e.id];
          const done = completed.includes(e.id);
          const now = !done && e.id === current;
          return (
            <g key={e.id} className={justCleared === e.id ? 'animate-pop-straight' : undefined} style={{ transformOrigin: `${x}px ${y}px`, transformBox: 'view-box' }}>
              {now && <circle cx={x} cy={y} r="22" fill="none" stroke="#FFCC53" strokeWidth="4" className="animate-pulse" />}
              <circle cx={x} cy={y} r="16" fill={done ? '#4587C5' : now ? '#FFCC53' : '#9ED8FF'} stroke="#FFFFFF" strokeWidth="2.5" />
              {done ? (
                <path d={`M${x - 6} ${y + 0.5} l4 4 l8 -9`} fill="none" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              ) : (
                <text x={x} y={y + 6.5} textAnchor="middle" fontSize="18" fontWeight="700" fill={now ? '#0E0C4E' : '#FFFFFF'} fontFamily="Poppins, sans-serif">
                  {e.id}
                </text>
              )}
            </g>
          );
        })}

        {/* Meta: la estrella */}
        <Estrella x={STOPS[META][0]} y={STOPS[META][1]} r={allDone ? 20 : 17} on={allDone} />
      </svg>

      {/* El jugador: su ícono, parado sobre la parada */}
      <div
        className="pointer-events-none absolute z-10 w-[14%] -translate-x-1/2 -translate-y-[118%]"
        style={{ ...pct(pos), transition: ms ? `left ${ms}ms linear, top ${ms}ms linear` : 'none' }}
      >
        <div className={walking ? 'animate-walk' : 'animate-breathe'}>
          <PlayerIcon icono={icono} graduado={graduado} className="w-full drop-shadow-[0_3px_4px_rgba(14,12,78,0.35)]" title="Tú" />
        </div>
      </div>
    </div>
  );
}

function describe(completed: number[], current: number | null) {
  const hechas = ESTACIONES.filter((e) => completed.includes(e.id)).map((e) => `Nivel ${e.id}`);
  const ahora = ESTACIONES.find((e) => e.id === current);
  return `Mapa del recorrido. Superados: ${hechas.length ? hechas.join(', ') : 'ninguno'}.${ahora ? ` Siguiente: Nivel ${ahora.id}.` : ''}`;
}

/** Montaña de pocas caras: el cuerpo y una cara más clara. */
function Montana({ pts, luz }: { pts: string; luz: string }) {
  return (
    <g>
      <polygon points={pts} fill="#0B4F7C" />
      <polygon points={luz} fill="#1C6A9E" />
    </g>
  );
}

function Nube({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <path
      transform={`translate(${x} ${y}) scale(${s})`}
      d="M-22 6 a8 8 0 0 1 6 -12 a11 11 0 0 1 20 -4 a9 9 0 0 1 14 8 a6 6 0 0 1 4 8 z"
      fill="#0E3A66"
    />
  );
}

function Estrella({ x, y, r, on }: { x: number; y: number; r: number; on: boolean }) {
  const pts = Array.from({ length: 10 }, (_, i) => {
    const a = (Math.PI / 5) * i - Math.PI / 2;
    const rr = i % 2 ? r * 0.48 : r;
    return `${x + Math.cos(a) * rr},${y + Math.sin(a) * rr}`;
  }).join(' ');
  return <polygon points={pts} fill="#FFCC53" stroke="#E5AC2E" strokeWidth="1.5" strokeLinejoin="round" className={on ? 'animate-pulse' : undefined} />;
}
