'use client';

// Portada. El acceso es solo con la cédula (la nómina de UEP ya trae nombre, localidad y estado).
// Primera vez → elige su ícono → instrucciones. Si ya jugó, sigue donde lo dejó.
// Con ?qr=1 viene de escanear el QR sin sesión: al entrar se cumple ese escaneo.
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { qrUrlFor } from '@/shared/qr';
import { Destello } from '@/components/Cargando';
import { Screen } from '@/components/ui';

export default function Inicio() {
  const router = useRouter();
  const [registered, setRegistered] = useState<boolean | null>(null);
  const [cedula, setCedula] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    api
      .me()
      .then((r) => setRegistered(Boolean(r.player)))
      .catch(() => setRegistered(false));
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setError('');
    try {
      const r = await api.login(cedula);
      if (!r.recovered) {
        router.replace('/registro');
        return;
      }
      // Venía de escanear el QR (abierto en otro navegador): se cumple ese escaneo sin volver a buscar el QR.
      const fromQr = new URLSearchParams(window.location.search).has('qr');
      if (fromQr && r.status?.phase === 'scan') {
        const aviso = await api
          .scan(qrUrlFor(window.location.origin))
          .then(() => '')
          .catch((err: Error) => err.message);
        router.replace(aviso ? `/jugar?aviso=${encodeURIComponent(aviso)}` : '/jugar');
        return;
      }
      router.replace('/jugar');
    } catch (err) {
      setError((err as Error).message);
      setSending(false);
    }
  }

  const header = (
    <>
      <Image src="/logos/universidad.png" alt="Universidad Empresas Polar" width={200} height={200} priority className="h-[min(200px,24dvh)] w-auto object-contain" />
      <h1 className="title-display text-[clamp(44px,16vw,64px)] leading-[1.02] text-white [text-shadow:0_5px_0_#0E0C4E]">
        Experiencia
        <br />
        UEP
      </h1>
    </>
  );

  if (registered) {
    return (
      <Screen>
        <Link href="/jugar" className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center" aria-label="Continuar jugando">
          {header}
          <span className="mt-6 text-base font-semibold">Toca para seguir jugando</span>
        </Link>
      </Screen>
    );
  }

  return (
    <Screen>
      <div className="flex flex-1 flex-col items-center justify-center gap-5 px-6 text-center">
        {header}
        {registered === false && (
          <form onSubmit={submit} className="mt-2 flex w-full max-w-[320px] flex-col gap-3">
            <label htmlFor="cedula" className="text-base font-extrabold">
              Escribe tu cédula para entrar
            </label>
            <input
              id="cedula"
              inputMode="numeric"
              autoComplete="off"
              required
              value={cedula}
              onChange={(e) => setCedula(e.target.value)}
              placeholder="12345678"
              className="h-[56px] rounded-full border-[3px] border-white bg-white px-[22px] text-center text-xl font-bold tracking-wider text-polar-ink shadow-input-blue outline-none placeholder:text-[#8A8A8A]"
            />
            {error && (
              <p role="alert" className="rounded-xl bg-polar-ink px-4 py-2 text-sm font-bold text-white">
                {error}
              </p>
            )}
            <button type="submit" disabled={sending} className="btn-game">
              {sending ? (
                <>
                  <Destello size={20} color="#0E0C4E" /> Entrando…
                </>
              ) : (
                'Entrar'
              )}
            </button>
          </form>
        )}
      </div>
    </Screen>
  );
}
