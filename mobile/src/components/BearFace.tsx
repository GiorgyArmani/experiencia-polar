// Cara del oso en 2D para listas (ranking): misma configuración que el modelo 3D.
// Versión react-native-svg de components/BearSvg.tsx de la web (crop="head").
import Svg, { Circle, G, Path, Polygon, Rect } from 'react-native-svg';
import { optionOf, type Avatar } from '@shared/avatar';
import { C } from '@/lib/theme';

export function BearFace({ avatar, graduado, size }: { avatar: Avatar; graduado?: boolean; size: number }) {
  const fur = optionOf('pelaje', avatar.pelaje);
  const cabeza = graduado ? null : optionOf('cabeza', avatar.cabeza);
  const acc = optionOf('accesorio', avatar.accesorio);
  const furS = fur.accent ?? '#DDE6EE';

  return (
    <Svg width={size} height={size} viewBox="28 6 144 144" style={{ backgroundColor: C.sky, borderRadius: size / 2 }}>
      <Polygon points="44,44 60,24 80,38 70,62" fill={fur.color} />
      <Polygon points="56,42 63,32 72,40 66,52" fill={furS} />
      <Polygon points="156,44 140,24 120,38 130,62" fill={fur.color} />
      <Polygon points="144,42 137,32 128,40 134,52" fill={furS} />
      <Polygon points="100,34 146,52 162,98 146,140 100,156 54,140 38,98 54,52" fill={fur.color} />
      <Polygon points="100,34 146,52 162,98 100,96" fill="#FFFFFF" opacity={0.35} />
      <Polygon points="146,140 100,156 100,96 162,98" fill={furS} opacity={0.6} />
      <Polygon points="80,112 100,102 120,112 116,132 100,140 84,132" fill={furS} />
      <Polygon points="92,110 108,110 100,120" fill={C.ink} />
      <Circle cx={78} cy={90} r={6} fill={C.ink} />
      <Circle cx={122} cy={90} r={6} fill={C.ink} />
      {acc.id === 'lentes' && (
        <G stroke={acc.color} strokeWidth={4} fill="none">
          <Circle cx={78} cy={90} r={14} />
          <Circle cx={122} cy={90} r={14} />
          <Path d="M92 90 L108 90" />
        </G>
      )}
      {cabeza?.id === 'gorra' && (
        <>
          <Polygon points="52,60 66,30 100,20 134,30 148,60" fill={cabeza.color} />
          <Polygon points="100,56 160,56 172,68 104,68" fill={cabeza.accent} />
        </>
      )}
      {cabeza?.id === 'melena' && (
        <G fill={cabeza.accent}>
          <Polygon points="74,46 84,18 94,42" />
          <Polygon points="88,40 100,10 110,40" />
          <Polygon points="106,42 118,18 126,46" />
        </G>
      )}
      {cabeza?.id === 'lazo' && (
        <>
          <Polygon points="132,40 112,26 114,54" fill={cabeza.color} />
          <Polygon points="132,40 152,26 150,54" fill={cabeza.color} />
          <Circle cx={132} cy={40} r={6} fill={cabeza.accent} />
        </>
      )}
      {cabeza?.id === 'gorro' && (
        <>
          <Polygon points="54,62 64,32 100,18 136,32 146,62" fill={cabeza.color} />
          <Rect x={52} y={56} width={96} height={12} rx={3} fill={cabeza.accent} />
          <Circle cx={100} cy={16} r={9} fill={cabeza.accent} />
        </>
      )}
      {cabeza?.id === 'audifonos' && (
        <>
          <Path d="M44 92 Q44 24 100 24 Q156 24 156 92" stroke={cabeza.color} strokeWidth={8} fill="none" />
          <Rect x={30} y={80} width={18} height={30} rx={6} fill={cabeza.accent} />
          <Rect x={152} y={80} width={18} height={30} rx={6} fill={cabeza.accent} />
        </>
      )}
      {graduado && (
        <>
          <Polygon points="100,8 162,30 100,52 38,30" fill={C.navy} />
          <Polygon points="70,40 130,40 128,58 72,58" fill={C.navy} />
          <Path d="M100 30 L150 36 L150 60" stroke={C.yellow} strokeWidth={3} fill="none" />
          <Circle cx={150} cy={62} r={5} fill={C.yellow} />
        </>
      )}
    </Svg>
  );
}
