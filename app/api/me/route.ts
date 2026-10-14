import { currentPlayer, setPlayerCookie } from '@/lib/session';
import { json, meResponse } from '@/lib/http';

export const dynamic = 'force-dynamic';

export async function GET() {
  const p = await currentPlayer();
  if (p) setPlayerCookie(p.id); // renueva la sesión: nunca caduca mientras siga entrando
  return json(meResponse(p));
}
