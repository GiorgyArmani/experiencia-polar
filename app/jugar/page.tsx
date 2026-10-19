'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';
import { qrUrlFor } from '@/shared/qr';
import { estacion, nivelLabel } from '@/shared/estaciones';
import type { Icono } from '@/shared/icono';
import type { AnswerResponse, MeResponse } from '@/shared/types';
import { lastStop, META, WorldMap } from '@/components/WorldMap';
import { SoundToggle } from '@/components/Talk';
import { Screen, Spinner } from '@/components/ui';
import { Anillos, Destello, Franjas } from '@/components/Cargando';
import { setMusicTempo, sfx, startMusic, stopMusic } from '@/lib/sfx';

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
  const [, rerender] = useState(0);
  const offset = useRef(0); // hora del servidor - hora del teléfono
  const streak = useRef(0); // aciertos seguidos (para celebrar la racha)
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
    // Aviso que deja /q/POLAR cuando el escaneo no pudo abrir un nivel.
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

  async function onScan(value: string) {
    if (busy) return;
    setBusy(true);
    sfx.scan();
    const t0 = Date.now();
    try {
      const r = await api.scan(value);
      // Que la animación de carga alcance a verse (~1 s) antes de pasar al mapa.
      await new Promise((ok) => setTimeout(ok, Math.max(0, 1000 - (Date.now() - t0))));
      apply(r);
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

  // Recién escaneado: el reloj del nivel todavía no arranca y se muestra el mapa.
  const startsAt = status.phase === 'playing' && status.startsAt ? new Date(status.startsAt).getTime() : 0;
  const inIntro = startsAt > Date.now() + offset.current;

  let content: React.ReactNode;
  if (overlay?.kind === 'superada') {
    const next = status.trivia ?? 0;
    content = (
      <Superada
        icono={player.icono}
        trivia={overlay.trivia}
        completed={player.completed}
        points={overlay.points}
        timedOut={overlay.timedOut}
        nextLabel={
          status.phase === 'final'
            ? 'Ver mi resultado final'
            : status.phase === 'scan'
              ? `Ir al Nivel ${next}`
              : `Ver cuándo abre el Nivel ${next}`
        }
        onNext={() => setOverlay(null)}
      />
    );
  } else if (status.phase === 'playing' && question && inIntro) {
    content = (
      <Intro
        icono={player.icono}
        trivia={question.trivia}
        completed={player.completed}
        startsAt={startsAt}
        offset={offset.current}
        onStart={() => rerender((n) => n + 1)}
      />
    );
  } else if (status.phase === 'playing' && question) {
    content = (
      <Trivia
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
        penalty={status.wrongPenalty}
        offset={offset.current}
        onTimeUp={() => refresh().catch(() => {})}
        onAnswer={onAnswer}
      />
    );
  } else if (status.phase === 'scan') {
    content = (
      <Camara
        icono={player.icono}
        trivia={status.trivia ?? 1}
        closesAt={status.closesAt}
        penalty={status.wrongPenalty}
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
        icono={player.icono}
        trivia={status.trivia ?? 1}
        opensAt={status.opensAt}
        offset={offset.current}
        completed={player.completed}
        demoTools={demoTools}
        onOpen={() => refresh().catch(() => {})}
        onSkip={() => api.skip().then(apply).catch((e) => setToast(e.message))}
      />
    );
  } else {
    content = <Final icono={player.icono} puntos={player.puntos} completed={player.completed} total={status.totalTrivias} />;
  }

  return (
    <Screen className="relative overflow-hidden">
      <div className="flex flex-1 flex-col">{content}</div>
      <SoundToggle className="absolute right-5 top-5 z-40" />
      {toast && (
        <div role="alert" className="fixed inset-x-4 bottom-6 z-50 mx-auto max-w-[400px] rounded-2xl bg-polar-ink px-4 py-3 text-center text-sm font-bold">
          {toast}
        </div>
      )}
    </Screen>
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
              done ? 'bg-polar-blue text-white' : now ? 'bg-polar-yellow text-polar-navy' : 'bg-white text-[#3D3D3D]'
            }`}
          >
            {done ? `✓ ${n}` : n}
          </span>
        );
      })}
    </div>
  );
}

/** +80 / −50 (con signo menos tipográfico). */
function signed(n: number) {
  return n < 0 ? `−${Math.abs(n)}` : `+${n}`;
}

function hora(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' });
}

/** Cartel de nivel estilo consola: "NIVEL 2" y el nombre de la estación. */
function NivelBanner({ trivia, className = '' }: { trivia: number; className?: string }) {
  return (
    <div className={`flex flex-col items-center text-center ${className}`}>
      <span className="rounded-full bg-polar-navy px-4 py-1 font-display text-[15px] uppercase tracking-[0.18em] text-polar-yellow">
        Nivel {trivia}
      </span>
      <span className="title-display mt-1 text-[clamp(28px,9vw,38px)] leading-none text-white [text-shadow:0_4px_0_#0E0C4E]">
        {estacion(trivia)?.nombre ?? `Estación ${trivia}`}
      </span>
    </div>
  );
}

/** Botones de abajo: mapa, instrucciones y ranking. */
function Nav({ onMap, className = '' }: { onMap?: () => void; className?: string }) {
  const base = 'flex h-[52px] items-center justify-center text-[15px] font-bold';
  return (
    <nav className={`grid gap-[3px] ${onMap ? 'grid-cols-3' : 'grid-cols-2'} ${className}`}>
      {onMap && (
        <button type="button" onClick={onMap} className={`${base} rounded-l-[26px] rounded-r-md bg-polar-yellow text-polar-navy`}>
          Mapa
        </button>
      )}
      <Link href="/reglas" className={`${base} ${onMap ? 'rounded-md' : 'rounded-l-[26px] rounded-r-md'} bg-polar-lav text-polar-lav-ink`}>
        Instrucciones
      </Link>
      <Link href="/ranking" className={`${base} rounded-l-md rounded-r-[26px] bg-polar-lav-dark text-white`}>
        Ranking
      </Link>
    </nav>
  );
}

/** Mapa en una hoja que sube desde abajo (desde la cámara). */
function MapSheet({ icono, completed, current, onClose }: { icono: Icono; completed: number[]; current: number; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50" role="dialog" aria-modal="true" aria-label="Mapa" onClick={onClose}>
      <div className="w-full max-w-[440px] rounded-t-[28px] bg-polar-blue px-4 pb-6 pt-4" onClick={(e) => e.stopPropagation()}>
        <p className="title-display text-center text-2xl">Tu recorrido</p>
        <WorldMap icono={icono} completed={completed} current={current} to={lastStop(completed)} className="mt-3 max-w-[min(340px,62dvh)]" />
        <button type="button" onClick={onClose} className="btn-game mx-auto mt-4 w-full max-w-[300px]">
          Seguir buscando el QR
        </button>
      </div>
    </div>
  );
}

function Camara({
  icono,
  trivia,
  closesAt,
  penalty,
  completed,
  total,
  demoTools,
  busy,
  onScan,
}: {
  icono: Icono;
  trivia: number;
  closesAt: string | null;
  penalty: number;
  completed: number[];
  total: number;
  demoTools: boolean;
  busy: boolean;
  onScan: (v: string) => void;
}) {
  const [map, setMap] = useState(false);
  return (
    <div className="relative m-3 flex min-h-[calc(100dvh-24px)] flex-1 flex-col overflow-hidden rounded-[22px] bg-[#1E1E1E]">
      <QrScanner onScan={onScan} paused={busy || map} />

      <div className="relative z-10 flex flex-col gap-2 p-4 pr-16">
        <span className="text-[12px] font-extrabold uppercase tracking-[0.16em] text-polar-yellow">Busca el QR · Nivel {trivia}</span>
        <span className="title-display text-[clamp(24px,7.5vw,32px)] leading-none text-white">{estacion(trivia)?.nombre}</span>
        <div className="flex flex-col gap-2">
          {closesAt && (
            <span className="self-start rounded-full bg-polar-yellow px-3 py-1.5 text-[13px] font-extrabold text-polar-navy">
              Abierto hasta las {hora(closesAt)}
            </span>
          )}
          {penalty > 0 && (
            <span className="self-start rounded-full bg-[#E5484D] px-3 py-1.5 text-[13px] font-extrabold text-white">
              ¡Último y más difícil! Cada incorrecta resta {penalty}
            </span>
          )}
          <Progress completed={completed} total={total} current={trivia} />
        </div>
      </div>

      {/* El visor se encoge en pantallas bajas o angostas para que todo quepa sin desplazarse. */}
      <div className="pointer-events-none relative z-10 mx-auto mt-[4dvh] aspect-square w-[min(240px,28dvh,70vw)]" aria-hidden>
        <span className="absolute left-0 top-0 h-[50px] w-[50px] rounded-tl-[20px] border-l-[6px] border-t-[6px] border-white" />
        <span className="absolute right-0 top-0 h-[50px] w-[50px] rounded-tr-[20px] border-r-[6px] border-t-[6px] border-white" />
        <span className="absolute bottom-0 left-0 h-[50px] w-[50px] rounded-bl-[20px] border-b-[6px] border-l-[6px] border-white" />
        <span className="absolute bottom-0 right-0 h-[50px] w-[50px] rounded-br-[20px] border-b-[6px] border-r-[6px] border-white" />
        <span className="absolute inset-x-4 h-1 animate-scan rounded bg-polar-yellow" />
      </div>
      <p className="relative z-10 mt-4 flex items-center justify-center gap-2 text-center text-sm font-semibold text-white drop-shadow">
        {busy && <Destello size={18} />}
        {busy ? 'Leyendo…' : 'Apunta la cámara al código QR'}
      </p>
      {/* QR leído: carga con los anillos mientras se abre el nivel. */}
      {busy && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-5 bg-polar-navy/85" role="status" aria-live="polite">
          <Anillos size={170} light={false} />
          <Franjas />
          <span className="text-sm font-extrabold uppercase tracking-[0.18em] text-white">Abriendo el nivel…</span>
        </div>
      )}

      <div className="relative z-10 mt-auto flex flex-col gap-3 p-5">
        {demoTools && (
          <button type="button" onClick={() => onScan(qrUrlFor(window.location.origin))} className="btn-game">
            Simular escaneo
          </button>
        )}
        <Nav onMap={() => setMap(true)} />
      </div>
      {map && <MapSheet icono={icono} completed={completed} current={trivia} onClose={() => setMap(false)} />}
    </div>
  );
}

/**
 * Recién escaneado: el mapa del mundo, tu ícono camina hasta la estación y arranca el nivel.
 * El reloj del nivel empieza cuando termina esta pantalla (lo decide el servidor con `startsAt`).
 */
function Intro({
  icono,
  trivia,
  completed,
  startsAt,
  offset,
  onStart,
}: {
  icono: Icono;
  trivia: number;
  completed: number[];
  startsAt: number;
  offset: number;
  onStart: () => void;
}) {
  const calc = () => Math.max(0, startsAt - (Date.now() + offset));
  const [left, setLeft] = useState(calc);
  const [arrived, setArrived] = useState(false);
  const started = useRef(false);
  const start = useRef(onStart);
  start.current = onStart;

  useEffect(() => {
    const id = setInterval(() => {
      const ms = calc();
      setLeft(ms);
      if (ms === 0 && !started.current) {
        started.current = true;
        sfx.cheer();
        start.current();
      }
    }, 100);
    return () => clearInterval(id);
  }, [startsAt, offset]);

  const secs = Math.ceil(left / 1000);
  return (
    <div className="flex flex-1 flex-col px-4 pb-5 pt-14">
      <NivelBanner trivia={trivia} className="animate-pop" />
      <WorldMap
        icono={icono}
        completed={completed}
        current={trivia}
        from={lastStop(completed.filter((n) => n < trivia))}
        to={trivia}
        onArrive={() => setArrived(true)}
        className="mt-3 max-w-[min(360px,56dvh)]"
      />
      <div className="mt-auto flex flex-col items-center gap-1 pt-3 text-center" aria-live="polite">
        <span className="text-sm font-extrabold uppercase tracking-[0.14em] text-[#DCEBFF]">
          {arrived ? '¡Prepárate!' : 'Camino a la estación…'}
        </span>
        <span key={secs} className="title-display animate-pop text-[clamp(40px,8dvh,64px)] leading-none text-polar-yellow [text-shadow:0_4px_0_#0E0C4E]">
          {secs > 3 ? 'Listo…' : secs > 0 ? secs : '¡YA!'}
        </span>
        <span className="text-[13px] font-semibold text-white/85">El reloj empieza al entrar al nivel</span>
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
  penalty,
  offset,
  onTimeUp,
  onAnswer,
}: {
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
  penalty: number;
  offset: number;
  onTimeUp: () => void;
  onAnswer: (i: number) => void;
}) {
  const [hover, setHover] = useState<number | null>(null);
  useEffect(() => setHover(null), [index]);

  const ms = useCountdown(deadline, offset, onTimeUp);
  const secs = Math.ceil(ms / 1000);
  const frac = deadline ? Math.min(1, ms / (limitSeconds * 1000)) : 1;
  // La presión sube por etapas: aviso (queda poco) → apuro (10 s) → alarma (5 s).
  const hurry = deadline !== null && secs <= 10;
  const critical = deadline !== null && secs <= 5;
  const warn = deadline !== null && (hurry || frac <= 0.4);
  const tone = hurry ? '#E5484D' : warn ? '#FF9F1C' : '#FFCC53';

  // Música de fondo mientras dura el nivel; se acelera en los últimos 10 s.
  useEffect(() => {
    startMusic();
    return () => {
      stopMusic();
      setMusicTempo(1);
    };
  }, []);
  useEffect(() => setMusicTempo(hurry ? 1.15 : 1), [hurry]);

  // Alarma una vez por segundo en los últimos 10.
  const lastTick = useRef<number | null>(null);
  useEffect(() => {
    if (!deadline || secs > 10 || secs <= 0 || lastTick.current === secs) return;
    lastTick.current = secs;
    sfx.alarm(secs);
  }, [secs, deadline]);

  function point(i: number) {
    if (busy || hover === i) return;
    setHover(i);
    sfx.hover();
  }

  // Aro de la cuenta regresiva: se vacía con el tiempo.
  const R = 54;
  const C = 2 * Math.PI * R;
  const aviso = hurry ? '¡Apúrate!' : warn ? '¡Se acaba el tiempo!' : '¡Responde rápido y suma más!';

  return (
    <div className="relative m-3 flex min-h-[calc(100dvh-24px)] flex-1 flex-col overflow-hidden rounded-[22px] bg-polar-cam px-[22px] pt-6 text-polar-ink">
      <div className="flex items-center justify-between gap-2 pr-12 text-[13px] text-[#3D3D3D]">
        <span className="min-w-0 truncate font-extrabold uppercase tracking-wider">
          Nivel {trivia}/{total} · {estacion(trivia)?.nombre}
        </span>
        <span className="shrink-0 font-bold">Pregunta {index + 1} de {count}</span>
      </div>
      {penalty > 0 && (
        <p className="mt-2 self-start rounded-full bg-[#E5484D] px-3 py-1 text-[12px] font-extrabold uppercase tracking-wide text-white">
          ¡Ojo! Cada incorrecta resta {penalty} puntos
        </p>
      )}
      <h1 key={index} className="mt-3 animate-pop title-display text-[clamp(22px,3.8dvh,30px)] leading-[1.1] text-polar-navy">
        {text}
      </h1>
      <div className="mt-[2dvh] flex flex-col gap-[min(12px,1.5dvh)]" onPointerLeave={() => setHover(null)}>
        {options.map((o, i) => (
          <button
            key={`${index}-${i}`}
            type="button"
            disabled={busy}
            onPointerEnter={() => point(i)}
            onPointerDown={() => point(i)}
            onFocus={() => point(i)}
            onClick={() => onAnswer(i)}
            className={`flex min-h-[clamp(44px,7.5dvh,52px)] items-center rounded-full px-6 py-1.5 text-left text-[17px] font-bold leading-tight text-polar-navy shadow-game-sm transition-transform active:translate-y-[3px] active:shadow-none disabled:opacity-70 ${
              hover === i ? 'bg-polar-yellow-dark' : 'bg-polar-yellow'
            }`}
          >
            {o}
          </button>
        ))}
      </div>

      {/* La cuenta regresiva: grande, cambia de color y te apura. */}
      <div className="relative -mx-[22px] mt-4 flex min-h-[150px] flex-1 flex-col items-center justify-center gap-2 border-t-4 border-white bg-polar-navy px-4 py-3 text-white">
        <div className={`relative aspect-square h-[min(200px,24dvh)] ${critical ? 'animate-alarm' : hurry ? 'animate-tremble' : ''}`}>
          <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90" aria-hidden>
            <circle cx="60" cy="60" r={R} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="10" />
            <circle
              cx="60"
              cy="60"
              r={R}
              fill="none"
              stroke={tone}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={C}
              strokeDashoffset={C * (1 - frac)}
              style={{ transition: 'stroke-dashoffset 200ms linear, stroke 300ms' }}
            />
          </svg>
          <span
            className={`absolute inset-0 flex items-center justify-center font-display text-[clamp(44px,9dvh,80px)] tabular-nums leading-none ${hurry ? 'animate-pulse' : ''}`}
            style={{ color: tone }}
            role="timer"
            aria-label={`Quedan ${secs} segundos`}
          >
            {secs}
          </span>
        </div>
        {flash ? (
          <div
            role="status"
            className={`animate-pop rounded-[16px] border-[3px] border-white px-4 py-1 text-center ${flash.correct ? 'bg-polar-bright' : 'bg-polar-ink'}`}
          >
            <p className="text-lg font-black uppercase leading-tight">
              {!flash.correct ? 'Incorrecta' : streak >= 2 ? `¡Racha de ${streak}!` : '¡Correcto!'}
            </p>
            <p className="text-sm font-extrabold">
              {flash.correct ? `+${flash.points} puntos` : flash.points < 0 ? `${signed(flash.points)} puntos` : '+0 · ¡sigue!'}
            </p>
          </div>
        ) : (
          <p className={`title-display text-center text-[clamp(18px,3dvh,24px)] leading-none ${hurry ? 'text-[#FF6B6F]' : 'text-white'}`}>{aviso}</p>
        )}
      </div>
      {/* Borde rojo que parpadea en los últimos segundos. */}
      {critical && !flash && (
        <div className="pointer-events-none absolute inset-0 z-10 animate-pulse rounded-[22px] border-[6px] border-[#E5484D]" aria-hidden />
      )}
    </div>
  );
}

function Superada({
  icono,
  trivia,
  completed,
  points,
  timedOut,
  nextLabel,
  onNext,
}: {
  icono: Icono;
  trivia: number;
  completed: number[];
  points: number;
  timedOut: boolean;
  nextLabel: string;
  onNext: () => void;
}) {
  return (
    <div className="flex flex-1 flex-col px-4 pb-4 pt-14">
      <h1 className="mx-2 flex min-h-14 items-center justify-center rounded-full bg-polar-yellow px-4 text-center title-display text-[clamp(20px,6.5vw,26px)] leading-none text-polar-navy shadow-game">
        {timedOut ? '¡Se acabó el tiempo!' : `¡Nivel ${trivia} superado!`}
      </h1>
      <p className="mt-3 text-center text-lg font-extrabold">
        <span className="text-polar-yellow">{signed(points)} puntos</span> para tu localidad
      </p>
      <WorldMap icono={icono} completed={completed} current={null} to={trivia} justCleared={trivia} className="mt-3 max-w-[min(340px,48dvh)]" />
      <button
        type="button"
        onClick={() => {
          sfx.tap();
          onNext();
        }}
        className="btn-game mx-2 mt-auto"
      >
        {nextLabel}
      </button>
    </div>
  );
}

function Espera({
  icono,
  trivia,
  opensAt,
  offset,
  completed,
  demoTools,
  onOpen,
  onSkip,
}: {
  icono: Icono;
  trivia: number;
  opensAt: string | null;
  offset: number;
  completed: number[];
  demoTools: boolean;
  onOpen: () => void;
  onSkip: () => void;
}) {
  const target = opensAt ? new Date(opensAt).getTime() : 0;
  const [left, setLeft] = useState(() => Math.max(0, target - (Date.now() + offset)));
  const onOpenRef = useRef(onOpen);
  onOpenRef.current = onOpen;

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
    <div className="flex flex-1 flex-col px-4 pb-5 pt-14">
      <p className="title-display mr-12 text-[clamp(24px,7.5vw,30px)] leading-none">Tu recorrido</p>
      <WorldMap icono={icono} completed={completed} current={trivia} to={lastStop(completed)} className="mt-3 max-w-[min(340px,44dvh)]" />

      <div className="mx-auto mt-3 flex w-[320px] max-w-full flex-col items-center gap-1 rounded-[20px] bg-white px-4 py-[min(16px,2dvh)] text-center text-polar-ink">
        <span className="text-[13px] font-extrabold uppercase tracking-wider text-polar-muted">
          El {nivelLabel(trivia)} abre en
        </span>
        <span className="text-[clamp(30px,min(12vw,6.5dvh),48px)] font-black leading-tight tabular-nums tracking-wide">{clock}</span>
        {opensAt && <span className="text-sm text-polar-muted">Abre a las {hora(opensAt)} · Escanea el mismo QR</span>}
      </div>
      {demoTools && (
        <button type="button" onClick={onSkip} className="mx-auto h-11 text-sm font-bold underline">
          Saltar espera (demo)
        </button>
      )}

      <Nav className="mx-auto mt-auto w-[260px] pt-3" />
    </div>
  );
}

function Final({ icono, puntos, completed, total }: { icono: Icono; puntos: number; completed: number[]; total: number }) {
  const [rank, setRank] = useState<number | null>(null);
  useEffect(() => {
    api.leaderboard().then((r) => setRank(r.me?.rank ?? null)).catch(() => {});
  }, []);

  return (
    <div className="flex flex-1 flex-col px-4 pb-4 pt-14">
      <div className="flex flex-col items-center gap-1 text-center">
        <span className="text-sm font-extrabold uppercase tracking-[0.12em]">
          {completed.length} de {total} niveles completados
        </span>
        <h1 className="title-display text-[clamp(36px,13vw,54px)] leading-none text-white [text-shadow:0_4px_0_#0E0C4E]">¡Te graduaste!</h1>
      </div>
      <WorldMap
        icono={icono}
        completed={completed}
        from={lastStop(completed)}
        to={META}
        graduado
        onArrive={() => sfx.graduate()}
        className="mt-3 max-w-[min(340px,42dvh)]"
      />
      <div className="mx-2 mt-3 grid grid-cols-2 gap-3 rounded-[20px] bg-white px-5 py-3 text-polar-ink">
        <div className="flex flex-col">
          <span className="text-[13px] font-semibold text-polar-muted">Tus puntos</span>
          <span className="text-[26px] font-black">{puntos}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[13px] font-semibold text-polar-muted">Puesto en tu localidad</span>
          <span className="text-[26px] font-black text-polar-blue">{rank ? `#${rank}` : '…'}</span>
        </div>
      </div>
      <Link href="/ranking" className="btn-game mx-2 mt-3">
        Ver el ranking
      </Link>
    </div>
  );
}
