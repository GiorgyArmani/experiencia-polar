import { currentPlayer } from '@/lib/session';
import { json, meResponse } from '@/lib/http';

export const dynamic = 'force-dynamic';

export async function GET() {
  const p = await currentPlayer();
  return json(meResponse(p));
}
