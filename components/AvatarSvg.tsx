// Avatar 2D del jugador: una persona cabezona y redondita (estilo Animal Crossing), personalizable.
// Lo usan el registro, el juego, las instrucciones, el ranking y el afiche del QR.
import { useId } from 'react';
import { optionOf, type Avatar } from '@/shared/avatar';

/**
 * Expresiones (lo que siente el jugador durante el juego):
 *   normal · feliz · triste · pensar (duda, ceja levantada) · sorpresa · orgulloso (racha)
 *   nervioso (esperando la respuesta) · animo (guiño, después de fallar) · dormido (esperando la próxima trivia)
 */
export type Mood = 'normal' | 'feliz' | 'triste' | 'pensar' | 'sorpresa' | 'orgulloso' | 'nervioso' | 'animo' | 'dormido';

/** Hacia dónde mira: x/y entre -1 y 1. */
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

const INK = '#2B2321';
const GRAD_NAVY = '#0B2A66';
const GRAD_GOLD = '#FFD23F';
const SHOE = '#24324A';

// Cabeza: elipse grande (casi del alto del cuerpo, como en la referencia).
const HEAD = { cx: 100, cy: 92, rx: 64, ry: 60 };
const EYE_X = [78, 122];
const EYE_Y = 104;
// La cabeza baja un poco para montarse sobre el cuello de la franela (si no, se ve flotando).
const HEAD_DROP = 6;
// Banda de cada sombrero (altura y bordes): el pelo de arriba se recorta para que no atraviese el sombrero,
// y por los lados el corte baja en curva, así el pelo parece salir por debajo del sombrero.
interface HatBand {
  y: number;
  l: number;
  r: number;
}
const HAT_BAND: Record<string, HatBand> = {
  gorra: { y: 78, l: 40, r: 160 },
  gorro: { y: 74, l: 36, r: 164 },
  llanero: { y: 58, l: 18, r: 182 },
  boina: { y: 52, l: 42, r: 160 },
};
const MORTARBOARD_BAND: HatBand = { y: 60, l: 58, r: 142 };
const hairClipD = ({ y, l, r }: HatBand) =>
  `M-50 400 L-50 ${y + 44} Q${l - 6} ${y + 44} ${l} ${y} L${r} ${y} Q${r + 6} ${y + 44} 250 ${y + 44} L250 400 Z`;

export function AvatarSvg({ avatar, graduado = false, crop = 'full', mood = 'normal', look, className, title }: Props) {
  const piel = optionOf('piel', avatar.piel);
  const pelo = optionOf('pelo', avatar.pelo);
  const ropa = optionOf('ropa', avatar.ropa);
  const acc = optionOf('accesorio', avatar.accesorio);
  const skin = piel.color;
  const skinS = piel.accent ?? skin;
  const hair = pelo.color;
  const hairS = pelo.accent ?? hair;
  // Con birrete no se ven los sombreros, pero sí los lentes.
  const hat = graduado ? null : acc.id;
  const peinado = avatar.peinado;

  const clipId = `hair-${useId().replace(/:/g, '')}`;
  const band = graduado ? MORTARBOARD_BAND : hat ? HAT_BAND[hat] : undefined;
  const hairClip = band ? `url(#${clipId})` : undefined;
  const headT = `translate(0 ${HEAD_DROP})`;

  return (
    <svg
      viewBox={crop === 'head' ? `28 ${12 + HEAD_DROP} 144 144` : '-8 0 216 300'}
      // Si la caja sobra de alto, el personaje se queda parado abajo (no flota en el medio).
      preserveAspectRatio={crop === 'head' ? undefined : 'xMidYMax meet'}
      className={className}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      {band && (
        <defs>
          <clipPath id={clipId}>
            <path d={hairClipD(band)} />
          </clipPath>
        </defs>
      )}

      {/* Pelo de atrás: va detrás del cuerpo, así el pelo largo cae por la espalda y no tapa los hombros */}
      <g transform={headT}>
        <g clipPath={hairClip}>
          <HairBack id={peinado} hair={hair} hairS={hairS} hat={hat} covered={!!band} />
        </g>
        {/* Con sombrero la cola sale por debajo, colgando de la nuca (fuera del recorte para que no se corte) */}
        {peinado === 'cola' && band && <LowPonytail hair={hair} hairS={hairS} />}
      </g>

      {crop === 'full' && (
        <Body skin={skin} skinS={skinS} ropa={ropa.id} color={ropa.color} accent={ropa.accent ?? ropa.color} graduado={graduado} />
      )}

      <g transform={headT}>
        {/* Orejas y cabeza */}
        {[37, 163].map((cx) => (
          <g key={cx}>
            <circle cx={cx} cy={102} r={10} fill={skin} stroke={skinS} strokeWidth={2.5} />
            <circle cx={cx + (cx < 100 ? 2 : -2)} cy={102} r={4.5} fill={skinS} opacity={0.6} />
          </g>
        ))}
        <ellipse {...ellipse(HEAD)} fill={skin} stroke={skinS} strokeWidth={2.5} />

        <Face mood={mood} look={look} brow={hairS} skinS={skinS} />

        {/* Pelo de adelante (flequillo) */}
        <g clipPath={hairClip}>
          <HairFront id={peinado} hair={hair} hairS={hairS} hat={hat} />
        </g>

        {(acc.id === 'lentes' || acc.id === 'lentes-sol') && <Glasses sun={acc.id === 'lentes-sol'} accent={acc.accent} />}
        {hat && <Hat id={hat} color={acc.color} accent={acc.accent ?? acc.color} />}
        {graduado && <Mortarboard />}
      </g>
    </svg>
  );
}

const ellipse = (e: { cx: number; cy: number; rx: number; ry: number }) => e;

/* ───────────────────────── Cuerpo ───────────────────────── */

const TORSO = 'M74 154 Q100 148 126 154 Q137 158 138 172 L139 224 Q139 231 132 231 L68 231 Q61 231 61 224 L62 172 Q63 158 74 154 Z';
const SLEEVE_L = 'M74 156 Q58 160 52 176 L48 190 L66 195 L69 176 Z';
const ARM_L = 'M50 186 L65 191 L62 214 L47 211 Z';
const flipD = (d: string) => d.replace(/(-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/g, (_, x, y) => `${200 - Number(x)} ${y}`);

const PANTS: Record<string, string> = { bata: '#3B3B5C', liquiliqui: '#E9E2CC', pelotero: '#E6E6E6', chaqueta: '#2E3A55' };
// Conjuntos con falda (sin shorts). La del joropo es larga, hasta los tobillos.
const SKIRT: Record<string, string> = {
  vestido: 'M64 206 L136 206 L150 254 Q100 264 50 254 Z',
  jumper: 'M64 206 L136 206 L148 254 Q100 262 52 254 Z',
  falda: 'M66 214 L134 214 L146 252 Q100 260 54 252 Z',
  joropo: 'M64 210 L136 210 L164 274 Q100 286 36 274 Z',
};

function Body({
  skin,
  skinS,
  ropa,
  color,
  accent,
  graduado,
}: {
  skin: string;
  skinS: string;
  ropa: string;
  color: string;
  accent: string;
  graduado: boolean;
}) {
  // El jumper va sobre una franela de cuello alto (el color de acento); el peto se dibuja en el patrón.
  const shirt = graduado ? GRAD_NAVY : ropa === 'jumper' ? accent : color;
  const shirtS = graduado ? '#061A42' : accent === color || ropa in SKIRT ? '#00000033' : accent;
  const skirt = graduado ? undefined : SKIRT[ropa];
  const skirtFill = ropa === 'jumper' ? color : ropa === 'falda' || ropa === 'joropo' ? accent : shirt;
  const pants = PANTS[ropa] ?? '#34507A';
  return (
    <g>
      {/* Sombra en el piso */}
      <ellipse cx="100" cy="290" rx="58" ry="6" fill="#0B2A66" opacity={0.16} />

      {/* Piernas y zapatos */}
      {[80, 103].map((x) => (
        <rect key={x} x={x} y={236} width={17} height={44} rx={7} fill={skin} stroke={skinS} strokeWidth={2} />
      ))}
      {[86, 114].map((cx) => (
        <g key={cx}>
          <ellipse cx={cx} cy={282} rx={15} ry={8.5} fill={SHOE} />
          <path d={`M${cx - 14} 285 Q${cx} 291 ${cx + 14} 285`} stroke="#FFFFFF" strokeWidth={2.5} fill="none" strokeLinecap="round" />
        </g>
      ))}

      {/* Shorts o pantalón (con vestido no) */}
      {!skirt && (
        <path
          d="M66 222 L134 222 L136 250 Q136 255 131 255 L105 255 L100 240 L95 255 L69 255 Q64 255 64 250 Z"
          fill={graduado ? GRAD_NAVY : pants}
          stroke="#00000022"
          strokeWidth={2}
        />
      )}

      {/* Brazos: piel, manga y mano redonda */}
      {[false, true].map((flip) => (
        <g key={String(flip)}>
          <path d={flip ? flipD(ARM_L) : ARM_L} fill={skin} stroke={skinS} strokeWidth={2} strokeLinejoin="round" />
          <circle cx={flip ? 146 : 54} cy={215} r={9.5} fill={skin} stroke={skinS} strokeWidth={2} />
          <path d={flip ? flipD(SLEEVE_L) : SLEEVE_L} fill={shirt} stroke={shirtS} strokeWidth={2} strokeLinejoin="round" />
        </g>
      ))}

      {/* Torso (y falda si es vestido) */}
      {skirt && <path d={skirt} fill={skirtFill} stroke="#00000033" strokeWidth={2} strokeLinejoin="round" />}
      {skirt && <SkirtPattern id={ropa} color={color} />}
      <path d={TORSO} fill={shirt} stroke={shirtS} strokeWidth={2} />
      {graduado ? <GownDetails /> : <ShirtPattern id={ropa} accent={accent} />}

      {/* Sombra de la cabeza sobre el cuello */}
      <ellipse cx="100" cy={155 + HEAD_DROP} rx="30" ry="6" fill="#000" opacity={0.14} />
    </g>
  );
}

function GownDetails() {
  return (
    <g>
      <path d="M86 152 L94 152 L96 230 L86 230 Z" fill={GRAD_GOLD} />
      <path d="M106 152 L114 152 L114 230 L104 230 Z" fill={GRAD_GOLD} />
    </g>
  );
}

function ShirtPattern({ id, accent }: { id: string; accent: string }) {
  switch (id) {
    case 'azul':
      return <path d="M86 153 Q100 166 114 153" stroke={accent} strokeWidth={4} fill="none" strokeLinecap="round" />;
    case 'vinotinto':
      return (
        <g>
          <path d="M86 153 L100 172 L114 153" stroke="#FFD23F" strokeWidth={4} fill="none" strokeLinejoin="round" strokeLinecap="round" />
          <circle cx="120" cy="186" r="5" fill="#FFD23F" />
        </g>
      );
    case 'pelotero':
      return (
        <g>
          {[70, 80, 90, 110, 120, 130].map((x) => (
            <line key={x} x1={x} y1={156} x2={x} y2={230} stroke={accent} strokeWidth={1.6} opacity={0.35} />
          ))}
          <path d="M86 153 L100 170 L114 153" stroke={accent} strokeWidth={4} fill="none" strokeLinecap="round" />
          <line x1="100" y1="170" x2="100" y2="230" stroke={accent} strokeWidth={2} />
          {[182, 198, 214].map((y) => (
            <circle key={y} cx={104} cy={y} r={2.2} fill={accent} />
          ))}
        </g>
      );
    case 'chaqueta':
      return (
        <g>
          <line x1="100" y1="156" x2="100" y2="230" stroke={accent} strokeWidth={3} />
          <path d="M80 152 L100 166 L120 152 L118 146 L100 158 L82 146 Z" fill={accent} />
          <rect x="70" y="204" width="18" height="12" rx="3" fill={accent} opacity={0.6} />
          <rect x="112" y="204" width="18" height="12" rx="3" fill={accent} opacity={0.6} />
        </g>
      );
    case 'bata':
      return (
        <g>
          <path d="M86 152 L100 196 L114 152 Z" fill="#2A7EEB" />
          <path d="M86 152 L100 196 M114 152 L100 196" stroke={accent} strokeWidth={2.5} />
          <line x1="100" y1="196" x2="100" y2="230" stroke={accent} strokeWidth={2} />
          <rect x="112" y="186" width="16" height="12" rx="2" fill="none" stroke={accent} strokeWidth={2} />
          <line x1="116" y1="184" x2="116" y2="192" stroke="#2A7EEB" strokeWidth={2.5} strokeLinecap="round" />
        </g>
      );
    case 'liquiliqui':
      return (
        <g>
          <rect x="84" y="150" width="32" height="9" rx="3" fill="#F3EEDF" stroke={accent} strokeWidth={2} />
          <line x1="100" y1="159" x2="100" y2="230" stroke={accent} strokeWidth={1.6} />
          {[170, 184, 198, 212].map((y) => (
            <circle key={y} cx={100} cy={y} r={2.6} fill="#D4A72C" />
          ))}
          <rect x="70" y="174" width="16" height="12" rx="2" fill="none" stroke={accent} strokeWidth={1.8} />
          <rect x="114" y="174" width="16" height="12" rx="2" fill="none" stroke={accent} strokeWidth={1.8} />
        </g>
      );
    case 'playera':
      return (
        <g>
          {[
            [76, 176],
            [118, 170],
            [96, 204],
            [128, 214],
            [72, 218],
          ].map(([x, y]) => (
            <g key={`${x}-${y}`} fill={accent}>
              {[0, 72, 144, 216, 288].map((a) => (
                <circle key={a} cx={x + Math.cos((a * Math.PI) / 180) * 4} cy={y + Math.sin((a * Math.PI) / 180) * 4} r={3} />
              ))}
              <circle cx={x} cy={y} r={2} fill="#FFFFFF" />
            </g>
          ))}
          <path d="M84 152 L100 168 L116 152 L112 148 L100 160 L88 148 Z" fill="#FFFFFF" />
        </g>
      );
    case 'vestido':
      return (
        <g fill={accent}>
          {[
            [76, 172], [100, 178], [124, 170], [86, 196], [114, 198], [72, 218], [100, 220], [128, 222],
            [64, 244], [88, 246], [112, 248], [138, 242],
          ].map(([x, y]) => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r={4} />
          ))}
          <path d="M86 153 Q100 164 114 153" stroke="#FFFFFF" strokeWidth={4} fill="none" strokeLinecap="round" />
        </g>
      );
    case 'jumper':
      return (
        <g>
          {/* Cuello alto de la franela */}
          <rect x="86" y="148" width="28" height="10" rx="4" fill={accent} stroke="#00000033" strokeWidth={2} />
          {/* Peto del jumper con sus tirantes */}
          <path d="M72 178 L128 178 L131 231 L69 231 Z" fill="#CDB89A" stroke="#00000033" strokeWidth={2} strokeLinejoin="round" />
          <path d="M76 158 L76 180 M124 158 L124 180" stroke="#CDB89A" strokeWidth={7} strokeLinecap="round" />
          <Plaid x1={70} x2={130} y1={178} y2={231} />
          {[84, 116].map((x) => (
            <circle key={x} cx={x} cy={184} r={2.6} fill="#5A4632" />
          ))}
        </g>
      );
    case 'falda':
      return (
        <g>
          {/* Cuellito redondo blanco */}
          {[91, 109].map((cx) => (
            <ellipse key={cx} cx={cx} cy={157} rx={10} ry={6} fill="#FFFFFF" stroke="#00000022" strokeWidth={1.5} />
          ))}
          {[176, 192, 208].map((y) => (
            <circle key={y} cx={100} cy={y} r={2.2} fill="#FFFFFF" />
          ))}
        </g>
      );
    case 'joropo':
      return (
        <g>
          {/* Blusa blanca con vuelo rojo en el escote */}
          <path
            d="M70 162 Q76 168 82 162 Q88 168 94 162 Q100 168 106 162 Q112 168 118 162 Q124 168 130 162"
            stroke={accent}
            strokeWidth={3}
            fill="none"
            strokeLinecap="round"
          />
          <circle cx={100} cy={176} r={4} fill="#FFD23F" />
        </g>
      );
    default:
      return null;
  }
}

/** Cuadros (líneas cruzadas) dentro de un rectángulo. */
function Plaid({ x1, x2, y1, y2 }: { x1: number; x2: number; y1: number; y2: number }) {
  const xs = [x1 + 14, (x1 + x2) / 2, x2 - 14];
  const ys = Array.from({ length: Math.floor((y2 - y1) / 16) }, (_, i) => y1 + 10 + i * 16);
  return (
    <g strokeWidth={2} opacity={0.45}>
      {xs.map((x) => (
        <line key={`v${x}`} x1={x} y1={y1 + 2} x2={x} y2={y2 - 2} stroke="#8C6E4E" />
      ))}
      {ys.map((y) => (
        <line key={`h${y}`} x1={x1 + 2} y1={y} x2={x2 - 2} y2={y} stroke="#B3263A" />
      ))}
    </g>
  );
}

/** Detalles de las faldas (van antes del torso, así el torso tapa la cintura). */
function SkirtPattern({ id, color }: { id: string; color: string }) {
  switch (id) {
    case 'jumper':
      return (
        <g strokeWidth={2} opacity={0.45}>
          {[80, 100, 120].map((x) => (
            <line key={x} x1={x} y1={228} x2={x + (x - 100) * 0.25} y2={256} stroke="#8C6E4E" />
          ))}
          <line x1={57} y1={242} x2={143} y2={242} stroke="#B3263A" />
        </g>
      );
    case 'falda':
      return (
        <g stroke="#00000030" strokeWidth={2}>
          {[78, 92, 108, 122].map((x) => (
            <line key={x} x1={x} y1={230} x2={x + (x - 100) * 0.35} y2={255} />
          ))}
        </g>
      );
    case 'joropo':
      return (
        <g>
          {/* Flores en la falda y vuelo blanco en el ruedo */}
          {[
            [66, 246], [96, 240], [126, 248], [52, 264], [82, 266], [112, 268], [146, 262],
          ].map(([x, y]) => (
            <g key={`${x}-${y}`}>
              {[0, 72, 144, 216, 288].map((a) => (
                <circle key={a} cx={x + Math.cos((a * Math.PI) / 180) * 4} cy={y + Math.sin((a * Math.PI) / 180) * 4} r={3} fill={color} />
              ))}
              <circle cx={x} cy={y} r={2} fill="#FFD23F" />
            </g>
          ))}
          <path
            d="M38 274 Q46 284 54 277 Q62 286 70 279 Q78 288 86 280 Q94 289 100 281 Q106 289 114 280 Q122 288 130 279 Q138 286 146 277 Q154 284 162 274"
            stroke={color}
            strokeWidth={4}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      );
    default:
      return null;
  }
}

/* ───────────────────────── Pelo ───────────────────────── */

// Flequillo base: tapa la parte de arriba de la cabeza y deja la frente libre sobre las cejas.
const CAP =
  'M34 104 C28 50 62 26 100 26 C140 26 172 50 166 104 C160 84 152 72 144 66 C136 76 122 80 110 75 C94 82 72 80 58 66 C48 74 40 86 34 104 Z';
const CAP_PARTED =
  'M34 106 C30 50 62 26 100 26 C138 26 170 50 166 106 C160 80 142 62 106 56 L100 64 L94 56 C58 62 40 80 34 106 Z';

/** Cola de caballo baja, para cuando hay sombrero: cuelga detrás de la nuca, con el gancho a la vista. */
function LowPonytail({ hair, hairS }: { hair: string; hairS: string }) {
  return (
    <g>
      <ellipse cx={170} cy={124} rx={15} ry={30} transform="rotate(16 170 124)" fill={hair} stroke={hairS} strokeWidth={2.5} />
      <circle cx={164} cy={98} r={6} fill="#E8476A" />
    </g>
  );
}

function HairBack({ id, hair, hairS, hat, covered }: { id: string; hair: string; hairS: string; hat: string | null; covered: boolean }) {
  const p = { fill: hair, stroke: hairS, strokeWidth: 2.5, strokeLinejoin: 'round' as const };
  switch (id) {
    case 'afro':
      return (
        <g>
          {Array.from({ length: 14 }, (_, i) => {
            const a = (i / 14) * Math.PI * 2;
            return <circle key={i} cx={100 + Math.cos(a) * 64} cy={86 + Math.sin(a) * 58} r={20} {...p} />;
          })}
          <ellipse cx={100} cy={86} rx={68} ry={62} fill={hair} />
        </g>
      );
    case 'cola':
      return covered ? null : (
        <g>
          <ellipse cx={164} cy={70} rx={17} ry={34} transform="rotate(28 164 70)" {...p} />
          <circle cx={152} cy={48} r={6} fill="#E8476A" />
        </g>
      );
    case 'mono':
      // Con gorro o sombrero el moño no se ve.
      return hat && HAT_BAND[hat] ? null : (
        <g>
          <circle cx={100} cy={24} r={20} {...p} />
          <path d="M84 36 Q100 44 116 36" stroke="#E8476A" strokeWidth={5} fill="none" strokeLinecap="round" />
        </g>
      );
    case 'trenzas':
      return (
        <g>
          {[false, true].map((flip) => (
            <g key={String(flip)}>
              {[118, 134, 150, 166].map((y, i) => (
                <circle key={y} cx={flip ? 166 - i * 1.5 : 34 + i * 1.5} cy={y} r={9.5 - i * 0.6} {...p} />
              ))}
              <circle cx={flip ? 161 : 39} cy={178} r={4.5} fill="#E8476A" />
            </g>
          ))}
        </g>
      );
    case 'largo':
      return <path d="M30 100 C26 40 70 22 100 22 C130 22 174 40 170 100 L174 176 Q152 186 134 176 L66 176 Q48 186 26 176 Z" {...p} />;
    default:
      return null;
  }
}

function HairFront({ id, hair, hairS, hat }: { id: string; hair: string; hairS: string; hat: string | null }) {
  const p = { fill: hair, stroke: hairS, strokeWidth: 2.5, strokeLinejoin: 'round' as const };
  switch (id) {
    case 'rapado':
      return <path d="M40 86 C40 46 68 30 100 30 C132 30 160 46 160 86 C150 64 128 56 100 56 C72 56 50 64 40 86 Z" {...p} />;
    case 'rizado':
      return (
        <g>
          {[
            [40, 92], [42, 70], [56, 50], [76, 38], [100, 34], [124, 38], [144, 50], [158, 70], [160, 92],
          ].map(([x, y]) => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r={14} {...p} />
          ))}
          <path d={CAP} fill={hair} />
          {[62, 80, 100, 120, 138].map((x, i) => (
            <circle key={x} cx={x} cy={i % 2 ? 76 : 70} r={9} {...p} />
          ))}
        </g>
      );
    case 'afro':
      // Tiene que tapar toda la coronilla (la cabeza llega hasta y=32), si no se asoma el contorno de la cabeza.
      return <path d="M33 96 C28 40 62 22 100 22 C138 22 172 40 167 96 C152 72 128 64 100 64 C72 64 48 72 33 96 Z" fill={hair} />;
    case 'largo':
    case 'mono':
    case 'trenzas':
      return <path d={CAP_PARTED} {...p} />;
    default:
      // corto y cola
      return <path d={CAP} {...p} />;
  }
}

/* ───────────────────────── Cara ───────────────────────── */

const stroke = { stroke: INK, fill: 'none', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
const blinkStyle = { transformBox: 'fill-box' as const, transformOrigin: 'center' };

/** Ojos ovalados con brillo (como en la referencia); siguen `look` y parpadean solos. */
function Eyes({ look, scale = 1, blink = true, only }: { look?: Look; scale?: number; blink?: boolean; only?: 0 | 1 }) {
  const dx = (look?.x ?? 0) * 3;
  const dy = (look?.y ?? 0) * 2.5;
  return (
    <g className={blink ? 'animate-blink' : undefined} style={blinkStyle}>
      {EYE_X.filter((_, i) => only === undefined || i === only).map((cx) => (
        <g key={cx}>
          <ellipse cx={cx + dx} cy={EYE_Y + dy} rx={7 * scale} ry={9.5 * scale} fill={INK} />
          <circle cx={cx + dx + 2.4 * scale} cy={EYE_Y + dy - 4 * scale} r={2.8 * scale} fill="#fff" />
        </g>
      ))}
    </g>
  );
}

/** Ojos cerrados de felicidad: ^ ^ */
function HappyEyes() {
  return (
    <>
      {EYE_X.map((cx) => (
        <path key={cx} d={`M${cx - 8} ${EYE_Y + 3} Q${cx} ${EYE_Y - 8} ${cx + 8} ${EYE_Y + 3}`} {...stroke} strokeWidth={4} />
      ))}
    </>
  );
}

function Blush({ strong = false }: { strong?: boolean }) {
  return (
    <>
      {[63, 137].map((cx) => (
        <ellipse key={cx} cx={cx} cy={122} rx={strong ? 10 : 8} ry={5} fill="#FF7F9C" opacity={strong ? 0.55 : 0.38} />
      ))}
    </>
  );
}

/** Cejas: [izquierda, derecha] como "y-inicio y-fin" en sus lados. */
function Brows({ l, r, color }: { l: [number, number]; r: [number, number]; color: string }) {
  return (
    <>
      <path d={`M69 ${l[0]} L87 ${l[1]}`} stroke={color} strokeWidth={4} strokeLinecap="round" />
      <path d={`M113 ${r[0]} L131 ${r[1]}`} stroke={color} strokeWidth={4} strokeLinecap="round" />
    </>
  );
}

function Face({ mood, look, brow, skinS }: { mood: Mood; look?: Look; brow: string; skinS: string }) {
  const nose = <ellipse cx={100} cy={117} rx={3.5} ry={2.5} fill={skinS} />;
  const openSmile = (
    <>
      <path d="M88 124 Q100 142 112 124 Z" fill="#7A2630" stroke={INK} strokeWidth={2} strokeLinejoin="round" />
      <ellipse cx={100} cy={133} rx={5.5} ry={3} fill="#F07A8A" />
    </>
  );
  switch (mood) {
    case 'feliz':
      return (
        <>
          <Brows l={[90, 87]} r={[87, 90]} color={brow} />
          <HappyEyes />
          {nose}
          {openSmile}
          <Blush strong />
        </>
      );

    case 'orgulloso':
      return (
        <>
          <Brows l={[86, 84]} r={[84, 86]} color={brow} />
          <HappyEyes />
          {nose}
          <path d="M84 123 Q100 148 116 123 Z" fill="#7A2630" stroke={INK} strokeWidth={2} strokeLinejoin="round" />
          <path d="M88 124 L112 124 L110 128 L90 128 Z" fill="#FFFFFF" />
          <ellipse cx={100} cy={137} rx={6} ry={3} fill="#F07A8A" />
          <Blush strong />
          <g fill="#FFD23F" stroke="#C99400" strokeWidth={1}>
            <path d="M30 60 l3 -8 l3 8 l8 3 l-8 3 l-3 8 l-3 -8 l-8 -3 z" />
            <path d="M168 48 l2 -6 l2 6 l6 2 l-6 2 l-2 6 l-2 -6 l-6 -2 z" />
          </g>
        </>
      );

    case 'triste':
      return (
        <>
          <Brows l={[92, 86]} r={[86, 92]} color={brow} />
          <Eyes look={look ?? { x: 0, y: 0.6 }} scale={0.85} />
          {nose}
          <path d="M91 133 Q100 125 109 133" {...stroke} strokeWidth={3} />
          <path d="M70 114 Q66 122 70 126 Q74 122 70 114 Z" fill="#7CC4FF" stroke={INK} strokeWidth={1.2} />
          <Blush />
        </>
      );

    case 'pensar':
      return (
        <>
          <Brows l={[89, 89]} r={[84, 80]} color={brow} />
          <Eyes look={look ?? { x: 0.7, y: -0.8 }} />
          {nose}
          <path d="M92 130 Q98 127 103 130 Q108 133 111 128" {...stroke} strokeWidth={2.8} />
          <Blush />
        </>
      );

    case 'sorpresa':
      return (
        <>
          <Brows l={[84, 82]} r={[82, 84]} color={brow} />
          <Eyes look={look} scale={1.15} blink={false} />
          {nose}
          <ellipse cx={100} cy={131} rx={5.5} ry={7} fill="#7A2630" stroke={INK} strokeWidth={2} />
          <Blush />
        </>
      );

    case 'nervioso':
      return (
        <>
          <Brows l={[90, 86]} r={[86, 90]} color={brow} />
          <Eyes look={look} scale={0.8} />
          {nose}
          <path d="M88 130 L92 127 L96 130 L100 127 L104 130 L108 127 L112 130" {...stroke} strokeWidth={2.5} />
          <path className="animate-sweat" d="M156 72 Q150 84 156 88 Q162 84 156 72 Z" fill="#7CC4FF" stroke={INK} strokeWidth={1.2} />
          <Blush />
        </>
      );

    case 'animo':
      return (
        <>
          <Brows l={[88, 87]} r={[86, 87]} color={brow} />
          {/* Guiño */}
          <path d={`M70 ${EYE_Y + 3} Q78 ${EYE_Y - 8} 86 ${EYE_Y + 3}`} {...stroke} strokeWidth={4} />
          <Eyes look={look} only={1} blink={false} />
          {nose}
          {openSmile}
          <Blush strong />
        </>
      );

    case 'dormido':
      return (
        <>
          <Brows l={[92, 92]} r={[92, 92]} color={brow} />
          {EYE_X.map((cx) => (
            <path key={cx} d={`M${cx - 8} ${EYE_Y} Q${cx} ${EYE_Y + 6} ${cx + 8} ${EYE_Y}`} {...stroke} strokeWidth={3.5} />
          ))}
          {nose}
          <ellipse cx={100} cy={130} rx={4} ry={3} fill="#7A2630" />
          <Blush />
          <g fill="#0B2A66" fontWeight="900" fontFamily="Poppins, sans-serif">
            <text x="150" y="50" fontSize="16" className="animate-zzz" style={blinkStyle}>z</text>
            <text x="158" y="38" fontSize="20" className="animate-zzz" style={{ ...blinkStyle, animationDelay: '0.8s' }}>z</text>
            <text x="168" y="24" fontSize="24" className="animate-zzz" style={{ ...blinkStyle, animationDelay: '1.6s' }}>Z</text>
          </g>
        </>
      );

    default:
      return (
        <>
          <Brows l={[89, 88]} r={[88, 89]} color={brow} />
          <Eyes look={look} />
          {nose}
          <path d="M91 127 Q100 135 109 127" {...stroke} strokeWidth={3} />
          <Blush />
        </>
      );
  }
}

/* ───────────────────────── Accesorios ───────────────────────── */

function Glasses({ sun, accent = '#FF8D28' }: { sun: boolean; accent?: string }) {
  return (
    <g>
      {EYE_X.map((cx) =>
        sun ? (
          <g key={cx}>
            <rect x={cx - 14} y={EYE_Y - 11} width={28} height={21} rx={8} fill="#1E1E1E" stroke={accent} strokeWidth={2.5} />
            <path d={`M${cx - 8} ${EYE_Y - 5} L${cx - 2} ${EYE_Y - 5}`} stroke="#FFFFFF" strokeWidth={2.5} strokeLinecap="round" opacity={0.7} />
          </g>
        ) : (
          <circle key={cx} cx={cx} cy={EYE_Y} r={13} fill="#FFFFFF" fillOpacity={0.15} stroke="#1E1E1E" strokeWidth={3} />
        ),
      )}
      <path d={`M${EYE_X[0] + (sun ? 14 : 13)} ${EYE_Y - 2} Q100 ${EYE_Y - 7} ${EYE_X[1] - (sun ? 14 : 13)} ${EYE_Y - 2}`} stroke={sun ? accent : '#1E1E1E'} strokeWidth={3} fill="none" />
    </g>
  );
}

function Hat({ id, color, accent }: { id: string; color: string; accent: string }) {
  const p = { strokeLinejoin: 'round' as const };
  switch (id) {
    case 'gorra':
      return (
        <g {...p}>
          <path d="M36 82 C34 36 66 20 100 20 C134 20 166 36 164 82 Z" fill={color} stroke="#00000033" strokeWidth={2} />
          <path d="M100 22 L100 80 M68 30 Q62 56 64 80 M132 30 Q138 56 136 80" stroke="#00000022" strokeWidth={2} fill="none" />
          <path d="M38 78 Q100 64 162 78 Q168 92 152 92 Q100 82 48 92 Q32 92 38 78 Z" fill={accent} stroke="#00000033" strokeWidth={2} />
          <circle cx={100} cy={21} r={5} fill={accent} />
        </g>
      );
    case 'gorro':
      return (
        <g {...p}>
          <path d="M36 86 C34 36 64 18 100 18 C136 18 166 36 164 86 Z" fill={color} stroke="#00000033" strokeWidth={2} />
          <rect x={33} y={70} width={134} height={20} rx={10} fill={accent} stroke="#00000022" strokeWidth={2} />
          {[50, 66, 82, 98, 114, 130, 146].map((x) => (
            <line key={x} x1={x} y1={73} x2={x} y2={87} stroke="#00000018" strokeWidth={3} />
          ))}
          <circle cx={100} cy={14} r={12} fill={accent} stroke="#00000022" strokeWidth={2} />
        </g>
      );
    case 'llanero':
      return (
        <g {...p}>
          <ellipse cx={100} cy={64} rx={86} ry={15} fill={color} stroke={accent} strokeWidth={2.5} />
          <path d="M60 64 C58 24 80 14 100 14 C120 14 142 24 140 64 Z" fill={color} stroke={accent} strokeWidth={2.5} />
          <path d="M92 16 Q100 26 108 16" stroke={accent} strokeWidth={2.5} fill="none" />
          <rect x={60} y={50} width={80} height={10} fill={accent} />
        </g>
      );
    case 'cayena':
      return (
        <g transform="translate(148 60)">
          <path d="M-4 6 Q-18 14 -20 4 Q-10 -2 -4 6 Z" fill="#2E9E4F" />
          {[0, 72, 144, 216, 288].map((a) => (
            <ellipse key={a} cx={0} cy={-9} rx={7} ry={10} fill={color} stroke="#B8182C" strokeWidth={1.5} transform={`rotate(${a})`} />
          ))}
          <circle r={4.5} fill={accent} />
          <path d="M0 0 L6 -14" stroke={accent} strokeWidth={2} strokeLinecap="round" />
        </g>
      );
    case 'lazo':
      return (
        <g transform="translate(136 40) rotate(18)" {...p}>
          <path d="M0 0 L-22 -12 L-22 12 Z" fill={color} stroke={accent} strokeWidth={2} />
          <path d="M0 0 L22 -12 L22 12 Z" fill={color} stroke={accent} strokeWidth={2} />
          <circle r={6} fill={accent} />
        </g>
      );
    case 'zarcillos':
      return (
        <g>
          {[37, 163].map((cx) => (
            <g key={cx}>
              <circle cx={cx} cy={120} r={6.5} fill="none" stroke={color} strokeWidth={3} />
              <circle cx={cx} cy={112} r={2.2} fill={accent} />
            </g>
          ))}
        </g>
      );
    case 'cintillo':
      return (
        <g>
          <path d="M40 90 C34 30 166 30 160 90" stroke={color} strokeWidth={9} fill="none" strokeLinecap="round" />
          {[
            [52, 66], [72, 47], [100, 40], [128, 47], [148, 66],
          ].map(([x, y]) => (
            <circle key={x} cx={x} cy={y} r={1.8} fill={accent} />
          ))}
        </g>
      );
    case 'boina':
      return (
        <g {...p} transform="rotate(-8 100 50)">
          <ellipse cx={104} cy={44} rx={70} ry={28} fill={color} stroke={accent} strokeWidth={2.5} />
          <path d="M44 56 Q100 76 160 56" stroke={accent} strokeWidth={6} fill="none" strokeLinecap="round" />
          <path d="M104 16 Q106 8 112 6" stroke={accent} strokeWidth={4} fill="none" strokeLinecap="round" />
          <ellipse cx={86} cy={34} rx={22} ry={8} fill="#FFFFFF" opacity={0.18} />
        </g>
      );
    case 'audifonos':
      return (
        <g {...p}>
          <path d="M36 100 C28 26 172 26 164 100" stroke={color} strokeWidth={8} fill="none" strokeLinecap="round" />
          {[37, 163].map((cx) => (
            <g key={cx}>
              <rect x={cx - 9} y={88} width={18} height={30} rx={8} fill={color} />
              <rect x={cx - 4} y={94} width={8} height={18} rx={4} fill={accent} />
            </g>
          ))}
        </g>
      );
    default:
      return null;
  }
}

function Mortarboard() {
  return (
    <g strokeLinejoin="round">
      <path d="M58 52 Q100 38 142 52 L142 70 Q100 58 58 70 Z" fill={GRAD_NAVY} />
      <polygon points="100,12 176,36 100,58 24,36" fill={GRAD_NAVY} stroke="#061A42" strokeWidth={2} />
      <circle cx={100} cy={35} r={4} fill={GRAD_GOLD} />
      <path d="M100 35 L160 46 L160 72" stroke={GRAD_GOLD} strokeWidth={3} fill="none" strokeLinecap="round" />
      <rect x={155} y={70} width={10} height={14} rx={3} fill={GRAD_GOLD} />
    </g>
  );
}
