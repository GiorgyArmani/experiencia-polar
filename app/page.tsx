'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Screen } from '@/components/ui';

export default function Inicio() {
  const [registered, setRegistered] = useState<boolean | null>(null);

  useEffect(() => {
    api
      .me()
      .then((r) => setRegistered(Boolean(r.player)))
      .catch(() => setRegistered(false));
  }, []);

  return (
    <Screen>
      <Link
        href={registered ? '/jugar' : '/registro'}
        className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center"
        aria-label={registered ? 'Continuar jugando' : 'Empezar la Experiencia Polar'}
      >
        <Image src="/logos/universidad.png" alt="Universidad Empresas Polar" width={236} height={236} priority className="h-[236px] w-[236px] object-contain" />
        <h1 className="text-[50px] font-extrabold uppercase leading-[1.08] text-polar-ink">
          Experiencia
          <br />
          Polar
        </h1>
        <span className="mt-6 text-base font-semibold">
          {registered === null ? ' ' : registered ? 'Toca para seguir jugando' : 'Toca para empezar'}
        </span>
      </Link>
    </Screen>
  );
}
