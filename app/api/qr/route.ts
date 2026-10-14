// Onboarding: la app escanea el QR antes de registrarse. Si es el de la experiencia,
// devuelve las sedes para que el jugador elija la suya.
import { isExperienceQr } from '@/shared/qr';
import type { QrResponse } from '@/shared/types';
import { config } from '@/lib/config';
import { error, json } from '@/lib/http';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const { value } = (await req.json().catch(() => ({}))) as { value?: string };
  if (typeof value !== 'string' || !isExperienceQr(value)) return error('Ese no es un QR de la Experiencia Polar', 404);
  const res: QrResponse = { sedes: config.sedes };
  return json(res);
}
