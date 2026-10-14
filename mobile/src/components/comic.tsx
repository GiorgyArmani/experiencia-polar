// Piezas de cómic: cada pantalla es una "página" con viñetas (Panel), cartuchos de narración
// (Caption) y globos de diálogo (Bubble). Sombra dura negra y trama de puntos (halftone).
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Circle, Defs, Path, Pattern, Rect } from 'react-native-svg';
import { C, font } from '@/lib/theme';

/** Página: fondo azul con trama. */
export function Page({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[styles.page, style]}>
      <Halftone color="#FFFFFF" opacity={0.12} />
      {children}
    </View>
  );
}

/** Viñeta: borde grueso, sombra dura y una leve inclinación para que se sienta dibujada. */
export function Panel({
  children,
  tilt = 0,
  bg = C.white,
  halftone,
  style,
  innerStyle,
}: {
  children: ReactNode;
  tilt?: number; // grados
  bg?: string;
  halftone?: string; // color de la trama, si se quiere
  style?: StyleProp<ViewStyle>;
  innerStyle?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[{ transform: [{ rotate: `${tilt}deg` }] }, style]}>
      <View style={styles.panelShadow} />
      <View style={[styles.panel, { backgroundColor: bg }, innerStyle]}>
        {halftone && <Halftone color={halftone} opacity={0.25} />}
        {children}
      </View>
    </View>
  );
}

/** Cartucho de narración (amarillo, arriba a la izquierda de la viñeta). */
export function Caption({ children, style, color = C.yellow }: { children: ReactNode; style?: StyleProp<ViewStyle>; color?: string }) {
  return (
    <View style={[styles.caption, { backgroundColor: color }, style]}>
      <Text style={styles.captionText}>{children}</Text>
    </View>
  );
}

/** Globo de diálogo con colita. `tail` indica hacia dónde apunta. */
export function Bubble({
  children,
  tail = 'bottom-left',
  style,
  big,
}: {
  children: ReactNode;
  tail?: 'bottom-left' | 'bottom-right' | 'left' | 'none';
  style?: StyleProp<ViewStyle>;
  big?: boolean;
}) {
  return (
    <View style={[styles.bubbleWrap, style]}>
      <View style={styles.bubble}>
        <Text style={[styles.bubbleText, big && styles.bubbleBig]}>{children}</Text>
      </View>
      {tail !== 'none' && (
        <Svg
          width={28}
          height={22}
          style={[
            styles.tail,
            tail === 'bottom-left' && { left: 22, bottom: -18 },
            tail === 'bottom-right' && { right: 22, bottom: -18, transform: [{ scaleX: -1 }] },
            tail === 'left' && { left: -20, top: 14, transform: [{ rotate: '90deg' }] },
          ]}
        >
          <Path d="M2 0 L26 0 L4 20 Z" fill={C.white} stroke={C.ink} strokeWidth={3} strokeLinejoin="round" />
          <Rect x={4} y={-3} width={20} height={4} fill={C.white} />
        </Svg>
      )}
    </View>
  );
}

/** Botón "de juego": se hunde al tocarlo. */
export function GameButton({
  label,
  onPress,
  disabled,
  variant = 'orange',
  style,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: 'orange' | 'white' | 'ghost';
  style?: StyleProp<ViewStyle>;
}) {
  const v = VARIANTS[variant];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.btn,
        { backgroundColor: v.bg, borderColor: v.border, opacity: disabled ? 0.55 : 1 },
        v.shadow && !pressed && { shadowColor: v.shadow, ...styles.btnShadow, borderBottomWidth: 6 },
        pressed && { transform: [{ translateY: 3 }] },
        style,
      ]}
    >
      <Text style={[styles.btnText, { color: v.text }]}>{label}</Text>
    </Pressable>
  );
}

const VARIANTS = {
  orange: { bg: C.orange, border: C.orangeDark, text: C.white, shadow: C.orangeDark },
  white: { bg: C.white, border: C.shadow, text: C.blue, shadow: C.shadow },
  ghost: { bg: 'transparent', border: C.white, text: C.white, shadow: null },
} as const;

/** Trama de puntos estilo cómic. */
export function Halftone({ color, opacity }: { color: string; opacity: number }) {
  return (
    <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
      <Defs>
        <Pattern id="dots" width={12} height={12} patternUnits="userSpaceOnUse">
          <Circle cx={3} cy={3} r={1.8} fill={color} />
          <Circle cx={9} cy={9} r={1.8} fill={color} />
        </Pattern>
      </Defs>
      <Rect width="100%" height="100%" fill="url(#dots)" opacity={opacity} />
    </Svg>
  );
}

/** Onomatopeya de cómic ("¡BIEN!", "¡UPS!"). */
export function Burst({ text, color = C.yellow, style }: { text: string; color?: string; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[styles.burst, { backgroundColor: color }, style]}>
      <Text style={styles.burstText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: C.blue, overflow: 'hidden' },
  panelShadow: {
    position: 'absolute',
    top: 6,
    left: 6,
    right: -6,
    bottom: -6,
    backgroundColor: C.ink,
    borderRadius: 6,
  },
  panel: { borderWidth: 4, borderColor: C.ink, borderRadius: 6, overflow: 'hidden' },
  caption: {
    alignSelf: 'flex-start',
    borderWidth: 3,
    borderColor: C.ink,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  captionText: { ...font.black, fontSize: 13, letterSpacing: 0.8, textTransform: 'uppercase', color: C.ink },
  bubbleWrap: { alignSelf: 'flex-start', maxWidth: '100%' },
  bubble: {
    backgroundColor: C.white,
    borderWidth: 3,
    borderColor: C.ink,
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleText: { ...font.bold, fontSize: 16, lineHeight: 21, color: C.ink },
  bubbleBig: { ...font.black, fontSize: 21, lineHeight: 26 },
  tail: { position: 'absolute' },
  btn: {
    minHeight: 56,
    borderRadius: 28,
    borderWidth: 2,
    paddingHorizontal: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnShadow: { shadowOffset: { width: 0, height: 4 }, shadowOpacity: 1, shadowRadius: 0, elevation: 0 },
  btnText: { ...font.black, fontSize: 17, textAlign: 'center' },
  burst: {
    alignSelf: 'center',
    borderWidth: 4,
    borderColor: C.ink,
    paddingHorizontal: 22,
    paddingVertical: 10,
    transform: [{ rotate: '-6deg' }],
  },
  burstText: { ...font.black, fontSize: 34, color: C.ink, textTransform: 'uppercase' },
});
