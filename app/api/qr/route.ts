// Onboarding: la app escanea el QR antes de registrarse y pregunta de qué sede es.
import { sedeCodeFromQr } from '@/shared/qr';
import type { QrResponse } from '@/shared/types';
import { sedeByCode } from '@/lib/config';
import { error, json } from '@/lib/http';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const { value } = (await req.json().catch(() => ({}))) as { value?: string };
  const sede = sedeByCode(typeof value === 'string' ? sedeCodeFromQr(value) : null);
  if (!sede) return error('Ese no es un QR de la Experiencia Polar', 404);
  const res: QrResponse = { sede };
  return json(res);
}
