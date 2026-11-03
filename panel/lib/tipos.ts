// Lo que el panel muestra de cada participante (leído de la tabla `players` del juego).
export interface Fila {
  cedula: string;
  nombre: string;
  localidad: string;
  estado: string | null;
  puntos: number;
  tiempoMs: number;
  niveles: number;
  terminado: boolean;
  ultimoNivelAt: string | null;
  registradoAt: string;
}

export interface Datos {
  rows: Fila[];
  totalNiveles: number;
  generadoAt: string;
}

// Una respuesta de un participante (tabla `answers` del juego, con los datos del jugador).
export interface Respuesta {
  cedula: string;
  nombre: string;
  localidad: string;
  trivia: number; // estación 1..4
  pregunta: number; // índice en el banco de la estación (lib/preguntas.ts)
  opcion: number; // índice de la opción que eligió
  correcta: boolean;
  at: string;
}

/** Cuántas veces se eligió cada opción de cada pregunta, por localidad (lo que necesitan los gráficos). */
export interface Conteo {
  localidad: string;
  trivia: number;
  pregunta: number;
  opcion: number;
  n: number;
}

export interface DatosReporte {
  conteos: Conteo[];
  /** Personas distintas que respondieron al menos una pregunta, por localidad. */
  participantes: Record<string, number>;
  generadoAt: string;
}
