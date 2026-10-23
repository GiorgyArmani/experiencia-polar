import { NextResponse, type NextRequest } from 'next/server';

// El mismo despliegue sirve los dos subdominios:
//   experienciauep.aulaciete.com  → el juego
//   leaderboarduep.aulaciete.com (o leaderboardpolar.) → directo al ranking (para pantallas en las sedes)
export function middleware(req: NextRequest) {
  const host = req.headers.get('host') ?? '';
  if (/^leaderboard(polar|uep)\./.test(host) && req.nextUrl.pathname === '/') {
    const url = req.nextUrl.clone();
    url.pathname = '/ranking';
    return NextResponse.rewrite(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/'],
};
