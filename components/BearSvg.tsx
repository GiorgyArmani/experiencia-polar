// Oso 2D (facetado, estilo low poly) para la web: ranking, registro y fallback del juego.
// Usa la misma configuración de avatar que el modelo 3D de la app nativa.
import { useId } from 'react';
import { optionOf, type Avatar } from '@/shared/avatar';

/**
 * Expresiones del oso (lo que siente contigo durante el juego):
 *   normal · feliz · triste · pensar (duda, ceja levantada) · sorpresa · orgulloso (racha)
 *   nervioso (esperando la respuesta) · animo (guiño, después de fallar) · dormido (esperando la próxima trivia)
 */
export type Mood = 'normal' | 'feliz' | 'triste' | 'pensar' | 'sorpresa' | 'orgulloso' | 'nervioso' | 'animo' | 'dormido';

/** Hacia dónde mira el oso: x/y entre -1 y 1. */
export interface Look {
  x: number;
  y: number;
}

interface Props {
  avatar: Avatar;
  graduado?: boolean;
  /** "head" recorta a la cabeza (para avatares redondos del ranking). */
  crop?: 'full' | 'head';
  mood?: Mood;
  look?: Look;
  className?: string;
  title?: string;
}

const INK = '#1E1E1E';
const GRAD_NAVY = '#0B2A66';
const GRAD_GOLD = '#FFD23F';
const TRIM = '#FF8D28';

/* ───────────────────────── Geometría low poly ─────────────────────────
 * Copia del render de referencia: oso blanco de cuerpo entero, franela de manga corta con ribete
 * en el cuello y las mangas, patas redondas y pies con deditos.
 *
 * Cada pieza es una cúpula partida en anillos de vértices (con un poco de ruido fijo para que se
 * vea tallada a mano). Cada triángulo se sombrea según su inclinación respecto a una luz arriba a
 * la izquierda. Se pinta la silueta con el color plano y encima una capa de facetas blancas o
 * azuladas semitransparentes: así sirve con cualquier color de pelaje o ropa.
 * Todo se calcula una sola vez al cargar el módulo.
 */

type P = [number, number];
type V3 = [number, number, number];
interface Facet {
  pts: string;
  fill: string;
  op: number;
}
interface Part {
  outline: string;
  facets: Facet[];
}
interface Ring {
  f: number; // fracción del radio (1 = silueta)
  n: number; // vértices en el anillo
  off?: number; // giro del anillo, en pasos
}

const LIGHT: V3 = (() => {
  const v: V3 = [-0.45, -0.6, 0.66];
  const l = Math.hypot(...v);
  return [v[0] / l, v[1] / l, v[2] / l];
})();
const NEUTRAL = 0.66; // una cara mirando de frente queda con el color plano
const SHADOW = '#3A5478';

const hash = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
const fmt = (x: V3 | P) => `${x[0].toFixed(1)},${x[1].toFixed(1)}`;

function dome({
  cx,
  cy,
  rx,
  ry,
  h,
  rings,
  seed = 1,
  shape = () => 1,
}: {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  h: number;
  rings: Ring[];
  seed?: number;
  shape?: (a: number) => number;
}): Part {
  const verts: V3[][] = [[[cx, cy, h]]];
  const angles: number[][] = [[0]];
  rings.forEach(({ f, n, off = 0 }, k) => {
    const step = (Math.PI * 2) / n;
    const ring: V3[] = [];
    const angs: number[] = [];
    for (let i = 0; i < n; i++) {
      const a = (i + off + (hash(seed * 97 + k * 31 + i) - 0.5) * 0.5) * step;
      const fr = f >= 1 ? 1 : f * (1 + (hash(seed * 13 + k * 7 + i * 3) - 0.5) * 0.14);
      const sh = shape(a);
      ring.push([cx + Math.cos(a) * rx * fr * sh, cy + Math.sin(a) * ry * fr * sh, h * Math.sqrt(Math.max(0, 1 - fr * fr))]);
      angs.push(a);
    }
    verts.push(ring);
    angles.push(angs);
  });

  // Une cada anillo con el siguiente avanzando por ángulo.
  const tris: [V3, V3, V3][] = [];
  for (let k = 0; k < verts.length - 1; k++) {
    const A = verts[k];
    const B = verts[k + 1];
    if (A.length === 1) {
      B.forEach((b, j) => tris.push([A[0], b, B[(j + 1) % B.length]]));
      continue;
    }
    const ua = (i: number) => angles[k][i % A.length] + Math.PI * 2 * Math.floor(i / A.length);
    const ub = (j: number) => angles[k + 1][j % B.length] + Math.PI * 2 * Math.floor(j / B.length);
    let i = 0;
    let j = 0;
    while (i < A.length || j < B.length) {
      if (j >= B.length || (i < A.length && ua(i + 1) < ub(j + 1))) {
        tris.push([A[i % A.length], A[(i + 1) % A.length], B[j % B.length]]);
        i++;
      } else {
        tris.push([A[i % A.length], B[(j + 1) % B.length], B[j % B.length]]);
        j++;
      }
    }
  }

  const facets = tris.map(([p, q, r]) => {
    const u = [q[0] - p[0], q[1] - p[1], q[2] - p[2]];
    const v = [r[0] - p[0], r[1] - p[1], r[2] - p[2]];
    let n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
    if (n[2] < 0) n = n.map((x) => -x);
    const len = Math.hypot(n[0], n[1], n[2]) || 1;
    const lum = Math.max(0, (n[0] * LIGHT[0] + n[1] * LIGHT[1] + n[2] * LIGHT[2]) / len);
    const lit = lum >= NEUTRAL;
    return {
      pts: [p, q, r].map(fmt).join(' '),
      fill: lit ? '#FFFFFF' : SHADOW,
      op: +(lit ? ((lum - NEUTRAL) / (1 - NEUTRAL)) * 0.3 : ((NEUTRAL - lum) / NEUTRAL) * 0.3).toFixed(3),
    };
  });

  return { outline: verts[verts.length - 1].map(fmt).join(' '), facets };
}

/** Cúpula con la silueta de un polígono cualquiera, vista desde `c`. */
function blob(poly: P[], c: P, h: number, rings: Ring[], seed: number): Part {
  const [cx, cy] = c;
  const shape = (a: number) => {
    const dx = Math.cos(a);
    const dy = Math.sin(a);
    let best = Infinity;
    poly.forEach(([x1, y1], i) => {
      const [x2, y2] = poly[(i + 1) % poly.length];
      const ex = x2 - x1;
      const ey = y2 - y1;
      const den = dx * ey - dy * ex;
      if (Math.abs(den) < 1e-9) return;
      const t = ((x1 - cx) * ey - (y1 - cy) * ex) / den;
      const u = ((x1 - cx) * dy - (y1 - cy) * dx) / den;
      if (t > 0 && u >= 0 && u <= 1) best = Math.min(best, t);
    });
    return best === Infinity ? 1 : best;
  };
  return dome({ cx, cy, rx: 1, ry: 1, h, rings, seed, shape });
}

const flip = (poly: P[]): P[] => poly.map(([x, y]) => [200 - x, y]);
const flipP = ([x, y]: P): P => [200 - x, y];
const pts = (poly: P[]) => poly.map(fmt).join(' ');

/* Cabeza */
const HEAD = dome({
  cx: 100,
  cy: 92,
  rx: 64,
  ry: 62,
  h: 60,
  seed: 3,
  rings: [
    { f: 0.36, n: 6 },
    { f: 0.7, n: 12, off: 0.3 },
    { f: 1, n: 22 },
  ],
  // Más ancha en los cachetes y un poco plana arriba.
  shape: (a) => 1 + 0.05 * Math.cos(2 * a) - 0.05 * Math.max(0, -Math.sin(a)),
});
// El hocico va dentro del grupo de la cara (que sube 12 unidades), por eso su centro está en 121.
const MUZZLE = dome({
  cx: 100,
  cy: 121,
  rx: 27,
  ry: 20,
  h: 20,
  seed: 5,
  rings: [
    { f: 0.5, n: 6, off: 0.5 },
    { f: 1, n: 14 },
  ],
  shape: (a) => 1 + 0.07 * Math.cos(2 * a),
});
const earAt = (cx: number, seed: number) => ({
  outer: dome({ cx, cy: 44, rx: 20, ry: 19, h: 14, seed, rings: [{ f: 0.55, n: 6 }, { f: 1, n: 12 }] }),
  inner: dome({ cx: cx + (cx < 100 ? 2 : -2), cy: 46, rx: 11, ry: 10, h: -6, seed: seed + 1, rings: [{ f: 1, n: 8 }] }),
});
const EARS = [earAt(48, 7), earAt(152, 11)];

/* Cuerpo */
const TORSO_POLY: P[] = [
  [100, 138], [128, 140], [150, 146], [163, 156], [168, 172], [166, 202], [164, 232], [162, 249],
  [100, 252], [38, 249], [36, 232], [34, 202], [32, 172], [37, 156], [50, 146], [72, 140],
];
const TORSO = blob(TORSO_POLY, [100, 196], 46, [{ f: 0.4, n: 8 }, { f: 0.75, n: 14, off: 0.4 }, { f: 1, n: 26 }], 13);

const LEG_L: P[] = [[34, 236], [99, 236], [99, 292], [96, 336], [34, 336], [30, 290]];
const FOOT_L: P[] = [[28, 324], [96, 324], [100, 344], [97, 360], [30, 360], [24, 344]];
const SLEEVE_L: P[] = [[54, 140], [36, 148], [18, 162], [6, 180], [1, 190], [37, 208], [42, 188], [46, 168]];
const CUFF_L: P[] = [[1, 188], [37, 206], [35, 214], [-1, 196]];
const FOREARM_L: P[] = [[3, 192], [36, 208], [38, 228], [30, 238], [8, 238], [1, 222]];
const TOES_L: P[] = [[45, 354], [57, 355.5], [69, 354]];
const PAW_AT = { L: [20, 245] as P, R: flipP([20, 245]) };

const side = (flipped: boolean, seed: number) => {
  const f = (poly: P[]) => (flipped ? flip(poly) : poly);
  const c = (p: P) => (flipped ? flipP(p) : p);
  return {
    leg: blob(f(LEG_L), c([65, 288]), 30, [{ f: 0.45, n: 7 }, { f: 1, n: 18 }], seed),
    foot: blob(f(FOOT_L), c([62, 342]), 16, [{ f: 0.5, n: 6 }, { f: 1, n: 16 }], seed + 1),
    sleeve: blob(f(SLEEVE_L), c([26, 176]), 16, [{ f: 0.5, n: 6 }, { f: 1, n: 16 }], seed + 2),
    forearm: blob(f(FOREARM_L), c([19, 216]), 14, [{ f: 1, n: 10 }], seed + 3),
    paw: dome({ cx: c(PAW_AT.L)[0], cy: PAW_AT.L[1], rx: 20, ry: 19, h: 16, seed: seed + 4, rings: [{ f: 0.5, n: 6 }, { f: 1, n: 14 }] }),
    cuff: pts(f(CUFF_L)),
    toes: f(TOES_L),
  };
};
const SIDES = { L: side(false, 40), R: side(true, 60) };

/** Silueta en color plano + facetas de luz y sombra. */
function Shaded({ part, color }: { part: Part; color: string }) {
  return (
    <g>
      <polygon points={part.outline} fill={color} />
      <FacetsOnly part={part} />
    </g>
  );
}

/** Solo la capa de facetas (para sombrear lo que ya se dibujó encima de la silueta). */
function FacetsOnly({ part }: { part: Part }) {
  return (
    <g>
      {part.facets.map((f, i) => (
        <polygon key={i} points={f.pts} fill={f.fill} fillOpacity={f.op} />
      ))}
    </g>
  );
}

function Paw({ side: s, fur }: { side: 'L' | 'R'; fur: string }) {
  return <Shaded part={SIDES[s].paw} color={fur} />;
}

// Lo que sube la cara (ojos, hocico, nariz, boca, lentes) para que quede como en la referencia.
const FACE_UP = 'translate(0 -12)';

export function BearSvg({ avatar, graduado = false, crop = 'full', mood = 'normal', look, className, title }: Props) {
  const fur = optionOf('pelaje', avatar.pelaje);
  const ropa = optionOf('ropa', avatar.ropa);
  const cabeza = graduado ? null : optionOf('cabeza', avatar.cabeza);
  const acc = optionOf('accesorio', avatar.accesorio);
  const furC = fur.color;
  const furS = fur.accent ?? '#DDE6EE';
  const shirt = graduado ? GRAD_NAVY : ropa.color;
  // Ribete naranja como en la referencia; si la ropa ya es naranja, usa su propio acento.
  const trim = graduado ? GRAD_GOLD : ropa.color.toUpperCase() === TRIM ? (ropa.accent ?? INK) : TRIM;
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const torsoClip = `${uid}-torso`;

  return (
    <svg
      viewBox={crop === 'head' ? '28 6 144 144' : '-8 0 216 368'}
      // Si la caja sobra de alto, el oso se queda parado abajo (no flota en el medio).
      preserveAspectRatio={crop === 'head' ? undefined : 'xMidYMax meet'}
      className={className}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      {crop === 'full' && (
        <g>
          <defs>
            <clipPath id={torsoClip}>
              <polygon points={TORSO.outline} />
            </clipPath>
          </defs>

          {/* Sombra en el piso */}
          <ellipse cx="100" cy="360" rx="84" ry="6" fill={SHADOW} opacity={0.18} />

          {/* Piernas y pies con deditos */}
          {(['L', 'R'] as const).map((s) => (
            <g key={s}>
              <Shaded part={SIDES[s].leg} color={furC} />
              <Shaded part={SIDES[s].foot} color={furC} />
              {SIDES[s].toes.map(([x, y]) => (
                <circle key={x} cx={x} cy={y} r="2.6" fill={INK} />
              ))}
            </g>
          ))}

          {/* Franela: color plano, estampado y luego las facetas encima */}
          <polygon points={TORSO.outline} fill={shirt} />
          <g clipPath={`url(#${torsoClip})`}>
            {!graduado && <ShirtPattern ropa={ropa} />}
            {graduado && <polygon points="86,150 100,180 114,150" fill={GRAD_GOLD} />}
          </g>
          <FacetsOnly part={TORSO} />
          {/* Ribete del cuello */}
          {(graduado || ropa.id !== 'liquiliqui') && (
            <path d="M48 140 Q100 170 152 140 L155 149 Q100 181 45 149 Z" fill={trim} />
          )}

          {/* Brazos: antebrazo, manga con ribete y pata */}
          {(['L', 'R'] as const).map((s) => (
            <g key={s}>
              <Shaded part={SIDES[s].forearm} color={furC} />
              <Shaded part={SIDES[s].sleeve} color={shirt} />
              <polygon points={SIDES[s].cuff} fill={trim} />
              <Paw side={s} fur={furC} />
            </g>
          ))}
        </g>
      )}

      {/* Orejas */}
      {EARS.map((ear, i) => (
        <g key={i}>
          <Shaded part={ear.outer} color={furC} />
          <Shaded part={ear.inner} color={furS} />
        </g>
      ))}

      {/* Cabeza facetada */}
      <Shaded part={HEAD} color={furC} />

      {/* Hocico, nariz redondeada y cara */}
      <g transform={FACE_UP}>
        <Shaded part={MUZZLE} color={furC} />
        <path d="M89 111 Q100 105 111 111 Q110 118 100 121 Q90 118 89 111 Z" fill={INK} />
        <ellipse cx="95.5" cy="110" rx="3.2" ry="1.6" fill="#FFFFFF" opacity={0.75} />
        <Face mood={mood} look={look} />
      </g>

      {/* Accesorios */}
      {acc.id === 'lentes' && (
        <g stroke={acc.color} strokeWidth="4" fill="none" transform={FACE_UP}>
          <circle cx="78" cy="90" r="14" />
          <circle cx="122" cy="90" r="14" />
          <path d="M92 90 L108 90" />
        </g>
      )}
      {acc.id === 'lentes-sol' && (
        <g transform={FACE_UP}>
          <path d="M60 82 H94 Q94 102 78 102 Q60 102 60 82 Z" fill={acc.color} />
          <path d="M106 82 H140 Q140 102 122 102 Q106 102 106 82 Z" fill={acc.color} />
          <path d="M94 86 Q100 82 106 86" stroke={acc.color} strokeWidth="4" fill="none" />
          <path d="M60 84 L46 80 M140 84 L154 80" stroke={acc.color} strokeWidth="4" strokeLinecap="round" />
          {/* Reflejo */}
          <path d="M66 86 L74 86 M112 86 L120 86" stroke={acc.accent} strokeWidth="3" strokeLinecap="round" opacity={0.9} />
        </g>
      )}
      {acc.id === 'bufanda' && (
        <>
          <polygon points="58,140 100,158 142,140 146,154 100,172 54,154" fill={acc.color} />
          <polygon points="122,160 134,200 120,204 112,164" fill={acc.color} />
          <rect x="116" y="186" width="16" height="4" fill={acc.accent} transform="rotate(-14 124 188)" />
        </>
      )}
      {acc.id === 'corbatin' && (
        <g fill={acc.color}>
          <polygon points="100,160 82,150 82,172" />
          <polygon points="100,160 118,150 118,172" />
          <circle cx="100" cy="161" r="5" />
        </g>
      )}

      {/* Cabeza: gorra, melena, lazo, gorro, audífonos */}
      {cabeza?.id === 'gorra' && (
        <>
          <polygon points="52,60 66,30 100,20 134,30 148,60" fill={cabeza.color} />
          <polygon points="100,20 134,30 148,60 100,60" fill="#000" opacity={0.12} />
          <polygon points="100,56 160,56 172,68 104,68" fill={cabeza.accent} />
          <circle cx="100" cy="22" r="5" fill={cabeza.accent} />
        </>
      )}
      {cabeza?.id === 'melena' && (
        <g fill={cabeza.accent}>
          <polygon points="74,46 84,18 94,42" />
          <polygon points="88,40 100,10 110,40" />
          <polygon points="106,42 118,18 126,46" />
        </g>
      )}
      {cabeza?.id === 'lazo' && (
        <g>
          <polygon points="132,40 112,26 114,54" fill={cabeza.color} />
          <polygon points="132,40 152,26 150,54" fill={cabeza.color} />
          <circle cx="132" cy="40" r="6" fill={cabeza.accent} />
        </g>
      )}
      {cabeza?.id === 'gorro' && (
        <>
          <polygon points="54,62 64,32 100,18 136,32 146,62" fill={cabeza.color} />
          <rect x="52" y="56" width="96" height="12" rx="3" fill={cabeza.accent} />
          <circle cx="100" cy="16" r="9" fill={cabeza.accent} />
        </>
      )}
      {cabeza?.id === 'audifonos' && (
        <>
          <path d="M44 92 Q44 24 100 24 Q156 24 156 92" stroke={cabeza.color} strokeWidth="8" fill="none" />
          <rect x="30" y="80" width="18" height="30" rx="6" fill={cabeza.accent} />
          <rect x="152" y="80" width="18" height="30" rx="6" fill={cabeza.accent} />
        </>
      )}
      {cabeza?.id === 'playa' && (
        <>
          {/* Sombrero de paja de ala ancha, con cinta y flor */}
          <ellipse cx="100" cy="54" rx="76" ry="15" fill={cabeza.color} />
          <path d="M64 54 Q64 16 100 16 Q136 16 136 54 Z" fill={cabeza.color} />
          <path d="M70 30 Q100 22 130 30 M66 42 Q100 34 134 42" stroke="#C9A55A" strokeWidth="1.5" fill="none" />
          <path d="M64 46 Q100 40 136 46 L136 54 Q100 48 64 54 Z" fill={cabeza.accent} />
          <ellipse cx="100" cy="58" rx="76" ry="9" fill="none" stroke="#C9A55A" strokeWidth="1.5" />
          <g fill="#FFD23F">
            <circle cx="126" cy="46" r="4" />
            <circle cx="132" cy="46" r="4" />
            <circle cx="129" cy="42" r="4" />
            <circle cx="129" cy="50" r="4" />
          </g>
          <circle cx="129" cy="46" r="2.5" fill="#FFFFFF" />
        </>
      )}
      {cabeza?.id === 'llanero' && (
        <>
          {/* Sombrero llanero: ala ancha recta y copa con hendidura */}
          <ellipse cx="100" cy="56" rx="72" ry="12" fill={cabeza.color} />
          <path d="M70 56 L76 22 Q100 14 124 22 L130 56 Z" fill={cabeza.color} />
          <path d="M86 20 Q100 28 114 20" stroke={cabeza.accent} strokeWidth="3" fill="none" />
          <rect x="70" y="44" width="60" height="7" fill={cabeza.accent} />
        </>
      )}
      {cabeza?.id === 'tricolor' && (
        <>
          {/* Gorra con los colores de la bandera y sus 8 estrellas */}
          <clipPath id="gorra-tricolor">
            <polygon points="52,60 66,30 100,20 134,30 148,60" />
          </clipPath>
          <g clipPath="url(#gorra-tricolor)">
            <rect x="40" y="10" width="120" height="24" fill="#FFD23F" />
            <rect x="40" y="34" width="120" height="13" fill="#1F4FB5" />
            <rect x="40" y="47" width="120" height="20" fill="#D62839" />
          </g>
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
            <circle key={i} cx={82 + i * 5.2} cy={41 - Math.sin((i / 7) * Math.PI) * 4} r="1.6" fill="#FFFFFF" />
          ))}
          <polygon points="100,56 160,56 172,68 104,68" fill="#1F4FB5" />
          <circle cx="100" cy="22" r="5" fill="#D62839" />
        </>
      )}
      {cabeza?.id === 'cayena' && (
        <g>
          {/* Flor de cayena detrás de la oreja */}
          {[0, 72, 144, 216, 288].map((r) => (
            <ellipse key={r} cx="134" cy="30" rx="8" ry="13" fill={cabeza.color} transform={`rotate(${r} 134 40)`} />
          ))}
          <circle cx="134" cy="40" r="5" fill="#9E1328" />
          <path d="M134 40 L146 26" stroke={cabeza.accent} strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="147" cy="25" r="3" fill={cabeza.accent} />
        </g>
      )}
      {graduado && (
        <>
          <polygon points="100,8 162,30 100,52 38,30" fill="#0B2A66" />
          <polygon points="70,40 130,40 128,58 72,58" fill="#0B2A66" />
          <path d="M100 30 L150 36 L150 60" stroke="#FFD23F" strokeWidth="3" fill="none" />
          <circle cx="150" cy="62" r="5" fill="#FFD23F" />
        </>
      )}

      {crop === 'full' && <HandItem id={acc.id} color={acc.color} accent={acc.accent} fur={furC} />}
    </svg>
  );
}

/* ───────────────────────── Estampados de la ropa ───────────────────────── */

type Ropa = ReturnType<typeof optionOf>;

function ShirtPattern({ ropa }: { ropa: Ropa }) {
  return (
    <>
      {ropa.id === 'pelotero' &&
        [178, 198, 218, 238].map((y) => <rect key={y} x="20" y={y} width="160" height="6" fill={ropa.accent} />)}
      {ropa.id === 'bata' && (
        <>
          <polygon points="86,156 100,200 100,240 92,240" fill={ropa.accent} />
          <polygon points="114,156 100,200 100,240 108,240" fill={ropa.accent} />
        </>
      )}
      {ropa.id === 'chaqueta' && <rect x="98" y="160" width="4" height="80" fill={ropa.accent} />}
      {ropa.id === 'liquiliqui' && (
        <>
          {/* Cuello cerrado y botonadura dorada */}
          <polygon points="84,152 116,152 114,164 86,164" fill={ropa.accent} />
          <rect x="99" y="164" width="2" height="76" fill={ropa.accent} />
          {[176, 192, 208, 224].map((y) => (
            <circle key={y} cx="100" cy={y} r="3" fill="#C9A227" />
          ))}
          <rect x="66" y="186" width="20" height="3" rx="1.5" fill={ropa.accent} />
          <rect x="114" y="186" width="20" height="3" rx="1.5" fill={ropa.accent} />
        </>
      )}
      {ropa.id === 'playera' && (
        <>
          {/* Cuello abierto y estampado de flores */}
          <polygon points="88,156 100,180 112,156" fill="#FFFFFF" opacity={0.9} />
          {[
            [72, 186],
            [124, 182],
            [90, 214],
            [130, 222],
            [64, 226],
            [110, 200],
          ].map(([x, y]) => (
            <g key={`${x}-${y}`} fill={ropa.accent}>
              <circle cx={x - 3} cy={y} r="3" />
              <circle cx={x + 3} cy={y} r="3" />
              <circle cx={x} cy={y - 3} r="3" />
              <circle cx={x} cy={y + 3} r="3" />
              <circle cx={x} cy={y} r="2" fill="#FFFFFF" />
            </g>
          ))}
        </>
      )}
    </>
  );
}

/* ───────────────────────── Objetos en las patas ───────────────────────── */

function HandItem({ id, color, accent = '#000', fur }: { id: string; color: string; accent?: string; fur: string }) {
  if (id === 'arepa') {
    return (
      <>
        <g transform="translate(27 10)">
          {/* Arepa rellena (queso y caraotas), en la pata derecha */}
          <ellipse cx="150" cy="206" rx="19" ry="14" fill={color} stroke={accent} strokeWidth="2" />
          <path d="M134 204 Q150 196 166 204 Q150 212 134 204 Z" fill="#3A2416" />
          <path d="M138 203 Q150 198 162 203" stroke="#FFFFFF" strokeWidth="3" fill="none" strokeLinecap="round" />
          {[
            [142, 214],
            [154, 216],
            [160, 210],
            [144, 196],
          ].map(([x, y]) => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r="1.6" fill={accent} />
          ))}
        </g>
        <Paw side="R" fur={fur} />
      </>
    );
  }
  if (id === 'cuatro') {
    return (
      <g transform="translate(0 12) rotate(-28 108 200)">
        {/* Cuatro venezolano cruzado sobre el pecho */}
        <rect x="118" y="194" width="58" height="7" rx="2" fill={accent} />
        <rect x="170" y="191" width="14" height="13" rx="3" fill={accent} />
        <circle cx="96" cy="198" r="20" fill={color} />
        <circle cx="116" cy="198" r="15" fill={color} />
        <circle cx="106" cy="198" r="6" fill="#2A1A0E" />
        <rect x="80" y="194" width="5" height="8" rx="1" fill={accent} />
        {[195, 197, 199, 201].map((y) => (
          <path key={y} d={`M82 ${y} L182 ${y}`} stroke="#F4F4F4" strokeWidth="0.7" opacity={0.85} />
        ))}
      </g>
    );
  }
  if (id === 'maracas') {
    return (
      <g>
        {/* Una maraca en cada pata */}
        {[
          [PAW_AT.L[0], PAW_AT.L[1], -18],
          [PAW_AT.R[0], PAW_AT.R[1], 18],
        ].map(([x, y, r]) => (
          <g key={x} transform={`rotate(${r} ${x} ${y})`}>
            <rect x={x - 2.5} y={y - 26} width="5" height="24" rx="2" fill="#8A5A2B" />
            <ellipse cx={x} cy={y - 36} rx="11" ry="13" fill={color} />
            <path d={`M${x - 10} ${y - 38} Q${x} ${y - 32} ${x + 10} ${y - 38}`} stroke={accent} strokeWidth="3" fill="none" />
            <circle cx={x - 4} cy={y - 42} r="2" fill="#FFFFFF" opacity={0.7} />
          </g>
        ))}
        <Paw side="L" fur={fur} />
        <Paw side="R" fur={fur} />
      </g>
    );
  }
  return null;
}

/* ───────────────────────── Cara ───────────────────────── */

const stroke = { stroke: INK, fill: 'none', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
const blinkStyle = { transformBox: 'fill-box' as const, transformOrigin: 'center' };

/** Ojos redondos con brillo; las pupilas siguen `look`. Parpadean solos. */
function RoundEyes({ r = 6, look, blink = true }: { r?: number; look?: Look; blink?: boolean }) {
  const dx = (look?.x ?? 0) * 3;
  const dy = (look?.y ?? 0) * 2.5;
  return (
    <g className={blink ? 'animate-blink' : undefined} style={blinkStyle}>
      {[78, 122].map((cx) => (
        <g key={cx}>
          <circle cx={cx + dx} cy={90 + dy} r={r} fill={INK} />
          <circle cx={cx + dx + r / 3} cy={90 + dy - r / 3} r={r / 3} fill="#fff" />
        </g>
      ))}
    </g>
  );
}

/** Ojos cerrados de felicidad: ^ ^ */
function HappyEyes() {
  return (
    <>
      <path d="M70 92 Q78 82 86 92" {...stroke} strokeWidth="4" />
      <path d="M114 92 Q122 82 130 92" {...stroke} strokeWidth="4" />
    </>
  );
}

function Blush({ strong = false }: { strong?: boolean }) {
  return (
    <>
      <ellipse cx="64" cy="112" rx={strong ? 10 : 7} ry="6" fill="#FF7F9C" opacity={strong ? 0.6 : 0.4} />
      <ellipse cx="136" cy="112" rx={strong ? 10 : 7} ry="6" fill="#FF7F9C" opacity={strong ? 0.6 : 0.4} />
    </>
  );
}

function Face({ mood, look }: { mood: Mood; look?: Look }) {
  switch (mood) {
    case 'feliz':
      return (
        <>
          <HappyEyes />
          <path d="M88 127 Q100 140 112 127" {...stroke} strokeWidth="3" />
          <Blush strong />
        </>
      );

    case 'orgulloso':
      return (
        <>
          <path d="M66 74 L86 70" {...stroke} strokeWidth="3.5" />
          <path d="M114 70 L134 74" {...stroke} strokeWidth="3.5" />
          <HappyEyes />
          {/* Sonrisa grande abierta con lengua */}
          <path d="M86 124 Q100 146 114 124 Z" fill={INK} />
          <path d="M93 134 Q100 141 107 134 Q100 130 93 134 Z" fill="#FF7F9C" />
          <Blush strong />
          {/* Destellos */}
          <g fill="#FFD23F">
            <path d="M40 60 l3 -8 l3 8 l8 3 l-8 3 l-3 8 l-3 -8 l-8 -3 z" />
            <path d="M158 50 l2 -6 l2 6 l6 2 l-6 2 l-2 6 l-2 -6 l-6 -2 z" />
          </g>
        </>
      );

    case 'triste':
      return (
        <>
          <path d="M66 80 L86 73" {...stroke} strokeWidth="3.5" />
          <path d="M114 73 L134 80" {...stroke} strokeWidth="3.5" />
          <RoundEyes r={5.5} look={look ?? { x: 0, y: 0.6 }} />
          <path d="M90 134 Q100 125 110 134" {...stroke} strokeWidth="3" />
          {/* Lagrimita */}
          <path d="M72 100 Q68 108 72 112 Q76 108 72 100 Z" fill="#7CC4FF" stroke={INK} strokeWidth="1.2" />
          <Blush />
        </>
      );

    case 'pensar':
      return (
        <>
          <path d="M68 76 L86 76" {...stroke} strokeWidth="3.5" />
          <path d="M114 72 Q123 64 132 70" {...stroke} strokeWidth="3.5" />
          <RoundEyes look={look ?? { x: 0.7, y: -0.8 }} />
          {/* Boca de lado, "mmm" */}
          <path d="M92 131 Q98 128 103 131 Q108 134 111 129" {...stroke} strokeWidth="2.8" />
          <Blush />
        </>
      );

    case 'sorpresa':
      return (
        <>
          <path d="M68 70 Q77 62 86 70" {...stroke} strokeWidth="3.5" />
          <path d="M114 70 Q123 62 132 70" {...stroke} strokeWidth="3.5" />
          <RoundEyes r={8} look={look} blink={false} />
          <ellipse cx="100" cy="132" rx="6" ry="7.5" fill={INK} />
          <Blush />
        </>
      );

    case 'nervioso':
      return (
        <>
          <path d="M67 78 Q76 72 86 76" {...stroke} strokeWidth="3" />
          <path d="M114 76 Q124 72 133 78" {...stroke} strokeWidth="3" />
          <RoundEyes r={5} look={look} />
          {/* Boca temblorosa */}
          <path d="M88 131 L92 128 L96 131 L100 128 L104 131 L108 128 L112 131" {...stroke} strokeWidth="2.5" />
          {/* Gota de sudor */}
          <path
            className="animate-sweat"
            d="M150 66 Q144 78 150 82 Q156 78 150 66 Z"
            fill="#7CC4FF"
            stroke={INK}
            strokeWidth="1.2"
          />
          <Blush />
        </>
      );

    case 'animo':
      return (
        <>
          <path d="M68 76 L86 74" {...stroke} strokeWidth="3.5" />
          <path d="M114 72 L132 74" {...stroke} strokeWidth="3.5" />
          {/* Guiño */}
          <path d="M70 92 Q78 84 86 92" {...stroke} strokeWidth="4" />
          <circle cx="122" cy="90" r="6" fill={INK} />
          <circle cx="124" cy="88" r="2" fill="#fff" />
          <path d="M88 127 Q102 140 114 124" {...stroke} strokeWidth="3" />
          <Blush strong />
        </>
      );

    case 'dormido':
      return (
        <>
          <path d="M70 90 Q78 96 86 90" {...stroke} strokeWidth="3.5" />
          <path d="M114 90 Q122 96 130 90" {...stroke} strokeWidth="3.5" />
          <ellipse cx="100" cy="131" rx="4" ry="3" fill={INK} />
          <Blush />
          <g fill="#0B2A66" fontWeight="900" fontFamily="Poppins, sans-serif">
            <text x="148" y="56" fontSize="16" className="animate-zzz" style={blinkStyle}>z</text>
            <text x="156" y="44" fontSize="20" className="animate-zzz" style={{ ...blinkStyle, animationDelay: '0.8s' }}>z</text>
            <text x="166" y="30" fontSize="24" className="animate-zzz" style={{ ...blinkStyle, animationDelay: '1.6s' }}>Z</text>
          </g>
        </>
      );

    default:
      return (
        <>
          <RoundEyes look={look} />
          <path d="M100 120 L100 127 M91 127 Q95.5 132 100 127 Q104.5 132 109 127" {...stroke} strokeWidth="2.5" />
        </>
      );
  }
}
