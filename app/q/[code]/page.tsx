// Destino del QR impreso (el mismo en todas las sedes): https://experienciapolar.aulaciete.com/q/POLAR
// Si la app está instalada, iOS/Android la abren directo (universal/app links) y esta página no se ve.
// Si no, invita a instalarla o a jugar en la web.
import Image from 'next/image';
import Link from 'next/link';
import { QR_CODE } from '@/shared/qr';
import { currentPlayer } from '@/lib/session';
import { Logos, Screen } from '@/components/ui';

export const dynamic = 'force-dynamic';

export default async function QrLanding({ params }: { params: { code: string } }) {
  const valid = params.code.toUpperCase() === QR_CODE;
  const player = await currentPlayer();
  const ios = process.env.APP_STORE_URL;
  const android = process.env.PLAY_STORE_URL;

  return (
    <Screen>
      <div className="flex flex-1 flex-col items-center justify-center gap-5 px-8 text-center">
        <Image src="/logos/universidad.png" alt="Universidad Empresas Polar" width={150} height={150} priority />
        <h1 className="text-[38px] font-black uppercase leading-[1.05]">
          Experiencia
          <br />
          Polar
        </h1>
        {valid ? (
          <>
            <p className="text-base font-semibold">Abre la app y escanea este mismo QR para jugar.</p>
            <a href={`experienciapolar://q/${QR_CODE}`} className="btn-game w-full max-w-[320px]">
              Abrir la app
            </a>
            <div className="flex w-full max-w-[320px] gap-3">
              {ios && (
                <a href={ios} className="btn-ghost flex-1 text-sm">
                  App Store
                </a>
              )}
              {android && (
                <a href={android} className="btn-ghost flex-1 text-sm">
                  Google Play
                </a>
              )}
            </div>
            <Link href={player ? '/jugar' : '/registro'} className="text-sm font-bold underline">
              {player ? 'Seguir jugando en la web' : 'Jugar desde el navegador'}
            </Link>
          </>
        ) : (
          <p className="text-base font-semibold">Este QR no es de la Experiencia Polar.</p>
        )}
      </div>
      <Logos className="pb-4" />
    </Screen>
  );
}
