// Lo que piensa en voz alta el avatar (que eres tú), en español venezolano neutral
// (sin modismos fuertes ni regionalismos de otros países). Reacciona a lo que pasa en el juego.
// `{n}` = tu primer nombre, `{r}` = racha de aciertos.

const POOLS = {
  pregunta: ['¡Yo puedo con esta!', 'Leamos con calma…', 'Esta me la sé… creo.', 'Concentración…', '¡Vamos con todo!'],
  mirando: ['¿Esa? Mmm…', '¿Será esta?', 'Mmm, puede ser…', 'Déjame pensar…'],
  esperando: ['¡Crucemos los dedos!', 'Ay, ay, ay…', 'No miro, no miro…'],
  acierto: ['¡Lo sabía!', '¡Eso es!', '¡Pan comido!', '¡Bien!'],
  racha: ['¡{r} seguidas! ¡Imparable!', '¡Racha de {r}!', '¡{r} de {r}! ¡Voy con todo!'],
  fallo: ['Uy… esa no era.', 'Casi, casi…', 'Ay, se me escapó.'],
  resta: ['¡Auch! Eso me restó puntos.', 'Uy… a pensar mejor la próxima.', 'Ay, ¡cuidado con la próxima!'],
  apurado: ['¡Rápido, rápido!', '¡Se me acaba el tiempo!', '¡Vamos, vamos, vamos!'],
  tiempo: ['¡Uy, se acabó el tiempo! Igual lo hice muy bien.', '¡Qué carrera! La próxima voy más rápido.'],
  superada: ['¡Lo logré! ¡Qué orgullo!', '¡Trivia superada!', '¡Una menos! ¡Vamos por la siguiente!'],
  escanear: ['¡A buscar el QR!', '¿Dónde estará el QR? ¡Vamos!', 'Tengo buen ojo para los QR…'],
  espera: ['Una pausa hasta la próxima trivia…', 'Zzz… ¡que me avisen cuando abra!', 'Recargo energía para la próxima.'],
  final: ['¡Me gradué! ¡Lo logré!', '¡Las 4 trivias completadas! ¡Qué orgullo!'],
  cosquillas: ['¡Ja, ja, cosquillas!', '¡Epa! ¿Qué pasó?', '¡Je, je!', '¡Aquí estoy!'],
} as const;

export type Frase = keyof typeof POOLS;

let last = '';

/** Frase al azar del grupo (sin repetir la anterior), con nombre y racha ya puestos. */
export function frase(kind: Frase, vars: { n: string; r?: number }) {
  const pool = POOLS[kind];
  let pick: string = pool[Math.floor(Math.random() * pool.length)];
  if (pool.length > 1 && pick === last) pick = pool[(pool.indexOf(pick as never) + 1) % pool.length];
  last = pick;
  return pick
    .replaceAll('{n}', vars.n)
    .replaceAll('{r}', String(vars.r ?? 0));
}

/** Solo el primer nombre: "María Pérez" → "María". */
export function primerNombre(nombre: string) {
  return nombre.trim().split(/\s+/)[0] ?? '';
}
