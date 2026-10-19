'use client';

// Mapa del mundo estilo Mario Bros 3: una isla con un camino de casillas que une las 4 estaciones
// (los niveles) desde el INICIO hasta la META (la graduación). El ícono del jugador camina por el camino.
import { useEffect, useId, useRef, useState } from 'react';
import { ESTACIONES } from '@/shared/estaciones';
import type { Icono } from '@/shared/icono';
import { sfx } from '@/lib/sfx';
import { PlayerIcon } from './PlayerIcon';

const W = 320;
const H = 380;
type Pt = readonly [number, number];

/** Paradas del camino: 0 = inicio, 1..4 = estaciones, 5 = meta. */
const STOPS: Pt[] = [
  [42, 322],
  [134, 322],
  [262, 236],
  [74, 236],
  [186, 146],
  [270, 66],
];
export const META = STOPS.length - 1;

/** Tramos entre una parada y la siguiente (con sus esquinas: el camino solo va en línea recta). */
const LEGS: Pt[][] = [
  [STOPS[0], STOPS[1]],
  [STOPS[1], [262, 322], STOPS[2]],
  [STOPS[2], STOPS[3]],
  [STOPS[3], [74, 146], STOPS[4]],
  [STOPS[4], [186, 66], STOPS[5]],
];

const pathD = LEGS.map((leg, i) => leg.map(([x, y], j) => `${i === 0 && j === 0 ? 'M' : 'L'}${x} ${y}`).join(' ')).join(' ');

/** Puntos a recorrer para ir de una parada a otra (hacia adelante). */
function route(from: number, to: number): Pt[] {
  const pts: Pt[] = [STOPS[from]];
  for (let i = from; i < to; i++) pts.push(...LEGS[i].slice(1));
  return pts;
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
  /** Estación recién superada: su casilla se voltea con la bandera. */
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
      // Pasitos 16 bits mientras camina.
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
          <pattern id={`tiles-${uid}`} width="16" height="16" patternUnits="userSpaceOnUse">
            <rect width="16" height="16" fill="#A9D3FF" />
            <rect width="8" height="8" fill="#C4E2FF" />
            <rect x="8" y="8" width="8" height="8" fill="#C4E2FF" />
          </pattern>
        </defs>

        {/* Cielo con estrellas */}
        <rect width={W} height={H} rx="22" fill="#F4F4F4" />
        {[
          [20, 22, 6], [300, 20, 5], [12, 190, 4], [306, 186, 5], [292, 366, 4], [26, 368, 5], [160, 14, 4],
        ].map(([x, y, r], i) => (
          <Star key={i} x={x} y={y} r={r} />
        ))}

        {/* La isla: agua oscura alrededor, tierra a cuadros */}
        <rect x="14" y="34" width="292" height="330" rx="34" fill="#0351A3" />
        <rect x="14" y="28" width="292" height="328" rx="34" fill="#008CFD" stroke="#0E0C4E" strokeWidth="4" />
        <rect x="26" y="40" width="268" height="304" rx="24" fill={`url(#tiles-${uid})`} stroke="#0E0C4E" strokeWidth="3" />
        {/* Olitas */}
        {[[30, 352], [120, 354], [230, 352], [298, 120], [18, 120], [298, 260]].map(([x, y], i) => (
          <path key={i} d={`M${x - 6} ${y} q3 -4 6 0 q3 4 6 0`} fill="none" stroke="#E3F1FF" strokeWidth="2" strokeLinecap="round" />
        ))}

        {/* Colinas y matas, con borde grueso como en los juegos de 16 bits */}
        <Hill x={200} y={302} w={40} h={28} />
        <Hill x={232} y={304} w={24} h={18} />
        <Hill x={130} y={200} w={36} h={26} />
        <Hill x={250} y={196} w={30} h={22} />
        <Hill x={60} y={110} w={34} h={28} />
        <Bush x={50} y={286} />
        <Bush x={165} y={292} />
        <Bush x={120} y={110} />
        <Bush x={240} y={112} />

        {/* Camino: borde, arena y puntitos */}
        <path d={pathD} fill="none" stroke="#0E0C4E" strokeWidth="18" strokeLinejoin="round" strokeLinecap="round" />
        <path d={pathD} fill="none" stroke="#FFF6DD" strokeWidth="12" strokeLinejoin="round" strokeLinecap="round" />
        <path d={pathD} fill="none" stroke="#E5AC2E" strokeWidth="3.5" strokeLinecap="round" strokeDasharray="0 9" />

        {/* Inicio */}
        <g>
          <circle cx={STOPS[0][0]} cy={STOPS[0][1]} r="12" fill="#FFFFFF" stroke="#0E0C4E" strokeWidth="3.5" />
          <circle cx={STOPS[0][0]} cy={STOPS[0][1]} r="5" fill="#E5484D" />
          <Tag x={STOPS[0][0]} y={STOPS[0][1] + 24} text="INICIO" w={44} />
        </g>

        {/* Estaciones (niveles) */}
        {ESTACIONES.map((e) => {
          const [x, y] = STOPS[e.id];
          const done = completed.includes(e.id);
          const now = !done && e.id === current;
          return (
            <g key={e.id}>
              {now && (
                <rect x={x - 23} y={y - 23} width="46" height="46" rx="12" fill="none" stroke="#FFCC53" strokeWidth="4" className="animate-pulse" />
              )}
              <rect x={x - 17} y={y - 13} width="34" height="34" rx="8" fill="#0E0C4E" />
              <rect
                x={x - 17}
                y={y - 17}
                width="34"
                height="34"
                rx="8"
                fill={done ? '#008CFD' : now ? '#FFCC53' : '#FFFFFF'}
                stroke="#0E0C4E"
                strokeWidth="3.5"
                className={justCleared === e.id ? 'animate-pop' : undefined}
                style={{ transformOrigin: `${x}px ${y}px`, transformBox: 'view-box' }}
              />
              {done ? (
                <Flag x={x} y={y} pop={justCleared === e.id} />
              ) : (
                <text
                  x={x}
                  y={y + 8}
                  textAnchor="middle"
                  className="font-display"
                  fontSize="22"
                  fill={now ? '#0E0C4E' : '#7C8FB3'}
                >
                  {e.id}
                </text>
              )}
              <Tag x={x} y={y + 31} text={e.corto} w={e.corto.length * 6 + 16} strong={now} />
            </g>
          );
        })}

        {/* Meta: la graduación */}
        <Castle x={STOPS[META][0]} y={STOPS[META][1]} done={completed.length >= ESTACIONES.length} />
        <Tag x={STOPS[META][0]} y={STOPS[META][1] + 30} text="META" w={40} strong={completed.length >= ESTACIONES.length} />
      </svg>

      {/* El jugador: su ícono, parado sobre la casilla */}
      <div
        className="pointer-events-none absolute z-10 w-[15%] -translate-x-1/2 -translate-y-[88%]"
        style={{ ...pct(pos), transition: ms ? `left ${ms}ms linear, top ${ms}ms linear` : 'none' }}
      >
        <div className={walking ? 'animate-walk' : 'animate-breathe'}>
          <PlayerIcon icono={icono} graduado={graduado} className="w-full" title="Tú" />
        </div>
        <span className="mx-auto mt-0.5 block h-1.5 w-2/3 rounded-full bg-[#0E0C4E]/30" aria-hidden />
      </div>
    </div>
  );
}

function describe(completed: number[], current: number | null) {
  const hechas = ESTACIONES.filter((e) => completed.includes(e.id)).map((e) => e.nombre);
  const ahora = ESTACIONES.find((e) => e.id === current);
  return `Mapa del recorrido. Superadas: ${hechas.length ? hechas.join(', ') : 'ninguna'}.${ahora ? ` Siguiente: ${ahora.nombre}.` : ''}`;
}

function Tag({ x, y, text, w, strong = false }: { x: number; y: number; text: string; w: number; strong?: boolean }) {
  return (
    <g>
      <rect x={x - w / 2} y={y - 8} width={w} height="15" rx="7.5" fill={strong ? '#FFCC53' : '#FFFFFF'} stroke="#0E0C4E" strokeWidth="2" />
      <text x={x} y={y + 3.2} textAnchor="middle" fontSize="9" fontWeight="800" fill="#0E0C4E" fontFamily="Poppins, sans-serif">
        {text}
      </text>
    </g>
  );
}

function Flag({ x, y, pop }: { x: number; y: number; pop: boolean }) {
  return (
    <g className={pop ? 'animate-pop' : undefined} style={{ transformOrigin: `${x}px ${y}px`, transformBox: 'view-box' }}>
      <path d={`M${x - 6} ${y + 10} V${y - 10}`} stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" />
      <path d={`M${x - 5} ${y - 10} h13 l-4 5 4 5 h-13z`} fill="#FFCC53" stroke="#0E0C4E" strokeWidth="1.5" strokeLinejoin="round" />
    </g>
  );
}

function Star({ x, y, r }: { x: number; y: number; r: number }) {
  const pts = Array.from({ length: 10 }, (_, i) => {
    const a = (Math.PI / 5) * i - Math.PI / 2;
    const rr = i % 2 ? r * 0.45 : r;
    return `${x + Math.cos(a) * rr},${y + Math.sin(a) * rr}`;
  }).join(' ');
  return <polygon points={pts} fill="#FFCC53" stroke="#E5AC2E" strokeWidth="1" />;
}

function Hill({ x, y, w, h }: { x: number; y: number; w: number; h: number }) {
  return (
    <g>
      <path d={`M${x - w / 2} ${y} a${w / 2} ${h} 0 0 1 ${w} 0 z`} fill="#4587C5" stroke="#0E0C4E" strokeWidth="3" strokeLinejoin="round" />
      <path d={`M${x - w / 4} ${y - h * 0.55} a${w / 6} ${h / 4} 0 0 1 ${w / 6} -${h / 6}`} fill="none" stroke="#C4E2FF" strokeWidth="2.5" strokeLinecap="round" />
    </g>
  );
}

function Bush({ x, y }: { x: number; y: number }) {
  return (
    <path
      d={`M${x - 12} ${y} a5 5 0 0 1 4 -8 a6 6 0 0 1 11 -2 a5 5 0 0 1 9 4 a4 4 0 0 1 0 6 z`}
      fill="#008CFD"
      stroke="#0E0C4E"
      strokeWidth="2.5"
      strokeLinejoin="round"
    />
  );
}

/** Castillo de la meta con bandera de birrete. */
function Castle({ x, y, done }: { x: number; y: number; done: boolean }) {
  const wall = done ? '#FFCC53' : '#FFFFFF';
  return (
    <g>
      <path d={`M${x} ${y - 34} V${y - 48}`} stroke="#0E0C4E" strokeWidth="2.5" />
      <path d={`M${x} ${y - 48} l12 4 -12 4z`} fill="#E5484D" stroke="#0E0C4E" strokeWidth="1.5" strokeLinejoin="round" />
      <path
        d={`M${x - 20} ${y + 16} V${y - 14} h6 v-6 h6 v6 h4 v-14 h8 v14 h4 v-6 h6 v6 h6 V${y + 16} z`}
        fill={wall}
        stroke="#0E0C4E"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path d={`M${x - 6} ${y + 16} v-10 a6 6 0 0 1 12 0 v10 z`} fill="#0E0C4E" />
      <rect x={x - 15} y={y - 6} width="5" height="6" rx="1" fill="#0E0C4E" />
      <rect x={x + 10} y={y - 6} width="5" height="6" rx="1" fill="#0E0C4E" />
    </g>
  );
}
