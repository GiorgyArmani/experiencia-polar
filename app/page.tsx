'use client';

// Portada. Sin sesión ofrece las dos puertas: registrarse o entrar con la cédula
// (p. ej. si el QR se abrió por accidente en otro navegador). Con ?qr=1 viene de escanear el QR.
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Screen } from '@/components/ui';

export default function Inicio() {
  const [registered, setRegistered] = useState<boolean | null>(null);
  const [fromQr, setFromQr] = useState(false);

  useEffect(() => {
    setFromQr(new URLSearchParams(window.location.search).has('qr'));
    api
      .me()
      .then((r) => setRegistered(Boolean(r.player)))
      .catch(() => setRegistered(false));
  }, []);

  const header = (
    <>
      <Image src="/logos/universidad.png" alt="Universidad Empresas Polar" width={200} height={200} priority className="h-[min(200px,26dvh)] w-auto object-contain" />
      <h1 className="title-display text-[clamp(44px,16vw,64px)] leading-[1.02] text-white [text-shadow:0_5px_0_#004572]">
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
          <div className="mt-4 flex w-full max-w-[320px] flex-col gap-3">
            <Link href="/registro" className="btn-game">
              Es mi primera vez
            </Link>
            <Link href={fromQr ? '/entrar?qr=1' : '/entrar'} className="btn-ghost">
              Ya tengo cuenta
            </Link>
            <p className="text-sm font-semibold text-polar-ink/80">¿Ya jugaste en otro teléfono o navegador? Entra con tu cédula.</p>
          </div>
        )}
      </div>
    </Screen>
  );
}
