import { NextResponse, type NextRequest } from 'next/server';

// El mismo despliegue sirve los dos subdominios:
//   experienciapolar.aulaciete.com  → el juego
//   leaderboardpolar.aulaciete.com  → directo al ranking (para pantallas en las sedes)
export function middleware(req: NextRequest) {
  const host = req.headers.get('host') ?? '';
  if (host.startsWith('leaderboardpolar.') && req.nextUrl.pathname === '/') {
    const url = req.nextUrl.clone();
    url.pathname = '/ranking';
    return NextResponse.rewrite(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/'],
};
