// Archivos para que el QR (https://experienciapolar.aulaciete.com/q/...) abra la app nativa directo.
// next.config.mjs reescribe /.well-known/<file> → /api/well-known/<file>.
//   APPLE_TEAM_ID       → apple-app-site-association (iOS universal links)
//   ANDROID_SHA256_CERT → assetlinks.json (Android app links), huella SHA-256 del certificado de firma de EAS
import { json } from '@/lib/http';

export const dynamic = 'force-dynamic';

const BUNDLE = 'com.aulaciete.experienciapolar';

export async function GET(_req: Request, { params }: { params: { file: string } }) {
  if (params.file === 'apple-app-site-association') {
    const team = process.env.APPLE_TEAM_ID;
    if (!team) return json({ error: 'APPLE_TEAM_ID no configurado' }, 404);
    return json({ applinks: { details: [{ appIDs: [`${team}.${BUNDLE}`], components: [{ '/': '/q/*' }] }] } });
  }
  if (params.file === 'assetlinks.json') {
    const sha = process.env.ANDROID_SHA256_CERT;
    if (!sha) return json([], 404);
    return json([
      {
        relation: ['delegate_permission/common.handle_all_urls'],
        target: { namespace: 'android_app', package_name: BUNDLE, sha256_cert_fingerprints: [sha] },
      },
    ]);
  }
  return json({ error: 'No encontrado' }, 404);
}
