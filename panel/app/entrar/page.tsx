'use client';

import { useState } from 'react';

export default function Entrar() {
  const [clave, setClave] = useState('');
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setError('');
    const r = await fetch('/api/entrar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clave }),
    }).catch(() => null);
    if (r?.ok) {
      window.location.replace('/');
      return;
    }
    setError(r ? 'Clave incorrecta. Revísala e intenta de nuevo.' : 'Sin conexión. Intenta de nuevo.');
    setEnviando(false);
  }

  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-polar-navy px-4">
      <form onSubmit={entrar} className="w-full max-w-[380px] rounded-3xl bg-white p-7 shadow-xl">
        <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-polar-blue">Experiencia UEP</p>
        <h1 className="title-display mt-1 text-[34px] leading-none text-polar-navy">Panel de premiación</h1>
        <p className="mt-3 text-sm text-polar-slate">Escribe la clave del panel para ver los resultados.</p>

        <label htmlFor="clave" className="mt-6 block text-sm font-bold text-polar-navy">
          Clave
        </label>
        <input
          id="clave"
          type="password"
          autoFocus
          required
          autoComplete="current-password"
          value={clave}
          onChange={(e) => setClave(e.target.value)}
          className="mt-1.5 h-12 w-full rounded-xl border-2 border-[#CBD5E1] px-4 text-base outline-none focus:border-polar-blue"
        />
        {error && (
          <p role="alert" className="mt-3 rounded-lg bg-[#FDE8E8] px-3 py-2 text-sm font-semibold text-[#9B1C1C]">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={enviando}
          className="mt-5 h-12 w-full rounded-xl bg-polar-yellow text-base font-extrabold text-polar-navy transition hover:brightness-95 disabled:opacity-60"
        >
          {enviando ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
    </main>
  );
}
