// Estado global mínimo: la respuesta de /api/me y el borrador del onboarding.
import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
import { DEFAULT_AVATAR, type Avatar } from '@shared/avatar';
import type { MeResponse, Sede } from '@shared/types';
import { api, loadToken, saveToken } from './api';

export interface Draft {
  scanned: boolean; // ya escaneó el QR de la experiencia (primer escaneo = onboarding)
  sedes: Sede[]; // opciones que devuelve /api/qr
  sede: Sede | null; // la elige el jugador en "Tus datos"
  avatar: Avatar;
  osoNombre: string;
}

interface Session {
  me: MeResponse | null;
  /** hora del servidor − hora del teléfono (ms), para los contadores. */
  offset: number;
  draft: Draft;
  setDraft: (patch: Partial<Draft>) => void;
  apply: (r: MeResponse) => void;
  boot: () => Promise<MeResponse>;
  refresh: () => Promise<MeResponse>;
  signIn: (token: string, r: MeResponse) => Promise<void>;
  signOut: () => Promise<void>;
}

const Ctx = createContext<Session | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [me, setMe] = useState<MeResponse | null>(null);
  const [offset, setOffset] = useState(0);
  const [draft, setDraftState] = useState<Draft>({
    scanned: false,
    sedes: [],
    sede: null,
    avatar: DEFAULT_AVATAR,
    osoNombre: '',
  });
  const booted = useRef(false);

  const apply = useCallback((r: MeResponse) => {
    if (r.status) setOffset(new Date(r.status.serverNow).getTime() - Date.now());
    setMe(r);
  }, []);

  const refresh = useCallback(async () => {
    const r = await api.me();
    apply(r);
    return r;
  }, [apply]);

  const boot = useCallback(async () => {
    if (!booted.current) {
      booted.current = true;
      await loadToken();
    }
    return refresh();
  }, [refresh]);

  const signIn = useCallback(
    async (token: string, r: MeResponse) => {
      await saveToken(token);
      apply(r);
    },
    [apply],
  );

  const signOut = useCallback(async () => {
    await saveToken(null);
    setMe(null);
  }, []);

  const setDraft = useCallback((patch: Partial<Draft>) => setDraftState((d) => ({ ...d, ...patch })), []);

  const value = useMemo(
    () => ({ me, offset, draft, setDraft, apply, boot, refresh, signIn, signOut }),
    [me, offset, draft, setDraft, apply, boot, refresh, signIn, signOut],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSession() {
  const s = useContext(Ctx);
  if (!s) throw new Error('useSession fuera de SessionProvider');
  return s;
}
