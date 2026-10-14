import { isExperienceQr } from '@/shared/qr';
import { scanQr } from '@/lib/game';
import { error, json, meResponse } from '@/lib/http';
import { currentPlayer } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const p = await currentPlayer();
  if (!p) return error('Regístrate primero', 401);

  const { value } = (await req.json().catch(() => ({}))) as { value?: string };
  if (typeof value !== 'string' || !isExperienceQr(value)) return error('Ese no es un QR de la Experiencia Polar');

  const r = await scanQr(p);
  return r.ok ? json(meResponse(r.player)) : error(r.error, r.status);
}
