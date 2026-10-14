// El QR solo (sin afiche), generado con el dominio de APP_URL (así nunca queda desfasado).
//   /qr/imagen                    → SVG (imprenta)
//   /qr/imagen?format=png&size=N  → PNG de N px (defecto 2048)
// El afiche para imprimir está en /qr.
import QRCode from 'qrcode';
import { QR_INK, qrUrlFor } from '@/shared/qr';
import { config } from '@/lib/config';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const params = new URL(req.url).searchParams;
  const url = qrUrlFor(config.appUrl);
  const opts = { errorCorrectionLevel: 'H' as const, margin: 4, color: { dark: QR_INK, light: '#FFFFFF' } };
  const download = params.has('download') ? 'attachment' : 'inline';

  if (params.get('format') === 'png') {
    const width = Math.min(4096, Math.max(256, Number(params.get('size')) || 2048));
    const png = await QRCode.toBuffer(url, { ...opts, width });
    return new Response(new Uint8Array(png), {
      headers: { 'Content-Type': 'image/png', 'Content-Disposition': `${download}; filename="qr-polar.png"` },
    });
  }
  const svg = await QRCode.toString(url, { ...opts, type: 'svg' });
  return new Response(svg, {
    headers: { 'Content-Type': 'image/svg+xml', 'Content-Disposition': `${download}; filename="qr-polar.svg"` },
  });
}
