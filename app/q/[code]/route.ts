// Destino del QR impreso (el mismo en todas las sedes): <APP_URL>/q/POLAR
// Escanearlo con la cámara del teléfono SOLO sirve para entrar a la app:
//   · Sin sesión en este navegador → portada: entrar con la cédula
//   · Registrado → /jugar (la cámara del juego). Los niveles se abren escaneando el QR desde el juego,
//     así se ve el modelo 3D de la estación.
import { QR_CODE } from '@/shared/qr';
import { currentPlayer } from '@/lib/session';

export const dynamic = 'force-dynamic';

// Redirección relativa: detrás del proxy (Docker/Dokploy) req.url trae el host interno
// (localhost / 0.0.0.0), así que el navegador se queda en el dominio con el que escaneó.
const to = (path: string) => new Response(null, { status: 303, headers: { Location: path } });

export async function GET(_req: Request, { params }: { params: { code: string } }) {
  if (params.code.toUpperCase() !== QR_CODE) return to('/');

  const p = await currentPlayer();
  return to(p ? '/jugar' : '/');
}
