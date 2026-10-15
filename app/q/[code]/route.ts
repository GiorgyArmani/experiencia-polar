// Destino del QR impreso (el mismo en todas las sedes): <APP_URL>/q/POLAR
// Escanearlo con la cámara del teléfono dispara el siguiente paso del jugador:
//   · Sin sesión en este navegador → portada (/?qr=1): registrarse o entrar con la cédula
//   · Registrado  → abre la trivia disponible y entra a /jugar (si no hay, /jugar muestra el aviso)
import { NextResponse } from 'next/server';
import { QR_CODE } from '@/shared/qr';
import { scanQr } from '@/lib/game';
import { currentPlayer } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function GET(req: Request, { params }: { params: { code: string } }) {
  const to = (path: string) => NextResponse.redirect(new URL(path, req.url), 303);
  if (params.code.toUpperCase() !== QR_CODE) return to('/');

  const p = await currentPlayer();
  if (!p) return to('/?qr=1');

  const r = await scanQr(p);
  return to(r.ok ? '/jugar' : `/jugar?aviso=${encodeURIComponent(r.error)}`);
}
