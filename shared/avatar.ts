// Avatar del jugador (una persona, estilo cabezón y redondito): lo comparten el servidor (validación)
// y la web (SVG 2D). Cada opción trae sus colores.

export interface Option {
  id: string;
  label: string;
  color: string;
  accent?: string;
}

export const PIELES = [
  { id: 'clara', label: 'Clara', color: '#FFE2CC', accent: '#F2BFA0' },
  { id: 'rosada', label: 'Rosada', color: '#F9D0B4', accent: '#E8A988' },
  { id: 'triguena', label: 'Trigueña', color: '#E7B186', accent: '#CC8E62' },
  { id: 'morena', label: 'Morena', color: '#C68A5C', accent: '#A66C42' },
  { id: 'canela', label: 'Canela', color: '#9C6542', accent: '#7E4C2E' },
  { id: 'oscura', label: 'Oscura', color: '#6E4630', accent: '#55331F' },
] as const satisfies readonly Option[];

export const PEINADOS = [
  { id: 'corto', label: 'Corto', color: '' },
  { id: 'rapado', label: 'Rapado', color: '' },
  { id: 'rizado', label: 'Rizado', color: '' },
  { id: 'afro', label: 'Afro', color: '' },
  { id: 'cola', label: 'Cola de caballo', color: '' },
  { id: 'mono', label: 'Moño', color: '' },
  { id: 'trenzas', label: 'Trenzas', color: '' },
  { id: 'largo', label: 'Largo', color: '' },
] as const satisfies readonly Option[];

export const PELOS = [
  { id: 'negro', label: 'Negro', color: '#2E2624', accent: '#1B1514' },
  { id: 'castano', label: 'Castaño', color: '#5B3A26', accent: '#412818' },
  { id: 'claro', label: 'Castaño claro', color: '#9A6A3E', accent: '#7A512C' },
  { id: 'rubio', label: 'Rubio', color: '#EAC46E', accent: '#C9A04A' },
  { id: 'pelirrojo', label: 'Pelirrojo', color: '#E07A35', accent: '#BC5D20' },
  { id: 'canoso', label: 'Canoso', color: '#D9D9D9', accent: '#B5B5B5' },
  { id: 'rosado', label: 'Rosado', color: '#F49AB9', accent: '#D97598' },
] as const satisfies readonly Option[];

export const ROPAS = [
  { id: 'azul', label: 'Franela azul', color: '#2A7EEB', accent: '#1B5FBF' },
  { id: 'vinotinto', label: 'Vinotinto', color: '#7A1F2B', accent: '#5A1520' },
  { id: 'pelotero', label: 'Pelotero', color: '#FFFFFF', accent: '#0B2A66' },
  { id: 'chaqueta', label: 'Chaqueta', color: '#FF8D28', accent: '#C9620A' },
  { id: 'bata', label: 'Bata', color: '#F4F4F4', accent: '#9FB3C8' },
  { id: 'liquiliqui', label: 'Liqui liqui', color: '#F3EEDF', accent: '#C9B98F' },
  { id: 'playera', label: 'Camisa playera', color: '#1FB5A8', accent: '#FFD23F' },
  { id: 'vestido', label: 'Vestido de lunares', color: '#E5233B', accent: '#FFFFFF' },
  { id: 'jumper', label: 'Jumper a cuadros', color: '#CDB89A', accent: '#B3263A' },
  { id: 'falda', label: 'Blusa y falda', color: '#F7A8C4', accent: '#2E3A55' },
  { id: 'joropo', label: 'Traje de joropo', color: '#FFFFFF', accent: '#E5233B' },
] as const satisfies readonly Option[];

export const ACCESORIOS = [
  { id: 'nada', label: 'Nada', color: '#000000' },
  { id: 'lentes', label: 'Lentes', color: '#1E1E1E' },
  { id: 'lentes-sol', label: 'Lentes de sol', color: '#1E1E1E', accent: '#FF8D28' },
  { id: 'gorra', label: 'Gorra', color: '#2A7EEB', accent: '#FF8D28' },
  { id: 'gorro', label: 'Gorro de lana', color: '#FF8D28', accent: '#FFFFFF' },
  { id: 'llanero', label: 'Sombrero llanero', color: '#6B4423', accent: '#3E2614' },
  { id: 'cayena', label: 'Flor de cayena', color: '#E5233B', accent: '#FFD23F' },
  { id: 'lazo', label: 'Lazo', color: '#E8476A', accent: '#B8304F' },
  { id: 'audifonos', label: 'Audífonos', color: '#1E1E1E', accent: '#2A7EEB' },
  { id: 'zarcillos', label: 'Zarcillos', color: '#E6B422', accent: '#B8860B' },
  { id: 'cintillo', label: 'Cintillo', color: '#E8476A', accent: '#FFFFFF' },
  { id: 'boina', label: 'Boina', color: '#B3263A', accent: '#8E1B2C' },
] as const satisfies readonly Option[];

export type PielId = (typeof PIELES)[number]['id'];
export type PeinadoId = (typeof PEINADOS)[number]['id'];
export type PeloId = (typeof PELOS)[number]['id'];
export type RopaId = (typeof ROPAS)[number]['id'];
export type AccesorioId = (typeof ACCESORIOS)[number]['id'];

export interface Avatar {
  piel: PielId;
  peinado: PeinadoId;
  pelo: PeloId;
  ropa: RopaId;
  accesorio: AccesorioId;
}

export const AVATAR_PARTS = {
  piel: PIELES,
  peinado: PEINADOS,
  pelo: PELOS,
  ropa: ROPAS,
  accesorio: ACCESORIOS,
} as const;

export type AvatarPart = keyof typeof AVATAR_PARTS;

export const DEFAULT_AVATAR: Avatar = { piel: 'triguena', peinado: 'corto', pelo: 'castano', ropa: 'azul', accesorio: 'nada' };

/** Normaliza lo que venga del cliente o de la BD: cualquier valor desconocido cae al default. */
export function parseAvatar(raw: unknown): Avatar {
  const src = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const pick = <K extends AvatarPart>(k: K): Avatar[K] => {
    const v = src[k];
    const ok = AVATAR_PARTS[k].some((o) => o.id === v);
    return (ok ? v : DEFAULT_AVATAR[k]) as Avatar[K];
  };
  return { piel: pick('piel'), peinado: pick('peinado'), pelo: pick('pelo'), ropa: pick('ropa'), accesorio: pick('accesorio') };
}

export function isValidAvatar(raw: unknown): boolean {
  if (!raw || typeof raw !== 'object') return false;
  const src = raw as Record<string, unknown>;
  return (Object.keys(AVATAR_PARTS) as AvatarPart[]).every((k) => AVATAR_PARTS[k].some((o) => o.id === src[k]));
}

export function optionOf<K extends AvatarPart>(part: K, id: string): Option {
  return AVATAR_PARTS[part].find((o) => o.id === id) ?? AVATAR_PARTS[part][0];
}

/** Avanza `dir` pasos en la lista de opciones de una parte. */
export function stepAvatar(a: Avatar, part: AvatarPart, dir: 1 | -1): Avatar {
  const list = AVATAR_PARTS[part];
  const i = list.findIndex((o) => o.id === a[part]);
  const next = list[(i + dir + list.length) % list.length];
  return { ...a, [part]: next.id };
}

/** Un avatar al azar (botón "Sorpréndeme" del registro). */
export function randomAvatar(): Avatar {
  const any = <K extends AvatarPart>(k: K) => AVATAR_PARTS[k][Math.floor(Math.random() * AVATAR_PARTS[k].length)].id as Avatar[K];
  return { piel: any('piel'), peinado: any('peinado'), pelo: any('pelo'), ropa: any('ropa'), accesorio: any('accesorio') };
}
