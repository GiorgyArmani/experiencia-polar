// Afiche del QR para imprimir y pegar en las sedes (el mismo en todas).
// El QR lleva el dominio de APP_URL; el logo del centro cabe gracias a la corrección de errores alta (H).
// Lineamientos UEP: solo el logo de la Universidad, paleta y tipografías UEP, sin mencionar premios.
import QRCode from 'qrcode';
import { QR_INK, qrUrlFor } from '@/shared/qr';
import { DEFAULT_AVATAR } from '@/shared/avatar';
import { config } from '@/lib/config';
import { BearSvg } from '@/components/BearSvg';
import { PrintButton } from './PrintButton';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'QR · Experiencia UEP' };

const PASOS = [
  { n: 1, t: 'Escanea', d: 'con la cámara de tu teléfono' },
  { n: 2, t: 'Crea tu oso', d: 'y elige tu localidad' },
  { n: 3, t: 'Responde', d: 'y suma puntos para tu localidad' },
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
    <main className="min-h-[100dvh] bg-polar-navy px-4 py-6 print:bg-white print:p-0">
      <style>{`
        @page { size: A4 portrait; margin: 0; }
        @media print {
          html, body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .poster { width: 210mm !important; height: 297mm !important; max-width: none !important; border-radius: 0 !important; box-shadow: none !important; }
        }
      `}</style>

      <article className="poster relative mx-auto flex aspect-[210/297] w-full max-w-[560px] flex-col items-center overflow-hidden rounded-[28px] bg-polar-blue pt-[6%] text-white shadow-2xl [container-type:inline-size]">
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(255,255,255,0.25),transparent_60%)]" />
        <Snow />

        <header className="relative flex flex-col items-center px-[7%] text-center">
          {/* Logo oficial de la Universidad (versión a color sobre blanco). */}
          <div className="rounded-[3cqw] bg-white px-[2.4cqw] py-[1.4cqw] shadow-[0_0.8cqw_0_#004572]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logos/uep.svg" alt="Universidad Empresas Polar" className="block h-[15cqw] w-auto" />
          </div>
          <h1 className="title-display mt-[0.3em] whitespace-nowrap text-[12.5cqw] leading-none [text-shadow:0_0.06em_0_#004572]">
            Experiencia UEP
          </h1>
          <p className="mt-[0.6em] -rotate-2 rounded-full bg-polar-yellow px-[1.1em] py-[0.35em] font-display text-[4.6cqw] uppercase tracking-wide text-polar-navy shadow-[0_0.2em_0_#D29B22]">
            Escanea · Juega · Aprende
          </p>
        </header>

        {/* QR con el globo de la UEP al centro, el oso asomado y su globo de diálogo. */}
        <div className="relative my-auto w-[44%] py-[2%]">
          <div className="rotate-[-1.5deg] rounded-[4cqw] border-[1cqw] border-polar-navy bg-white p-[6%] shadow-[1.6cqw_1.6cqw_0_#004572]">
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
          <div className="absolute -right-[50%] bottom-[4%] aspect-[216/368] w-[44%] rotate-[6deg] overflow-hidden rounded-[3cqw] border-[0.8cqw] border-white bg-polar-sky px-[3%] pt-[6%] shadow-[1cqw_1cqw_0_#004572]">
            <BearSvg avatar={DEFAULT_AVATAR} mood="feliz" className="h-full w-full" title="Oso polar de la Experiencia UEP" />
          </div>
          <div className="absolute -left-[50%] top-[24%] -rotate-[8deg] rounded-[2.5cqw] border-[0.6cqw] border-polar-navy bg-white px-[0.7em] py-[0.45em] text-[3.4cqw] font-extrabold leading-tight text-polar-navy shadow-[0.8cqw_0.8cqw_0_#004572]">
            ¡Escanéame!
          </div>
        </div>

        {/* Pie en azul oscuro UEP con los tres pasos. */}
        <footer className="relative w-full bg-polar-navy-2 px-[7%] pb-[4%] pt-[4%]">
        <ol className="grid w-full grid-cols-3 gap-[3%]">
          {PASOS.map((p) => (
            <li key={p.n} className="flex flex-col items-center rounded-[3cqw] bg-white px-[5%] py-[3.5%] text-center text-polar-navy">
              <span className="flex h-[1.7em] w-[1.7em] items-center justify-center rounded-full bg-polar-yellow font-display text-[5cqw] leading-none">
                {p.n}
              </span>
              <span className="mt-[0.35em] font-display text-[5cqw] uppercase leading-none">{p.t}</span>
              <span className="mt-[0.3em] text-[2.7cqw] font-medium leading-tight text-polar-muted">{p.d}</span>
            </li>
          ))}
        </ol>
        <p className="mt-[2.5%] text-center text-[3cqw] font-semibold text-white/90">Es el mismo QR en todas las estaciones.</p>
        </footer>
      </article>

      <div className="mx-auto mt-5 flex w-full max-w-[560px] flex-col gap-3 print:hidden">
        <PrintButton />
        <div className="grid grid-cols-2 gap-3">
          <a href="/qr/imagen?download" className="btn-ghost text-sm">
            QR solo (SVG)
          </a>
          <a href="/qr/imagen?format=png&size=2048&download" className="btn-ghost text-sm">
            QR solo (PNG)
          </a>
        </div>
        <p className="text-center text-xs text-white/70">Lleva a {url}</p>
      </div>
    </main>
  );
}

/** Copos de nieve decorativos (posiciones fijas para que el afiche impreso salga siempre igual). */
function Snow() {
  const flakes = [
    [8, 10, 10], [90, 8, 14], [14, 40, 8], [93, 36, 9], [5, 60, 12], [95, 56, 10], [50, 3, 7],
  ];
  return (
    <svg aria-hidden className="pointer-events-none absolute inset-0 h-full w-full opacity-40">
      {flakes.map(([x, y, s], i) => (
        <svg key={i} x={`${x}%`} y={`${y}%`} overflow="visible">
          <path
            d="M0 -6V6M-5.2 -3L5.2 3M-5.2 3L5.2 -3"
            transform={`scale(${s / 8})`}
            stroke="#fff"
            strokeWidth={1.6}
            strokeLinecap="round"
            fill="none"
          />
        </svg>
      ))}
    </svg>
  );
}
