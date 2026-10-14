// Lo que dice el oso, en español venezolano neutral (tuteo, sin modismos fuertes ni regionalismos de otros países).
// Te habla por tu nombre y reacciona a lo que pasa, para que se sienta tu compañero.
// `{n}` = tu nombre, `{oso}` = el nombre de tu oso, `{r}` = racha de aciertos.

const POOLS = {
  pregunta: ['¡Tú puedes, {n}!', 'Leamos con calma…', 'Esta me la sé… creo.', 'Confío en ti, {n}.', 'Vamos juntos, {n}.'],
  mirando: ['¿Esa? Mmm…', '¿Seguro, {n}?', 'Interesante elección…', 'Mmm, puede ser…'],
  esperando: ['¡Crucemos los dedos!', 'Ay, ay, ay…', 'No miro, no miro…'],
  acierto: ['¡Sabía que lo sabías!', '¡Eso, {n}!', '¡Qué cerebrito!', '¡Bien hecho!'],
  racha: ['¡{r} seguidas! ¡Imparables!', '¡Racha de {r}, {n}!', '¡Vamos con todo! {r} de {r}'],
  fallo: ['Uy… esa no era.', 'Casi, casi…', 'Ay, se nos escapó.'],
  animo: ['No pasa nada, {n}. ¡La sacamos juntos!', 'Respira. Tú puedes con esta.', 'Yo sigo creyendo en ti, {n}.'],
  apurado: ['¡Rápido, {n}, rápido!', '¡Se nos acaba el tiempo!', '¡Vamos, vamos, vamos!'],
  tiempo: ['¡Uy, se nos acabó el tiempo! Igual lo hicimos muy bien.', '¡Qué carrera, {n}! La próxima vamos más rápido.'],
  superada: ['¡Lo logramos, {n}! Estoy orgulloso.', '¡Somos un gran equipo!', '¡Trivia superada! ¡Choca esos cinco!'],
  escanear: ['¡Busquemos el QR, {n}!', 'Tengo buen olfato para los QR…', '¿Dónde estará el QR? ¡Vamos!'],
  espera: ['Me echo una siesta hasta la próxima… ¡no te olvides de mí!', 'Zzz… avísame cuando abra, {n}.', 'Recargo energía para la próxima.'],
  final: ['¡Nos graduamos, {n}! Gracias por jugar conmigo.', '¡Lo hicimos juntos! Te voy a extrañar.'],
  cosquillas: ['¡Ja, ja, cosquillas!', '¡Epa! ¿Qué pasó?', '¡Aquí estoy, {n}!', '¡Hola, {n}!'],
} as const;

export type Frase = keyof typeof POOLS;

let last = '';

/** Frase al azar del grupo (sin repetir la anterior), con nombre y racha ya puestos. */
export function frase(kind: Frase, vars: { n: string; oso?: string; r?: number }) {
  const pool = POOLS[kind];
  let pick: string = pool[Math.floor(Math.random() * pool.length)];
  if (pool.length > 1 && pick === last) pick = pool[(pool.indexOf(pick as never) + 1) % pool.length];
  last = pick;
  return pick
    .replaceAll('{n}', vars.n)
    .replaceAll('{oso}', vars.oso ?? '')
    .replaceAll('{r}', String(vars.r ?? 0));
}

/** Solo el primer nombre: "María Pérez" → "María". */
export function primerNombre(nombre: string) {
  return nombre.trim().split(/\s+/)[0] ?? '';
}
