// Afiche del QR para imprimir y pegar en las sedes (el mismo en todas).
// El QR lleva el dominio de APP_URL; el logo del centro cabe gracias a la corrección de errores alta (H).
import Image from 'next/image';
import QRCode from 'qrcode';
import { QR_INK, qrUrlFor } from '@/shared/qr';
import { config } from '@/lib/config';
import { PrintButton } from './PrintButton';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'QR · Experiencia Polar' };

const PASOS = [
  { n: 1, t: 'Escanea', d: 'con la cámara de tu teléfono' },
  { n: 2, t: 'Crea tu oso', d: 'y elige tu localidad' },
  { n: 3, t: 'Responde', d: 'y suma puntos' },
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

      <article className="poster relative mx-auto flex aspect-[210/297] w-full max-w-[560px] flex-col items-center overflow-hidden rounded-[28px] bg-polar-blue px-[6%] pb-[5%] pt-[6%] text-white shadow-2xl [container-type:inline-size]">
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(255,255,255,0.28),transparent_60%)]" />
        <Snow />

        <header className="relative flex flex-col items-center text-center">
          <span className="rounded-full bg-white/15 px-[1em] py-[0.35em] text-[2.6cqw] font-extrabold uppercase tracking-[0.18em]">
            Universidad Empresas Polar
          </span>
          <h1 className="mt-[0.25em] text-[12.5cqw] font-black uppercase leading-[0.92] tracking-tight [text-shadow:0_0.06em_0_#1B5FBF]">
            Experiencia
            <br />
            Polar
          </h1>
          <p className="mt-[0.7em] -rotate-2 rounded-full bg-polar-orange px-[1.1em] py-[0.4em] text-[4cqw] font-black uppercase shadow-[0_0.25em_0_#C9620A]">
            Escanea · Juega · Gana
          </p>
        </header>

        {/* QR con el logo al centro, el oso asomado y su globo */}
        <div className="relative mt-[5%] w-[54%]">
          <div className="rotate-[-1.5deg] rounded-[4cqw] border-[1cqw] border-polar-ink bg-white p-[6%] shadow-[1.6cqw_1.6cqw_0_#1E1E1E]">
            <div className="relative">
              <div
                className="[&>svg]:block [&>svg]:h-auto [&>svg]:w-full"
                dangerouslySetInnerHTML={{ __html: svg }}
                role="img"
                aria-label={`Código QR: ${url}`}
              />
              <div className="absolute left-1/2 top-1/2 flex aspect-square w-[22%] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white p-[2.5%]">
                <Image src="/logos/universidad.png" alt="" width={120} height={120} className="h-full w-full object-contain" />
              </div>
            </div>
          </div>
          <div className="absolute bottom-[4%] -right-[40%] w-[36%] rotate-[8deg] overflow-hidden rounded-[3cqw] border-[0.8cqw] border-polar-ink bg-polar-sky shadow-[1cqw_1cqw_0_#1E1E1E]">
            <Image src="/osos/clasico.jpg" alt="Oso polar de la Experiencia" width={330} height={440} className="block h-auto w-full" />
          </div>
          <div className="absolute -left-[44%] top-[30%] -rotate-[8deg] rounded-[2.5cqw] border-[0.6cqw] border-polar-ink bg-white px-[0.7em] py-[0.45em] text-[3.2cqw] font-black leading-tight text-polar-ink shadow-[0.8cqw_0.8cqw_0_#1E1E1E]">
            ¡Escanéame!
          </div>
        </div>

        <ol className="relative mt-auto grid w-full grid-cols-3 gap-[3%] pt-[5%]">
          {PASOS.map((p) => (
            <li key={p.n} className="flex flex-col items-center rounded-[3cqw] bg-polar-card px-[6%] py-[8%] text-center">
              <span className="flex h-[1.9em] w-[1.9em] items-center justify-center rounded-full bg-polar-orange text-[3.4cqw] font-black">
                {p.n}
              </span>
              <span className="mt-[0.4em] text-[3.2cqw] font-black uppercase leading-tight">{p.t}</span>
              <span className="text-[2.5cqw] font-semibold leading-tight text-white/85">{p.d}</span>
            </li>
          ))}
        </ol>

        <footer className="relative mt-[4%] flex w-full items-center justify-center gap-[5%] rounded-[3cqw] bg-polar-navy px-[5%] py-[2.5%]">
          <Image src="/logos/universidad.png" alt="Universidad Empresas Polar" width={88} height={88} className="h-auto w-[12%] object-contain" />
          <span className="h-[8cqw] w-px bg-white/30" aria-hidden />
          <Image src="/logos/fundacion.png" alt="Fundación Empresas Polar" width={150} height={50} className="h-auto w-[30%] object-contain" />
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
    [8, 10, 10], [90, 8, 14], [14, 40, 8], [93, 36, 9], [5, 64, 12], [95, 60, 10], [10, 80, 9], [90, 76, 12], [50, 3, 7],
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
