'use client';

// Panel de premiación (panelpolar.aulaciete.net). Lee la base del juego y muestra quién va ganando.
// Pensado para usarse sin explicación: filtro por localidad (la nómina de la UEP no trae estado), el podio arriba y la tabla completa abajo.
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Datos, Fila } from '@/lib/tipos';

const PAGINA = 50;

type ConPuesto = Fila & { puesto: number };

/** 254300 → "4 min 14 s". Sin tiempo pero con niveles jugados = jugó antes de que se guardara el tiempo. */
function tiempo(ms: number, niveles = 0) {
  if (!ms) return niveles ? 'Sin registro' : '—';
  const total = Math.round(ms / 100) / 10;
  const m = Math.floor(total / 60);
  const s = total - m * 60;
  const seg = s % 1 === 0 ? s.toFixed(0) : s.toFixed(1).replace('.', ',');
  return m ? `${m} min ${seg} s` : `${seg} s`;
}

function haceCuanto(iso: string, ahora: number) {
  const s = Math.max(0, Math.round((ahora - new Date(iso).getTime()) / 1000));
  if (s < 10) return 'justo ahora';
  if (s < 60) return `hace ${s} s`;
  return `hace ${Math.round(s / 60)} min`;
}

/** Puesto con empates: mismo puntaje y mismo tiempo comparten puesto. */
function conPuesto(rows: Fila[]): ConPuesto[] {
  let puesto = 0;
  return rows.map((r, i) => {
    const prev = rows[i - 1];
    if (!prev || prev.puntos !== r.puntos || prev.tiempoMs !== r.tiempoMs) puesto = i + 1;
    return { ...r, puesto };
  });
}

function descargar(rows: ConPuesto[], nombre: string, totalNiveles: number) {
  const head = ['Puesto', 'Cédula', 'Nombre', 'Localidad', 'Puntos', 'Tiempo (segundos)', 'Niveles completados', 'Terminó todo', 'Último nivel', 'Registro'];
  const esc = (v: string | number) => {
    const t = String(v);
    return /[";\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
  };
  const lines = rows.map((r) =>
    [
      r.puesto,
      r.cedula,
      r.nombre,
      r.localidad,
      r.puntos,
      r.tiempoMs ? (r.tiempoMs / 1000).toFixed(1).replace('.', ',') : '',
      `${r.niveles} de ${totalNiveles}`,
      r.terminado ? 'Sí' : 'No',
      r.ultimoNivelAt ? new Date(r.ultimoNivelAt).toLocaleString('es-VE') : '',
      new Date(r.registradoAt).toLocaleString('es-VE'),
    ]
      .map(esc)
      .join(';'),
  );
  // BOM + punto y coma: Excel en español lo abre directo, con acentos y columnas separadas.
  const blob = new Blob(['﻿' + [head.join(';'), ...lines].join('\r\n')], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = nombre;
  a.click();
  URL.revokeObjectURL(a.href);
}

const slug = (v: string) =>
  v
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

export default function Panel() {
  const [data, setData] = useState<Datos | null>(null);
  const [error, setError] = useState('');
  const [localidad, setLocalidad] = useState('');
  const [buscar, setBuscar] = useState('');
  const [soloTerminados, setSoloTerminados] = useState(false);
  const [mostrar, setMostrar] = useState(PAGINA);
  const [ahora, setAhora] = useState(() => Date.now());

  const load = useCallback(() => {
    fetch('/api/datos', { cache: 'no-store' })
      .then(async (r) => {
        if (r.status === 401) {
          window.location.replace('/entrar');
          return;
        }
        const body = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(body.error ?? 'No pudimos cargar los datos');
        setData(body as Datos);
        setError('');
      })
      .catch((e: Error) => setError(e.message));
  }, []);

  useEffect(() => {
    load();
    const a = setInterval(load, 30000); // se actualiza solo
    const b = setInterval(() => setAhora(Date.now()), 5000);
    return () => {
      clearInterval(a);
      clearInterval(b);
    };
  }, [load]);

  // Al cambiar un filtro vuelve a mostrar desde el primero.
  useEffect(() => setMostrar(PAGINA), [localidad, buscar, soloTerminados]);

  const rows = useMemo(() => data?.rows ?? [], [data]);
  const totalNiveles = data?.totalNiveles ?? 4;

  const localidades = useMemo(() => [...new Set(rows.map((r) => r.localidad))].sort((a, b) => a.localeCompare(b, 'es')), [rows]);

  // El puesto se calcula dentro de la localidad elegida (es el ranking de ese grupo).
  const ranking = useMemo(() => conPuesto(localidad ? rows.filter((r) => r.localidad === localidad) : rows), [rows, localidad]);

  // La búsqueda y "solo quienes terminaron" filtran la lista sin cambiar los puestos.
  const lista = useMemo(() => {
    const q = slug(buscar);
    return ranking.filter((r) => (!soloTerminados || r.terminado) && (!q || slug(r.nombre).includes(q) || r.cedula.includes(buscar.replace(/\D/g, '') || '§')));
  }, [ranking, buscar, soloTerminados]);

  const grupo = localidad || 'Todo el país';
  const hayFiltros = Boolean(localidad || buscar || soloTerminados);
  const terminaron = ranking.filter((r) => r.terminado).length;
  const podio = ranking.slice(0, 3).filter((r) => r.puntos > 0);

  function limpiar() {
    setLocalidad('');
    setBuscar('');
    setSoloTerminados(false);
  }

  async function salir() {
    await fetch('/api/salir', { method: 'POST' }).catch(() => {});
    window.location.replace('/entrar');
  }

  return (
    <main className="min-h-[100dvh] pb-10">
      <header className="bg-polar-navy text-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-8">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-polar-yellow">Experiencia UEP</p>
            <h1 className="title-display text-[clamp(26px,4.5vw,36px)] leading-none">Panel de premiación</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-2 text-sm text-[#CFE3F7]">
              <span className="h-2 w-2 rounded-full bg-[#3DDC84]" aria-hidden />
              {data ? `Actualizado ${haceCuanto(data.generadoAt, ahora)}` : 'Cargando…'}
            </span>
            <button type="button" onClick={salir} className="h-9 rounded-lg border border-white/30 px-3 text-sm font-semibold hover:bg-white/10">
              Salir
            </button>
          </div>
        </div>
      </header>

      {/* Filtros: siempre a la vista */}
      <div className="z-20 border-b lg:sticky lg:top-0 border-[#E2E8F0] bg-white/95 backdrop-blur">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-3 px-4 py-3 sm:grid-cols-2 sm:px-8 lg:grid-cols-[1fr_1.3fr_auto]">
          <Campo label="Localidad">
            <select value={localidad} onChange={(e) => setLocalidad(e.target.value)} className="input">
              <option value="">Todas las localidades</option>
              {localidades.map((l) => (
                <option key={l}>{l}</option>
              ))}
            </select>
          </Campo>
          <Campo label="Buscar participante">
            <input type="search" value={buscar} onChange={(e) => setBuscar(e.target.value)} placeholder="Nombre o cédula" className="input" />
          </Campo>
          <div className="flex items-end gap-2">
            <button
              type="button"
              disabled={!lista.length}
              onClick={() => descargar(lista, `ranking-${slug(grupo)}.csv`, totalNiveles)}
              className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-polar-yellow px-4 text-sm font-extrabold text-polar-navy hover:brightness-95 disabled:opacity-50 lg:flex-none"
              title="Descarga la lista que estás viendo, para abrirla en Excel"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M12 3v12M7 10l5 5 5-5M5 21h14" />
              </svg>
              Descargar Excel
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 sm:px-8">
        {error && <p className="mt-4 rounded-xl bg-[#FDE8E8] p-3 text-sm font-semibold text-[#9B1C1C]">{error}</p>}

        {/* Qué se está viendo */}
        <div className="mt-6 flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-polar-slate">Ranking de</p>
            <h2 className="text-2xl font-black text-polar-navy">{grupo}</h2>
          </div>
          {hayFiltros && (
            <button type="button" onClick={limpiar} className="text-sm font-bold text-polar-blue underline underline-offset-2">
              Quitar filtros
            </button>
          )}
        </div>

        <section className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4" aria-label="Resumen">
          <Stat label="Participantes" value={ranking.length.toLocaleString('es-VE')} />
          <Stat label={`Terminaron los ${totalNiveles} niveles`} value={terminaron.toLocaleString('es-VE')} />
          <Stat label="Puntaje más alto" value={(ranking[0]?.puntos ?? 0).toLocaleString('es-VE')} />
          <Stat label="Localidades" value={new Set(ranking.map((r) => r.localidad)).size.toLocaleString('es-VE')} />
        </section>

        {/* Podio */}
        {podio.length > 0 && (
          <section className="mt-6" aria-label="Primeros lugares">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-polar-slate">Primeros lugares</h3>
            <ol className="mt-2 grid gap-3 md:grid-cols-3">
              {podio.map((r) => (
                <li
                  key={r.cedula || r.registradoAt}
                  className={`flex items-center gap-4 rounded-2xl p-4 shadow-sm ${r.puesto === 1 ? 'bg-polar-navy text-white' : 'bg-white'}`}
                >
                  <Medalla puesto={r.puesto} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-base font-extrabold">{r.nombre}</p>
                    <p className={`truncate text-sm ${r.puesto === 1 ? 'text-[#CFE3F7]' : 'text-polar-slate'}`}>
                      {r.localidad}
                    </p>
                    <p className={`mt-1 text-sm ${r.puesto === 1 ? 'text-white' : 'text-polar-ink'}`}>
                      <b className="text-lg">{r.puntos}</b> pts · {tiempo(r.tiempoMs, r.niveles)}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        )}

        {/* Tabla completa */}
        <section className="mt-6" aria-label="Todos los participantes">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-polar-slate">
              Todos los participantes {lista.length !== ranking.length && `(${lista.length} de ${ranking.length})`}
            </h3>
            <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-polar-navy">
              <input type="checkbox" checked={soloTerminados} onChange={(e) => setSoloTerminados(e.target.checked)} className="h-4 w-4 accent-polar-blue" />
              Solo quienes terminaron los {totalNiveles} niveles
            </label>
          </div>

          <div className="mt-2 overflow-x-auto rounded-2xl bg-white shadow-sm">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-[#EEF3FA] text-xs font-bold uppercase tracking-wide text-polar-slate">
                <tr>
                  <th className="w-16 px-4 py-3 text-center">Puesto</th>
                  <th className="px-4 py-3">Participante</th>
                  <th className="px-4 py-3">Localidad</th>
                  <th className="px-4 py-3 text-right">Puntos</th>
                  <th className="px-4 py-3 text-right">Tiempo</th>
                  <th className="px-4 py-3">Niveles</th>
                </tr>
              </thead>
              <tbody>
                {lista.slice(0, mostrar).map((r) => (
                  <tr key={r.cedula || r.registradoAt} className="border-t border-[#EEF1F5] hover:bg-[#F8FAFD]">
                    <td className="px-4 py-3 text-center text-base font-black text-polar-navy">{r.puesto}</td>
                    <td className="px-4 py-3">
                      <p className="font-bold text-polar-ink">{r.nombre}</p>
                      <p className="text-xs tabular-nums text-polar-slate">C.I. {r.cedula}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold">{r.localidad}</p>
                    </td>
                    <td className="px-4 py-3 text-right text-base font-black tabular-nums text-polar-navy">{r.puntos}</td>
                    <td
                      className={`px-4 py-3 text-right tabular-nums ${!r.tiempoMs && r.niveles ? 'text-xs text-polar-slate' : ''}`}
                      title={!r.tiempoMs && r.niveles ? 'Jugó antes de que el juego guardara el tiempo' : undefined}
                    >
                      {tiempo(r.tiempoMs, r.niveles)}
                    </td>
                    <td className="px-4 py-3">
                      <Niveles hechos={r.niveles} total={totalNiveles} />
                    </td>
                  </tr>
                ))}
                {data && !lista.length && (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center font-semibold text-polar-slate">
                      {rows.length ? 'Nadie coincide con estos filtros.' : 'Todavía no hay participantes registrados.'}
                    </td>
                  </tr>
                )}
                {!data && !error && (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center font-semibold text-polar-slate">
                      Cargando participantes…
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {lista.length > mostrar && (
            <button
              type="button"
              onClick={() => setMostrar((n) => n + PAGINA * 2)}
              className="mx-auto mt-4 block h-11 rounded-xl border-2 border-polar-navy px-5 text-sm font-bold text-polar-navy hover:bg-white"
            >
              Ver más ({lista.length - mostrar} restantes)
            </button>
          )}

          <div className="mt-5 rounded-2xl border border-[#E2E8F0] bg-white p-4 text-sm text-polar-slate">
            <p className="font-bold text-polar-navy">¿Cómo se ordena?</p>
            <p className="mt-1">
              Gana quien tiene <b>más puntos</b>. Si dos personas empatan en puntos, va primero quien <b>tardó menos</b> en responder sus niveles
              (se suma el tiempo de cada nivel desde que arranca el reloj). El puesto es dentro de la localidad que elijas arriba.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-bold uppercase tracking-wide text-polar-slate">{label}</span>
      {children}
    </label>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold text-polar-slate">{label}</p>
      <p className="mt-1 text-[28px] font-black leading-none tabular-nums text-polar-navy">{value}</p>
    </div>
  );
}

function Medalla({ puesto }: { puesto: number }) {
  const color = puesto === 1 ? 'bg-polar-yellow text-polar-navy' : puesto === 2 ? 'bg-[#D9DEE7] text-polar-navy' : 'bg-[#E8B98A] text-polar-navy';
  return (
    <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-xl font-black ${color}`} aria-label={`Puesto ${puesto}`}>
      {puesto}º
    </span>
  );
}

function Niveles({ hechos, total }: { hechos: number; total: number }) {
  return (
    <span className="flex items-center gap-2" aria-label={`${hechos} de ${total} niveles`}>
      <span className="flex gap-1" aria-hidden>
        {Array.from({ length: total }, (_, i) => (
          <span key={i} className={`h-2.5 w-5 rounded-full ${i < hechos ? 'bg-polar-blue' : 'bg-[#E2E8F0]'}`} />
        ))}
      </span>
      <span className="text-xs font-semibold text-polar-slate">
        {hechos}/{total}
      </span>
    </span>
  );
}
