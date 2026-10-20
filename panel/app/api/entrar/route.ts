import { NextResponse } from 'next/server';
import { COOKIE, MAX_AGE, tokenDe } from '@/lib/sesion';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const password = process.env.PANEL_PASSWORD;
  const { clave } = (await req.json().catch(() => ({}))) as { clave?: unknown };
  if (!password || typeof clave !== 'string' || clave !== password) {
    // Pequeña pausa para que no se pueda probar claves a toda velocidad.
    await new Promise((ok) => setTimeout(ok, 800));
    return NextResponse.json({ error: 'Clave incorrecta' }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, await tokenDe(password), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: MAX_AGE,
  });
  return res;
}
