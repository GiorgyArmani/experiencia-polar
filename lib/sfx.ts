// Sonidos 16 bits generados en el navegador (Web Audio): ondas cuadradas/triangulares como una consola clásica.
// Sin archivos que descargar. El volumen es bajo a propósito y se puede silenciar (se recuerda en el navegador).

type Wave = OscillatorType;
type Note = [freq: number, dur: number, wave?: Wave, vol?: number];

const MUTE_KEY = 'polar_mute';
let ctx: AudioContext | null = null;
let master: GainNode | null = null;
// Volumen general: los parlantes de teléfono son débiles; los volúmenes de cada sonido son relativos a este.
const MASTER_VOLUME = 2.6;
let muted = readMuted();
const listeners = new Set<(m: boolean) => void>();

function readMuted() {
  try {
    return typeof window !== 'undefined' && window.localStorage.getItem(MUTE_KEY) === '1';
  } catch {
    return false;
  }
}

function audio(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = MASTER_VOLUME;
    master.connect(ctx.destination);
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
  listeners.forEach((l) => l(m));
}

export function onMuteChange(l: (m: boolean) => void) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

/** Toca una secuencia de notas (freq 0 = silencio). */
function play(notes: Note[], gap = 0) {
  if (muted) return;
  const ac = audio();
  if (!ac) return;
  let t = ac.currentTime + 0.01;
  for (const [freq, dur, wave = 'square', vol = 0.06] of notes) {
    if (freq > 0) {
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.type = wave;
      osc.frequency.setValueAtTime(freq, t);
      // Envolvente corta y seca, como un chip de sonido.
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(vol, t + 0.005);
      gain.gain.setValueAtTime(vol, t + dur * 0.7);
      gain.gain.linearRampToValueAtTime(0, t + dur);
      osc.connect(gain).connect(master ?? ac.destination);
      osc.start(t);
      osc.stop(t + dur + 0.02);
    }
    t += dur + gap;
  }
}

/** Barrido de frecuencia (para "bwomp", saltos, etc.). */
function sweep(from: number, to: number, dur: number, wave: Wave = 'square', vol = 0.06) {
  if (muted) return;
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

// Notas (Hz)
const N = {
  C4: 261.6, E4: 329.6, G4: 392, A4: 440, B4: 493.9,
  C5: 523.3, D5: 587.3, E5: 659.3, F5: 698.5, G5: 784, A5: 880, B5: 987.8,
  C6: 1046.5, E6: 1318.5, G6: 1568,
};

export const sfx = {
  /** Tocar una opción / botón. */
  tap: () => play([[N.A5, 0.04, 'square', 0.035]]),
  /** El oso mira una opción. */
  hover: () => play([[N.E5, 0.03, 'triangle', 0.04]]),
  /** QR leído. */
  scan: () => play([[N.C6, 0.06], [N.G6, 0.09]], 0.02),
  /** Respuesta correcta: moneda. */
  correct: () => play([[N.B5, 0.07], [N.E6, 0.22]]),
  /** Racha de aciertos: arpegio que sube según la racha. */
  streak: (n: number) => {
    const base = [N.C5, N.E5, N.G5, N.C6, N.E6, N.G6];
    play(base.slice(0, Math.min(base.length, n + 2)).map((f) => [f, 0.06, 'square', 0.05] as Note));
  },
  /** Respuesta incorrecta: un "bwomp" suave, nada castigador. */
  wrong: () => {
    sweep(392, 196, 0.18, 'square', 0.05);
    setTimeout(() => sweep(330, 147, 0.28, 'triangle', 0.07), 190);
  },
  /** El oso te anima después de fallar. */
  cheer: () => play([[N.G4, 0.08, 'triangle', 0.07], [N.C5, 0.08, 'triangle', 0.07], [N.E5, 0.14, 'triangle', 0.07]], 0.01),
  /** Trivia superada: fanfarria. */
  levelUp: () =>
    play(
      [
        [N.C5, 0.1], [N.C5, 0.1], [N.C5, 0.1], [N.C5, 0.3],
        [N.A4, 0.3], [N.B4, 0.3], [N.C5, 0.12], [0, 0.06], [N.B4, 0.1], [N.C5, 0.5],
      ],
      0.015,
    ),
  /** Graduación: melodía más larga. */
  graduate: () =>
    play(
      [
        [N.G4, 0.12], [N.C5, 0.12], [N.E5, 0.12], [N.G5, 0.3], [N.E5, 0.12], [N.G5, 0.5],
        [0, 0.08], [N.A5, 0.12], [N.G5, 0.12], [N.E5, 0.12], [N.C6, 0.6],
      ],
      0.02,
    ),
  /** Tic-tac de los últimos segundos (más agudo cuanto menos queda). */
  tick: (secsLeft: number) => play([[secsLeft <= 2 ? N.C6 : N.G5, 0.05, 'square', 0.05]]),
  /** Se acabó el tiempo. */
  timeUp: () => play([[N.G5, 0.12], [N.E5, 0.12], [N.C5, 0.12], [N.G4, 0.4]], 0.02),
  /** Risita al tocar al oso. */
  giggle: () => play([[N.E6, 0.05, 'square', 0.04], [N.C6, 0.05, 'square', 0.04], [N.E6, 0.05, 'square', 0.04], [N.G6, 0.09, 'square', 0.04]], 0.02),
  /** Bostezo / siesta. */
  yawn: () => sweep(523, 262, 0.6, 'triangle', 0.06),
  /** Bloqueado / todavía no abre. */
  nope: () => play([[N.E4, 0.08], [N.C4, 0.14]], 0.03),
  /** "Voz" del oso al hablar: un blip con tono propio de cada oso. */
  voice: (pitch: number) => play([[pitch * (0.94 + Math.random() * 0.12), 0.035, 'square', 0.025]]),
};

/** Tono de voz estable por oso (según su nombre): entre ~300 y ~600 Hz. */
export function voiceFor(name: string) {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return 300 + (h % 300);
}
