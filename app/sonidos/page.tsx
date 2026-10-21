'use client';

// Muestrario de música y efectos para que el equipo UEP escuche las opciones y elija.
// Lo elegido aquí queda guardado en este navegador y es lo que suena en el juego.
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { SoundToggle } from '@/components/Talk';
import { Screen } from '@/components/ui';
import {
  getMusicChoice,
  getSfxPack,
  MUSIC_TRACKS,
  playingMusic,
  setMusicChoice,
  setSfxPack,
  SFX_PACKS,
  sfxOf,
  startMusic,
  stopMusic,
  unlockAudio,
  type SfxPack,
  type SfxPackId,
} from '@/lib/sfx';

const MUESTRAS: { label: string; play: (p: SfxPack) => void }[] = [
  { label: 'Correcta', play: (p) => p.correct() },
  { label: 'Racha', play: (p) => p.streak(4) },
  { label: 'Incorrecta', play: (p) => p.wrong() },
  { label: 'Escanear QR', play: (p) => p.scan() },
  { label: 'Últimos segundos', play: (p) => [10, 6, 3].forEach((s, i) => setTimeout(() => p.alarm(s), i * 1000)) },
  { label: 'Se acabó el tiempo', play: (p) => p.timeUp() },
  { label: 'Trivia superada', play: (p) => p.levelUp() },
  { label: 'Graduación', play: (p) => p.graduate() },
  { label: 'Botón', play: (p) => p.tap() },
  { label: 'Voz', play: (p) => [0, 70, 140, 210, 280].forEach((d) => setTimeout(() => p.voice(420), d)) },
];

export default function Sonidos() {
  const [music, setMusic] = useState('ninguna');
  const [pack, setPack] = useState<SfxPackId>('clasico');
  const [playing, setPlaying] = useState<string | null>(null);

  useEffect(() => {
    setMusic(getMusicChoice());
    setPack(getSfxPack());
    return () => stopMusic();
  }, []);

  function toggleTrack(id: string) {
    unlockAudio();
    if (playingMusic() === id) {
      stopMusic();
      setPlaying(null);
    } else {
      startMusic(id);
      setPlaying(id === 'ninguna' ? null : id);
    }
  }

  return (
    <Screen dark className="relative">
      <div className="flex flex-col gap-5 px-4 pb-8 pt-6">
        <div className="pr-14">
          <h1 className="title-display text-[clamp(30px,10vw,40px)] leading-none text-white [text-shadow:0_4px_0_#0E0C4E]">Música y sonidos</h1>
          <p className="mt-2 text-sm font-semibold text-[#DCEBFF]">
            Escucha las opciones y marca la que prefieras. Queda guardada en este teléfono y es la que suena al jugar.
          </p>
        </div>

        <section className="rounded-[20px] bg-white p-4 text-polar-ink">
          <h2 className="text-lg font-extrabold text-polar-navy">Música de fondo</h2>
          <p className="text-[13px] text-polar-muted">Suena mientras respondes la trivia y se acelera en los últimos 10 segundos.</p>
          <ul className="mt-3 flex flex-col gap-2">
            {MUSIC_TRACKS.map((t) => {
              const on = playing === t.id;
              const chosen = music === t.id;
              return (
                <li
                  key={t.id}
                  className={`flex items-center gap-3 rounded-2xl border-[3px] p-2.5 ${chosen ? 'border-polar-blue bg-polar-sky/40' : 'border-[#E3E3E3]'}`}
                >
                  {t.id === 'ninguna' ? (
                    <span className="h-11 w-11 shrink-0" aria-hidden />
                  ) : (
                    <button
                      type="button"
                      onClick={() => toggleTrack(t.id)}
                      aria-label={on ? `Detener ${t.label}` : `Escuchar ${t.label}`}
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white shadow-[0_3px_0_#1E1E1E] active:translate-y-[2px] active:shadow-none ${on ? 'bg-polar-ink' : 'bg-polar-blue'}`}
                    >
                      <PlayIcon stop={on} />
                    </button>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-extrabold leading-tight">{t.label}</p>
                    <p className="text-[13px] leading-snug text-polar-muted">{t.desc}</p>
                  </div>
                  <Choose
                    chosen={chosen}
                    label={t.label}
                    onClick={() => {
                      setMusicChoice(t.id);
                      setMusic(t.id);
                    }}
                  />
                </li>
              );
            })}
          </ul>
        </section>

        <section className="rounded-[20px] bg-white p-4 text-polar-ink">
          <h2 className="text-lg font-extrabold text-polar-navy">Efectos de sonido</h2>
          <p className="text-[13px] text-polar-muted">Toca cada botón para escuchar el efecto con ese estilo.</p>
          <ul className="mt-3 flex flex-col gap-3">
            {SFX_PACKS.map((p) => {
              const chosen = pack === p.id;
              return (
                <li key={p.id} className={`rounded-2xl border-[3px] p-3 ${chosen ? 'border-polar-blue bg-polar-sky/40' : 'border-[#E3E3E3]'}`}>
                  <div className="flex items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-extrabold leading-tight">{p.label}</p>
                      <p className="text-[13px] leading-snug text-polar-muted">{p.desc}</p>
                    </div>
                    <Choose
                      chosen={chosen}
                      label={p.label}
                      onClick={() => {
                        setSfxPack(p.id);
                        setPack(p.id);
                      }}
                    />
                  </div>
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {MUESTRAS.map((m) => (
                      <button
                        key={m.label}
                        type="button"
                        onClick={() => {
                          unlockAudio();
                          m.play(sfxOf(p.id));
                        }}
                        className="rounded-full bg-polar-yellow px-3 py-1.5 text-[13px] font-bold text-polar-navy shadow-game-sm active:translate-y-[2px] active:shadow-none"
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        <Link href="/" className="btn-ghost">Volver</Link>
      </div>
      <SoundToggle className="absolute right-4 top-5 z-40" />
    </Screen>
  );
}

function Choose({ chosen, label, onClick }: { chosen: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={chosen}
      aria-label={chosen ? `${label}: elegida` : `Elegir ${label}`}
      className={`shrink-0 rounded-full px-3 py-2 text-[13px] font-extrabold ${chosen ? 'bg-polar-blue text-white' : 'border-2 border-polar-blue text-polar-blue'}`}
    >
      {chosen ? '✓ Elegida' : 'Elegir'}
    </button>
  );
}

function PlayIcon({ stop }: { stop: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      {stop ? <rect x="6" y="6" width="12" height="12" rx="2" /> : <path d="M8 5v14l11-7z" />}
    </svg>
  );
}
