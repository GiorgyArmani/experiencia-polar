// Lector de QR. Solo una cámara puede estar activa: se desmonta cuando la pantalla pierde el foco.
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Linking, StyleSheet, Text, View } from 'react-native';
import { C, font } from '@/lib/theme';
import { GameButton } from './comic';

export function QrCamera({ onScan, busy }: { onScan: (value: string) => void; busy: boolean }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [focused, setFocused] = useState(true);
  const last = useRef({ value: '', at: 0 });

  useFocusEffect(
    useCallback(() => {
      setFocused(true);
      return () => setFocused(false);
    }, []),
  );

  if (!permission) return <View style={styles.fill} />;

  if (!permission.granted) {
    return (
      <View style={[styles.fill, styles.center]}>
        <Text style={styles.msg}>Necesitamos la cámara para leer los códigos QR.</Text>
        {permission.canAskAgain ? (
          <GameButton label="Permitir cámara" onPress={requestPermission} />
        ) : (
          <GameButton label="Abrir ajustes" onPress={() => Linking.openSettings()} />
        )}
      </View>
    );
  }

  return (
    <View style={styles.fill}>
      {focused && (
        <CameraView
          style={StyleSheet.absoluteFill}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          onBarcodeScanned={
            busy
              ? undefined
              : ({ data }) => {
                  // El lector dispara muchas veces por segundo: ignora el mismo código por 3 s.
                  const now = Date.now();
                  if (data === last.current.value && now - last.current.at < 3000) return;
                  last.current = { value: data, at: now };
                  onScan(data);
                }
          }
        />
      )}
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.center]}>
        <View style={styles.frame}>
          <View style={[styles.corner, { top: 0, left: 0, borderTopWidth: 6, borderLeftWidth: 6 }]} />
          <View style={[styles.corner, { top: 0, right: 0, borderTopWidth: 6, borderRightWidth: 6 }]} />
          <View style={[styles.corner, { bottom: 0, left: 0, borderBottomWidth: 6, borderLeftWidth: 6 }]} />
          <View style={[styles.corner, { bottom: 0, right: 0, borderBottomWidth: 6, borderRightWidth: 6 }]} />
          {busy && <ActivityIndicator size="large" color={C.white} />}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: C.ink },
  center: { alignItems: 'center', justifyContent: 'center', gap: 16, padding: 20 },
  msg: { ...font.bold, color: C.white, fontSize: 16, textAlign: 'center' },
  frame: { width: 210, height: 210, alignItems: 'center', justifyContent: 'center' },
  corner: { position: 'absolute', width: 46, height: 46, borderColor: C.white, borderRadius: 4 },
});
