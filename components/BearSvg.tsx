// Oso 2D (facetado, estilo low poly) para la web: ranking, registro y fallback del juego.
// Usa la misma configuración de avatar que el modelo 3D de la app nativa.
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

export function BearSvg({ avatar, graduado = false, crop = 'full', mood = 'normal', look, className, title }: Props) {
  const fur = optionOf('pelaje', avatar.pelaje);
  const ropa = optionOf('ropa', avatar.ropa);
  const cabeza = graduado ? null : optionOf('cabeza', avatar.cabeza);
  const acc = optionOf('accesorio', avatar.accesorio);
  const furC = fur.color;
  const furS = fur.accent ?? '#DDE6EE';

  return (
    <svg
      viewBox={crop === 'head' ? '28 6 144 144' : '0 0 200 240'}
      className={className}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      {crop === 'full' && (
        <g>
          {/* Torso + ropa */}
          <polygon points="52,240 60,168 100,152 140,168 148,240" fill={ropa.color} />
          <polygon points="100,152 140,168 148,240 100,240" fill={ropa.accent} opacity={0.35} />
          {ropa.id === 'pelotero' &&
            [178, 198, 218].map((y) => <rect key={y} x="56" y={y} width="88" height="5" fill={ropa.accent} />)}
          {ropa.id === 'bata' && (
            <>
              <polygon points="86,156 100,200 100,240 92,240" fill={ropa.accent} />
              <polygon points="114,156 100,200 100,240 108,240" fill={ropa.accent} />
            </>
          )}
          {ropa.id === 'chaqueta' && <rect x="98" y="160" width="4" height="80" fill={ropa.accent} />}
          {/* Brazos */}
          <polygon points="60,170 40,214 54,222 70,186" fill={ropa.color} />
          <polygon points="140,170 160,214 146,222 130,186" fill={ropa.color} />
          <circle cx="47" cy="220" r="9" fill={furC} />
          <circle cx="153" cy="220" r="9" fill={furC} />
          {graduado && (
            <>
              <polygon points="52,240 60,168 100,152 140,168 148,240" fill="#0B2A66" />
              <polygon points="88,156 100,176 112,156" fill="#FFD23F" />
            </>
          )}
        </g>
      )}

      {/* Orejas */}
      <polygon points="44,44 60,24 80,38 70,62" fill={furC} />
      <polygon points="56,42 63,32 72,40 66,52" fill={furS} />
      <polygon points="156,44 140,24 120,38 130,62" fill={furC} />
      <polygon points="144,42 137,32 128,40 134,52" fill={furS} />

      {/* Cabeza facetada */}
      <polygon points="100,34 146,52 162,98 146,140 100,156 54,140 38,98 54,52" fill={furC} />
      <polygon points="100,34 146,52 162,98 100,96" fill="#FFFFFF" opacity={0.35} />
      <polygon points="146,140 100,156 100,96 162,98" fill={furS} opacity={0.6} />

      {/* Hocico, nariz y cara */}
      <polygon points="80,112 100,102 120,112 116,132 100,140 84,132" fill={furS} />
      <polygon points="92,110 108,110 100,120" fill={INK} />
      <Face mood={mood} look={look} />

      {/* Accesorios */}
      {acc.id === 'lentes' && (
        <g stroke={acc.color} strokeWidth="4" fill="none">
          <circle cx="78" cy="90" r="14" />
          <circle cx="122" cy="90" r="14" />
          <path d="M92 90 L108 90" />
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
      {graduado && (
        <>
          <polygon points="100,8 162,30 100,52 38,30" fill="#0B2A66" />
          <polygon points="70,40 130,40 128,58 72,58" fill="#0B2A66" />
          <path d="M100 30 L150 36 L150 60" stroke="#FFD23F" strokeWidth="3" fill="none" />
          <circle cx="150" cy="62" r="5" fill="#FFD23F" />
        </>
      )}
    </svg>
  );
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
          <g fill="#0B2A66" fontWeight="900" fontFamily="Inter, sans-serif">
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
          <Blush />
        </>
      );
  }
}
