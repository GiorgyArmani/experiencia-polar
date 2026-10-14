import { json } from '@/lib/http';
import { clearPlayerCookie } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function POST() {
  clearPlayerCookie();
  return json({ ok: true });
}
