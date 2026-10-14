// Deep link del QR impreso: experienciapolar://q/POLAR o <APP_URL>/q/POLAR
// (si el jugador lo escanea con la cámara del teléfono y la app está instalada, llega aquí).
// Hace lo mismo que escanearlo dentro de la app:
//   · Sin registro → onboarding.
//   · Registrado  → el servidor decide el siguiente paso (abrir la trivia disponible).
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator } from 'react-native';
import { Page } from '@/components/comic';
import { api } from '@/lib/api';
import { useSession } from '@/lib/session';
import { C } from '@/lib/theme';

export default function QrLink() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const { boot, apply, setDraft } = useSession();

  useEffect(() => {
    const value = `POLAR:${code}`;
    (async () => {
      try {
        const me = await boot();
        if (!me.player) {
          const { sedes } = await api.qr(value);
          setDraft({ scanned: true, sedes });
          router.replace('/onboarding/oso');
          return;
        }
        if (me.status?.phase === 'scan') await api.scan(value).then(apply).catch(() => {});
        router.replace('/jugar');
      } catch {
        router.replace('/');
      }
    })();
  }, [code, boot, apply, setDraft]);

  return (
    <Page style={{ alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator size="large" color={C.white} />
    </Page>
  );
}
