// Escena 0: presentación. Dos viñetas y el llamado a escanear el QR.
import { router } from 'expo-router';
import { Image, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bear3D } from '@/components/Bear3D';
import { Bubble, Caption, GameButton, Page, Panel } from '@/components/comic';
import { useSession } from '@/lib/session';
import { C, font } from '@/lib/theme';

export default function Bienvenida() {
  const { draft } = useSession();
  return (
    <Page>
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <Image source={require('../../assets/icon.png')} style={styles.logo} />
          <Text style={styles.title}>Experiencia{'\n'}Polar</Text>
        </View>

        <Panel tilt={-1.2} style={styles.big} innerStyle={styles.fill}>
          <Bear3D avatar={draft.avatar} reaction="celebrar" style={styles.fill} />
          <Caption style={styles.captionTop}>¡La Universidad Polar está de aniversario!</Caption>
          <Bubble tail="bottom-right" style={styles.bubble}>
            ¡Hola! Seré tu oso en esta aventura.
          </Bubble>
        </Panel>

        <Panel tilt={1} bg={C.yellow} style={styles.small} innerStyle={styles.smallInner}>
          <Text style={styles.mission}>Tu misión</Text>
          <Text style={styles.missionText}>
            Busca el QR de la Experiencia Polar: cada vez que lo escanees desbloqueas el siguiente paso. Responde las trivias y gradúa a tu oso.
          </Text>
        </Panel>

        <GameButton label="Escanear el QR" onPress={() => router.push('/onboarding/qr')} style={styles.cta} />
      </SafeAreaView>
    </Page>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, paddingHorizontal: 18, paddingBottom: 12, gap: 16 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 8 },
  logo: { width: 52, height: 52, borderRadius: 12 },
  title: { ...font.black, color: C.white, fontSize: 28, lineHeight: 29, textTransform: 'uppercase' },
  big: { flex: 1 },
  fill: { flex: 1 },
  captionTop: { position: 'absolute', top: 10, left: 10, right: 40 },
  bubble: { position: 'absolute', bottom: 18, left: 14, right: 70 },
  small: {},
  smallInner: { padding: 14, gap: 4 },
  mission: { ...font.black, fontSize: 18, textTransform: 'uppercase', color: C.ink },
  missionText: { ...font.semi, fontSize: 15, lineHeight: 20, color: C.ink },
  cta: { marginTop: 4 },
});
