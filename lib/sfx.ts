// Sonidos y música en el navegador (Web Audio): efectos generados en código y la pista de la UEP (public/music/).
// Hay varios paquetes de efectos y varias pistas de música para elegir (ver /sonidos); la elección,
// el volumen y el silencio se recuerdan en el navegador.

type Wave = OscillatorType;

const MUTE_KEY = 'polar_mute';
const VOLUME_KEY = 'polar_volume';
const PACK_KEY = 'polar_sfx_pack';
const MUSIC_KEY = 'polar_music_v3'; // v3: la música por defecto pasó a la pista oficial de la UEP
let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let musicBus: GainNode | null = null;
let noise: AudioBuffer | null = null;
// Volumen general: los parlantes de teléfono son débiles; los volúmenes de cada sonido son relativos a este.
const MASTER_VOLUME = 2.6;
// La música va más baja que los efectos para que estos se distingan.
const MUSIC_LEVEL = 0.4;
let muted = readMuted();
// Volumen elegido por el jugador (0 a 1); 1 = el volumen máximo de siempre.
let volume = readVolume();
const listeners = new Set<(m: boolean) => void>();
const volumeListeners = new Set<(v: number) => void>();

function readMuted() {
  try {
    return typeof window !== 'undefined' && window.localStorage.getItem(MUTE_KEY) === '1';
  } catch {
    return false;
  }
}

function readVolume() {
  try {
    const v = typeof window !== 'undefined' ? parseFloat(window.localStorage.getItem(VOLUME_KEY) ?? '') : NaN;
    return Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : 1;
  } catch {
    return 1;
  }
}

// El oído percibe el volumen de forma logarítmica: con la curva al cuadrado el deslizador se siente parejo.
function masterGain() {
  return MASTER_VOLUME * volume * volume;
}

function audio(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = masterGain();
    master.connect(ctx.destination);
    musicBus = ctx.createGain();
    musicBus.gain.value = muted ? 0 : MUSIC_LEVEL;
    musicBus.connect(master);
    // Ruido blanco (platillos, maracas, redoblante): se genera una sola vez.
    noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const data = noise.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  }
  // iOS/Chrome arrancan el audio suspendido hasta el primer toque.
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

/**
 * Desbloquea el audio. Los navegadores móviles solo lo permiten dentro de un gesto "real"
 * (touchend / click / keydown; pointerdown NO cuenta en iOS ni en Chrome Android).
 */
export function unlockAudio() {
  if (typeof window === 'undefined') return;
  // iOS 17+: que suene aunque el iPhone tenga el interruptor de silencio (como un video).
  const nav = navigator as Navigator & { audioSession?: { type: string } };
  if (nav.audioSession) {
    try {
      nav.audioSession.type = 'playback';
    } catch {}
  }
  const ac = audio();
  if (!ac) return;
  // Un sonido vacío dentro del gesto termina de "despertar" el audio en Safari.
  const buffer = ac.createBuffer(1, 1, 22050);
  const src = ac.createBufferSource();
  src.buffer = buffer;
  src.connect(ac.destination);
  src.start(0);
}

// Desbloqueo automático en el primer toque de cualquier pantalla (se quita cuando el audio ya corre).
if (typeof window !== 'undefined') {
  const events = ['touchend', 'click', 'keydown'] as const;
  const onGesture = () => {
    unlockAudio();
    if (ctx?.state === 'running') events.forEach((e) => window.removeEventListener(e, onGesture, true));
  };
  events.forEach((e) => window.addEventListener(e, onGesture, true));
}

export function isMuted() {
  return muted;
}

export function setMuted(m: boolean) {
  muted = m;
  try {
    window.localStorage.setItem(MUTE_KEY, m ? '1' : '0');
  } catch {}
  if (musicBus && ctx) musicBus.gain.setValueAtTime(m ? 0 : MUSIC_LEVEL, ctx.currentTime);
  listeners.forEach((l) => l(m));
}

export function onMuteChange(l: (m: boolean) => void) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

export function getVolume() {
  return volume;
}

/** Volumen de 0 a 1 (se recuerda en el navegador). */
export function setVolume(v: number) {
  volume = Math.min(1, Math.max(0, v));
  try {
    window.localStorage.setItem(VOLUME_KEY, String(volume));
  } catch {}
  if (master && ctx) master.gain.setValueAtTime(masterGain(), ctx.currentTime);
  volumeListeners.forEach((l) => l(volume));
}

export function onVolumeChange(l: (v: number) => void) {
  volumeListeners.add(l);
  return () => {
    volumeListeners.delete(l);
  };
}

/* ───────────────────────── Síntesis ───────────────────────── */

/**
 * Envolventes:
 *   chip  → corta y seca, como un chip de consola (16 bits).
 *   pluck → ataque inmediato y caída exponencial (marimba, campana, cuerda pulsada).
 *   soft  → entra y sale suave (colchones, notas largas, metales).
 */
type Env = 'chip' | 'pluck' | 'soft';

interface Tone {
  wave?: Wave;
  vol?: number;
  env?: Env;
  /** Filtro pasa bajos (Hz): suaviza ondas ásperas como la de sierra (metales). */
  lowpass?: number;
  /** Segunda onda una octava arriba, más baja: da brillo de marimba o campana. */
  octave?: number;
  /** Desafinación en cents. */
  detune?: number;
}

function voice(ac: AudioContext, out: AudioNode, freq: number, t: number, dur: number, o: Tone) {
  const { wave = 'square', vol = 0.06, env = 'chip', lowpass, octave, detune } = o;
  const gain = ac.createGain();
  gain.gain.setValueAtTime(0, t);
  if (env === 'chip') {
    gain.gain.linearRampToValueAtTime(vol, t + 0.005);
    gain.gain.setValueAtTime(vol, t + dur * 0.7);
    gain.gain.linearRampToValueAtTime(0, t + dur);
  } else if (env === 'pluck') {
    gain.gain.linearRampToValueAtTime(vol, t + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.0008, t + dur);
  } else {
    gain.gain.linearRampToValueAtTime(vol, t + Math.min(0.08, dur * 0.3));
    gain.gain.setValueAtTime(vol, t + dur * 0.6);
    gain.gain.linearRampToValueAtTime(0, t + dur);
  }
  let dest: AudioNode = gain;
  if (lowpass) {
    const f = ac.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = lowpass;
    gain.connect(f);
    dest = f;
  }
  dest.connect(out);
  const oscs: [number, number][] = octave ? [[freq, 1], [freq * 2, octave]] : [[freq, 1]];
  for (const [f, level] of oscs) {
    const osc = ac.createOscillator();
    osc.type = wave;
    osc.frequency.setValueAtTime(f, t);
    if (detune) osc.detune.setValueAtTime(detune, t);
    if (level === 1) osc.connect(gain);
    else {
      const g = ac.createGain();
      g.gain.value = level;
      osc.connect(g).connect(gain);
    }
    osc.start(t);
    osc.stop(t + dur + 0.03);
  }
}

/** Golpe de ruido filtrado: platillo, maraca, redoblante o tic de reloj. */
function hit(ac: AudioContext, out: AudioNode, t: number, dur: number, type: BiquadFilterType, freq: number, vol: number) {
  if (!noise) return;
  const src = ac.createBufferSource();
  src.buffer = noise;
  const f = ac.createBiquadFilter();
  f.type = type;
  f.frequency.value = freq;
  const g = ac.createGain();
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  src.connect(f).connect(g).connect(out);
  src.start(t, Math.random() * 0.5);
  src.stop(t + dur + 0.02);
}

/** Bombo: un seno que cae rápido de tono. */
function kick(ac: AudioContext, out: AudioNode, t: number, vol: number) {
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.frequency.setValueAtTime(140, t);
  osc.frequency.exponentialRampToValueAtTime(45, t + 0.14);
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
  osc.connect(g).connect(out);
  osc.start(t);
  osc.stop(t + 0.2);
}

type Note = [freq: number, dur: number, wave?: Wave, vol?: number];

/** Toca una secuencia de notas (freq 0 = silencio). `tone` es el timbre por defecto. */
function play(notes: Note[], gap = 0, tone: Tone = {}) {
  if (muted || volume === 0) return;
  const ac = audio();
  if (!ac) return;
  let t = ac.currentTime + 0.01;
  for (const [freq, dur, wave, vol] of notes) {
    if (freq > 0) voice(ac, master ?? ac.destination, freq, t, dur, { ...tone, wave: wave ?? tone.wave, vol: vol ?? tone.vol });
    t += dur + gap;
  }
}

/** Acorde: varias notas a la vez. */
function chord(freqs: number[], dur: number, tone: Tone) {
  if (muted || volume === 0) return;
  const ac = audio();
  if (!ac) return;
  const t = ac.currentTime + 0.01;
  for (const f of freqs) voice(ac, master ?? ac.destination, f, t, dur, tone);
}

/** Barrido de frecuencia (para "bwomp", saltos, etc.). */
function sweep(from: number, to: number, dur: number, wave: Wave = 'square', vol = 0.06) {
  if (muted || volume === 0) return;
  const ac = audio();
  if (!ac) return;
  const t = ac.currentTime + 0.01;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = wave;
  osc.frequency.setValueAtTime(from, t);
  osc.frequency.exponentialRampToValueAtTime(to, t + dur);
  gain.gain.setValueAtTime(vol, t);
  gain.gain.linearRampToValueAtTime(0, t + dur);
  osc.connect(gain).connect(master ?? ac.destination);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

/** Golpe de ruido suelto (tic de reloj, clic) fuera de la música. */
function tick(freq: number, dur: number, vol: number) {
  if (muted || volume === 0) return;
  const ac = audio();
  if (!ac) return;
  hit(ac, master ?? ac.destination, ac.currentTime + 0.01, dur, 'bandpass', freq, vol);
}

// Notas (Hz)
const N = {
  A3: 220,
  C4: 261.6, D4: 293.7, E4: 329.6, F4: 349.2, G4: 392, A4: 440, B4: 493.9,
  C5: 523.3, D5: 587.3, E5: 659.3, F5: 698.5, G5: 784, A5: 880, B5: 987.8,
  C6: 1046.5, E6: 1318.5, G6: 1568, C7: 2093,
};

/* ───────────────────────── Paquetes de efectos ───────────────────────── */

export interface SfxPack {
  /** Tocar una opción / botón. */
  tap: () => void;
  /** Pasar el dedo por una opción. */
  hover: () => void;
  /** QR leído. */
  scan: () => void;
  /** Respuesta correcta. */
  correct: () => void;
  /** Racha de aciertos: sube según la racha. */
  streak: (n: number) => void;
  /** Respuesta incorrecta. */
  wrong: () => void;
  /** Ánimo después de fallar. */
  cheer: () => void;
  /** Trivia superada. */
  levelUp: () => void;
  /** Graduación. */
  graduate: () => void;
  /** Alarma de los últimos 10 segundos (una vez por segundo). */
  alarm: (secsLeft: number) => void;
  /** Se acabó el tiempo. */
  timeUp: () => void;
  /** Risita al tocar el avatar. */
  giggle: () => void;
  /** Bostezo / pausa hasta la próxima trivia. */
  yawn: () => void;
  /** Bloqueado / todavía no abre. */
  nope: () => void;
  /** "Voz" del avatar al hablar: un blip con tono propio. */
  voice: (pitch: number) => void;
}

/** 16 bits: ondas cuadradas y triangulares, como una consola clásica (el sonido original). */
const CLASICO: SfxPack = {
  tap: () => play([[N.A5, 0.04, 'square', 0.035]]),
  hover: () => play([[N.E5, 0.03, 'triangle', 0.04]]),
  scan: () => play([[N.C6, 0.06], [N.G6, 0.09]], 0.02),
  correct: () => play([[N.B5, 0.07], [N.E6, 0.22]]),
  streak: (n) => {
    const base = [N.C5, N.E5, N.G5, N.C6, N.E6, N.G6];
    play(base.slice(0, Math.min(base.length, n + 2)).map((f) => [f, 0.06, 'square', 0.05] as Note));
  },
  // Un "bwomp" suave, nada castigador.
  wrong: () => {
    sweep(392, 196, 0.18, 'square', 0.05);
    setTimeout(() => sweep(330, 147, 0.28, 'triangle', 0.07), 190);
  },
  cheer: () => play([[N.G4, 0.08, 'triangle', 0.07], [N.C5, 0.08, 'triangle', 0.07], [N.E5, 0.14, 'triangle', 0.07]], 0.01),
  levelUp: () =>
    play(
      [
        [N.C5, 0.1], [N.C5, 0.1], [N.C5, 0.1], [N.C5, 0.3],
        [N.A4, 0.3], [N.B4, 0.3], [N.C5, 0.12], [0, 0.06], [N.B4, 0.1], [N.C5, 0.5],
      ],
      0.015,
    ),
  graduate: () =>
    play(
      [
        [N.G4, 0.12], [N.C5, 0.12], [N.E5, 0.12], [N.G5, 0.3], [N.E5, 0.12], [N.G5, 0.5],
        [0, 0.08], [N.A5, 0.12], [N.G5, 0.12], [N.E5, 0.12], [N.C6, 0.6],
      ],
      0.02,
    ),
  // "Bip-bip" desde los 10 s y alarma de reloj despertador (más rápida y aguda) en los últimos 5.
  alarm: (secsLeft) => {
    if (secsLeft > 5) return play([[N.A5, 0.07, 'square', 0.045], [0, 0.05], [N.A5, 0.07, 'square', 0.045]]);
    const bip: Note = [secsLeft <= 2 ? N.E6 : N.C6, 0.06, 'square', 0.06];
    play([bip, bip, bip, bip], 0.035);
  },
  timeUp: () => play([[N.G5, 0.12], [N.E5, 0.12], [N.C5, 0.12], [N.G4, 0.4]], 0.02),
  giggle: () => play([[N.E6, 0.05, 'square', 0.04], [N.C6, 0.05, 'square', 0.04], [N.E6, 0.05, 'square', 0.04], [N.G6, 0.09, 'square', 0.04]], 0.02),
  yawn: () => sweep(523, 262, 0.6, 'triangle', 0.06),
  nope: () => play([[N.E4, 0.08], [N.C4, 0.14]], 0.03),
  voice: (pitch) => play([[pitch * (0.94 + Math.random() * 0.12), 0.035, 'square', 0.025]]),
};

/** Marimba: tonos redondos de madera y campanita, suaves y cálidos. Nada estridente. */
const mar: Tone = { wave: 'sine', env: 'pluck', vol: 0.11, octave: 0.25 };
const MARIMBA: SfxPack = {
  tap: () => play([[N.G5, 0.12]], 0, { ...mar, vol: 0.07 }),
  hover: () => play([[N.D5, 0.1]], 0, { ...mar, vol: 0.05 }),
  scan: () => play([[N.C5, 0.18], [N.G5, 0.3]], 0.01, mar),
  correct: () => play([[N.E5, 0.16], [N.A5, 0.16], [N.C6, 0.5]], 0, mar),
  streak: (n) => {
    const base = [N.C5, N.E5, N.G5, N.C6, N.E6, N.G6];
    play(base.slice(0, Math.min(base.length, n + 2)).map((f) => [f, 0.14] as Note), 0, mar);
  },
  wrong: () => play([[N.D4, 0.3], [N.A3, 0.6]], 0.02, { ...mar, vol: 0.13, octave: 0.1 }),
  cheer: () => play([[N.C5, 0.14], [N.E5, 0.14], [N.G5, 0.4]], 0, mar),
  levelUp: () => {
    play([[N.C5, 0.14], [N.E5, 0.14], [N.G5, 0.14], [N.C6, 0.14], [N.E6, 0.14], [N.G6, 0.8]], 0, mar);
    setTimeout(() => chord([N.C5, N.E5, N.G5], 1.2, { ...mar, vol: 0.06 }), 700);
  },
  graduate: () => {
    play(
      [
        [N.G4, 0.2], [N.C5, 0.2], [N.E5, 0.2], [N.G5, 0.4], [N.E5, 0.2], [N.G5, 0.6],
        [N.A5, 0.2], [N.G5, 0.2], [N.E5, 0.2], [N.C6, 1.2],
      ],
      0.02,
      mar,
    );
    setTimeout(() => chord([N.C5, N.E5, N.G5, N.C6], 1.6, { ...mar, vol: 0.06 }), 2900);
  },
  // Toc de bloque de madera; en los últimos 5 s, doble y más agudo.
  alarm: (secsLeft) => {
    const wood: Tone = { wave: 'sine', env: 'pluck', vol: 0.13 };
    if (secsLeft > 5) return play([[N.C6, 0.08]], 0, wood);
    const f = secsLeft <= 2 ? N.G6 : N.E6;
    play([[f, 0.07], [f, 0.07]], 0.08, wood);
  },
  timeUp: () => play([[N.G5, 0.2], [N.E5, 0.2], [N.C5, 0.2], [N.G4, 0.8]], 0.02, mar),
  giggle: () => play([[N.E6, 0.08], [N.C6, 0.08], [N.E6, 0.08], [N.G6, 0.2]], 0.01, { ...mar, vol: 0.06 }),
  yawn: () => play([[N.G5, 0.25], [N.E5, 0.25], [N.C5, 0.6]], 0.04, { ...mar, vol: 0.07 }),
  nope: () => play([[N.E4, 0.16], [N.C4, 0.3]], 0.02, mar),
  voice: (pitch) => play([[pitch * 1.6 * (0.94 + Math.random() * 0.12), 0.06]], 0, { wave: 'sine', env: 'pluck', vol: 0.035 }),
};

/** Concurso de TV: campana brillante al acertar, zumbador al fallar y fanfarria de metales. */
const bell: Tone = { wave: 'sine', env: 'pluck', vol: 0.1, octave: 0.45 };
const brass: Tone = { wave: 'sawtooth', env: 'soft', vol: 0.05, lowpass: 2200 };
const buzz: Tone = { wave: 'sawtooth', env: 'chip', vol: 0.05, lowpass: 1400 };
const CONCURSO: SfxPack = {
  tap: () => tick(3200, 0.04, 0.35),
  hover: () => play([[N.C6, 0.06]], 0, { ...bell, vol: 0.035, octave: 0 }),
  scan: () => play([[N.E6, 0.25], [N.C7, 0.5]], 0.02, bell),
  correct: () => play([[N.C6, 0.4], [N.E6, 0.7]], 0.04, bell),
  streak: (n) => {
    const base = [N.C6, N.E6, N.G6, N.C7];
    play(base.slice(0, Math.min(base.length, n + 1)).map((f) => [f, 0.22] as Note), 0, bell);
  },
  // Zumbador: dos ondas de sierra casi iguales que "baten" entre sí.
  wrong: () => chord([110, 116.5], 0.55, buzz),
  cheer: () => play([[N.G5, 0.12], [N.C6, 0.3]], 0.02, bell),
  levelUp: () => {
    play([[N.G4, 0.12], [N.C5, 0.12], [N.E5, 0.12], [N.G5, 0.3], [N.E5, 0.12], [N.G5, 0.6]], 0.02, brass);
    setTimeout(() => chord([N.C4, N.E4, N.G4, N.C5], 0.9, { ...brass, vol: 0.03 }), 1000);
  },
  graduate: () => {
    play(
      [
        [N.C5, 0.15], [N.C5, 0.15], [N.C5, 0.15], [N.G5, 0.6], [0, 0.05], [N.F5, 0.15], [N.E5, 0.15],
        [N.D5, 0.15], [N.C6, 0.6], [N.G5, 0.4], [0, 0.05], [N.F5, 0.15], [N.E5, 0.15], [N.F5, 0.15], [N.D5, 0.8],
      ],
      0.02,
      brass,
    );
    setTimeout(() => chord([N.C4, N.G4, N.C5, N.E5], 1.4, { ...brass, vol: 0.03 }), 3700);
  },
  // Tic-tac de reloj; en los últimos 5 s se agrega un pitido.
  alarm: (secsLeft) => {
    tick(secsLeft % 2 ? 2600 : 1900, 0.05, 0.6);
    if (secsLeft <= 5) play([[secsLeft <= 2 ? N.C7 : N.G6, 0.1]], 0, { ...bell, octave: 0 });
  },
  timeUp: () => chord([98, 103.8], 1.1, buzz),
  giggle: () => play([[N.G6, 0.08], [N.E6, 0.08], [N.G6, 0.08], [N.C7, 0.18]], 0.01, { ...bell, vol: 0.05 }),
  yawn: () => play([[N.E5, 0.3], [N.C5, 0.5]], 0.04, { ...brass, vol: 0.035 }),
  nope: () => chord([147, 155.6], 0.25, buzz),
  voice: (pitch) => play([[pitch * (0.94 + Math.random() * 0.12), 0.04, 'triangle', 0.035]]),
};

export const SFX_PACKS = [
  { id: 'clasico', label: '16 bits (elegido por la UEP)', desc: 'Sonidos de consola clásica, alegres y "pixelados".', pack: CLASICO },
  { id: 'marimba', label: 'Marimba', desc: 'Madera y campanitas: suave, cálido y tropical.', pack: MARIMBA },
  { id: 'concurso', label: 'Concurso de TV', desc: 'Campana al acertar, zumbador al fallar y fanfarria de metales.', pack: CONCURSO },
] as const;

export type SfxPackId = (typeof SFX_PACKS)[number]['id'];
const DEFAULT_PACK: SfxPackId = 'clasico';

function readChoice<T extends string>(key: string, ids: readonly string[], fallback: T): T {
  try {
    const v = typeof window !== 'undefined' ? window.localStorage.getItem(key) : null;
    return v !== null && ids.includes(v) ? (v as T) : fallback;
  } catch {
    return fallback;
  }
}

function saveChoice(key: string, v: string) {
  try {
    window.localStorage.setItem(key, v);
  } catch {}
}

let packId: SfxPackId = readChoice(PACK_KEY, SFX_PACKS.map((p) => p.id), DEFAULT_PACK);

export function getSfxPack() {
  return packId;
}

/** Elige el paquete de efectos del juego (se recuerda en el navegador). */
export function setSfxPack(id: SfxPackId) {
  packId = id;
  saveChoice(PACK_KEY, id);
}

/** Los efectos de un paquete en particular (para probarlos en /sonidos). */
export function sfxOf(id: SfxPackId): SfxPack {
  return (SFX_PACKS.find((p) => p.id === id) ?? SFX_PACKS[0]).pack;
}

/** Efectos del juego: siempre suenan con el paquete elegido. */
export const sfx: SfxPack = {
  tap: () => sfxOf(packId).tap(),
  hover: () => sfxOf(packId).hover(),
  scan: () => sfxOf(packId).scan(),
  correct: () => sfxOf(packId).correct(),
  streak: (n) => sfxOf(packId).streak(n),
  wrong: () => sfxOf(packId).wrong(),
  cheer: () => sfxOf(packId).cheer(),
  levelUp: () => sfxOf(packId).levelUp(),
  graduate: () => sfxOf(packId).graduate(),
  alarm: (s) => sfxOf(packId).alarm(s),
  timeUp: () => sfxOf(packId).timeUp(),
  giggle: () => sfxOf(packId).giggle(),
  yawn: () => sfxOf(packId).yawn(),
  nope: () => sfxOf(packId).nope(),
  voice: (p) => sfxOf(packId).voice(p),
};

/** Tono de voz estable por jugador (según su apodo): entre ~300 y ~600 Hz. */
export function voiceFor(name: string) {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return 300 + (h % 300);
}

/* ───────────────────────── Música ─────────────────────────
 * Pistas cortas en bucle, escritas como partitura: cada compás tiene 16 casillas (semicorcheas).
 * Una nota ("E5", "Bb4", o "F4+A4+C5" para un acorde) empieza en su casilla y dura hasta la
 * siguiente casilla que no sea "-". "." es silencio. En la batería, "x" es un golpe.
 */

interface Instrument extends Tone {
  /** Fracción de la duración escrita que suena (< 1 = staccato; > 1 deja sonar la cola de la marimba). */
  gate?: number;
}

type Drum = 'kick' | 'snare' | 'hat' | 'shaker' | 'wood';

interface Track {
  id: string;
  label: string;
  desc: string;
  bpm: number;
  parts: { inst: Instrument; bars: string[] }[];
  drums: Partial<Record<Drum, string[]>>;
}

const MUSIC: Track[] = [
  {
    id: 'aventura',
    label: 'Aventura 16 bits',
    desc: 'Alegre y movida, estilo videojuego clásico.',
    bpm: 132,
    parts: [
      {
        inst: { wave: 'square', env: 'chip', vol: 0.045, gate: 0.85 },
        bars: [
          'E5 - G5 - C6 - G5 - E5 - G5 - A5 - G5 -',
          'A5 - - - E5 - A5 - C6 - B5 - A5 - E5 -',
          'F5 - A5 - C6 - A5 - F5 - G5 - A5 - C6 -',
          'B5 - - - G5 - - - D6 - C6 - B5 - G5 -',
        ],
      },
      {
        inst: { wave: 'triangle', env: 'chip', vol: 0.12, gate: 0.8 },
        bars: [
          'C3 - C4 - C3 - C4 - C3 - C4 - C3 - C4 -',
          'A2 - A3 - A2 - A3 - A2 - A3 - A2 - A3 -',
          'F2 - F3 - F2 - F3 - F2 - F3 - F2 - F3 -',
          'G2 - G3 - G2 - G3 - G2 - G3 - G2 - G3 -',
        ],
      },
    ],
    drums: {
      kick: ['x . . . x . . . x . . . x . . .'],
      snare: ['. . . . x . . . . . . . x . . .'],
      hat: ['. . x . . . x . . . x . . . x .'],
    },
  },
  {
    id: 'caribe',
    label: 'Caribe',
    desc: 'Marimba y clave: tropical, relajada y con sabor.',
    bpm: 112,
    parts: [
      {
        inst: { wave: 'sine', env: 'pluck', vol: 0.1, octave: 0.25, gate: 2.5 },
        bars: [
          'A5 . . C6 . . A5 . F5 . G5 . A5 . . .',
          'Bb5 . . D6 . . Bb5 . G5 . A5 . Bb5 . . .',
          'C6 . . E6 . . C6 . G5 . A5 . Bb5 . C6 .',
          'A5 . . F5 . . C5 . F5 . . . . . . .',
        ],
      },
      {
        inst: { wave: 'sine', env: 'pluck', vol: 0.05, octave: 0.2, gate: 2 },
        bars: [
          '. . F4+A4+C5 . . . F4+A4+C5 . . . F4+A4+C5 . . . F4+A4+C5 .',
          '. . F4+Bb4+D5 . . . F4+Bb4+D5 . . . F4+Bb4+D5 . . . F4+Bb4+D5 .',
          '. . E4+G4+C5 . . . E4+G4+C5 . . . E4+G4+Bb4 . . . E4+G4+Bb4 .',
          '. . F4+A4+C5 . . . F4+A4+C5 . . . F4+A4+C5 . . . F4+A4+C5 .',
        ],
      },
      {
        inst: { wave: 'sine', env: 'pluck', vol: 0.2, gate: 1.5 },
        bars: [
          'F2 . . C3 . . F2 . . . F2 . C3 . . .',
          'Bb2 . . F2 . . Bb2 . . . Bb2 . F2 . . .',
          'C3 . . G2 . . C3 . . . C3 . G2 . . .',
          'F2 . . C3 . . F2 . . . F2 . C3 . . .',
        ],
      },
    ],
    drums: {
      wood: ['x . . x . . x . . . x . x . . .'],
      shaker: ['x . x . x . x . x . x . x . x .'],
      kick: ['x . . . . . . . x . . . . . . .'],
    },
  },
  {
    id: 'concentracion',
    label: 'Concentración',
    desc: 'Tranquila, para pensar sin presión.',
    bpm: 92,
    parts: [
      {
        inst: { wave: 'triangle', env: 'pluck', vol: 0.1, gate: 3 },
        bars: [
          'A4 . E5 . A5 . C6 . B5 . A5 . E5 . C5 .',
          'F4 . C5 . F5 . A5 . G5 . F5 . C5 . A4 .',
          'E4 . G4 . C5 . E5 . D5 . C5 . G4 . E4 .',
          'D4 . G4 . B4 . D5 . B4 . G4 . D5 . B4 .',
        ],
      },
      {
        inst: { wave: 'sine', env: 'soft', vol: 0.13 },
        bars: [
          'A2 - - - - - - - - - - - - - - -',
          'F2 - - - - - - - - - - - - - - -',
          'C3 - - - - - - - - - - - - - - -',
          'G2 - - - - - - - - - - - - - - -',
        ],
      },
    ],
    drums: {
      kick: ['x . . . . . . . x . . . . . . .'],
      hat: ['. . . . x . . . . . . . x . . .'],
    },
  },
  {
    id: 'contrarreloj',
    label: 'Contrarreloj',
    desc: 'Tensa y rápida: se siente la presión del reloj.',
    bpm: 150,
    parts: [
      {
        inst: { wave: 'square', env: 'chip', vol: 0.04, gate: 0.6 },
        bars: [
          'D5 . . D5 . . F5 . A5 . . . G5 . F5 .',
          'F5 . . F5 . . D5 . Bb4 . . . C5 . D5 .',
          'E5 . . E5 . . G5 . C6 . . . Bb5 . A5 .',
          'A5 . . . E5 . . . C#5 . . . E5 . A5 .',
        ],
      },
      {
        inst: { wave: 'square', env: 'chip', vol: 0.05, lowpass: 900, gate: 0.7 },
        bars: [
          'D2 . D3 . D2 . D3 . D2 . D3 . D2 . D3 .',
          'Bb1 . Bb2 . Bb1 . Bb2 . Bb1 . Bb2 . Bb1 . Bb2 .',
          'C2 . C3 . C2 . C3 . C2 . C3 . C2 . C3 .',
          'A1 . A2 . A1 . A2 . A1 . A2 . A1 . A2 .',
        ],
      },
    ],
    drums: {
      kick: ['x . . . x . . . x . . . x . x .'],
      snare: ['. . . . x . . . . . . . x . . .'],
      hat: ['x x x x x x x x x x x x x x x x'],
    },
  },
];

// Pistas grabadas (archivos en public/music/): se descargan y decodifican una vez y suenan en bucle
// por el mismo canal que la música generada, así respetan el volumen y el silencio.
const FILE_TRACKS: { id: string; label: string; desc: string; url: string; gain: number }[] = [
  { id: 'uep', label: 'Música UEP', desc: 'La pista oficial que envió la UEP.', url: '/music/musica-uep.mp3', gain: 0.75 },
];

export const MUSIC_TRACKS: readonly { id: string; label: string; desc: string }[] = [
  { id: 'ninguna', label: 'Sin música', desc: 'Solo efectos de sonido (como hasta ahora).' },
  ...FILE_TRACKS.map(({ id, label, desc }) => ({ id, label, desc })),
  ...MUSIC.map(({ id, label, desc }) => ({ id, label, desc })),
];
// La UEP envió su propia pista (2026-10-23); antes sonaba «Aventura 16 bits».
const DEFAULT_MUSIC = 'uep';

// Una canción grabada también sube de tono al acelerarse: se acelera la mitad que la música generada.
const fileRate = (t: number) => 1 + (t - 1) / 2;

const decoded = new Map<string, Promise<AudioBuffer | null>>();

/** Descarga y decodifica una pista grabada (una sola vez). Se guarda en mono para gastar la mitad de memoria. */
function loadFileTrack(id: string): Promise<AudioBuffer | null> {
  const t = FILE_TRACKS.find((f) => f.id === id);
  const ac = audio();
  if (!t || !ac) return Promise.resolve(null);
  let p = decoded.get(id);
  if (!p) {
    p = fetch(t.url)
      .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(new Error(String(r.status)))))
      // Forma con callbacks: la de promesa no existe en Safari viejos.
      .then((data) => new Promise<AudioBuffer>((ok, fail) => ac.decodeAudioData(data, ok, fail)))
      .then((buf) => {
        if (buf.numberOfChannels === 1) return buf;
        const mono = ac.createBuffer(1, buf.length, buf.sampleRate);
        const out = mono.getChannelData(0);
        const chans = Array.from({ length: buf.numberOfChannels }, (_, c) => buf.getChannelData(c));
        for (let i = 0; i < out.length; i++) {
          let sum = 0;
          for (const ch of chans) sum += ch[i];
          out[i] = sum / chans.length;
        }
        return mono;
      })
      .catch(() => {
        decoded.delete(id); // que se pueda reintentar
        return null;
      });
    decoded.set(id, p);
  }
  return p;
}

/** Adelanta la descarga de la música elegida (p. ej. mientras se ve el mapa), para que suene sin espera. */
export function preloadMusic(id: string = musicId) {
  if (FILE_TRACKS.some((f) => f.id === id)) void loadFileTrack(id);
}

let musicId: string = readChoice(MUSIC_KEY, MUSIC_TRACKS.map((t) => t.id), DEFAULT_MUSIC);

export function getMusicChoice() {
  return musicId;
}

/** Elige la música del juego (suena durante las trivias; se recuerda en el navegador). */
export function setMusicChoice(id: string) {
  musicId = id;
  saveChoice(MUSIC_KEY, id);
}

const SEMI: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

/** "Bb4" → Hz */
function hz(name: string) {
  const m = /^([A-G])(#|b)?(\d)$/.exec(name);
  if (!m) return 0;
  const midi = 12 * (Number(m[3]) + 1) + SEMI[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
  return 440 * 2 ** ((midi - 69) / 12);
}

const tokensOf = (bars: string[]) => bars.flatMap((b) => b.trim().split(/\s+/));

interface Ev {
  len: number; // en casillas
  freqs: number[];
}

interface Compiled {
  bpm: number;
  steps: number;
  parts: { inst: Instrument; evs: Map<number, Ev> }[];
  drums: Partial<Record<Drum, Set<number>>>;
}

/** Partitura → eventos por casilla. */
function compile(t: Track): Compiled {
  const steps = Math.max(...t.parts.map((p) => p.bars.length)) * 16;
  const parts = t.parts.map((p) => {
    const tokens = tokensOf(p.bars);
    const evs = new Map<number, Ev>();
    tokens.forEach((tok, i) => {
      if (tok === '-' || tok === '.') return;
      let len = 1;
      while (tokens[i + len] === '-') len++;
      evs.set(i, { len, freqs: tok.split('+').map(hz) });
    });
    return { inst: p.inst, evs };
  });
  const drums: Compiled['drums'] = {};
  for (const [k, bars] of Object.entries(t.drums) as [Drum, string[]][]) {
    const tokens = tokensOf(bars);
    const set = new Set<number>();
    // Un patrón de batería más corto que la pista se repite.
    for (let s = 0; s < steps; s++) if (tokens[s % tokens.length] === 'x') set.add(s);
    drums[k] = set;
  }
  return { bpm: t.bpm, steps, parts, drums };
}

let seq: { id: string; stop: () => void; source?: AudioBufferSourceNode } | null = null;
let tempo = 1;

/** Arranca una pista en bucle (si ya suena esa misma, no hace nada). Sin argumento: la elegida. */
export function startMusic(id: string = musicId) {
  if (seq?.id === id) return;
  stopMusic();
  const file = FILE_TRACKS.find((f) => f.id === id);
  if (file) {
    const ac = audio();
    if (!ac || !musicBus) return;
    const bus = musicBus;
    let stopped = false;
    const me: NonNullable<typeof seq> = {
      id,
      stop: () => {
        stopped = true;
        try {
          me.source?.stop();
        } catch {}
        me.source?.disconnect();
      },
    };
    seq = me;
    loadFileTrack(id).then((buf) => {
      if (!buf || stopped) return;
      const src = ac.createBufferSource();
      src.buffer = buf;
      src.loop = true;
      src.playbackRate.value = fileRate(tempo);
      const g = ac.createGain();
      g.gain.setValueAtTime(0, ac.currentTime);
      g.gain.linearRampToValueAtTime(file.gain, ac.currentTime + 0.4); // entrada suave
      src.connect(g).connect(bus);
      src.start();
      me.source = src;
    });
    return;
  }
  const t = MUSIC.find((m) => m.id === id);
  const ac = audio();
  if (!t || !ac || !musicBus) return;
  const track = compile(t);
  const bus = musicBus;
  let step = 0;
  let next = ac.currentTime + 0.08;
  // Programa con anticipación las notas de los próximos 120 ms (el temporizador de JS no es preciso).
  const schedule = () => {
    const stepDur = 60 / (track.bpm * tempo) / 4;
    while (next < ac.currentTime + 0.12) {
      const st = step % track.steps;
      for (const p of track.parts) {
        const ev = p.evs.get(st);
        if (!ev) continue;
        const dur = Math.max(0.05, ev.len * stepDur * (p.inst.gate ?? 0.9));
        for (const f of ev.freqs) if (f) voice(ac, bus, f, next, dur, p.inst);
      }
      const d = track.drums;
      if (d.kick?.has(st)) kick(ac, bus, next, 0.5);
      if (d.snare?.has(st)) hit(ac, bus, next, 0.12, 'highpass', 1800, 0.28);
      if (d.hat?.has(st)) hit(ac, bus, next, 0.03, 'highpass', 7000, 0.12);
      if (d.shaker?.has(st)) hit(ac, bus, next, 0.05, 'bandpass', 5500, st % 4 === 2 ? 0.22 : 0.12);
      if (d.wood?.has(st)) voice(ac, bus, 1650, next, 0.06, { wave: 'sine', env: 'pluck', vol: 0.12 });
      next += stepDur;
      step++;
    }
  };
  schedule();
  const timer = setInterval(schedule, 25);
  seq = { id, stop: () => clearInterval(timer) };
}

export function stopMusic() {
  if (!seq) return;
  seq.stop();
  seq = null;
}

export function playingMusic() {
  return seq?.id ?? null;
}

/** Acelera la música (p. ej. 1.15 en los últimos segundos de la trivia). */
export function setMusicTempo(t: number) {
  tempo = t;
  if (seq?.source && ctx) seq.source.playbackRate.setValueAtTime(fileRate(t), ctx.currentTime);
}
