// Destino del QR impreso (el mismo en todas las sedes): <APP_URL>/q/POLAR
// Escanearlo con la cámara del teléfono SOLO sirve para entrar a la app:
//   · Sin sesión en este navegador → portada: entrar con la cédula
//   · Registrado → /jugar (la cámara del juego). Los niveles se abren escaneando el QR desde el juego,
//     así se ve el modelo 3D de la estación.
import { NextResponse } from 'next/server';
import { QR_CODE } from '@/shared/qr';
import { currentPlayer } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function GET(req: Request, { params }: { params: { code: string } }) {
  const to = (path: string) => NextResponse.redirect(new URL(path, req.url), 303);
  if (params.code.toUpperCase() !== QR_CODE) return to('/');

  const p = await currentPlayer();
  return to(p ? '/jugar' : '/');
}
