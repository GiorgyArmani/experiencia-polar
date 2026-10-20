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
