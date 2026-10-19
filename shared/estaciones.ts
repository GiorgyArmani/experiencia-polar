// Las 4 estaciones (niveles del mapa), cada una asociada a un servicio de la UEP.
// Lo comparten el servidor y la web (el mapa y los títulos de cada nivel).

export interface Estacion {
  id: number; // 1..4
  nombre: string; // nombre completo del nivel
  corto: string; // etiqueta bajo el nodo del mapa
}

export const ESTACIONES: readonly Estacion[] = [
  { id: 1, nombre: 'Plataforma UEP', corto: 'Plataforma' },
  { id: 2, nombre: 'Biblioteca UEP', corto: 'Biblioteca' },
  { id: 3, nombre: 'Unidad Móvil', corto: 'Unidad Móvil' },
  { id: 4, nombre: 'Líneas educativas', corto: 'Líneas' },
];

export function estacion(id: number | null | undefined): Estacion | undefined {
  return ESTACIONES.find((e) => e.id === id);
}

/** "Nivel 2 · Biblioteca UEP" */
export function nivelLabel(id: number) {
  const e = estacion(id);
  return e ? `Nivel ${id} · ${e.nombre}` : `Nivel ${id}`;
}
