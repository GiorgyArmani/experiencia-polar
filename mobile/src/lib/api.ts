// Cliente de la API (el servidor Next.js). Autenticación: `Authorization: Bearer <token>`.
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import type { Avatar } from '@shared/avatar';
import type { AnswerResponse, LeaderboardResponse, MeResponse, QrResponse, RegisterResponse } from '@shared/types';

// EXPO_PUBLIC_API_URL (p. ej. http://192.168.1.10:3000 en desarrollo) tiene prioridad sobre app.json → extra.apiUrl.
const BASE = (process.env.EXPO_PUBLIC_API_URL ?? (Constants.expoConfig?.extra?.apiUrl as string) ?? '').replace(/\/$/, '');
const TOKEN_KEY = 'polar_token';

let token: string | null = null;

export async function loadToken() {
  token = await SecureStore.getItemAsync(TOKEN_KEY);
  return token;
}

export async function saveToken(t: string | null) {
  token = t;
  if (t) await SecureStore.setItemAsync(TOKEN_KEY, t);
  else await SecureStore.deleteItemAsync(TOKEN_KEY);
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

async function call<T>(path: string, body?: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      method: body === undefined ? 'GET' : 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError('Sin conexión. Revisa tu internet.', 0);
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError((data as { error?: string }).error ?? 'Algo salió mal. Intenta de nuevo.', res.status);
  return data as T;
}

export const api = {
  me: () => call<MeResponse>('/api/me'),
  qr: (value: string) => call<QrResponse>('/api/qr', { value }),
  register: (body: { nombre: string; email: string; telefono: string; sedeCode: string; osoNombre: string; avatar: Avatar }) =>
    call<RegisterResponse>('/api/register', body),
  scan: (value: string) => call<MeResponse>('/api/scan', { value }),
  answer: (option: number, index: number) => call<AnswerResponse>('/api/answer', { option, index }),
  leaderboard: () => call<LeaderboardResponse>('/api/leaderboard'),
  skip: () => call<MeResponse>('/api/demo/skip', {}),
};
