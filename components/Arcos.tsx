// Arcos de líneas concéntricas (Elementos EP del Juego Aniversario): el fondo claro de los mockups de la UEP.
// Van detrás del contenido, en las esquinas, sin tapar textos.
import { useId } from 'react';

type Arco = {
  /** Clases de posición y tamaño de la caja (absolute). */
  box: string;
  /** Centro de los círculos en la caja de 100×100 (puede quedar afuera). */
  cx: number;
  cy: number;
  /** Radio del primer arco y separación entre arcos. */
  r: number;
  gap: number;
  n: number;
  from: string;
  to: string;
};

const ARCOS: Arco[] = [
  // Arriba a la derecha: azules
  { box: 'right-0 top-[5%] h-[24%] w-[30%]', cx: 150, cy: 105, r: 62, gap: 5, n: 8, from: '#0351A3', to: '#4587C5' },
  // Centro a la izquierda: azul acero a oliva
  { box: 'left-0 top-[46%] h-[22%] w-[13%]', cx: -110, cy: 150, r: 150, gap: 5, n: 8, from: '#4A6F8F', to: '#A39A55' },
  // Centro a la derecha: azul acero a oliva
  { box: 'right-0 top-[50%] h-[22%] w-[13%]', cx: 210, cy: 150, r: 150, gap: 5, n: 8, from: '#4A6F8F', to: '#A39A55' },
  // Abajo a la izquierda: amarillos
  { box: 'bottom-0 left-0 h-[24%] w-[34%]', cx: 150, cy: 175, r: 120, gap: 5, n: 8, from: '#D2B45A', to: '#FFCC53' },
];

export function Arcos({ className = '' }: { className?: string }) {
  const uid = useId().replace(/:/g, '');
  return (
    <div className={`pointer-events-none absolute inset-0 -z-10 overflow-hidden ${className}`} aria-hidden>
      {ARCOS.map((a, i) => (
        <svg key={i} viewBox="0 0 100 100" preserveAspectRatio="none" className={`absolute ${a.box}`}>
          <defs>
            <linearGradient id={`arco-${uid}-${i}`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor={a.from} />
              <stop offset="1" stopColor={a.to} />
            </linearGradient>
          </defs>
          {Array.from({ length: a.n }, (_, k) => (
            <circle
              key={k}
              cx={a.cx}
              cy={a.cy}
              r={a.r + k * a.gap}
              fill="none"
              stroke={`url(#arco-${uid}-${i})`}
              strokeWidth="2.5"
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </svg>
      ))}
    </div>
  );
}
