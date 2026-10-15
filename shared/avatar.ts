// Avatar del oso: lo comparten el servidor (validación), la web (SVG 2D)
// y la app nativa (modelo 3D low poly). Cada opción trae sus colores.

export interface Option {
  id: string;
  label: string;
  color: string;
  accent?: string;
}

export const PELAJES = [
  { id: 'blanco', label: 'Blanco', color: '#F7FAFC', accent: '#DCE6EE' },
  { id: 'crema', label: 'Crema', color: '#F6EBD9', accent: '#E3D1B4' },
  { id: 'hielo', label: 'Hielo', color: '#E4F1FB', accent: '#BFD8EC' },
] as const satisfies readonly Option[];

export const CABEZAS = [
  { id: 'nada', label: 'Nada', color: '#000000' },
  { id: 'gorra', label: 'Gorra', color: '#2A7EEB', accent: '#FF8D28' },
  { id: 'melena', label: 'Melena', color: '#F2E6D0', accent: '#E0CFAE' },
  { id: 'lazo', label: 'Lazo', color: '#E8476A', accent: '#B8304F' },
  { id: 'gorro', label: 'Gorro de lana', color: '#FF8D28', accent: '#FFFFFF' },
  { id: 'audifonos', label: 'Audífonos', color: '#1E1E1E', accent: '#2A7EEB' },
  { id: 'playa', label: 'Sombrero de playa', color: '#E9C77B', accent: '#E8476A' },
  { id: 'llanero', label: 'Sombrero llanero', color: '#6B4423', accent: '#3E2614' },
  { id: 'tricolor', label: 'Gorra tricolor', color: '#FFD23F', accent: '#1F4FB5' },
  { id: 'cayena', label: 'Flor de cayena', color: '#E5233B', accent: '#FFD23F' },
] as const satisfies readonly Option[];

export const ROPAS = [
  { id: 'azul', label: 'Franela azul', color: '#2A7EEB', accent: '#1B5FBF' },
  { id: 'vinotinto', label: 'Vinotinto', color: '#7A1F2B', accent: '#5A1520' },
  { id: 'pelotero', label: 'Pelotero', color: '#FFFFFF', accent: '#0B2A66' },
  { id: 'chaqueta', label: 'Chaqueta', color: '#FF8D28', accent: '#C9620A' },
  { id: 'bata', label: 'Bata', color: '#F4F4F4', accent: '#9FB3C8' },
  { id: 'liquiliqui', label: 'Liqui liqui', color: '#F3EEDF', accent: '#C9B98F' },
  { id: 'playera', label: 'Camisa playera', color: '#1FB5A8', accent: '#FFD23F' },
] as const satisfies readonly Option[];

export const ACCESORIOS = [
  { id: 'nada', label: 'Nada', color: '#000000' },
  { id: 'lentes', label: 'Lentes', color: '#1E1E1E' },
  { id: 'bufanda', label: 'Bufanda', color: '#E8476A', accent: '#FFFFFF' },
  { id: 'corbatin', label: 'Corbatín', color: '#FF8D28' },
  { id: 'lentes-sol', label: 'Lentes de sol', color: '#1E1E1E', accent: '#FF8D28' },
  { id: 'arepa', label: 'Arepa', color: '#F0D9A0', accent: '#C9913F' },
  { id: 'cuatro', label: 'Cuatro', color: '#C8833B', accent: '#7A4A1F' },
  { id: 'maracas', label: 'Maracas', color: '#E5233B', accent: '#FFD23F' },
] as const satisfies readonly Option[];

export type PelajeId = (typeof PELAJES)[number]['id'];
export type CabezaId = (typeof CABEZAS)[number]['id'];
export type RopaId = (typeof ROPAS)[number]['id'];
export type AccesorioId = (typeof ACCESORIOS)[number]['id'];

export interface Avatar {
  pelaje: PelajeId;
  cabeza: CabezaId;
  ropa: RopaId;
  accesorio: AccesorioId;
}

export const AVATAR_PARTS = {
  pelaje: PELAJES,
  cabeza: CABEZAS,
  ropa: ROPAS,
  accesorio: ACCESORIOS,
} as const;

export type AvatarPart = keyof typeof AVATAR_PARTS;

export const DEFAULT_AVATAR: Avatar = { pelaje: 'blanco', cabeza: 'nada', ropa: 'azul', accesorio: 'nada' };

/** Normaliza lo que venga del cliente o de la BD: cualquier valor desconocido cae al default. */
export function parseAvatar(raw: unknown): Avatar {
  const src = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const pick = <K extends AvatarPart>(k: K): Avatar[K] => {
    const v = src[k];
    const ok = AVATAR_PARTS[k].some((o) => o.id === v);
    return (ok ? v : DEFAULT_AVATAR[k]) as Avatar[K];
  };
  return { pelaje: pick('pelaje'), cabeza: pick('cabeza'), ropa: pick('ropa'), accesorio: pick('accesorio') };
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
