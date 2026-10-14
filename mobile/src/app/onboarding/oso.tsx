// Escena 2 del onboarding: diseña tu oso (pelaje, cabeza, ropa, accesorio) y ponle nombre.
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AVATAR_PARTS, optionOf, stepAvatar, type AvatarPart } from '@shared/avatar';
import { Bear3D, type Reaction } from '@/components/Bear3D';
import { Caption, GameButton, Page, Panel } from '@/components/comic';
import { useSession } from '@/lib/session';
import { C, font } from '@/lib/theme';

const LABEL: Record<AvatarPart, string> = { pelaje: 'Pelaje', cabeza: 'Cabeza', ropa: 'Ropa', accesorio: 'Accesorio' };

export default function OnboardingOso() {
  const { draft, setDraft } = useSession();
  const [reaction, setReaction] = useState<Reaction>('idle');
  const [error, setError] = useState('');
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  // Sin sede (p. ej. volvió atrás hasta el inicio) no puede seguir.
  useEffect(() => {
    if (!draft.sede) router.replace('/onboarding/qr');
  }, [draft.sede]);

  function change(part: AvatarPart, dir: 1 | -1) {
    setDraft({ avatar: stepAvatar(draft.avatar, part, dir) });
    setReaction('celebrar');
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setReaction('idle'), 1100);
  }

  function next() {
    if (!draft.osoNombre.trim()) {
      setError('Ponle nombre a tu oso para continuar');
      setReaction('duda');
      return;
    }
    setError('');
    router.push('/onboarding/datos');
  }

  return (
    <Page>
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView style={styles.safe} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <Panel tilt={-1} style={styles.bear} innerStyle={styles.fill}>
            <Bear3D avatar={draft.avatar} reaction={reaction} style={styles.fill} />
            <Caption style={styles.caption}>Escena 2 · Diseña tu oso</Caption>
            {draft.sede && (
              <Caption color={C.white} style={styles.sede}>
                {draft.sede.name}
              </Caption>
            )}
          </Panel>

          <View style={styles.parts}>
            {(Object.keys(AVATAR_PARTS) as AvatarPart[]).map((part) => (
              <View key={part} style={styles.partRow}>
                <Arrow dir={-1} label={`${LABEL[part]} anterior`} onPress={() => change(part, -1)} />
                <View style={styles.partValue}>
                  <Text style={styles.partLabel}>{LABEL[part]}</Text>
                  <Text style={styles.partText}>{optionOf(part, draft.avatar[part]).label}</Text>
                </View>
                <Arrow dir={1} label={`${LABEL[part]} siguiente`} onPress={() => change(part, 1)} />
              </View>
            ))}
          </View>

          <TextInput
            value={draft.osoNombre}
            onChangeText={(osoNombre) => setDraft({ osoNombre })}
            maxLength={24}
            placeholder="Nombre de tu oso (ej. Copo)"
            placeholderTextColor="#8A8A8A"
            accessibilityLabel="Nombre de tu oso"
            returnKeyType="done"
            onSubmitEditing={next}
            style={styles.input}
          />
          {!!error && <Text style={styles.error}>{error}</Text>}
          <GameButton label="¡Este es mi oso!" onPress={next} />
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Page>
  );
}

function Arrow({ dir, label, onPress }: { dir: 1 | -1; label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={6}
      style={({ pressed }) => [styles.arrow, pressed && { transform: [{ translateY: 3 }], borderBottomWidth: 2 }]}
    >
      <Text style={styles.arrowText}>{dir === -1 ? '‹' : '›'}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, paddingHorizontal: 18, paddingBottom: 10, gap: 12 },
  fill: { flex: 1 },
  bear: { flex: 1, minHeight: 220, marginTop: 8 },
  caption: { position: 'absolute', top: 10, left: 10 },
  sede: { position: 'absolute', bottom: 10, right: 10 },
  parts: { gap: 8 },
  partRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  partValue: {
    flex: 1,
    height: 46,
    borderRadius: 23,
    backgroundColor: C.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  partLabel: { ...font.bold, fontSize: 11, color: '#DCEBFF', textTransform: 'uppercase', letterSpacing: 0.8 },
  partText: { ...font.black, fontSize: 15, color: C.white },
  arrow: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: C.white,
    borderColor: C.shadow,
    borderBottomWidth: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowText: { ...font.black, fontSize: 30, lineHeight: 32, color: C.blue },
  input: {
    height: 54,
    borderRadius: 27,
    borderWidth: 3,
    borderColor: C.ink,
    backgroundColor: C.white,
    paddingHorizontal: 20,
    fontSize: 18,
    fontWeight: '700',
    color: C.ink,
  },
  error: { ...font.bold, color: C.white, fontSize: 14, textAlign: 'center' },
});
