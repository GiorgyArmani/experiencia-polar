import { NextResponse } from 'next/server';
import { leerReporte } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    return NextResponse.json(await leerReporte(), { headers: { 'Cache-Control': 'no-store' } });
  } catch (e) {
    console.error('[reporte]', e);
    return NextResponse.json({ error: 'No pudimos leer las respuestas' }, { status: 500 });
  }
}
