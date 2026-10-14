'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';
import type { Avatar } from '@/shared/avatar';
import type { AnswerResponse, MeResponse } from '@/shared/types';
import { BearSvg } from '@/components/BearSvg';
import { BearCard, Bubble, Confetti, Screen, Spinner } from '@/components/ui';

const QrScanner = dynamic(() => import('@/components/QrScanner'), { ssr: false });

type Overlay =
  | { kind: 'error' }
  | { kind: 'flash'; points: number }
  | { kind: 'superada'; trivia: number; points: number }
  | null;

export default function Jugar() {
  const router = useRouter();
  const [me, setMe] = useState<MeResponse | null>(null);
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState('');
  const offset = useRef(0); // hora del servidor - hora del teléfono

  const apply = useCallback((r: MeResponse) => {
    if (r.status) offset.current = new Date(r.status.serverNow).getTime() - Date.now();
    setMe(r);
  }, []);

  const refresh = useCallback(() => api.me().then(apply), [apply]);

  useEffect(() => {
    refresh()
      .then(() => {})
      .catch(() => setToast('Sin conexión. Revisa tu internet.'));
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
    try {
      apply(await api.scan(value));
    } catch (e) {
      setToast((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function onAnswer(option: number) {
    if (busy || !question) return;
    setBusy(true);
    try {
      const r: AnswerResponse = await api.answer(option, question.index);
      offset.current = new Date(r.status.serverNow).getTime() - Date.now();
      setMe((m) => (m ? { ...m, player: r.player, status: r.status, question: r.question } : m));
      if (!r.correct) setOverlay({ kind: 'error' });
      else if (r.triviaDone) setOverlay({ kind: 'superada', trivia: question.trivia, points: r.triviaPoints });
      else {
        setOverlay({ kind: 'flash', points: r.pointsEarned });
        setTimeout(() => setOverlay((o) => (o?.kind === 'flash' ? null : o)), 1200);
      }
    } catch (e) {
      setToast((e as Error).message);
      refresh().catch(() => {});
    } finally {
      setBusy(false);
    }
  }

  let content: React.ReactNode;
  if (overlay?.kind === 'error') {
    content = <Incorrecto avatar={player.avatar} onRetry={() => setOverlay(null)} />;
  } else if (overlay?.kind === 'superada') {
    const isLast = status.phase === 'final';
    content = (
      <Superada
        avatar={player.avatar}
        trivia={overlay.trivia}
        points={overlay.points}
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
        flash={overlay?.kind === 'flash' ? overlay.points : null}
        onAnswer={onAnswer}
      />
    );
  } else if (status.phase === 'scan') {
    content = (
      <Camara
        avatar={player.avatar}
        sedeCode={me.sedes.find((s) => s.name === player.sede)?.code ?? ''}
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
    content = <Final avatar={player.avatar} puntos={player.puntos} completed={player.completed.length} total={status.totalTrivias} />;
  }

  return (
    <Screen className="relative overflow-hidden">
      {content}
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

function Thumb({ avatar }: { avatar: Avatar }) {
  return (
    <div className="relative flex h-[187px] w-[105px] shrink-0 items-end overflow-hidden rounded-[20px] border-4 border-white bg-polar-sky">
      <BearSvg avatar={avatar} className="w-full" title="Tu oso" />
    </div>
  );
}

function hora(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' });
}

function Camara({
  avatar,
  sedeCode,
  trivia,
  closesAt,
  completed,
  total,
  demoTools,
  busy,
  onScan,
}: {
  avatar: Avatar;
  sedeCode: string;
  trivia: number;
  closesAt: string | null;
  completed: number[];
  total: number;
  demoTools: boolean;
  busy: boolean;
  onScan: (v: string) => void;
}) {
  return (
    <div className="relative m-3 flex min-h-[calc(100dvh-24px)] flex-1 flex-col overflow-hidden rounded-[22px] bg-[#1E1E1E]">
      <QrScanner onScan={onScan} paused={busy} />

      <div className="relative z-10 flex items-start gap-3">
        <Thumb avatar={avatar} />
        <div className="flex flex-col gap-2 pr-3 pt-7">
          <Bubble>¡Busca el QR de la Trivia {trivia}!</Bubble>
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
          <button type="button" onClick={() => onScan(`POLAR:${sedeCode}`)} className="btn-game">
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

function Trivia({
  avatar,
  trivia,
  total,
  index,
  count,
  text,
  options,
  busy,
  flash,
  onAnswer,
}: {
  avatar: Avatar;
  trivia: number;
  total: number;
  index: number;
  count: number;
  text: string;
  options: string[];
  busy: boolean;
  flash: number | null;
  onAnswer: (i: number) => void;
}) {
  return (
    <div className="relative m-3 flex min-h-[calc(100dvh-24px)] flex-1 flex-col overflow-hidden rounded-[22px] bg-polar-cam px-[22px] pt-7 text-polar-ink">
      <div className="flex items-center justify-between text-[13px] text-[#3D3D3D]">
        <span className="font-extrabold uppercase tracking-wider">Trivia {trivia} de {total}</span>
        <span className="font-bold">Pregunta {index + 1} de {count}</span>
      </div>
      <h1 className="mt-3 text-[28px] font-black uppercase leading-[1.1]">{text}</h1>
      <div className="mt-5 flex flex-col gap-3.5">
        {options.map((o, i) => (
          <button
            key={i}
            type="button"
            disabled={busy || flash !== null}
            onClick={() => onAnswer(i)}
            className="flex min-h-[54px] items-center rounded-full bg-polar-orange px-6 py-2 text-left text-[17px] font-bold text-white shadow-game-sm transition-transform active:translate-y-[3px] active:shadow-none disabled:opacity-70"
          >
            {o}
          </button>
        ))}
      </div>
      <div className="relative mx-auto mt-auto flex h-[38vh] max-h-[434px] w-[255px] items-end overflow-hidden rounded-t-[20px] border-4 border-b-0 border-white bg-polar-sky">
        <BearSvg avatar={avatar} mood={flash !== null ? 'feliz' : 'normal'} className="w-full" title="Tu oso pensando" />
      </div>
      <Bubble className="absolute bottom-[34vh] right-6 text-[15px]">{flash !== null ? '¡Bien!' : 'Mmm…'}</Bubble>

      {flash !== null && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-polar-blue/80" role="status">
          <div className="animate-pop rounded-[24px] border-4 border-white bg-polar-orange px-8 py-6 text-center text-white shadow-game">
            <p className="text-[32px] font-black uppercase">¡Correcto!</p>
            {flash > 0 && <p className="text-lg font-extrabold">+{flash} puntos</p>}
          </div>
        </div>
      )}
    </div>
  );
}

function Incorrecto({ avatar, onRetry }: { avatar: Avatar; onRetry: () => void }) {
  return (
    <div className="flex flex-1 flex-col px-[18px] pb-4 pt-10">
      <h1 className="mx-4 flex h-14 items-center justify-center gap-2.5 rounded-full bg-polar-ink text-[21px] font-black uppercase shadow-[0_5px_0_#000]">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FF8D28" strokeWidth="3.4" strokeLinecap="round" aria-hidden>
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
        Respuesta incorrecta
      </h1>
      <BearCard art={<BearSvg avatar={avatar} mood="triste" className="h-full" title="Tu oso" />} className="mt-6 flex-1" artClassName="origin-bottom animate-shake">
        <div className="absolute inset-x-4 top-4 flex animate-pop flex-col gap-0.5 rounded-[18px] border-[3px] border-polar-ink bg-white px-4 py-3 text-polar-ink">
          <span className="text-xl font-black">¡Ups, casi!</span>
          <span className="text-[15px] font-semibold">Esa no era. Piénsalo otra vez.</span>
        </div>
      </BearCard>
      <button type="button" onClick={onRetry} className="btn-game mx-4 mt-5">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M4 12a8 8 0 1 0 2.5-5.8" />
          <path d="M4 4v4h4" />
        </svg>
        Volver a intentar
      </button>
    </div>
  );
}

function Superada({ avatar, trivia, points, nextLabel, onNext }: { avatar: Avatar; trivia: number; points: number; nextLabel: string; onNext: () => void }) {
  return (
    <div className="flex flex-1 flex-col px-[18px] pb-4 pt-10">
      <h1 className="mx-4 flex h-14 items-center justify-center rounded-full bg-polar-orange text-[22px] font-black uppercase shadow-game">
        ¡Trivia {trivia} superada!
      </h1>
      <BearCard art={<BearSvg avatar={avatar} mood="feliz" className="h-full" title="Tu oso celebrando" />} className="mt-6 flex-1" artClassName="origin-bottom animate-hop">
        <Confetti />
        <Bubble className="absolute left-4 top-4 animate-pop text-lg font-black">¡Sumaste +{points} para tu sede!</Bubble>
      </BearCard>
      <button type="button" onClick={onNext} className="btn-game mx-4 mt-5">
        {nextLabel}
      </button>
    </div>
  );
}

function Espera({
  avatar,
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
  const last = completed.length ? Math.max(...completed) : trivia - 1;

  return (
    <div className="relative m-3 flex min-h-[calc(100dvh-24px)] flex-1 flex-col rounded-[22px] bg-polar-cam text-polar-ink">
      <div className="flex items-start gap-3">
        <Thumb avatar={avatar} />
        <Bubble className="mr-3 mt-7">¡Ya hiciste la Trivia {last}! Vuelve cuando abra la próxima.</Bubble>
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

function Final({ avatar, puntos, completed, total }: { avatar: Avatar; puntos: number; completed: number; total: number }) {
  const [rank, setRank] = useState<number | null>(null);
  useEffect(() => {
    api.leaderboard().then((r) => setRank(r.me?.rank ?? null)).catch(() => {});
  }, []);

  return (
    <div className="flex flex-1 flex-col px-[18px] pb-4 pt-8">
      <div className="flex flex-col items-center gap-1 text-center">
        <span className="text-sm font-extrabold uppercase tracking-[0.12em]">{completed} de {total} trivias completadas</span>
        <h1 className="text-[44px] font-black uppercase leading-none text-polar-ink">¡Te graduaste!</h1>
      </div>
      <BearCard art={<BearSvg avatar={avatar} graduado mood="feliz" className="h-full" title="Tu oso graduado" />} className="mt-5 flex-1">
        <Confetti />
      </BearCard>
      <div className="mx-4 mt-4 grid grid-cols-2 gap-3 rounded-[20px] bg-white px-5 py-3.5 text-polar-ink">
        <div className="flex flex-col">
          <span className="text-[13px] font-semibold text-polar-muted">Tus puntos</span>
          <span className="text-[26px] font-black">{puntos}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[13px] font-semibold text-polar-muted">Puesto en tu sede</span>
          <span className="text-[26px] font-black text-polar-blue">{rank ? `#${rank}` : '…'}</span>
        </div>
      </div>
      <Link href="/ranking" className="btn-game mx-4 mt-4">
        Ver el leaderboard
      </Link>
    </div>
  );
}
