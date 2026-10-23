'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';
import { isExperienceQr, qrUrlFor } from '@/shared/qr';
import type { Icono } from '@/shared/icono';
import { estacion } from '@/shared/estaciones';
import { FEEDBACK_MS, type AnswerResponse, type MeResponse, type QuestionView } from '@/shared/types';
import { lastStop, META, WorldMap } from '@/components/WorldMap';
import { SoundToggle } from '@/components/Talk';
import { OtraCedula } from '@/components/OtraCedula';
import { Screen, Spinner } from '@/components/ui';
import { Anillos, CARGA_MIN_MS, Destello, Franjas, useTiempoMinimo } from '@/components/Cargando';
import { setMusicTempo, sfx, startMusic, stopMusic } from '@/lib/sfx';

const QrScanner = dynamic(() => import('@/components/QrScanner'), { ssr: false });
const LogoAR = dynamic(() => import('@/components/LogoAR'), { ssr: false });
/** Baja el modelo 3D de la estación por adelantado para que salga al instante al escanear. */
const precargarLogo = (url?: string) => {
  if (url) import('@/components/LogoAR').then((m) => m.precargarLogo(url)).catch(() => {});
};

type Overlay = { kind: 'superada'; trivia: number; points: number; timedOut: boolean } | null;

/** Pregunta recién respondida: se queda en pantalla con el aviso de correcta/incorrecta. */
type Review = {
  q: QuestionView;
  selected: number;
  correct: boolean;
  explanation: string;
  points: number;
  streak: number;
  /** Lo que marcaba el reloj al responder (se queda quieto durante el aviso). */
  msLeft: number;
};

export default function Jugar() {
  const router = useRouter();
  const [me, setMe] = useState<MeResponse | null>(null);
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [review, setReview] = useState<Review | null>(null);
  const reviewTimer = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => () => clearTimeout(reviewTimer.current), []);
  const [busy, setBusy] = useState(false);
  // QR válido recién leído: el logo 3D queda sobre la cámara hasta que el jugador toca "Comenzar".
  const [qrLeido, setQrLeido] = useState<string | null>(null);
  const [toast, setToast] = useState('');
  const [, rerender] = useState(0);
  const cargaVista = useTiempoMinimo(CARGA_MIN_MS.pantalla);
  const offset = useRef(0); // hora del servidor - hora del teléfono
  const streak = useRef(0); // aciertos seguidos (para celebrar la racha)
  const playing = useRef<number | null>(null); // trivia que estaba jugando (para detectar "se acabó el tiempo")

  // `receivedAt`: cuándo llegó la respuesta (si se aplica más tarde, la hora del servidor ya quedó vieja).
  const apply = useCallback((r: MeResponse, receivedAt = Date.now()) => {
    if (r.status) offset.current = new Date(r.status.serverNow).getTime() - receivedAt;
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
    if (me && !me.player) router.replace('/');
  }, [me, router]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  if (!cargaVista || !me || !me.player || !me.status) {
    return (
      <Screen>
        <Spinner />
      </Screen>
    );
  }

  const { status, question, player, demoTools } = me;

  async function abrirNivel(value: string) {
    setBusy(true);
    try {
      const r = await api.scan(value);
      apply(r, Date.now());
    } catch (e) {
      setToast((e as Error).message);
      sfx.nope();
    } finally {
      setQrLeido(null);
      setBusy(false);
    }
  }

  function onScan(value: string) {
    if (busy || qrLeido) return;
    sfx.scan();
    // QR de la experiencia: primero el logo 3D (sin reloj); el nivel abre cuando toca "Comenzar".
    // Cualquier otro QR va directo al servidor, que responde con el aviso de error.
    if (isExperienceQr(value)) setQrLeido(value);
    else abrirNivel(value);
  }

  async function onAnswer(option: number) {
    if (busy || review || !question || !status) return;
    setBusy(true);
    sfx.tap();
    const q = question;
    const deadline = status.deadline;
    try {
      const r: AnswerResponse = await api.answer(option, q.index);
      const msLeft = deadline ? Math.max(0, new Date(deadline).getTime() - (Date.now() + offset.current)) : 0;
      offset.current = new Date(r.status.serverNow).getTime() - Date.now();
      playing.current = r.status.phase === 'playing' ? r.status.trivia : null;
      streak.current = r.correct ? streak.current + 1 : 0;
      if (!r.correct) sfx.wrong();
      else if (streak.current >= 2) sfx.streak(streak.current);
      else sfx.correct();
      // Primero el aviso de correcta/incorrecta (el servidor pausó el reloj ese rato); luego sigue el juego.
      setReview({
        q,
        selected: option,
        correct: r.correct,
        explanation: r.explanation ?? `La respuesta correcta es: ${q.options[r.correctOption] ?? ''}`,
        points: r.pointsEarned,
        streak: streak.current,
        msLeft,
      });
      reviewTimer.current = setTimeout(() => {
        setReview(null);
        setMe((m) => (m ? { ...m, player: r.player, status: r.status, question: r.question } : m));
        if (r.triviaDone) {
          sfx.levelUp();
          setOverlay({ kind: 'superada', trivia: q.trivia, points: r.triviaPoints, timedOut: false });
        }
      }, FEEDBACK_MS);
    } catch (e) {
      // Si fue porque se acabó el tiempo, refresh() lo detecta y muestra el resultado.
      refresh().catch(() => setToast((e as Error).message));
    } finally {
      setBusy(false);
    }
  }

  // Recién escaneado: el reloj del nivel todavía no arranca y se muestra el mapa.
  const startsAt = status.phase === 'playing' && status.startsAt ? new Date(status.startsAt).getTime() : 0;
  const inIntro = question?.index === 0 && startsAt > Date.now() + offset.current;
  const triviaProps = {
    busy,
    deadline: status.deadline,
    limitSeconds: status.limitSeconds,
    penalty: status.wrongPenalty,
    offset: offset.current,
    onTimeUp: () => refresh().catch(() => {}),
    onAnswer,
  };

  let content: React.ReactNode;
  let enTrivia = false;
  if (review) {
    enTrivia = true;
    content = <Trivia {...triviaProps} q={review.q} review={review} />;
  } else if (overlay?.kind === 'superada') {
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
    enTrivia = true;
    content = <Trivia {...triviaProps} q={question} review={null} />;
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
        logo={qrLeido !== null}
        onScan={onScan}
        onStart={() => qrLeido && abrirNivel(qrLeido)}
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
    // En las preguntas la pantalla mide justo el alto del teléfono (sin desplazarse): Trivia achica el contenido si no cabe.
    // En el resto, en teléfonos bajos la pantalla se desplaza en vez de recortar el texto.
    <Screen className={enTrivia ? 'h-[100dvh] overflow-hidden' : 'overflow-x-hidden'}>
      <div className="flex min-h-0 flex-1 flex-col">{content}</div>
      {/* En las preguntas la esquina derecha es de "Pregunta N": el sonido pasa a la izquierda. */}
      <SoundToggle className={`absolute z-40 ${enTrivia ? 'left-3 top-3' : 'right-5 top-5'}`} />
      {toast && (
        <div role="alert" className="fixed inset-x-4 bottom-6 z-50 mx-auto max-w-[400px] rounded-2xl bg-polar-ink px-4 py-3 text-center text-sm font-bold text-white">
          {toast}
        </div>
      )}
    </Screen>
  );
}

/* ───────────────────────── Piezas ───────────────────────── */

/** Progreso de niveles: círculos como las paradas del mapa (hecho = acero con ✓, actual = amarillo, pendiente = celeste). */
function Progress({ completed, total, current }: { completed: number[]; total: number; current: number | null }) {
  return (
    <ol className="flex items-center gap-2" aria-label="Niveles">
      {Array.from({ length: total }, (_, i) => i + 1).map((n) => {
        const done = completed.includes(n);
        const now = !done && n === current;
        return (
          <li
            key={n}
            aria-label={`Nivel ${n}${done ? ' superado' : now ? ' (ahora)' : ''}`}
            className={`flex h-8 w-8 items-center justify-center rounded-full border-2 border-white text-[14px] font-bold shadow-[0_2px_6px_rgba(14,12,78,0.25)] ${
              done ? 'bg-polar-steel text-white' : now ? 'bg-polar-yellow text-polar-navy ring-2 ring-polar-yellow/50 ring-offset-1' : 'bg-[#9ED8FF] text-white'
            }`}
          >
            {done ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M5 12.5l4.5 4.5L19 7.5" />
              </svg>
            ) : (
              n
            )}
          </li>
        );
      })}
    </ol>
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

/** Cartel de nivel estilo consola: "NIVEL 2" (sin el nombre de la estación, por pedido de la UEP). */
function NivelBanner({ trivia, className = '' }: { trivia: number; className?: string }) {
  return (
    <div className={`flex flex-col items-center text-center ${className}`}>
      <span className="title-display text-[clamp(36px,12vw,52px)] leading-none text-polar-navy">Nivel {trivia}</span>
    </div>
  );
}

/** Botones de abajo: mapa, instrucciones y ranking (píldoras del estilo claro). */
function Nav({ onMap, className = '' }: { onMap?: () => void; className?: string }) {
  const base = 'flex h-[clamp(44px,6.5dvh,50px)] items-center justify-center rounded-full border-2 border-polar-navy px-1.5 text-[clamp(12px,3.7vw,14px)] font-bold transition-transform active:translate-y-[2px]';
  return (
    <nav className={`grid gap-2 ${onMap ? 'grid-cols-3' : 'grid-cols-2'} ${className}`}>
      {onMap && (
        <button type="button" onClick={onMap} className={`${base} bg-polar-steel text-white`}>
          Mapa
        </button>
      )}
      <Link href="/reglas" className={`${base} bg-white text-polar-navy`}>
        Instrucciones
      </Link>
      <Link href="/ranking" className={`${base} bg-white text-polar-navy`}>
        Ranking
      </Link>
    </nav>
  );
}

/** Tras el logo 3D: el jugador decide cuándo empieza el nivel (el reloj arranca al tocarlo). */
function BotonComenzar({ trivia, busy, onStart }: { trivia: number; busy: boolean; onStart: () => void }) {
  return (
    <button type="button" onClick={onStart} disabled={busy} className="btn-game mt-1 w-full max-w-[300px]">
      {busy ? <Destello size={20} /> : `¡Comenzar el Nivel ${trivia}!`}
    </button>
  );
}

/** Mapa en una hoja que sube desde abajo (desde la cámara). */
function MapSheet({ icono, completed, current, onClose }: { icono: Icono; completed: number[]; current: number; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50" role="dialog" aria-modal="true" aria-label="Mapa" onClick={onClose}>
      <div className="w-full max-w-[440px] rounded-t-[28px] bg-white px-4 pb-6 pt-4 text-polar-navy" onClick={(e) => e.stopPropagation()}>
        <p className="title-display text-center text-2xl">Tu recorrido</p>
        <WorldMap icono={icono} completed={completed} current={current} to={lastStop(completed)} className="mt-3 max-w-[min(340px,62dvh)]" />
        <button type="button" onClick={onClose} className="btn-uep mx-auto mt-4 w-full max-w-[300px]">
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
  logo,
  onScan,
  onStart,
}: {
  icono: Icono;
  trivia: number;
  closesAt: string | null;
  penalty: number;
  completed: number[];
  total: number;
  demoTools: boolean;
  busy: boolean;
  logo: boolean;
  onScan: (v: string) => void;
  onStart: () => void;
}) {
  const [map, setMap] = useState(false);
  const modelo = estacion(trivia)?.modelo;
  const [logoFallo, setLogoFallo] = useState(false);
  useEffect(() => precargarLogo(modelo), [modelo]);
  return (
    <div className="flex flex-1 flex-col px-[clamp(14px,4.5vw,22px)] pb-[max(14px,env(safe-area-inset-bottom))] pt-[clamp(14px,2.5dvh,22px)]">
      <div className="flex flex-col gap-2 pr-14">
        <span className="text-[12px] font-extrabold uppercase tracking-[0.16em] text-polar-steel">Busca el QR de la estación</span>
        <h1 className="title-display text-[clamp(32px,min(10vw,6dvh),44px)] leading-none text-polar-navy">Nivel {trivia}</h1>
        <div className="flex flex-wrap items-center gap-2">
          <Progress completed={completed} total={total} current={trivia} />
          {closesAt && (
            <span className="rounded-full border-2 border-polar-steel bg-polar-lav px-3 py-1 text-[12px] font-bold text-polar-navy">
              Abierto hasta las {hora(closesAt)}
            </span>
          )}
        </div>
        {penalty > 0 && (
          <span className="self-start rounded-full bg-[#E5484D] px-3 py-1 text-[12px] font-extrabold text-white">
            ¡Último y más difícil! Cada incorrecta resta {penalty}
          </span>
        )}
      </div>

      {/* La cámara en una tarjeta redondeada; el visor y los avisos van encima. */}
      <div className="relative mt-[clamp(10px,2dvh,18px)] min-h-[min(300px,45dvh)] flex-1 overflow-hidden rounded-[28px] border-4 border-white bg-polar-navy shadow-[0_8px_24px_rgba(14,12,78,0.28)]">
        <QrScanner onScan={onScan} paused={busy || map || logo} />

        <div className={`pointer-events-none absolute inset-0 z-10 flex items-center justify-center ${logo ? 'invisible' : ''}`} aria-hidden>
          <div className="relative aspect-square w-[min(220px,62%,32dvh)]">
            <span className="absolute left-0 top-0 h-[44px] w-[44px] rounded-tl-[18px] border-l-[5px] border-t-[5px] border-white" />
            <span className="absolute right-0 top-0 h-[44px] w-[44px] rounded-tr-[18px] border-r-[5px] border-t-[5px] border-white" />
            <span className="absolute bottom-0 left-0 h-[44px] w-[44px] rounded-bl-[18px] border-b-[5px] border-l-[5px] border-white" />
            <span className="absolute bottom-0 right-0 h-[44px] w-[44px] rounded-br-[18px] border-b-[5px] border-r-[5px] border-white" />
            <span className="absolute inset-x-4 h-1 animate-scan rounded bg-polar-yellow shadow-[0_0_10px_#FFCC53]" />
          </div>
        </div>
        <p
          className={`absolute inset-x-3 bottom-3 z-10 flex items-center justify-center gap-2 rounded-full bg-polar-navy/70 px-4 py-2 text-center text-sm font-bold text-white backdrop-blur-sm ${logo ? 'invisible' : ''}`}
        >
          {busy && <Destello size={18} />}
          {busy ? 'Leyendo…' : 'Apunta la cámara al código QR'}
        </p>

        {/* QR válido: el modelo 3D de la estación aparece sobre la cámara en vivo, con su animación. */}
        {logo && modelo && !logoFallo && (
          <div className="absolute inset-0 z-30 bg-gradient-to-b from-polar-navy/45 via-transparent to-polar-navy/80" role="status" aria-live="polite">
            <LogoAR url={modelo} className="absolute inset-x-0 top-[4%] h-[68%]" onError={() => setLogoFallo(true)} />
            <div className="absolute inset-x-0 bottom-[7%] flex animate-pop-straight flex-col items-center gap-2 px-5 text-center">
              <span className="title-display text-[clamp(28px,8.5vw,38px)] leading-none text-white [text-shadow:0_3px_12px_rgba(14,12,78,0.8)]">¡Encontraste el QR!</span>
              <BotonComenzar trivia={trivia} busy={busy} onStart={onStart} />
            </div>
          </div>
        )}
        {/* Estación sin modelo todavía, o el teléfono no puede mostrar 3D: la carga con los anillos. */}
        {logo && (!modelo || logoFallo) && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-5 bg-polar-navy/85" role="status" aria-live="polite">
            <Anillos size={160} light={false} />
            <Franjas />
            <span className="title-display text-[clamp(28px,8.5vw,38px)] leading-none text-white">¡Encontraste el QR!</span>
            <BotonComenzar trivia={trivia} busy={busy} onStart={onStart} />
          </div>
        )}
      </div>

      <div className={`mt-[clamp(10px,2dvh,16px)] flex flex-col gap-2.5 ${logo ? 'invisible' : ''}`}>
        {demoTools && (
          <button type="button" onClick={() => onScan(qrUrlFor(window.location.origin))} className="btn-uep">
            Simular escaneo
          </button>
        )}
        <Nav onMap={() => setMap(true)} />
        <OtraCedula />
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
  const cuenta = secs > 3 ? 'Listo…' : secs > 0 ? String(secs) : '¡YA!';
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
        <span className="text-sm font-extrabold uppercase tracking-[0.14em] text-polar-steel">
          {arrived ? '¡Prepárate!' : 'Camino a la estación…'}
        </span>
        <span key={cuenta} className="title-display animate-pop text-[clamp(40px,8dvh,64px)] leading-none text-polar-steel">
          {cuenta}
        </span>
        <span className="text-[13px] font-semibold text-polar-muted">El reloj empieza al entrar al nivel</span>
      </div>
    </div>
  );
}

/** Segundos que quedan hasta `deadline` (con la hora del servidor). Avisa una vez al llegar a cero. */
function useCountdown(deadline: string | null, offset: number, onZero: () => void, frozen: number | null = null) {
  const target = deadline ? new Date(deadline).getTime() : 0;
  const calc = () => Math.max(0, target - (Date.now() + offset));
  const [ms, setMs] = useState(calc);
  const onZeroRef = useRef(onZero);
  onZeroRef.current = onZero;
  const paused = frozen !== null;

  useEffect(() => {
    if (!target || paused) return;
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
  }, [target, offset, paused]);
  return paused ? frozen : ms;
}

/**
 * Pregunta (mockup de la UEP): pestaña "Pregunta N", número y nombre de la estación, la pregunta y las opciones
 * en tarjetas blancas, y abajo el reloj. Al responder, la opción elegida se pinta (verde = correcta,
 * amarilla = incorrecta) y el reloj cede su lugar al aviso con la respuesta clave.
 * Todo cabe en una pantalla sin desplazarse: los tamaños dependen del alto y, si aún no cabe, se achican con --fit.
 */
function Trivia({
  q,
  review,
  busy,
  deadline,
  limitSeconds,
  penalty,
  offset,
  onTimeUp,
  onAnswer,
}: {
  q: QuestionView;
  review: Review | null;
  busy: boolean;
  deadline: string | null;
  limitSeconds: number;
  penalty: number;
  offset: number;
  onTimeUp: () => void;
  onAnswer: (i: number) => void;
}) {
  const { trivia, index, text, options } = q;
  const [hover, setHover] = useState<number | null>(null);
  useEffect(() => setHover(null), [index]);

  const ms = useCountdown(deadline, offset, onTimeUp, review ? review.msLeft : null);
  const secs = Math.ceil(ms / 1000);
  const frac = deadline ? Math.min(1, ms / (limitSeconds * 1000)) : 1;
  // La presión sube por etapas: aviso (queda poco) → apuro (10 s) → alarma (5 s).
  const live = deadline !== null && !review;
  const hurry = live && secs <= 10;
  const critical = live && secs <= 5;
  const warn = live && (hurry || frac <= 0.4);
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
    if (!live || secs > 10 || secs <= 0 || lastTick.current === secs) return;
    lastTick.current = secs;
    sfx.alarm(secs);
  }, [secs, live]);

  const locked = busy || review !== null;
  // Todo debe caber en una pantalla sin desplazarse: si la pregunta o las opciones ocupan más líneas,
  // se baja la escala (--fit) de letras, espacios y reloj hasta que quepa.
  const fitRef = useRef<HTMLDivElement>(null);
  const enAviso = review !== null;
  useLayoutEffect(() => {
    const el = fitRef.current;
    if (!el) return;
    const ajustar = () => {
      let fit = 1;
      el.style.setProperty('--fit', '1');
      while (fit > 0.6 && el.scrollHeight > el.clientHeight + 1) {
        fit = Math.round((fit - 0.04) * 100) / 100;
        el.style.setProperty('--fit', String(fit));
      }
    };
    ajustar();
    document.fonts?.ready.then(ajustar).catch(() => {});
    const ro = new ResizeObserver(ajustar);
    ro.observe(el);
    return () => ro.disconnect();
  }, [index, text, enAviso]);
  function point(i: number) {
    if (locked || hover === i) return;
    setHover(i);
    sfx.hover();
  }

  function fondo(i: number) {
    if (review) {
      if (i !== review.selected) return 'bg-white';
      return review.correct ? 'bg-[#8BDD6D]' : 'bg-polar-yellow';
    }
    return hover === i ? 'bg-polar-lav' : 'bg-white';
  }

  const nombre = estacion(trivia)?.nombre ?? `Nivel ${trivia}`;
  const aviso = hurry ? '¡Apúrate!' : warn ? '¡Se acaba el tiempo!' : '¡Responde rápido y suma más!';

  // Aro del reloj: se vacía con el tiempo.
  const R = 54;
  const C = 2 * Math.PI * R;

  return (
    <div ref={fitRef} className="relative flex min-h-0 flex-1 flex-col overflow-hidden px-[clamp(16px,5vw,26px)] pb-[max(14px,env(safe-area-inset-bottom))]">
      {/* Solo "Pregunta 1/2/3", sin importar qué pregunta del banco le tocó. */}
      <span className="absolute right-0 top-0 rounded-bl-[22px] bg-polar-steel py-[clamp(4px,0.9dvh,8px)] pl-6 pr-5 font-display text-[clamp(20px,3.3dvh,28px)] leading-tight text-white">
        Pregunta {index + 1}
      </span>

      <div className="mt-[max(48px,calc(clamp(54px,8.5dvh,76px)*var(--fit,1)))] flex items-center gap-3">
        <span className="flex aspect-square h-[clamp(34px,5.4dvh,46px)] shrink-0 items-center justify-center rounded-[10px] border-2 border-polar-navy bg-[#9ED8FF] text-[clamp(20px,3.4dvh,28px)] font-bold leading-none text-polar-navy shadow-[0_3px_6px_rgba(14,12,78,0.25)]">
          {trivia}
        </span>
        <span className="min-w-0 text-[length:calc(clamp(22px,min(8vw,4.4dvh),38px)*var(--fit,1))] font-bold leading-[1.05] text-polar-steel">{nombre}</span>
      </div>
      {penalty > 0 && (
        <p className="mt-2 self-start rounded-full bg-[#E5484D] px-3 py-1 text-[12px] font-extrabold uppercase tracking-wide text-white">
          ¡Ojo! Cada incorrecta resta {penalty} puntos
        </p>
      )}

      <div className="card-uep mt-[calc(clamp(10px,2.4dvh,28px)*var(--fit,1))] px-4 py-[calc(clamp(10px,2.2dvh,22px)*var(--fit,1))]">
        <h1 key={index} className="animate-pop-straight text-balance text-center title-display text-[length:calc(clamp(19px,3.3dvh,30px)*var(--fit,1))] leading-[1.1] text-polar-navy">
          {text}
        </h1>
      </div>

      <div
        className="card-uep mt-[calc(clamp(10px,2.4dvh,28px)*var(--fit,1))] flex flex-col gap-[calc(clamp(8px,1.4dvh,14px)*var(--fit,1))] p-[calc(clamp(12px,2dvh,20px)*var(--fit,1))]"
        onPointerLeave={() => setHover(null)}
      >
        {options.map((o, i) => (
          <button
            key={`${index}-${i}`}
            type="button"
            disabled={locked}
            aria-pressed={review ? i === review.selected : undefined}
            onPointerEnter={() => point(i)}
            onPointerDown={() => point(i)}
            onFocus={() => point(i)}
            onClick={() => onAnswer(i)}
            className={`flex min-h-[max(40px,calc(clamp(44px,6.6dvh,60px)*var(--fit,1)))] items-center justify-center rounded-[16px] border-2 border-polar-navy px-4 py-1 text-center text-[length:max(12px,calc(clamp(14px,2.2dvh,18px)*var(--fit,1)))] font-bold leading-tight text-polar-navy transition-colors active:translate-y-[2px] ${fondo(i)}`}
          >
            {o}
          </button>
        ))}
      </div>

      <div className="mt-auto flex flex-col items-center pt-[calc(clamp(10px,2.2dvh,26px)*var(--fit,1))]">
        {review ? (
          <div
            role="status"
            className={`w-full animate-pop-straight rounded-[28px] px-5 py-[calc(clamp(10px,2dvh,20px)*var(--fit,1))] text-center text-white shadow-[0_6px_16px_rgba(14,12,78,0.3)] ${
              review.correct ? 'bg-polar-steel' : 'bg-polar-navy'
            }`}
          >
            <p className="title-display text-[length:calc(clamp(24px,4.2dvh,38px)*var(--fit,1))] leading-none">{review.correct ? '¡Correcto!' : '¡Incorrecto!'}</p>
            <p className="mt-1 text-balance text-[length:max(13px,calc(clamp(15px,2.5dvh,21px)*var(--fit,1)))] leading-snug">{review.explanation}</p>
            <p className="mt-1 text-[clamp(12px,1.8dvh,14px)] font-bold text-white/85">
              {review.correct
                ? `${review.streak >= 2 ? `¡Racha de ${review.streak}! · ` : ''}+${review.points} puntos`
                : review.points < 0
                  ? `${signed(review.points)} puntos`
                  : '+0 puntos'}
            </p>
          </div>
        ) : (
          // La cuenta regresiva de siempre (el reloj del mockup era solo referencial), un poco más chica:
          // el aro se vacía, el número cambia de color y los mensajes apuran.
          <div className="flex w-full flex-col items-center gap-[calc(clamp(4px,1dvh,10px)*var(--fit,1))] rounded-[28px] bg-polar-navy px-4 py-[calc(clamp(8px,1.6dvh,16px)*var(--fit,1))] text-white shadow-[0_6px_16px_rgba(14,12,78,0.3)]">
            <div className={`relative aspect-square h-[calc(min(150px,17dvh)*var(--fit,1)*var(--fit,1))] ${critical ? 'animate-alarm' : hurry ? 'animate-tremble' : ''}`}>
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
                className={`absolute inset-0 flex items-center justify-center font-display text-[length:calc(clamp(34px,6.6dvh,62px)*var(--fit,1)*var(--fit,1))] tabular-nums leading-none ${hurry ? 'animate-pulse' : ''}`}
                style={{ color: tone }}
                role="timer"
                aria-label={`Quedan ${secs} segundos`}
              >
                {secs}
              </span>
            </div>
            <p className={`title-display text-center text-[clamp(16px,2.5dvh,20px)] leading-none ${hurry ? 'text-[#FF6B6F]' : 'text-white'}`}>{aviso}</p>
          </div>
        )}
      </div>
      {/* Borde rojo que parpadea en los últimos segundos. */}
      {critical && <div className="pointer-events-none fixed inset-0 z-10 mx-auto max-w-[440px] animate-pulse border-[6px] border-[#E5484D]" aria-hidden />}
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
    <div className="flex flex-1 flex-col px-4 pb-[max(16px,env(safe-area-inset-bottom))] pt-14">
      <h1 className="title-display text-balance text-center text-[clamp(30px,min(10vw,5.5dvh),46px)] leading-none text-polar-navy">
        {timedOut ? '¡Se acabó el tiempo!' : `¡Nivel ${trivia} superado!`}
      </h1>
      <p className="mt-2 text-center text-[clamp(15px,2.4dvh,18px)] font-bold">
        <span className="text-polar-steel">{signed(points)} puntos</span> para tu localidad
      </p>
      <WorldMap icono={icono} completed={completed} current={null} to={trivia} justCleared={trivia} className="mb-4 mt-3 max-w-[min(340px,52dvh)]" />
      <button
        type="button"
        onClick={() => {
          sfx.tap();
          onNext();
        }}
        className="btn-uep mx-2 mt-auto"
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
    <div className="flex flex-1 flex-col px-4 pb-[max(20px,env(safe-area-inset-bottom))] pt-14">
      <p className="title-display mr-12 text-[clamp(24px,7.5vw,30px)] leading-none text-polar-navy">Tu recorrido</p>
      <WorldMap icono={icono} completed={completed} current={trivia} to={lastStop(completed)} className="mt-3 max-w-[min(340px,44dvh)]" />

      <div className="card-uep mx-auto mt-3 flex w-[320px] max-w-full flex-col items-center gap-1 px-4 py-[min(16px,2dvh)] text-center text-polar-ink">
        <span className="text-[13px] font-extrabold uppercase tracking-wider text-polar-muted">
          El Nivel {trivia} abre en
        </span>
        <span className="text-[clamp(30px,min(12vw,6.5dvh),48px)] font-black leading-tight tabular-nums tracking-wide">{clock}</span>
        {opensAt && <span className="text-sm text-polar-muted">Abre a las {hora(opensAt)} · Escanea el mismo QR</span>}
      </div>
      {demoTools && (
        <button type="button" onClick={onSkip} className="mx-auto h-11 text-sm font-bold text-polar-navy underline">
          Saltar espera (demo)
        </button>
      )}

      <Nav className="mx-auto mt-auto w-[260px] pt-3" />
      <OtraCedula className="mt-1" />
    </div>
  );
}

/** 1ro, 2do, 3ro, 4to… 7mo, 8vo, 9no, 10mo, 11vo, 12vo. */
function ordinal(n: number) {
  const fin = n % 100 === 11 || n % 100 === 12 ? 'vo' : ['mo', 'ro', 'do', 'ro', 'to', 'to', 'to', 'mo', 'vo', 'no'][n % 10];
  return `${n}${fin}`;
}

/** Resultado final (mockup de la UEP): ¡Lo lograste!, el mapa completo, puesto y puntuación. */
function Final({ icono, puntos, completed, total }: { icono: Icono; puntos: number; completed: number[]; total: number }) {
  const [rank, setRank] = useState<number | null>(null);
  useEffect(() => {
    api.leaderboard().then((r) => setRank(r.me?.rank ?? null)).catch(() => {});
  }, []);

  return (
    <div className="flex flex-1 flex-col px-4 pb-[max(16px,env(safe-area-inset-bottom))] pt-[clamp(44px,7dvh,64px)]">
      <div className="flex flex-col items-center gap-1 text-center text-polar-navy">
        <h1 className="title-display text-[clamp(44px,min(15vw,8dvh),72px)] leading-none">¡Lo lograste!</h1>
        <p className="text-[clamp(15px,2.4dvh,19px)] font-bold">
          {completed.length >= total ? 'Completaste todos los niveles' : `Completaste ${completed.length} de ${total} niveles`}
        </p>
      </div>
      <WorldMap
        icono={icono}
        completed={completed}
        from={lastStop(completed)}
        to={META}
        onArrive={() => sfx.graduate()}
        className="mt-3 max-w-[min(340px,44dvh)]"
      />
      <div className="mx-2 mt-3 flex flex-col gap-1 bg-white px-6 py-[clamp(10px,2dvh,18px)] text-polar-navy shadow-[0_6px_18px_rgba(14,12,78,0.18)]">
        <div className="flex items-center justify-between gap-3">
          <span className="text-[clamp(18px,3dvh,26px)] font-bold leading-tight">Puesto en tu localidad</span>
          <span className="font-display text-[clamp(40px,7dvh,64px)] uppercase leading-none text-polar-steel">{rank ? ordinal(rank) : '…'}</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-[clamp(15px,2.4dvh,20px)] font-bold">Puntuación</span>
          <span className="font-display text-[clamp(28px,4.6dvh,40px)] leading-none text-polar-steel">{puntos}</span>
        </div>
      </div>
      <div className="mt-auto px-2 pt-4">
        <Link href="/ranking" className="btn-uep">
          Ver ranking
        </Link>
        <OtraCedula className="mt-2 flex" />
      </div>
    </div>
  );
}
