'use client';

// Portada. Sin sesión ofrece las dos puertas: registrarse o entrar con la cédula
// (p. ej. si el QR se abrió por accidente en otro navegador). Con ?qr=1 viene de escanear el QR.
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Logos, Screen } from '@/components/ui';

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
      <Image src="/logos/universidad.png" alt="Universidad Empresas Polar" width={200} height={200} priority className="h-[200px] w-[200px] object-contain" />
      <h1 className="text-[50px] font-extrabold uppercase leading-[1.08] text-polar-ink">
        Experiencia
        <br />
        Polar
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
      <Logos className="pb-4" />
    </Screen>
  );
}
