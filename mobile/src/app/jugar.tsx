// Gameloop: escanear QR → trivia → resultado → esperar la próxima → … → oso graduado.
// Todo lo decide el servidor (con su hora); aquí solo se dibuja cada escena.
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { Avatar } from '@shared/avatar';
import { QR_CODE } from '@shared/qr';
import type { AnswerResponse, QuestionView } from '@shared/types';
import { Bear3D, type Reaction } from '@/components/Bear3D';
import { Bubble, Burst, Caption, GameButton, Page, Panel } from '@/components/comic';
import { QrCamera } from '@/components/QrCamera';
import { api, ApiError } from '@/lib/api';
import { useSession } from '@/lib/session';
import { C, font } from '@/lib/theme';

type Overlay = { kind: 'error' } | { kind: 'flash'; points: number } | { kind: 'superada'; trivia: number; points: number } | null;

export default function Jugar() {
  const { me, apply, refresh, offset, signOut } = useSession();
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState('');

  const reload = useCallback(
    () =>
      refresh().catch(async (e: ApiError) => {
        // Token inválido (p. ej. se borró la base de pruebas): volver a registrarse.
        if (e.status === 401) {
          await signOut();
          router.replace('/bienvenida');
        } else setToast(e.message);
      }),
    [refresh, signOut],
  );

  useEffect(() => {
    if (me && !me.player) router.replace('/bienvenida');
  }, [me]);

  // Al volver a la app (después de horas esperando) pregunta el estado de nuevo.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => s === 'active' && reload());
    return () => sub.remove();
  }, [reload]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  if (!me?.player || !me.status) return <Page>{null}</Page>;

  const { status, question, player, demoTools } = me;

  async function onScan(value: string) {
    if (busy) return;
    setBusy(true);
    try {
      apply(await api.scan(value));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      setToast((e as Error).message);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } finally {
      setBusy(false);
    }
  }

  async function onAnswer(option: number) {
    if (busy || !question || !me) return;
    setBusy(true);
    try {
      const r: AnswerResponse = await api.answer(option, question.index);
      apply({ ...me, player: r.player, status: r.status, question: r.question });
      if (!r.correct) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setOverlay({ kind: 'error' });
      } else if (r.triviaDone) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setOverlay({ kind: 'superada', trivia: question.trivia, points: r.triviaPoints });
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setOverlay({ kind: 'flash', points: r.pointsEarned });
        setTimeout(() => setOverlay((o) => (o?.kind === 'flash' ? null : o)), 1300);
      }
    } catch (e) {
      setToast((e as Error).message);
      reload();
    } finally {
      setBusy(false);
    }
  }

  let scene: React.ReactNode;
  if (overlay?.kind === 'error') {
    scene = <Incorrecto avatar={player.avatar} onRetry={() => setOverlay(null)} />;
  } else if (overlay?.kind === 'superada') {
    scene = (
      <Superada
        avatar={player.avatar}
        trivia={overlay.trivia}
        points={overlay.points}
        nextLabel={status.phase === 'final' ? 'Ver mi graduación' : 'Continuar'}
        onNext={() => setOverlay(null)}
      />
    );
  } else if (status.phase === 'playing' && question) {
    scene = (
      <Trivia
        avatar={player.avatar}
        q={question}
        totalTrivias={status.totalTrivias}
        busy={busy}
        flash={overlay?.kind === 'flash' ? overlay.points : null}
        onAnswer={onAnswer}
      />
    );
  } else if (status.phase === 'scan') {
    scene = (
      <Escanear
        avatar={player.avatar}
        trivia={status.trivia ?? 1}
        closesAt={status.closesAt}
        completed={player.completed}
        total={status.totalTrivias}
        busy={busy}
        onScan={onScan}
        onDemo={demoTools ? () => onScan(`POLAR:${QR_CODE}`) : undefined}
      />
    );
  } else if (status.phase === 'locked') {
    scene = (
      <Espera
        avatar={player.avatar}
        trivia={status.trivia ?? 1}
        opensAt={status.opensAt}
        offset={offset}
        completed={player.completed}
        total={status.totalTrivias}
        onOpen={reload}
        onSkip={demoTools ? () => api.skip().then(apply).catch((e: Error) => setToast(e.message)) : undefined}
      />
    );
  } else {
    scene = <Graduado avatar={player.avatar} osoNombre={player.osoNombre} puntos={player.puntos} completed={player.completed.length} total={status.totalTrivias} />;
  }

  return (
    <Page>
      <SafeAreaView style={styles.safe}>
        {scene}
        {!!toast && (
          <View accessibilityRole="alert" style={styles.toast}>
            <Text style={styles.toastText}>{toast}</Text>
          </View>
        )}
      </SafeAreaView>
    </Page>
  );
}

/* ───────────────────────── Escenas ───────────────────────── */

function Progress({ completed, total, current }: { completed: number[]; total: number; current: number | null }) {
  return (
    <View style={styles.progress} accessibilityLabel={`${completed.length} de ${total} trivias completadas`}>
      {Array.from({ length: total }, (_, i) => i + 1).map((n) => {
        const done = completed.includes(n);
        const now = !done && n === current;
        return (
          <View key={n} style={[styles.chip, done && { backgroundColor: C.navy }, now && { backgroundColor: C.orange }]}>
            <Text style={[styles.chipText, (done || now) && { color: C.white }]}>{done ? `✓${n}` : n}</Text>
          </View>
        );
      })}
    </View>
  );
}

function hora(iso: string | null) {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' });
}

function Escanear(props: {
  avatar: Avatar;
  trivia: number;
  closesAt: string | null;
  completed: number[];
  total: number;
  busy: boolean;
  onScan: (v: string) => void;
  onDemo?: () => void;
}) {
  return (
    <View style={styles.scene}>
      <View style={styles.row}>
        <Panel tilt={-2} style={styles.bearSmall} innerStyle={styles.fill}>
          <Bear3D avatar={props.avatar} reaction="pensar" style={styles.fill} />
        </Panel>
        <View style={styles.side}>
          <Bubble tail="left">¡Busca el QR de la Trivia {props.trivia}!</Bubble>
          {props.closesAt && <Caption color={C.orange}>Abierta hasta las {hora(props.closesAt)}</Caption>}
          <Progress completed={props.completed} total={props.total} current={props.trivia} />
        </View>
      </View>
      <Panel tilt={0.8} style={styles.fill} innerStyle={styles.fill}>
        <QrCamera onScan={props.onScan} busy={props.busy} />
        <Caption style={styles.captionAbs}>Escena · La búsqueda</Caption>
      </Panel>
      {props.onDemo && <GameButton label="Simular escaneo (demo)" variant="white" onPress={props.onDemo} />}
      <Nav />
    </View>
  );
}

function Trivia({
  avatar,
  q,
  totalTrivias,
  busy,
  flash,
  onAnswer,
}: {
  avatar: Avatar;
  q: QuestionView;
  totalTrivias: number;
  busy: boolean;
  flash: number | null;
  onAnswer: (i: number) => void;
}) {
  const reaction: Reaction = flash !== null ? 'celebrar' : 'pensar';
  return (
    <ScrollView contentContainerStyle={styles.sceneScroll}>
      <View style={styles.row}>
        <Panel tilt={-1.5} style={styles.bearSmall} innerStyle={styles.fill}>
          <Bear3D avatar={avatar} reaction={reaction} style={styles.fill} />
        </Panel>
        <View style={styles.side}>
          <Caption>
            Trivia {q.trivia} de {totalTrivias} · Pregunta {q.index + 1}/{q.total}
          </Caption>
          <Bubble tail="left">{flash !== null ? '¡Sabía que lo sabías!' : 'Mmm… déjame pensar.'}</Bubble>
        </View>
      </View>

      <Panel tilt={0.5} innerStyle={styles.question}>
        <Text style={styles.questionText}>{q.text}</Text>
      </Panel>

      <View style={styles.options}>
        {q.options.map((o, i) => (
          <GameButton key={i} label={o} onPress={() => onAnswer(i)} disabled={busy || flash !== null} />
        ))}
      </View>

      {flash !== null && (
        <View pointerEvents="none" style={styles.flash}>
          <Burst text="¡Bien!" />
          {flash > 0 && <Burst text={`+${flash}`} color={C.orange} style={styles.flashPoints} />}
        </View>
      )}
    </ScrollView>
  );
}

function Incorrecto({ avatar, onRetry }: { avatar: Avatar; onRetry: () => void }) {
  // Primero la reacción de error y luego la duda: "¿y entonces cuál era?"
  const [reaction, setReaction] = useState<Reaction>('error');
  useEffect(() => {
    const t = setTimeout(() => setReaction('duda'), 1600);
    return () => clearTimeout(t);
  }, []);
  return (
    <View style={styles.scene}>
      <Burst text="¡Ups!" color={C.red} style={styles.burstTop} />
      <Panel tilt={-1} style={styles.fill} innerStyle={styles.fill}>
        <Bear3D avatar={avatar} reaction={reaction} style={styles.fill} />
        <Bubble tail="bottom-left" style={styles.bubbleTop}>
          Esa no era. ¡Piénsalo otra vez!
        </Bubble>
      </Panel>
      <GameButton label="Volver a intentar" onPress={onRetry} />
    </View>
  );
}

function Superada({ avatar, trivia, points, nextLabel, onNext }: { avatar: Avatar; trivia: number; points: number; nextLabel: string; onNext: () => void }) {
  return (
    <View style={styles.scene}>
      <Burst text={`¡Trivia ${trivia} superada!`} style={styles.burstTop} />
      <Panel tilt={1} style={styles.fill} innerStyle={styles.fill}>
        <Bear3D avatar={avatar} reaction="celebrar" style={styles.fill} />
        <Bubble tail="bottom-left" style={styles.bubbleTop} big>
          ¡Sumaste +{points} para tu sede!
        </Bubble>
      </Panel>
      <GameButton label={nextLabel} onPress={onNext} />
    </View>
  );
}

function Espera(props: {
  avatar: Avatar;
  trivia: number;
  opensAt: string | null;
  offset: number;
  completed: number[];
  total: number;
  onOpen: () => void;
  onSkip?: () => void;
}) {
  const target = props.opensAt ? new Date(props.opensAt).getTime() : 0;
  const [left, setLeft] = useState(() => Math.max(0, target - (Date.now() + props.offset)));
  const onOpen = useRef(props.onOpen);
  onOpen.current = props.onOpen;

  useEffect(() => {
    let lastAsk = 0;
    const tick = () => {
      const ms = Math.max(0, target - (Date.now() + props.offset));
      setLeft(ms);
      // Al llegar a cero pregunta al servidor (cada 3 s como máximo) si ya abrió.
      if (ms === 0 && Date.now() - lastAsk > 3000) {
        lastAsk = Date.now();
        onOpen.current();
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target, props.offset]);

  const s = Math.ceil(left / 1000);
  const pad = (n: number) => String(n).padStart(2, '0');
  const clock = `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;

  return (
    <View style={styles.scene}>
      <Panel tilt={-1} style={styles.fill} innerStyle={styles.fill}>
        <Bear3D avatar={props.avatar} reaction="idle" style={styles.fill} />
        <Caption style={styles.captionAbs}>Mientras tanto…</Caption>
        <Bubble tail="bottom-left" style={styles.bubbleBottom}>
          ¡Buen trabajo! Volvemos al mismo QR cuando abra la Trivia {props.trivia}.
        </Bubble>
      </Panel>
      <Panel tilt={0.8} bg={C.yellow} innerStyle={styles.countdown}>
        <Text style={styles.countLabel}>La Trivia {props.trivia} abre en</Text>
        <Text style={styles.count} accessibilityLabel={`Faltan ${clock}`}>
          {clock}
        </Text>
        {props.opensAt && <Text style={styles.countSub}>A las {hora(props.opensAt)}</Text>}
      </Panel>
      <Progress completed={props.completed} total={props.total} current={props.trivia} />
      {props.onSkip && <GameButton label="Saltar espera (demo)" variant="white" onPress={props.onSkip} />}
      <Nav />
    </View>
  );
}

function Graduado({ avatar, osoNombre, puntos, completed, total }: { avatar: Avatar; osoNombre: string; puntos: number; completed: number; total: number }) {
  const [rank, setRank] = useState<number | null>(null);
  useEffect(() => {
    api.leaderboard().then((r) => setRank(r.me?.rank ?? null)).catch(() => {});
  }, []);
  return (
    <View style={styles.scene}>
      <Burst text="¡Te graduaste!" style={styles.burstTop} />
      <Panel tilt={-1} style={styles.fill} innerStyle={styles.fill}>
        <Bear3D avatar={avatar} reaction="celebrar" graduado style={styles.fill} />
        <Caption style={styles.captionAbs}>
          {osoNombre} · {completed} de {total} trivias
        </Caption>
      </Panel>
      <Panel tilt={0.6} innerStyle={styles.stats}>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Tus puntos</Text>
          <Text style={styles.statValue}>{puntos}</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Puesto en tu sede</Text>
          <Text style={[styles.statValue, { color: C.blue }]}>{rank ? `#${rank}` : '…'}</Text>
        </View>
      </Panel>
      <GameButton label="Ver el leaderboard" onPress={() => router.push('/ranking')} />
    </View>
  );
}

function Nav() {
  return (
    <Pressable onPress={() => router.push('/ranking')} accessibilityRole="button" style={styles.nav}>
      <Text style={styles.navText}>Ver ranking de mi sede</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  fill: { flex: 1 },
  scene: { flex: 1, padding: 16, gap: 16 },
  sceneScroll: { padding: 16, gap: 18, flexGrow: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 22 },
  side: { flex: 1, gap: 8 },
  bearSmall: { width: 118, height: 150 },
  captionAbs: { position: 'absolute', top: 10, left: 10 },
  bubbleTop: { position: 'absolute', top: 14, left: 14, right: 14 },
  bubbleBottom: { position: 'absolute', bottom: 18, left: 14, right: 14 },
  progress: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  chip: {
    minWidth: 34,
    height: 28,
    paddingHorizontal: 8,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: C.ink,
    backgroundColor: C.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipText: { ...font.black, fontSize: 13, color: C.ink },
  question: { padding: 16, backgroundColor: C.white },
  questionText: { ...font.black, fontSize: 22, lineHeight: 27, color: C.ink },
  options: { gap: 12 },
  flash: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', gap: 12, backgroundColor: 'rgba(42,126,235,0.75)' },
  flashPoints: { transform: [{ rotate: '5deg' }] },
  burstTop: { zIndex: 2 },
  countdown: { padding: 16, alignItems: 'center' },
  countLabel: { ...font.black, fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.8, color: C.ink },
  count: { ...font.black, fontSize: 48, color: C.ink, fontVariant: ['tabular-nums'] },
  countSub: { ...font.semi, fontSize: 14, color: C.ink },
  stats: { flexDirection: 'row', padding: 14 },
  stat: { flex: 1 },
  statLabel: { ...font.semi, fontSize: 13, color: C.muted },
  statValue: { ...font.black, fontSize: 28, color: C.ink },
  nav: { alignSelf: 'center', padding: 8 },
  navText: { ...font.bold, color: C.white, fontSize: 15, textDecorationLine: 'underline' },
  toast: { position: 'absolute', left: 16, right: 16, bottom: 24, backgroundColor: C.ink, borderRadius: 16, padding: 14 },
  toastText: { ...font.bold, color: C.white, fontSize: 15, textAlign: 'center' },
});
