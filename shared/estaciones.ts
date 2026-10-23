// Las 4 estaciones (niveles del mapa), cada una asociada a un servicio de la UEP.
// Lo comparten el servidor y la web (el mapa y los títulos de cada nivel).

export interface Estacion {
  id: number; // 1..4
  nombre: string; // nombre completo del nivel
  corto: string; // etiqueta bajo el nodo del mapa
  /** Modelo 3D (GLB en public/) que aparece con su animación al escanear el QR de esta estación. */
  modelo?: string;
}

// Modelos 3D de cada estación (public/modelos/). La 4 repite el de la 1 mientras llega el suyo.
const MODELO_UNIVERSIDAD = '/modelos/logo%20universidad%20polar%20FORMULARIO%201.glb';
const MODELO_BIBLIOTECA = '/modelos/logo%20biblioteca%20polar%20FORMULARIO%202.glb';
const MODELO_UNIDAD_MOVIL = '/modelos/logo%20unidad%20movil%20FORMULARIO%203.glb';

export const ESTACIONES: readonly Estacion[] = [
  { id: 1, nombre: 'Universidad Empresas Polar', corto: 'Universidad', modelo: MODELO_UNIVERSIDAD },
  { id: 2, nombre: 'Biblioteca UEP', corto: 'Biblioteca', modelo: MODELO_BIBLIOTECA },
  { id: 3, nombre: 'Unidad Móvil', corto: 'Unidad Móvil', modelo: MODELO_UNIDAD_MOVIL },
  { id: 4, nombre: 'Plataforma UEP', corto: 'Plataforma', modelo: MODELO_UNIVERSIDAD },
];

export function estacion(id: number | null | undefined): Estacion | undefined {
  return ESTACIONES.find((e) => e.id === id);
}

/** "Nivel 2 · Biblioteca UEP" */
export function nivelLabel(id: number) {
  const e = estacion(id);
  return e ? `Nivel ${id} · ${e.nombre}` : `Nivel ${id}`;
}
