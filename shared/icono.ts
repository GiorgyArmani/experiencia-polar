// Ícono del jugador (reemplaza al avatar, por pedido de la UEP): un símbolo y un color de fondo.
// Lo comparten el servidor (validación) y la web (components/PlayerIcon.tsx dibuja cada símbolo).

export const SIMBOLOS = [
  { id: 'birrete', label: 'Birrete' },
  { id: 'libro', label: 'Libro' },
  { id: 'bombillo', label: 'Bombillo' },
  { id: 'cohete', label: 'Cohete' },
  { id: 'estrella', label: 'Estrella' },
  { id: 'trofeo', label: 'Trofeo' },
  { id: 'rayo', label: 'Rayo' },
  { id: 'corazon', label: 'Corazón' },
  { id: 'nota', label: 'Música' },
  { id: 'sol', label: 'Sol' },
] as const;

export const COLORES = [
  { id: 'azul', label: 'Azul brillante', bg: '#008CFD', fg: '#FFFFFF' },
  { id: 'marino', label: 'Azul rey', bg: '#0351A3', fg: '#FFFFFF' },
  { id: 'indigo', label: 'Índigo', bg: '#0E0C4E', fg: '#FFFFFF' },
  { id: 'acero', label: 'Azul acero', bg: '#4587C5', fg: '#FFFFFF' },
  { id: 'cian', label: 'Cian', bg: '#00C3DA', fg: '#0E0C4E' },
  { id: 'amarillo', label: 'Amarillo', bg: '#FFCC53', fg: '#0E0C4E' },
  { id: 'lima', label: 'Lima', bg: '#DEDE00', fg: '#0E0C4E' },
  { id: 'rojo', label: 'Rojo', bg: '#E5484D', fg: '#FFFFFF' },
] as const;

export type SimboloId = (typeof SIMBOLOS)[number]['id'];
export type ColorId = (typeof COLORES)[number]['id'];

export interface Icono {
  simbolo: SimboloId;
  color: ColorId;
}

export const DEFAULT_ICONO: Icono = { simbolo: 'birrete', color: 'azul' };

const isSimbolo = (v: unknown): v is SimboloId => SIMBOLOS.some((s) => s.id === v);
const isColor = (v: unknown): v is ColorId => COLORES.some((c) => c.id === v);

/**
 * Normaliza lo que venga del cliente o de la BD. Los jugadores que se registraron con el avatar
 * de antes (sin `simbolo`) reciben un ícono fijo calculado de lo que tenían guardado.
 */
export function parseIcono(raw: unknown): Icono {
  const src = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  if (isSimbolo(src.simbolo)) return { simbolo: src.simbolo, color: isColor(src.color) ? src.color : DEFAULT_ICONO.color };
  const seed = [...JSON.stringify(src)].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 7);
  return { simbolo: SIMBOLOS[seed % SIMBOLOS.length].id, color: COLORES[(seed >>> 4) % COLORES.length].id };
}

export function isValidIcono(raw: unknown): boolean {
  if (!raw || typeof raw !== 'object') return false;
  const src = raw as Record<string, unknown>;
  return isSimbolo(src.simbolo) && isColor(src.color);
}

export function colorOf(id: ColorId) {
  return COLORES.find((c) => c.id === id) ?? COLORES[0];
}

export function simboloLabel(id: SimboloId) {
  return SIMBOLOS.find((s) => s.id === id)?.label ?? '';
}
