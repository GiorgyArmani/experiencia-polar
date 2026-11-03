'use client';

import Link from 'next/link';

const PESTANAS = [
  { id: 'ranking', href: '/', label: 'Ranking' },
  { id: 'reporte', href: '/reporte', label: 'Reporte' },
] as const;

const TITULOS = { ranking: 'Panel de premiación', reporte: 'Reporte de respuestas' };

export function Encabezado({ activo, estado }: { activo: 'ranking' | 'reporte'; estado: string }) {
  async function salir() {
    await fetch('/api/salir', { method: 'POST' }).catch(() => {});
    window.location.replace('/entrar');
  }
  return (
    <header className="bg-polar-navy text-white print:hidden">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 pt-4 sm:px-8">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-polar-yellow">Experiencia UEP</p>
          <h1 className="title-display text-[clamp(26px,4.5vw,36px)] leading-none">{TITULOS[activo]}</h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-2 text-sm text-[#CFE3F7]">
            <span className="h-2 w-2 rounded-full bg-[#3DDC84]" aria-hidden />
            {estado}
          </span>
          <button type="button" onClick={salir} className="h-9 rounded-lg border border-white/30 px-3 text-sm font-semibold hover:bg-white/10">
            Salir
          </button>
        </div>
      </div>
      <nav className="mx-auto mt-3 flex max-w-6xl gap-1 px-4 sm:px-8" aria-label="Secciones">
        {PESTANAS.map((p) => (
          <Link
            key={p.id}
            href={p.href}
            aria-current={p.id === activo ? 'page' : undefined}
            className={`rounded-t-xl px-4 py-2 text-sm font-extrabold ${
              p.id === activo ? 'bg-polar-ice text-polar-navy' : 'text-[#CFE3F7] hover:bg-white/10 hover:text-white'
            }`}
          >
            {p.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
