// Afiche del QR para imprimir y pegar en las estaciones (el mismo en todas).
// El QR lleva el dominio de APP_URL; el logo del centro cabe gracias a la corrección de errores alta (H).
// Lineamientos UEP: estilo claro (fondo blanco + arcos), solo el logo de la Universidad, sin premios ni graduación.
// Todo se mide en cqw (ancho del afiche) para que en pantalla y en A4 se vea igual y nada se corte.
import QRCode from 'qrcode';
import { QR_INK, qrUrlFor } from '@/shared/qr';
import { config } from '@/lib/config';
import { Arcos } from '@/components/Arcos';
import { PlayerIcon } from '@/components/PlayerIcon';
import { PrintButton } from './PrintButton';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'QR · Experiencia UEP' };

const PASOS = [
  { n: 1, t: 'Escanea', d: 'este QR con la cámara de tu teléfono' },
  { n: 2, t: 'Entra', d: 'con tu cédula y elige tu ícono' },
  { n: 3, t: 'Juega', d: 'en cada estación, escanea este QR desde el juego' },
];

export default async function QrPoster() {
  const url = qrUrlFor(config.appUrl);
  const svg = await QRCode.toString(url, {
    type: 'svg',
    errorCorrectionLevel: 'H',
    margin: 0,
    color: { dark: QR_INK, light: '#FFFFFF' },
  });

  return (
    <main className="min-h-[100dvh] bg-polar-ice px-4 py-6 print:bg-white print:p-0">
      <style>{`
        @page { size: A4 portrait; margin: 0; }
        @media print {
          html, body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .poster { width: 210mm !important; height: 297mm !important; max-width: none !important; border-radius: 0 !important; box-shadow: none !important; }
          .poster * { animation: none !important; }
        }
      `}</style>

      <article className="poster relative isolate mx-auto aspect-[210/297] w-full max-w-[560px] overflow-hidden rounded-[28px] bg-white text-polar-navy shadow-xl [container-type:inline-size]">
        <Arcos />
        {/* El relleno va adentro y en cqw: en % se calcularía contra la página y empujaría el contenido fuera del afiche. */}
        <div className="absolute inset-0 flex flex-col items-center justify-between px-[7cqw] pb-[6cqw] pt-[8cqw]">

        <header className="flex flex-col items-center text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logos/uep.svg" alt="Universidad Empresas Polar" className="block h-[15cqw] w-auto" />
          <h1 className="title-display mt-[2cqw] whitespace-nowrap text-[12cqw] leading-none">
            Experiencia <span className="text-polar-steel">UEP</span>
          </h1>
          <p className="mt-[2.5cqw] rounded-full bg-polar-yellow px-[1.1em] py-[0.35em] font-display text-[4.4cqw] uppercase tracking-wide text-polar-navy">
            Escanea · Juega · Aprende
          </p>
        </header>

        {/* QR con el globo de la UEP al centro y dos íconos de jugador de adorno. */}
        <div className="relative w-[42cqw]">
          <div className="rounded-[4cqw] border-[0.9cqw] border-polar-steel bg-white p-[3.2cqw] shadow-[0_1.5cqw_4cqw_rgba(14,12,78,0.22)]">
            <div className="relative">
              <div
                className="[&>svg]:block [&>svg]:h-auto [&>svg]:w-full"
                dangerouslySetInnerHTML={{ __html: svg }}
                role="img"
                aria-label={`Código QR: ${url}`}
              />
              <div className="absolute left-1/2 top-1/2 flex aspect-square w-[24%] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white p-[3%]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logos/uep-isotipo.svg" alt="" className="h-full w-full object-contain" />
              </div>
            </div>
          </div>
          <div className="absolute -left-[27cqw] top-[16%] rounded-full bg-polar-navy px-[0.8em] py-[0.4em] text-[3.4cqw] font-extrabold leading-none text-white" aria-hidden>
            ¡Escanéame!
          </div>
          <PlayerIcon icono={{ simbolo: 'bombillo', color: 'amarillo' }} className="!absolute -left-[17cqw] bottom-[4%] w-[11cqw] border-[0.7cqw]" />
          <PlayerIcon icono={{ simbolo: 'cohete', color: 'cian' }} className="!absolute -right-[17cqw] top-[40%] w-[12cqw] border-[0.7cqw]" />
        </div>

        <footer className="w-full">
          <ol className="grid w-full grid-cols-3 gap-[2.5cqw]">
            {PASOS.map((p) => (
              <li
                key={p.n}
                className="flex flex-col items-center rounded-[3cqw] bg-white px-[1.8cqw] py-[2.4cqw] text-center shadow-[0_0.8cqw_2.5cqw_rgba(14,12,78,0.16)]"
              >
                <span className="flex h-[7.5cqw] w-[7.5cqw] items-center justify-center rounded-full bg-polar-steel font-display text-[4.6cqw] leading-none text-white">
                  {p.n}
                </span>
                <span className="mt-[1.4cqw] font-display text-[5cqw] uppercase leading-none">{p.t}</span>
                <span className="mt-[1cqw] text-[2.7cqw] font-medium leading-tight text-polar-muted">{p.d}</span>
              </li>
            ))}
          </ol>
         
        </footer>
        </div>
      </article>

      <div className="mx-auto mt-5 flex w-full max-w-[560px] flex-col gap-3 print:hidden">
        <PrintButton />
        <div className="grid grid-cols-2 gap-3">
          <a href="/qr/imagen?download" className="flex h-[54px] items-center justify-center rounded-full border-2 border-polar-steel px-6 text-sm font-bold text-polar-steel transition-transform active:translate-y-[2px]">
            QR solo (SVG)
          </a>
          <a href="/qr/imagen?format=png&size=2048&download" className="flex h-[54px] items-center justify-center rounded-full border-2 border-polar-steel px-6 text-sm font-bold text-polar-steel transition-transform active:translate-y-[2px]">
            QR solo (PNG)
          </a>
        </div>
        <p className="break-all text-center text-xs text-polar-muted">Lleva a {url}</p>
      </div>
    </main>
  );
}
