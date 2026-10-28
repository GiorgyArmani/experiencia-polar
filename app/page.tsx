'use client';

// Portada. El acceso es solo con la cédula (la nómina de UEP ya trae nombre, localidad y estado).
// Primera vez → elige su ícono → instrucciones. Si ya jugó, sigue donde lo dejó.
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Destello } from '@/components/Cargando';
import { Screen } from '@/components/ui';
import { OtraCedula } from '@/components/OtraCedula';

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
      router.replace('/jugar');
    } catch (err) {
      setError((err as Error).message);
      setSending(false);
    }
  }

  const header = (
    <>
      <Image src="/logos/uep.svg" alt="Universidad Empresas Polar" width={190} height={184} priority className="h-[min(190px,24dvh)] w-auto object-contain" />
      <h1 className="title-display text-[clamp(48px,min(17vw,9dvh),72px)] leading-[0.98] text-polar-navy">
        Experiencia
        <br />
        <span className="text-polar-steel">UEP</span>
      </h1>
    </>
  );

  if (registered) {
    return (
      <Screen portada>
        <Link href="/jugar" className="flex flex-1 flex-col items-center justify-center px-4 text-center" aria-label="Continuar jugando">
          <div className="flex w-full max-w-[360px] flex-col items-center gap-6 rounded-[28px] bg-white/95 px-5 py-6 shadow-[0_8px_28px_rgba(14,12,78,0.18)]">
            {header}
            <span className="btn-uep mt-2 w-full max-w-[320px]">Seguir jugando</span>
          </div>
        </Link>
        <OtraCedula className="mb-[max(20px,env(safe-area-inset-bottom))]" />
      </Screen>
    );
  }

  return (
    <Screen portada>
      <div className="flex flex-1 flex-col items-center justify-center px-4 text-center">
        {/* Recuadro blanco para que los arcos del fondo no choquen con el texto. */}
        <div className="flex w-full max-w-[360px] flex-col items-center gap-5 rounded-[28px] bg-white/95 px-5 py-6 shadow-[0_8px_28px_rgba(14,12,78,0.18)]">
        {header}
        {registered === false && (
          <form onSubmit={submit} className="mt-2 flex w-full max-w-[320px] flex-col gap-3">
            <label htmlFor="cedula" className="text-base font-bold text-polar-navy">
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
              className="h-[56px] rounded-[16px] border-2 border-polar-navy bg-white px-[22px] text-center text-xl font-bold tracking-wider text-polar-navy shadow-[0_6px_18px_rgba(14,12,78,0.15)] outline-none placeholder:text-[#9AA3B5] focus:border-polar-steel focus:ring-4 focus:ring-polar-steel/25"
            />
            {error && (
              <p role="alert" className="rounded-[16px] bg-polar-navy px-4 py-2 text-sm font-bold text-white">
                {error}
              </p>
            )}
            <button type="submit" disabled={sending} className="btn-uep">
              {sending ? (
                <>
                  <Destello size={20} color="#FFFFFF" /> Entrando…
                </>
              ) : (
                'Entrar'
              )}
            </button>
          </form>
        )}
        </div>
      </div>
    </Screen>
  );
}
