// EJEMPLO: el avatar "vivo" del juego de Experiencia UEP.
// - TapAvatar: el avatar respira, se menea al tocarlo y tiembla cuando se acaba el tiempo.
// - useTickle: al tocarlo se ríe (sfx.giggle) y dice una frase por un momento.
// - useFrase: una frase estable por estado del juego (ver ./frases.ts).
// Dependencias: ./AvatarSvg, ./avatar, ./frases y el módulo de sonido `sfx` del proyecto original (lib/sfx.ts).
// Animaciones de Tailwind necesarias: ver README.md (breathe, wiggle, tremble, alarm).
'use client';

import { useEffect, useRef, useState } from 'react';
import type { Avatar } from './avatar';
import { AvatarSvg, type Look, type Mood } from './AvatarSvg';
import { frase, type Frase } from './frases';
// En el proyecto original: import { sfx } from '@/lib/sfx';
const sfx = { giggle: () => {} };

/* ───────────────────────── El avatar (eres tú) ───────────────────────── */

/** Lo que el avatar necesita para "pensar en voz alta": tu nombre y tu tono de voz. */
export interface Buddy {
  name: string;
  voice: number;
}

/** Frase estable mientras no cambie `key` (no cambia en cada render). */
export function useFrase(kind: Frase, buddy: Buddy, key: unknown, r?: number) {
  const [text, setText] = useState(() => frase(kind, { n: buddy.name, r }));
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    setText(frase(kind, { n: buddy.name, r }));
  }, [kind, key]);
  return text;
}

/** Tocar al avatar: se ríe, se mueve y saluda. Devuelve el estado "cosquillas" por un momento. */
export function useTickle(buddy: Buddy) {
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

/** El avatar, tocable. Respira cuando está quieto y se menea cuando le haces cosquillas. */
export function TapAvatar({
  avatar,
  mood,
  look,
  graduado,
  tickleKey,
  onTickle,
  fit = 'height',
  className = '',
  title,
  shake,
}: {
  avatar: Avatar;
  mood: Mood;
  look?: Look;
  graduado?: boolean;
  tickleKey: number;
  onTickle: () => void;
  /** "width": el avatar ocupa el ancho (tarjetas angostas); "height": el alto. */
  fit?: 'width' | 'height';
  className?: string;
  title: string;
  /** Tiembla porque se acaba el tiempo. */
  shake?: 'tremble' | 'alarm';
}) {
  const anim = shake === 'alarm' ? 'animate-alarm' : shake === 'tremble' ? 'animate-tremble' : tickleKey ? 'animate-wiggle' : 'animate-breathe';
  return (
    <button
      type="button"
      onClick={onTickle}
      aria-label={`${title}. Tócalo para saludarlo`}
      className={`flex items-end justify-center ${className}`}
    >
      <span
        key={tickleKey}
        className={`flex h-full w-full origin-bottom items-end justify-center ${anim}`}
      >
        <AvatarSvg avatar={avatar} mood={mood} look={look} graduado={graduado} className={fit === 'width' ? 'h-auto w-full' : 'h-full w-auto max-w-full'} />
      </span>
    </button>
  );
}

