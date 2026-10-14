// Escena 1 del onboarding: el QR de la sede registra a qué sede pertenece el jugador.
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bear3D } from '@/components/Bear3D';
import { Bubble, Caption, Page, Panel } from '@/components/comic';
import { QrCamera } from '@/components/QrCamera';
import { api } from '@/lib/api';
import { useSession } from '@/lib/session';
import { C, font } from '@/lib/theme';

export default function OnboardingQr() {
  const { draft, setDraft } = useSession();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  async function onScan(value: string) {
    setBusy(true);
    setMsg('');
    try {
      const { sede } = await api.qr(value);
      setDraft({ sede, qrValue: value });
      router.push('/onboarding/oso');
    } catch (e) {
      setMsg((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Page>
      <SafeAreaView style={styles.safe}>
        <Panel tilt={-0.8} style={styles.cam} innerStyle={styles.fill}>
          <QrCamera onScan={onScan} busy={busy} />
          <Caption style={styles.caption}>Escena 1 · Encuentra el QR de tu sede</Caption>
        </Panel>

        <View style={styles.row}>
          <Panel tilt={1.5} style={styles.bearPanel} innerStyle={styles.fill}>
            <Bear3D avatar={draft.avatar} reaction={msg ? 'error' : 'pensar'} style={styles.fill} />
          </Panel>
          <Bubble tail="left" style={styles.bubble}>
            {msg || '¿Dónde estará? Apunta la cámara al código QR de tu sede.'}
          </Bubble>
        </View>

        <Pressable onPress={() => router.back()} accessibilityRole="button" style={styles.back}>
          <Text style={styles.backText}>Volver</Text>
        </Pressable>
      </SafeAreaView>
    </Page>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, paddingHorizontal: 18, paddingBottom: 8, gap: 18 },
  fill: { flex: 1 },
  cam: { flex: 1, marginTop: 8 },
  caption: { position: 'absolute', top: 10, left: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 24 },
  bearPanel: { width: 130, height: 160 },
  bubble: { flex: 1 },
  back: { alignSelf: 'center', padding: 10 },
  backText: { ...font.bold, color: C.white, fontSize: 15, textDecorationLine: 'underline' },
});
