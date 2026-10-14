import 'server-only';
import { NextResponse } from 'next/server';
import { config } from './config';
import { computeStatus, questionView, toPublic } from './game';
import type { MeResponse, Player } from '@/shared/types';

export function json<T>(data: T, status = 200) {
  return NextResponse.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
}

export function error(message: string, status = 400) {
  return json({ error: message }, status);
}

export function meResponse(p: Player | null): MeResponse {
  return {
    player: p ? toPublic(p) : null,
    status: p ? computeStatus(p) : null,
    question: p ? questionView(p) : null,
    sedes: config.sedes,
    demoTools: config.demoTools,
  };
}
