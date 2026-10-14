'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';
import { qrUrlFor } from '@/shared/qr';
import type { Avatar } from '@/shared/avatar';
import type { AnswerResponse, MeResponse } from '@/shared/types';
import { BearSvg, type Look, type Mood } from '@/components/BearSvg';
import { SoundToggle, Speech } from '@/components/BearTalk';
import { BearCard, Bubble, Confetti, Screen, Spinner } from '@/components/ui';
import { frase, primerNombre, type Frase } from '@/lib/frases';
import { sfx, unlockAudio, voiceFor } from '@/lib/sfx';

const QrScanner = dynamic(() => import('@/components/QrScanner'), { ssr: false });

type Overlay =
  | { kind: 'flash'; correct: boolean; points: number }
  | { kind: 'superada'; trivia: number; points: number; timedOut: boolean }
  | null;

export default function Jugar() {
  const router = useRouter();
  const [me, setMe] = useState<MeResponse | null>(null);
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState('');
  const offset = useRef(0); // hora del servidor - hora del teléfono
  const streak = useRef(0); // aciertos seguidos (para que el oso celebre la racha)
  const playing = useRef<number | null>(null); // trivia que estaba jugando (para detectar "se acabó el tiempo")

  const apply = useCallback((r: MeResponse) => {
    if (r.status) offset.current = new Date(r.status.serverNow).getTime() - Date.now();
    // Estaba jugando y el servidor ya cerró la trivia: se le acabó el tiempo.
    const now = r.status?.phase === 'playing' ? r.status.trivia : null;
    if (playing.current !== null && now === null && r.player) {
      streak.current = 0;
      sfx.timeUp();
      setOverlay({ kind: 'superada', trivia: playing.current, points: r.player.triviaPuntos, timedOut: true });
    }
    playing.current = now;
    setMe(r);
  }, []);

  const refresh = useCallback(() => api.me().then(apply), [apply]);

  useEffect(() => {
    refresh()
      .then(() => {})
      .catch(() => setToast('Sin conexión. Revisa tu internet.'));
    // Aviso que deja /q/POLAR cuando el escaneo no pudo abrir una trivia.
    const aviso = new URLSearchParams(window.location.search).get('aviso');
    if (aviso) {
      setToast(aviso);
      window.history.replaceState(null, '', '/jugar');
    }
  }, [refresh]);

  useEffect(() => {
    if (me && !me.player) router.replace('/registro');
  }, [me, router]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  if (!me || !me.player || !me.status) {
    return (
      <Screen>
        <Spinner />
      </Screen>
    );
  }

  const { status, question, player, demoTools } = me;
  const buddy: Buddy = { name: primerNombre(player.nombre), oso: player.osoNombre, voice: voiceFor(player.osoNombre) };

  async function onScan(value: string) {
    if (busy) return;
    setBusy(true);
    try {
      apply(await api.scan(value));
      sfx.scan();
    } catch (e) {
      setToast((e as Error).message);
      sfx.nope();
    } finally {
      setBusy(false);
    }
  }

  async function onAnswer(option: number) {
    if (busy || !question) return;
    setBusy(true);
    sfx.tap();
    try {
      const r: AnswerResponse = await api.answer(option, question.index);
      offset.current = new Date(r.status.serverNow).getTime() - Date.now();
      playing.current = r.status.phase === 'playing' ? r.status.trivia : null;
      setMe((m) => (m ? { ...m, player: r.player, status: r.status, question: r.question } : m));
      streak.current = r.correct ? streak.current + 1 : 0;
      if (r.triviaDone) {
        sfx.levelUp();
        setOverlay({ kind: 'superada', trivia: question.trivia, points: r.triviaPoints, timedOut: false });
      } else {
        // Contrarreloj: el aviso es corto y no bloquea; la siguiente pregunta ya está en pantalla.
        if (!r.correct) sfx.wrong();
        else if (streak.current >= 2) sfx.streak(streak.current);
        else sfx.correct();
        setOverlay({ kind: 'flash', correct: r.correct, points: r.pointsEarned });
        setTimeout(() => setOverlay((o) => (o?.kind === 'flash' ? null : o)), 1100);
      }
    } catch (e) {
      // Si fue porque se acabó el tiempo, refresh() lo detecta y muestra el resultado.
      refresh().catch(() => setToast((e as Error).message));
    } finally {
      setBusy(false);
    }
  }

  let content: React.ReactNode;
  if (overlay?.kind === 'superada') {
    const isLast = status.phase === 'final';
    content = (
      <Superada
        avatar={player.avatar}
        buddy={buddy}
        trivia={overlay.trivia}
        points={overlay.points}
        timedOut={overlay.timedOut}
        nextLabel={isLast ? 'Ver mi resultado final' : `Ver cuándo abre la Trivia ${status.trivia ?? ''}`}
        onNext={() => setOverlay(null)}
      />
    );
  } else if (status.phase === 'playing' && question) {
    content = (
      <Trivia
        avatar={player.avatar}
        trivia={question.trivia}
        total={status.totalTrivias}
        index={question.index}
        count={question.total}
        text={question.text}
        options={question.options}
        busy={busy}
        flash={overlay?.kind === 'flash' ? overlay : null}
        streak={streak.current}
        deadline={status.deadline}
        limitSeconds={status.limitSeconds}
        offset={offset.current}
        onTimeUp={() => refresh().catch(() => {})}
        buddy={buddy}
        onAnswer={onAnswer}
      />
    );
  } else if (status.phase === 'scan') {
    content = (
      <Camara
        avatar={player.avatar}
        buddy={buddy}
        trivia={status.trivia ?? 1}
        closesAt={status.closesAt}
        completed={player.completed}
        total={status.totalTrivias}
        demoTools={demoTools}
        busy={busy}
        onScan={onScan}
      />
    );
  } else if (status.phase === 'locked') {
    content = (
      <Espera
        avatar={player.avatar}
        buddy={buddy}
        trivia={status.trivia ?? 1}
        opensAt={status.opensAt}
        offset={offset.current}
        completed={player.completed}
        total={status.totalTrivias}
        demoTools={demoTools}
        onOpen={() => refresh().catch(() => {})}
        onSkip={() => api.skip().then(apply).catch((e) => setToast(e.message))}
      />
    );
  } else {
    content = <Final avatar={player.avatar} buddy={buddy} puntos={player.puntos} completed={player.completed.length} total={status.totalTrivias} />;
  }

  return (
    <Screen className="relative overflow-hidden">
      <div onPointerDownCapture={unlockAudio} className="flex flex-1 flex-col">
        {content}
      </div>
      <SoundToggle className="absolute right-5 top-5 z-40" />
      {toast && (
        <div role="alert" className="fixed inset-x-4 bottom-6 z-50 mx-auto max-w-[400px] rounded-2xl bg-polar-ink px-4 py-3 text-center text-sm font-bold">
          {toast}
        </div>
      )}
    </Screen>
  );
}

/* ───────────────────────── El oso compañero ───────────────────────── */

/** Lo que el oso sabe de ti para hablarte: tu nombre, el suyo y su tono de voz. */
interface Buddy {
  name: string;
  oso: string;
  voice: number;
}

/** Frase estable mientras no cambie `key` (no cambia en cada render). */
function useFrase(kind: Frase, buddy: Buddy, key: unknown, r?: number) {
  const [text, setText] = useState(() => frase(kind, { n: buddy.name, oso: buddy.oso, r }));
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    setText(frase(kind, { n: buddy.name, oso: buddy.oso, r }));
  }, [kind, key]);
  return text;
}

/** Tocar al oso: se ríe, se mueve y te saluda. Devuelve el estado "cosquillas" por un momento. */
function useTickle(buddy: Buddy) {
  const [tickle, setTickle] = useState<{ n: number; text: string } | null>(null);
  useEffect(() => {
    if (!tickle) return;
    const t = setTimeout(() => setTickle(null), 1800);
    return () => clearTimeout(t);
  }, [tickle]);
  return {
    tickled: tickle !== null,
    tickleText: tickle?.text ?? null,
    tickleKey: tickle?.n ?? 0,
    onTickle: () => {
      sfx.giggle();
      setTickle({ n: Date.now(), text: frase('cosquillas', { n: buddy.name }) });
    },
  };
}

/** El oso, tocable. Respira cuando está quieto y se menea cuando le haces cosquillas. */
function TapBear({
  avatar,
  mood,
  look,
  graduado,
  tickleKey,
  onTickle,
  fit = 'height',
  className = '',
  title,
}: {
  avatar: Avatar;
  mood: Mood;
  look?: Look;
  graduado?: boolean;
  tickleKey: number;
  onTickle: () => void;
  /** "width": el oso ocupa el ancho (tarjetas angostas); "height": el alto. */
  fit?: 'width' | 'height';
  className?: string;
  title: string;
}) {
  return (
    <button
      type="button"
      onClick={onTickle}
      aria-label={`${title}. Tócalo para saludarlo`}
      className={`flex items-end justify-center ${className}`}
    >
      <span
        key={tickleKey}
        className={`flex h-full w-full origin-bottom items-end justify-center ${tickleKey ? 'animate-wiggle' : 'animate-breathe'}`}
      >
        <BearSvg avatar={avatar} mood={mood} look={look} graduado={graduado} className={fit === 'width' ? 'h-auto w-full' : 'h-full w-auto'} />
      </span>
    </button>
  );
}

/* ───────────────────────── Piezas ───────────────────────── */

function Progress({ completed, total, current }: { completed: number[]; total: number; current: number | null }) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: total }, (_, i) => i + 1).map((n) => {
        const done = completed.includes(n);
        const now = !done && n === current;
        return (
          <span
            key={n}
            className={`flex h-7 min-w-[34px] items-center justify-center rounded-full px-2 text-[13px] font-extrabold ${
              done ? 'bg-polar-blue text-white' : now ? 'bg-polar-orange text-white' : 'bg-white text-[#3D3D3D]'
            }`}
          >
            {done ? `✓ ${n}` : n}
          </span>
        );
      })}
    </div>
  );
}

function Thumb({ avatar, buddy, mood = 'normal' }: { avatar: Avatar; buddy: Buddy; mood?: Mood }) {
  const { tickled, tickleKey, onTickle } = useTickle(buddy);
  return (
    <div className="relative h-[187px] w-[105px] shrink-0 overflow-hidden rounded-[20px] border-4 border-white bg-polar-sky">
      <TapBear
        avatar={avatar}
        mood={tickled ? 'feliz' : mood}
        tickleKey={tickleKey}
        onTickle={onTickle}
        fit="width"
        className="absolute inset-0"
        title="Tu oso"
      />
    </div>
  );
}

function hora(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' });
}

function Camara({
  avatar,
  buddy,
  trivia,
  closesAt,
  completed,
  total,
  demoTools,
  busy,
  onScan,
}: {
  avatar: Avatar;
  buddy: Buddy;
  trivia: number;
  closesAt: string | null;
  completed: number[];
  total: number;
  demoTools: boolean;
  busy: boolean;
  onScan: (v: string) => void;
}) {
  const text = useFrase('escanear', buddy, trivia);
  return (
    <div className="relative m-3 flex min-h-[calc(100dvh-24px)] flex-1 flex-col overflow-hidden rounded-[22px] bg-[#1E1E1E]">
      <QrScanner onScan={onScan} paused={busy} />

      <div className="relative z-10 flex items-start gap-3">
        <Thumb avatar={avatar} buddy={buddy} mood={busy ? 'sorpresa' : 'normal'} />
        <div className="flex flex-col gap-2 pr-14 pt-7">
          <Speech text={`${text} Es la Trivia ${trivia}.`} voice={buddy.voice} />
          {closesAt && (
            <span className="self-start rounded-full bg-polar-orange px-3 py-1.5 text-[13px] font-extrabold text-polar-ink">
              Abierta hasta las {hora(closesAt)}
            </span>
          )}
          <Progress completed={completed} total={total} current={trivia} />
        </div>
      </div>

      <div className="pointer-events-none relative z-10 mx-auto mt-[12vh] h-[240px] w-[240px]" aria-hidden>
        <span className="absolute left-0 top-0 h-[50px] w-[50px] rounded-tl-[20px] border-l-[6px] border-t-[6px] border-white" />
        <span className="absolute right-0 top-0 h-[50px] w-[50px] rounded-tr-[20px] border-r-[6px] border-t-[6px] border-white" />
        <span className="absolute bottom-0 left-0 h-[50px] w-[50px] rounded-bl-[20px] border-b-[6px] border-l-[6px] border-white" />
        <span className="absolute bottom-0 right-0 h-[50px] w-[50px] rounded-br-[20px] border-b-[6px] border-r-[6px] border-white" />
        <span className="absolute inset-x-4 h-1 animate-scan rounded bg-polar-orange" />
      </div>
      <p className="relative z-10 mt-4 text-center text-sm font-semibold text-white drop-shadow">
        {busy ? 'Leyendo…' : 'Apunta la cámara al código QR'}
      </p>

      <div className="relative z-10 mt-auto flex flex-col gap-3 p-5">
        {demoTools && (
          <button type="button" onClick={() => onScan(qrUrlFor(window.location.origin))} className="btn-game">
            Simular escaneo (demo)
          </button>
        )}
        <nav className="grid grid-cols-2 gap-[3px]">
          <Link href="/reglas" className="flex h-[52px] items-center justify-center rounded-l-[26px] rounded-r-md bg-polar-lav text-[15px] font-bold text-polar-lav-ink">
            Reglas
          </Link>
          <Link href="/ranking" className="flex h-[52px] items-center justify-center rounded-l-md rounded-r-[26px] bg-polar-lav-dark text-[15px] font-bold text-white">
            Ranking
          </Link>
        </nav>
      </div>
    </div>
  );
}

/** Segundos que quedan hasta `deadline` (con la hora del servidor). Avisa una vez al llegar a cero. */
function useCountdown(deadline: string | null, offset: number, onZero: () => void) {
  const target = deadline ? new Date(deadline).getTime() : 0;
  const calc = () => Math.max(0, target - (Date.now() + offset));
  const [ms, setMs] = useState(calc);
  const onZeroRef = useRef(onZero);
  onZeroRef.current = onZero;

  useEffect(() => {
    if (!target) return;
    let lastAsk = 0;
    const tick = () => {
      const left = calc();
      setMs(left);
      // En cero pregunta al servidor (que cierra la trivia); reintenta cada 2 s por si el margen aún no venció.
      if (left === 0 && Date.now() - lastAsk > 2000) {
        lastAsk = Date.now();
        onZeroRef.current();
      }
    };
    tick();
    const id = setInterval(tick, 200);
    return () => clearInterval(id);
  }, [target, offset]);
  return ms;
}

function Trivia({
  avatar,
  buddy,
  trivia,
  total,
  index,
  count,
  text,
  options,
  busy,
  flash,
  streak,
  deadline,
  limitSeconds,
  offset,
  onTimeUp,
  onAnswer,
}: {
  avatar: Avatar;
  buddy: Buddy;
  trivia: number;
  total: number;
  index: number;
  count: number;
  text: string;
  options: string[];
  busy: boolean;
  flash: { correct: boolean; points: number } | null;
  streak: number;
  deadline: string | null;
  limitSeconds: number;
  offset: number;
  onTimeUp: () => void;
  onAnswer: (i: number) => void;
}) {
  // La opción que estás por elegir: el oso la mira y duda contigo.
  const [hover, setHover] = useState<number | null>(null);
  const { tickled, tickleText, tickleKey, onTickle } = useTickle(buddy);
  useEffect(() => setHover(null), [index]);

  const ms = useCountdown(deadline, offset, onTimeUp);
  const secs = Math.ceil(ms / 1000);
  const hurry = deadline !== null && secs <= 10;
  const pct = deadline ? Math.min(100, (ms / (limitSeconds * 1000)) * 100) : 100;

  // Tic-tac en los últimos 5 segundos.
  const lastTick = useRef<number | null>(null);
  useEffect(() => {
    if (!deadline || secs > 5 || secs <= 0 || lastTick.current === secs) return;
    lastTick.current = secs;
    sfx.tick(secs);
  }, [secs, deadline]);

  const state: Frase = flash
    ? flash.correct
      ? streak >= 2
        ? 'racha'
        : 'acierto'
      : 'fallo'
    : busy
      ? 'esperando'
      : hover !== null
        ? 'mirando'
        : hurry
          ? 'apurado'
          : 'pregunta';
  const said = useFrase(state, buddy, `${index}-${state}-${hover}-${flash?.correct}`, streak);

  const mood: Mood = tickled
    ? 'feliz'
    : flash
      ? flash.correct
        ? streak >= 2
          ? 'orgulloso'
          : 'sorpresa'
        : 'triste'
      : busy || hurry
        ? 'nervioso'
        : hover !== null
          ? 'pensar'
          : 'normal';
  // Las opciones están arriba del oso: mira hacia arriba, de izquierda a derecha según cuál.
  const look: Look | undefined = hover !== null ? { x: -0.6 + (hover / Math.max(1, options.length - 1)) * 1.2, y: -1 } : undefined;

  function point(i: number) {
    if (busy || hover === i) return;
    setHover(i);
    sfx.hover();
  }

  return (
    <div className="relative m-3 flex min-h-[calc(100dvh-24px)] flex-1 flex-col overflow-hidden rounded-[22px] bg-polar-cam px-[22px] pt-6 text-polar-ink">
      {/* Reloj de la trivia */}
      <div className="flex items-center gap-3 pr-12">
        <span
          className={`min-w-[64px] rounded-full px-3 py-1 text-center text-lg font-black tabular-nums text-white ${
            hurry ? 'animate-pulse bg-[#E5484D]' : 'bg-polar-ink'
          }`}
          aria-label={`Quedan ${secs} segundos`}
        >
          {`${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`}
        </span>
        <div className="h-3 flex-1 overflow-hidden rounded-full bg-white">
          <div
            className={`h-full rounded-full transition-[width] duration-200 ease-linear ${hurry ? 'bg-[#E5484D]' : 'bg-polar-orange'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between text-[13px] text-[#3D3D3D]">
        <span className="font-extrabold uppercase tracking-wider">Trivia {trivia} de {total}</span>
        <span className="font-bold">Pregunta {index + 1} de {count}</span>
      </div>
      <h1 key={index} className="mt-2 animate-pop text-[26px] font-black uppercase leading-[1.1]">
        {text}
      </h1>
      <div className="mt-4 flex flex-col gap-3" onPointerLeave={() => setHover(null)}>
        {options.map((o, i) => (
          <button
            key={`${index}-${i}`}
            type="button"
            disabled={busy}
            onPointerEnter={() => point(i)}
            onPointerDown={() => point(i)}
            onFocus={() => point(i)}
            onClick={() => onAnswer(i)}
            className={`flex min-h-[52px] items-center rounded-full px-6 py-2 text-left text-[17px] font-bold text-white shadow-game-sm transition-transform active:translate-y-[3px] active:shadow-none disabled:opacity-70 ${
              hover === i ? 'bg-polar-orange-dark' : 'bg-polar-orange'
            }`}
          >
            {o}
          </button>
        ))}
      </div>
      <div className="relative mx-auto mt-auto h-[32vh] max-h-[380px] w-[230px] overflow-hidden rounded-t-[20px] border-4 border-b-0 border-white bg-polar-sky">
        <TapBear
          avatar={avatar}
          mood={mood}
          look={look}
          tickleKey={tickleKey}
          onTickle={onTickle}
          fit="width"
          className="absolute inset-0"
          title="Tu oso"
        />
      </div>
      <Speech text={tickleText ?? said} voice={buddy.voice} className="absolute bottom-[27vh] right-5 max-w-[60%] text-[15px]" />

      {flash && (
        <div className="pointer-events-none absolute inset-x-0 bottom-[34vh] z-20 flex justify-center" role="status">
          <div
            className={`animate-pop rounded-[20px] border-4 border-white px-6 py-3 text-center text-white ${
              flash.correct ? 'bg-polar-blue shadow-arrow' : 'bg-polar-ink shadow-[0_5px_0_#000]'
            }`}
          >
            <p className="text-[22px] font-black uppercase">
              {!flash.correct ? 'Incorrecta' : streak >= 2 ? `¡Racha de ${streak}!` : '¡Correcto!'}
            </p>
            <p className="text-base font-extrabold">{flash.correct ? `+${flash.points} puntos` : '+0 · ¡sigue!'}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function Superada({
  avatar,
  buddy,
  trivia,
  points,
  timedOut,
  nextLabel,
  onNext,
}: {
  avatar: Avatar;
  buddy: Buddy;
  trivia: number;
  points: number;
  timedOut: boolean;
  nextLabel: string;
  onNext: () => void;
}) {
  const { tickled, tickleText, tickleKey, onTickle } = useTickle(buddy);
  const said = useFrase(timedOut ? 'tiempo' : 'superada', buddy, trivia);
  return (
    <div className="flex flex-1 flex-col px-[18px] pb-4 pt-16">
      <h1 className="mx-4 flex h-14 items-center justify-center rounded-full bg-polar-orange text-[22px] font-black uppercase shadow-game">
        {timedOut ? '¡Se acabó el tiempo!' : `¡Trivia ${trivia} superada!`}
      </h1>
      <BearCard
        art={
          <TapBear
            avatar={avatar}
            mood={tickled ? 'feliz' : timedOut ? 'animo' : 'orgulloso'}
            tickleKey={tickleKey}
            onTickle={onTickle}
            className="h-full w-full"
            title="Tu oso celebrando"
          />
        }
        className="mt-6 flex-1"
        artClassName="origin-bottom animate-hop"
      >
        <Confetti />
        <Speech text={tickleText ?? `${said} +${points} para tu localidad.`} voice={buddy.voice} className="absolute inset-x-4 top-4 animate-pop text-lg" />
      </BearCard>
      <button
        type="button"
        onClick={() => {
          sfx.tap();
          onNext();
        }}
        className="btn-game mx-4 mt-5"
      >
        {nextLabel}
      </button>
    </div>
  );
}

function Espera({
  avatar,
  buddy,
  trivia,
  opensAt,
  offset,
  completed,
  total,
  demoTools,
  onOpen,
  onSkip,
}: {
  avatar: Avatar;
  buddy: Buddy;
  trivia: number;
  opensAt: string | null;
  offset: number;
  completed: number[];
  total: number;
  demoTools: boolean;
  onOpen: () => void;
  onSkip: () => void;
}) {
  const target = opensAt ? new Date(opensAt).getTime() : 0;
  const [left, setLeft] = useState(() => Math.max(0, target - (Date.now() + offset)));
  const onOpenRef = useRef(onOpen);
  onOpenRef.current = onOpen;
  const said = useFrase('espera', buddy, trivia);

  useEffect(() => {
    sfx.yawn();
  }, []);

  useEffect(() => {
    let lastAsk = 0;
    const tick = () => {
      const ms = Math.max(0, target - (Date.now() + offset));
      setLeft(ms);
      // Al llegar a cero, pregunta al servidor (cada 3 s como máximo) si ya abrió.
      if (ms === 0 && Date.now() - lastAsk > 3000) {
        lastAsk = Date.now();
        onOpenRef.current();
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target, offset]);

  const s = Math.ceil(left / 1000);
  const pad = (n: number) => String(n).padStart(2, '0');
  const clock = `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;

  return (
    <div className="relative m-3 flex min-h-[calc(100dvh-24px)] flex-1 flex-col rounded-[22px] bg-polar-cam text-polar-ink">
      <div className="flex items-start gap-3">
        <Thumb avatar={avatar} buddy={buddy} mood="dormido" />
        <Speech text={said} voice={buddy.voice} className="mr-14 mt-7" />
      </div>

      <div className="mx-auto mt-10 grid w-[320px] max-w-[85%] grid-cols-4 gap-2">
        {Array.from({ length: total }, (_, i) => i + 1).map((n) => {
          const done = completed.includes(n);
          const next = n === trivia;
          return (
            <span
              key={n}
              className={`flex h-16 items-center justify-center rounded-2xl text-lg font-black ${
                done ? 'bg-polar-blue text-white' : next ? 'bg-polar-orange text-white' : 'bg-white text-[#3D3D3D]'
              }`}
            >
              {done ? `✓ ${n}` : n}
            </span>
          );
        })}
      </div>

      <div className="mx-auto mt-6 flex w-[320px] max-w-[85%] flex-col items-center gap-1.5 rounded-[20px] bg-white p-5 text-center">
        <span className="text-[13px] font-extrabold uppercase tracking-wider text-polar-muted">La Trivia {trivia} abre en</span>
        <span className="text-[52px] font-black tabular-nums tracking-wide">{clock}</span>
        {opensAt && <span className="text-sm text-polar-muted">Abre a las {hora(opensAt)} · Escanea el mismo QR</span>}
      </div>

      <div className="mx-auto mt-6 flex w-[320px] max-w-[85%] flex-col items-center gap-3">
        <div className="flex h-14 w-full items-center justify-center rounded-full border-2 border-dashed border-[#8A8A8A] text-base font-bold text-[#3D3D3D]">
          Bloqueada hasta que abra
        </div>
        {demoTools && (
          <button type="button" onClick={onSkip} className="h-11 text-sm font-bold underline">
            Saltar espera (demo)
          </button>
        )}
      </div>

      <nav className="mx-auto mb-5 mt-auto grid w-[260px] grid-cols-2 gap-[3px]">
        <Link href="/reglas" className="flex h-[52px] items-center justify-center rounded-l-[26px] rounded-r-md bg-polar-lav text-[15px] font-bold text-polar-lav-ink">
          Reglas
        </Link>
        <Link href="/ranking" className="flex h-[52px] items-center justify-center rounded-l-md rounded-r-[26px] bg-polar-lav-dark text-[15px] font-bold text-white">
          Ranking
        </Link>
      </nav>
    </div>
  );
}

function Final({ avatar, buddy, puntos, completed, total }: { avatar: Avatar; buddy: Buddy; puntos: number; completed: number; total: number }) {
  const [rank, setRank] = useState<number | null>(null);
  const { tickled, tickleText, tickleKey, onTickle } = useTickle(buddy);
  const said = useFrase('final', buddy, 'final');
  useEffect(() => {
    api.leaderboard().then((r) => setRank(r.me?.rank ?? null)).catch(() => {});
    sfx.graduate();
  }, []);

  return (
    <div className="flex flex-1 flex-col px-[18px] pb-4 pt-16">
      <div className="flex flex-col items-center gap-1 text-center">
        <span className="text-sm font-extrabold uppercase tracking-[0.12em]">{completed} de {total} trivias completadas</span>
        <h1 className="text-[44px] font-black uppercase leading-none text-polar-ink">¡Te graduaste!</h1>
      </div>
      <BearCard
        art={
          <TapBear
            avatar={avatar}
            graduado
            mood={tickled ? 'feliz' : 'orgulloso'}
            tickleKey={tickleKey}
            onTickle={onTickle}
            className="h-full w-full"
            title="Tu oso graduado"
          />
        }
        className="mt-5 flex-1"
      >
        <Confetti />
        <Speech text={tickleText ?? said} voice={buddy.voice} className="absolute inset-x-4 top-4 text-base" />
      </BearCard>
      <div className="mx-4 mt-4 grid grid-cols-2 gap-3 rounded-[20px] bg-white px-5 py-3.5 text-polar-ink">
        <div className="flex flex-col">
          <span className="text-[13px] font-semibold text-polar-muted">Tus puntos</span>
          <span className="text-[26px] font-black">{puntos}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[13px] font-semibold text-polar-muted">Puesto en tu localidad</span>
          <span className="text-[26px] font-black text-polar-blue">{rank ? `#${rank}` : '…'}</span>
        </div>
      </div>
      <Link href="/ranking" className="btn-game mx-4 mt-4">
        Ver el ranking
      </Link>
    </div>
  );
}
