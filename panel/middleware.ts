import { NextResponse, type NextRequest } from 'next/server';
import { COOKIE, tokenDe } from '@/lib/sesion';

// Todo el panel pide la clave (PANEL_PASSWORD), menos la pantalla de entrada. Sin PANEL_PASSWORD queda apagado.
export async function middleware(req: NextRequest) {
  const password = process.env.PANEL_PASSWORD;
  if (!password) return new NextResponse('Panel desactivado: falta PANEL_PASSWORD.', { status: 503 });

  const { pathname } = req.nextUrl;
  if (pathname === '/entrar' || pathname === '/api/entrar') return NextResponse.next();

  if (req.cookies.get(COOKIE)?.value === (await tokenDe(password))) return NextResponse.next();

  if (pathname.startsWith('/api/')) return NextResponse.json({ error: 'Tu sesión expiró. Vuelve a entrar.' }, { status: 401 });
  const url = req.nextUrl.clone();
  url.pathname = '/entrar';
  url.search = '';
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
