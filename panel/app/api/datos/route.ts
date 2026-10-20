import { NextResponse } from 'next/server';
import { leerDatos } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    return NextResponse.json(await leerDatos(), { headers: { 'Cache-Control': 'no-store' } });
  } catch (e) {
    console.error('[datos]', e);
    return NextResponse.json({ error: 'No pudimos leer la base de datos' }, { status: 500 });
  }
}
