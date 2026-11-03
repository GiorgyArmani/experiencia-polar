import { leerRespuestas } from '@/lib/db';
import { BANCOS, ESTACIONES } from '@/lib/preguntas';

export const dynamic = 'force-dynamic';

const esc = (v: string | number) => {
  const t = String(v);
  return /[";\n\r]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
};

// Una fila por cada respuesta: qué eligió cada participante en cada pregunta.
// Filtros opcionales: ?localidad=...&estacion=1
export async function GET(req: Request) {
  const params = new URL(req.url).searchParams;
  const localidad = params.get('localidad') ?? '';
  const estacion = Number(params.get('estacion')) || 0;
  try {
    const rows = (await leerRespuestas()).filter((r) => (!localidad || r.localidad === localidad) && (!estacion || r.trivia === estacion));
    const head = ['Cédula', 'Nombre', 'Localidad', 'Estación', 'Pregunta', 'Respuesta elegida', 'Respuesta correcta', 'Acertó', 'Fecha'];
    const nombreEst = new Map<number, string>(ESTACIONES.map((e) => [e.id, `${e.id}. ${e.nombre}`]));
    const lines = rows.map((r) => {
      const p = BANCOS[r.trivia]?.[r.pregunta];
      return [
        r.cedula,
        r.nombre,
        r.localidad,
        nombreEst.get(r.trivia) ?? `Estación ${r.trivia}`,
        p?.text ?? `Pregunta ${r.pregunta + 1}`,
        p?.options[r.opcion] ?? `Opción ${r.opcion + 1}`,
        p ? p.options[p.correct] : '',
        r.correcta ? 'Sí' : 'No',
        new Date(r.at).toLocaleString('es-VE', { timeZone: 'America/Caracas' }),
      ]
        .map(esc)
        .join(';');
    });
    // BOM + punto y coma: Excel en español lo abre directo, con acentos y columnas separadas.
    const body = '﻿' + [head.join(';'), ...lines].join('\r\n');
    return new Response(body, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="respuestas-por-participante.csv"',
        'Cache-Control': 'no-store',
      },
    });
  } catch (e) {
    console.error('[reporte/excel]', e);
    return new Response('No pudimos leer las respuestas', { status: 500 });
  }
}
