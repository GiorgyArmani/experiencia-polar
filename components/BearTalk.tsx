'use client';

// El oso "habla": el globo se escribe letra a letra con la voz 16 bits del oso.
import { useEffect, useState } from 'react';
import { isMuted, onMuteChange, setMuted, sfx, unlockAudio } from '@/lib/sfx';

export function Speech({ text, voice, className = '' }: { text: string; voice: number; className?: string }) {
  const [shown, setShown] = useState(0);

  useEffect(() => {
    setShown(0);
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setShown(i);
      // Un blip cada dos letras (no en espacios) suena a "voz" sin saturar.
      if (i % 2 === 0 && text[i - 1] && text[i - 1] !== ' ') sfx.voice(voice);
      if (i >= text.length) clearInterval(id);
    }, 32);
    return () => clearInterval(id);
  }, [text, voice]);

  return (
    <div
      className={`grid rounded-[18px] border-[3px] border-polar-ink bg-white px-3.5 py-2.5 text-base font-extrabold leading-snug text-polar-ink ${className}`}
      aria-live="polite"
    >
      {/* El texto completo reserva el espacio (invisible); en la misma celda va lo que ya "dijo". */}
      <span className="invisible [grid-area:1/1]">{text}</span>
      <span className="[grid-area:1/1]">{text.slice(0, shown)}</span>
    </div>
  );
}

/** Botón de sonido (se recuerda en el navegador). */
export function SoundToggle({ className = '' }: { className?: string }) {
  const [muted, setM] = useState(false);
  useEffect(() => {
    setM(isMuted());
    return onMuteChange(setM);
  }, []);

  return (
    <button
      type="button"
      onClick={() => {
        unlockAudio();
        setMuted(!muted);
        if (muted) setTimeout(() => sfx.tap(), 30);
      }}
      aria-label={muted ? 'Activar sonido' : 'Silenciar'}
      aria-pressed={!muted}
      className={`flex h-10 w-10 items-center justify-center rounded-full border-[3px] border-polar-ink bg-white text-polar-ink shadow-[0_3px_0_#1E1E1E] active:translate-y-[2px] active:shadow-none ${className}`}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor" />
        {muted ? <path d="M17 9l5 6M22 9l-5 6" /> : <path d="M17 8.5a5 5 0 0 1 0 7M19.5 6a8.5 8.5 0 0 1 0 12" />}
      </svg>
    </button>
  );
}
