// Arranque: si hay sesión va al juego; si no, a la bienvenida.
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { GameButton, Page } from '@/components/comic';
import { useSession } from '@/lib/session';
import { C, font } from '@/lib/theme';

export default function Boot() {
  const { boot } = useSession();
  const [error, setError] = useState('');

  const start = useCallback(() => {
    setError('');
    boot()
      .then((r) => router.replace(r.player ? '/jugar' : '/bienvenida'))
      .catch((e: Error) => setError(e.message));
  }, [boot]);

  useEffect(start, [start]);

  return (
    <Page style={styles.center}>
      {error ? (
        <View style={styles.box}>
          <Text style={styles.msg}>{error}</Text>
          <GameButton label="Reintentar" onPress={start} />
        </View>
      ) : (
        <ActivityIndicator size="large" color={C.white} />
      )}
    </Page>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
  box: { gap: 16, padding: 24, alignItems: 'stretch' },
  msg: { ...font.bold, color: C.white, fontSize: 17, textAlign: 'center' },
});
