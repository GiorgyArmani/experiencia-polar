// Leaderboard: top de mi sede (podio + lista) y el total por sede.
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { LeaderboardResponse, LeaderRow } from '@shared/types';
import { BearFace } from '@/components/BearFace';
import { Caption, Page, Panel } from '@/components/comic';
import { api } from '@/lib/api';
import { C, font } from '@/lib/theme';

export default function Ranking() {
  const [tab, setTab] = useState<'sede' | 'general'>('sede');
  const [data, setData] = useState<LeaderboardResponse | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    api
      .leaderboard()
      .then((r) => {
        setData(r);
        setError('');
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 20000);
    return () => clearInterval(id);
  }, [load]);

  const top = data?.top ?? [];
  const podium = [top[1], top[0], top[2]];

  return (
    <Page>
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Volver" style={styles.back}>
            <Text style={styles.backText}>‹</Text>
          </Pressable>
          <View>
            <Text style={styles.title}>Ranking</Text>
            <Text style={styles.subtitle}>{tab === 'sede' ? (data?.sede ?? 'Tu sede') : 'Sedes por puntos'}</Text>
          </View>
        </View>

        <View style={styles.tabs} accessibilityRole="tablist">
          {(['sede', 'general'] as const).map((t) => (
            <Pressable
              key={t}
              accessibilityRole="tab"
              accessibilityState={{ selected: tab === t }}
              onPress={() => setTab(t)}
              style={[styles.tab, tab === t && styles.tabOn]}
            >
              <Text style={[styles.tabText, tab === t && { color: C.navy }]}>{t === 'sede' ? 'Mi sede' : 'Todas las sedes'}</Text>
            </Pressable>
          ))}
        </View>

        <ScrollView
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={C.white} />}
        >
          {!!error && <Text style={styles.error}>{error}</Text>}

          {tab === 'sede' ? (
            <>
              <Panel tilt={-0.6} bg={C.navy} innerStyle={styles.podium}>
                <Caption style={styles.podiumCaption}>El podio</Caption>
                <View style={styles.podiumRow}>
                  {podium.map((row, i) => {
                    const place = i === 1 ? 1 : i === 0 ? 2 : 3;
                    const h = place === 1 ? 80 : place === 2 ? 56 : 42;
                    return (
                      <View key={place} style={styles.podiumCol}>
                        {row ? <BearFace avatar={row.avatar} graduado={row.graduado} size={place === 1 ? 76 : 62} /> : <View style={{ height: 62 }} />}
                        <Text style={styles.podiumName} numberOfLines={1}>
                          {row?.osoNombre ?? '—'}
                        </Text>
                        <View style={[styles.step, { height: h }, place === 1 && { backgroundColor: C.orange }]}>
                          <Text style={styles.stepText}>{place}</Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </Panel>
              {top.slice(3).map((r, i) => (
                <Row key={i} row={r} />
              ))}
              {data && top.length === 0 && <Text style={styles.empty}>Aún no hay puntos en esta sede. ¡Sé el primero!</Text>}
              {data?.me && !top.some((r) => r.isMe) && (
                <>
                  <Text style={styles.gap}>…</Text>
                  <Row row={data.me} />
                </>
              )}
            </>
          ) : (
            (data?.sedes ?? []).map((s) => (
              <View key={s.code} style={[styles.row, s.isMine && styles.rowMe]}>
                <Text style={styles.rank}>{s.rank}</Text>
                <Text style={styles.name}>{s.sede}</Text>
                <Text style={styles.small}>{s.jugadores} jug.</Text>
                <Text style={styles.pts}>{s.puntos} pts</Text>
              </View>
            ))
          )}
        </ScrollView>
      </SafeAreaView>
    </Page>
  );
}

function Row({ row }: { row: LeaderRow }) {
  return (
    <View style={[styles.row, row.isMe && styles.rowMe]}>
      <Text style={styles.rank}>{row.rank}</Text>
      <BearFace avatar={row.avatar} graduado={row.graduado} size={40} />
      <Text style={styles.name} numberOfLines={1}>
        {row.osoNombre}
        {row.isMe ? ' (tú)' : ''}
      </Text>
      <Text style={styles.pts}>{row.puntos} pts</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 18, paddingTop: 8 },
  back: { width: 44, height: 44, borderRadius: 14, backgroundColor: C.navy2, alignItems: 'center', justifyContent: 'center' },
  backText: { ...font.black, color: C.white, fontSize: 30, lineHeight: 32 },
  title: { ...font.black, color: C.white, fontSize: 28 },
  subtitle: { ...font.semi, color: '#DCEBFF', fontSize: 14 },
  tabs: { flexDirection: 'row', margin: 18, marginBottom: 6, padding: 4, borderRadius: 14, backgroundColor: C.navy2, gap: 4 },
  tab: { flex: 1, height: 42, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  tabOn: { backgroundColor: C.white },
  tabText: { ...font.bold, color: C.white, fontSize: 15 },
  list: { padding: 18, gap: 10 },
  error: { ...font.bold, backgroundColor: C.white, borderRadius: 12, padding: 12, color: C.ink },
  podium: { padding: 14, paddingTop: 48 },
  podiumCaption: { position: 'absolute', top: 10, left: 10 },
  podiumRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 10 },
  podiumCol: { flex: 1, alignItems: 'center', gap: 6 },
  podiumName: { ...font.bold, color: C.white, fontSize: 14, maxWidth: '100%' },
  step: { width: '100%', borderTopLeftRadius: 12, borderTopRightRadius: 12, backgroundColor: C.navy2, alignItems: 'center', justifyContent: 'center' },
  stepText: { ...font.black, color: C.white, fontSize: 26 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 58,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: C.white,
    borderWidth: 3,
    borderColor: C.ink,
  },
  rowMe: { backgroundColor: '#FFF1E6', borderColor: C.clay },
  rank: { ...font.black, width: 28, textAlign: 'center', color: C.slate, fontSize: 16 },
  name: { ...font.bold, flex: 1, fontSize: 16, color: C.ink },
  small: { fontSize: 13, color: C.slate },
  pts: { ...font.black, color: C.navy, fontSize: 15 },
  empty: { ...font.bold, color: C.white, textAlign: 'center', padding: 16 },
  gap: { ...font.black, color: C.white, textAlign: 'center' },
});
