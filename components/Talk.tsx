'use client';

// El avatar "habla": el globo se escribe letra a letra con una voz 16 bits.
import { useEffect, useRef, useState } from 'react';
import { getVolume, isMuted, onMuteChange, onVolumeChange, setMuted, setVolume, sfx, unlockAudio } from '@/lib/sfx';

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

function SpeakerIcon({ silent, low }: { silent: boolean; low?: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor" />
      {silent ? (
        <path d="M17 9l5 6M22 9l-5 6" />
      ) : low ? (
        <path d="M17 8.5a5 5 0 0 1 0 7" />
      ) : (
        <path d="M17 8.5a5 5 0 0 1 0 7M19.5 6a8.5 8.5 0 0 1 0 12" />
      )}
    </svg>
  );
}

const roundBtn =
  'flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-[3px] border-polar-ink bg-white text-polar-ink shadow-[0_3px_0_#1E1E1E] active:translate-y-[2px] active:shadow-none';

/** Control de sonido: tocar abre el volumen y el botón de silenciar (se recuerda en el navegador). */
export function SoundToggle({ className = '' }: { className?: string }) {
  const [muted, setM] = useState(false);
  const [volume, setV] = useState(1);
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const lastPreview = useRef(0);

  useEffect(() => {
    setM(isMuted());
    setV(getVolume());
    const offMute = onMuteChange(setM);
    const offVolume = onVolumeChange(setV);
    return () => {
      offMute();
      offVolume();
    };
  }, []);

  // Se cierra al tocar fuera del panel.
  useEffect(() => {
    if (!open) return;
    const close = (e: PointerEvent) => {
      if (!box.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener('pointerdown', close, true);
    return () => window.removeEventListener('pointerdown', close, true);
  }, [open]);

  const silent = muted || volume === 0;

  return (
    <div ref={box} className={`flex flex-col items-end gap-2 ${className}`}>
      <button
        type="button"
        onClick={() => {
          unlockAudio();
          setOpen(!open);
        }}
        aria-label="Sonido"
        aria-expanded={open}
        className={roundBtn}
      >
        <SpeakerIcon silent={silent} low={volume < 0.5} />
      </button>
      {open && (
        <div className="flex items-center gap-3 rounded-full border-[3px] border-polar-ink bg-white py-1 pl-1 pr-4 shadow-[0_3px_0_#1E1E1E]">
          <button
            type="button"
            onClick={() => {
              setMuted(!muted);
              if (muted) setTimeout(() => sfx.tap(), 30);
            }}
            aria-label={muted ? 'Activar sonido' : 'Silenciar'}
            aria-pressed={muted}
            className={`${roundBtn} h-9 w-9 shadow-none ${muted ? 'bg-polar-ink text-white' : ''}`}
          >
            <SpeakerIcon silent={silent} low={volume < 0.5} />
          </button>
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={Math.round((muted ? 0 : volume) * 100)}
            onChange={(e) => {
              if (muted) setMuted(false);
              setVolume(Number(e.target.value) / 100);
              // Un toquecito de muestra mientras se arrastra, sin saturar.
              const now = Date.now();
              if (now - lastPreview.current > 120) {
                lastPreview.current = now;
                sfx.tap();
              }
            }}
            aria-label="Volumen"
            className="h-2 w-36 cursor-pointer accent-polar-ink"
          />
        </div>
      )}
    </div>
  );
}
