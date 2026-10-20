import { NextResponse, type NextRequest } from 'next/server';

// Todo el panel pide clave: usuario "uep" + PANEL_PASSWORD. Sin PANEL_PASSWORD el panel queda apagado.
export function middleware(req: NextRequest) {
  const password = process.env.PANEL_PASSWORD;
  if (!password) return new NextResponse('Panel desactivado: falta PANEL_PASSWORD.', { status: 503 });
  const [scheme, encoded] = (req.headers.get('authorization') ?? '').split(' ');
  if (scheme === 'Basic' && encoded) {
    try {
      const [user, ...rest] = atob(encoded).split(':');
      if (user === 'uep' && rest.join(':') === password) return NextResponse.next();
    } catch {
      // credenciales mal formadas: se vuelven a pedir
    }
  }
  return new NextResponse('Se necesita la clave del panel.', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="Panel Experiencia UEP", charset="UTF-8"' },
  });
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
