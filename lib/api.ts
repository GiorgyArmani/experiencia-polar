// Llamadas del navegador a las API routes.
import type { Avatar } from '@/shared/avatar';
import type { AnswerResponse, LeaderboardResponse, MeResponse, RegisterResponse } from '@/shared/types';

async function call<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    cache: 'no-store',
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error ?? 'Algo salió mal. Intenta de nuevo.');
  return data as T;
}

export const api = {
  me: () => call<MeResponse>('/api/me'),
  register: (body: {
    nombre: string;
    email: string;
    telefono: string;
    sede?: string;
    sedeCode?: string;
    osoNombre: string;
    avatar: Avatar;
  }) => call<RegisterResponse>('/api/register', { method: 'POST', body: JSON.stringify(body) }),
  scan: (value: string) => call<MeResponse>('/api/scan', { method: 'POST', body: JSON.stringify({ value }) }),
  answer: (option: number, index: number) =>
    call<AnswerResponse>('/api/answer', { method: 'POST', body: JSON.stringify({ option, index }) }),
  leaderboard: (sede?: string) =>
    call<LeaderboardResponse>(`/api/leaderboard${sede ? `?sede=${encodeURIComponent(sede)}` : ''}`),
  skip: () => call<MeResponse>('/api/demo/skip', { method: 'POST' }),
  logout: () => call<{ ok: true }>('/api/logout', { method: 'POST' }),
};
