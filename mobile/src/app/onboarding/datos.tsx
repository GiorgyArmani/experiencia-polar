// Escena 3 del onboarding: datos del jugador y su sede.
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bear3D } from '@/components/Bear3D';
import { Bubble, Caption, GameButton, Page, Panel } from '@/components/comic';
import { api } from '@/lib/api';
import { useSession } from '@/lib/session';
import { C, font } from '@/lib/theme';

export default function OnboardingDatos() {
  const { draft, setDraft, signIn } = useSession();
  const [form, setForm] = useState({ nombre: '', email: '', telefono: '' });
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!draft.scanned) router.replace('/onboarding/qr');
  }, [draft.scanned]);

  async function submit() {
    if (!draft.sede) {
      setError('Elige tu sede');
      return;
    }
    setSending(true);
    setError('');
    try {
      const r = await api.register({
        ...form,
        sedeCode: draft.sede.code,
        osoNombre: draft.osoNombre.trim(),
        avatar: draft.avatar,
      });
      await signIn(r.token, r);
      // El siguiente escaneo del QR abre la trivia.
      router.replace('/jugar');
    } catch (e) {
      setError((e as Error).message);
      setSending(false);
    }
  }

  return (
    <Page>
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
            <View style={styles.row}>
              <Panel tilt={-2} style={styles.bearPanel} innerStyle={styles.fill}>
                <Bear3D avatar={draft.avatar} reaction={error ? 'duda' : 'idle'} style={styles.fill} />
              </Panel>
              <Bubble tail="left" style={styles.bubble}>
                {error || `¡Soy ${draft.osoNombre || 'tu oso'}! Ahora cuéntame de ti.`}
              </Bubble>
            </View>

            <Panel tilt={0.6} innerStyle={styles.form}>
              <Caption>Escena 3 · Tus datos</Caption>
              <Field label="Nombre y apellido" value={form.nombre} onChangeText={(nombre) => setForm({ ...form, nombre })} autoComplete="name" textContentType="name" />
              <Field
                label="Correo electrónico"
                value={form.email}
                onChangeText={(email) => setForm({ ...form, email })}
                autoComplete="email"
                keyboardType="email-address"
                autoCapitalize="none"
                textContentType="emailAddress"
              />
              <Field
                label="Teléfono"
                value={form.telefono}
                onChangeText={(telefono) => setForm({ ...form, telefono })}
                autoComplete="tel"
                keyboardType="phone-pad"
                textContentType="telephoneNumber"
              />
              <View>
                <Text style={styles.label}>Tu sede</Text>
                <View style={styles.sedes}>
                  {draft.sedes.map((s) => {
                    const selected = draft.sede?.code === s.code;
                    return (
                      <Pressable
                        key={s.code}
                        onPress={() => setDraft({ sede: s })}
                        accessibilityRole="radio"
                        accessibilityState={{ selected }}
                        style={[styles.sedeChip, selected && styles.sedeChipOn]}
                      >
                        <Text style={[styles.sedeText, selected && styles.sedeTextOn]}>{s.name}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
              <Text style={styles.note}>Usamos tus datos solo para el juego y la entrega de premios.</Text>
            </Panel>

            <GameButton label={sending ? 'Registrando…' : 'Terminar registro'} onPress={submit} disabled={sending} />
            <GameButton label="Atrás" variant="ghost" onPress={() => router.back()} />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Page>
  );
}

function Field({ label, ...props }: { label: string } & TextInputProps) {
  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      <TextInput {...props} accessibilityLabel={label} style={styles.input} placeholderTextColor="#8A8A8A" />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  fill: { flex: 1 },
  scroll: { padding: 18, gap: 18 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 24 },
  bearPanel: { width: 120, height: 150 },
  bubble: { flex: 1 },
  form: { padding: 16, gap: 14 },
  label: { ...font.bold, fontSize: 12, color: C.muted, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 4 },
  input: {
    height: 50,
    borderWidth: 2,
    borderColor: C.ink,
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 16,
    color: C.ink,
    backgroundColor: C.white,
  },
  sedes: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  sedeChip: { borderWidth: 2, borderColor: C.ink, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 10, backgroundColor: C.white },
  sedeChipOn: { backgroundColor: C.ink },
  sedeText: { ...font.bold, fontSize: 15, color: C.ink },
  sedeTextOn: { color: C.white },
  note: { fontSize: 13, color: C.muted },
});
