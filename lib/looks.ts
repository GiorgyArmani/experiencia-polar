// Looks del oso disponibles. Cada look es un render completo (cabeza + ropa).
// Cuando el artista entregue capas separadas (PNG transparentes), este archivo
// puede pasar a combinar cabeza y ropa libremente.

export type LookId = 'clasico' | 'vinotinto' | 'melena' | 'pelotero';

export interface Look {
  id: LookId;
  head: string;
  body: string;
  src: string;
}

export const LOOKS: Look[] = [
  { id: 'clasico', head: 'Nada', body: 'Azul', src: '/osos/clasico.jpg' },
  { id: 'vinotinto', head: 'Nada', body: 'Vinotinto', src: '/osos/vinotinto.jpg' },
  { id: 'melena', head: 'Melena', body: 'Azul', src: '/osos/melena.jpg' },
  { id: 'pelotero', head: 'Gorra', body: 'Pelotero', src: '/osos/pelotero.jpg' },
];

export const HEADS = ['Nada', 'Melena', 'Gorra'];
export const BODIES = ['Azul', 'Vinotinto', 'Pelotero'];

export const OSO_ESTANDAR = '/osos/clasico.jpg';
export const OSO_GRADUADO = '/osos/graduado.jpg';

export function lookById(id: string | null | undefined): Look {
  return LOOKS.find((l) => l.id === id) ?? LOOKS[0];
}

/**
 * Mueve la cabeza o la ropa en `dir` pasos, quedándose solo en looks que existen.
 * Si la combinación exacta no existe, salta al primer look con esa pieza.
 */
export function stepLook(current: LookId, key: 'head' | 'body', dir: 1 | -1): LookId {
  const list = key === 'head' ? HEADS : BODIES;
  const other = key === 'head' ? 'body' : 'head';
  const cur = lookById(current);
  let i = list.indexOf(cur[key]);
  for (let n = 0; n < list.length; n++) {
    i = (i + dir + list.length) % list.length;
    const same = LOOKS.find((l) => l[key] === list[i] && l[other] === cur[other]);
    const any = LOOKS.find((l) => l[key] === list[i]);
    const pick = same ?? any;
    if (pick) return pick.id;
  }
  return current;
}
