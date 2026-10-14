import Image from 'next/image';
import type { ReactNode } from 'react';

/** Contenedor de pantalla: columna de teléfono centrada, alto completo. */
export function Screen({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <main className={`mx-auto flex min-h-[100dvh] w-full max-w-[440px] flex-col bg-polar-blue ${className}`}>
      {children}
    </main>
  );
}

/** Logos de Universidad y Fundación Empresas Polar. */
export function Logos({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center gap-5 py-3 ${className}`}>
      <Image src="/logos/universidad.png" alt="Universidad Empresas Polar" width={88} height={88} className="h-[88px] w-[88px] object-contain" priority />
      <span className="h-12 w-px bg-white/50" aria-hidden />
      <Image src="/logos/fundacion.png" alt="Fundación Empresas Polar" width={150} height={50} className="h-[50px] w-[150px] object-contain" priority />
    </div>
  );
}

/** Stepper del registro (2 pasos). */
export function Stepper({ step }: { step: 1 | 2 }) {
  const items = [
    { n: 1, label: 'Tu oso' },
    { n: 2, label: 'Tus datos' },
  ];
  return (
    <div className="relative mx-auto mt-5 w-[260px]">
      <span className="absolute left-[65px] right-[65px] top-4 h-[3px] rounded bg-white/35" aria-hidden />
      {step === 2 && <span className="absolute left-[65px] right-[65px] top-4 h-[3px] rounded bg-white" aria-hidden />}
      <ol aria-label="Progreso del registro" className="relative grid grid-cols-2">
        {items.map((it) => {
          const done = it.n < step;
          const now = it.n === step;
          return (
            <li key={it.n} aria-current={now ? 'step' : undefined} className="flex flex-col items-center gap-1.5">
              <span
                className={
                  done
                    ? 'flex h-[34px] w-[34px] items-center justify-center rounded-full bg-white text-polar-blue'
                    : now
                      ? 'flex h-[34px] w-[34px] items-center justify-center rounded-full bg-polar-orange text-[15px] font-extrabold shadow-[0_0_0_4px_rgba(255,141,40,0.35)]'
                      : 'flex h-[34px] w-[34px] items-center justify-center rounded-full border-2 border-white/70 text-[15px] font-bold'
                }
              >
                {done ? <CheckIcon /> : it.n}
              </span>
              <span className={`text-[13px] ${now || done ? 'font-bold' : 'font-semibold text-[#DCEBFF]'}`}>{it.label}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/** Globo de diálogo estilo cómic. */
export function Bubble({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-[18px] border-[3px] border-polar-ink bg-white px-3.5 py-2.5 text-base font-extrabold leading-snug text-polar-ink ${className}`}>
      {children}
    </div>
  );
}

/** Tarjeta grande del oso con borde blanco. */
export function BearCard({
  src,
  alt,
  className = '',
  imgClassName = '',
  children,
}: {
  src: string;
  alt: string;
  className?: string;
  imgClassName?: string;
  children?: ReactNode;
}) {
  return (
    <div className={`relative overflow-hidden rounded-[20px] border-4 border-white bg-polar-sky ${className}`}>
      <Image src={src} alt={alt} fill sizes="440px" className={`object-cover object-[center_40%] ${imgClassName}`} priority />
      {children}
    </div>
  );
}

/** Lluvia de confeti para las celebraciones. */
export function Confetti() {
  const bits = [
    { l: 8, w: 10, h: 18, c: '#FF8D28', d: 3.2, s: 0 },
    { l: 22, w: 12, h: 12, c: '#FFFFFF', d: 2.6, s: 0.4, r: true },
    { l: 35, w: 8, h: 16, c: '#0B2A66', d: 3.6, s: 1.1 },
    { l: 48, w: 10, h: 18, c: '#FFD23F', d: 2.9, s: 0.2 },
    { l: 61, w: 12, h: 12, c: '#FF8D28', d: 3.3, s: 1.6, r: true },
    { l: 72, w: 8, h: 16, c: '#FFFFFF', d: 2.7, s: 0.9 },
    { l: 85, w: 10, h: 18, c: '#0B2A66', d: 3.1, s: 0.6 },
    { l: 15, w: 8, h: 14, c: '#FFD23F', d: 3.8, s: 2 },
    { l: 66, w: 10, h: 10, c: '#FFD23F', d: 3.4, s: 2.4, r: true },
  ];
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {bits.map((b, i) => (
        <span
          key={i}
          className="absolute top-0"
          style={{
            left: `${b.l}%`,
            width: b.w,
            height: b.h,
            background: b.c,
            borderRadius: b.r ? '50%' : 2,
            animation: `confetti-fall ${b.d}s linear ${b.s}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

export function CheckIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  );
}

export function Chevron({ dir, size = 30 }: { dir: 'left' | 'right'; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={dir === 'left' ? 'M15 6l-6 6 6 6' : 'M9 6l6 6-6 6'} />
    </svg>
  );
}

export function Spinner() {
  return (
    <div className="flex flex-1 items-center justify-center" role="status" aria-label="Cargando">
      <span className="h-10 w-10 animate-spin rounded-full border-4 border-white/40 border-t-white" />
    </div>
  );
}
