'use client';

// Panel de premiación (panelpolar.aulaciete.net): lee la base del juego y muestra el ranking de participantes
// por puntaje y tiempo, con filtro global / por estado / por localidad y descarga en CSV. Protegido con clave (middleware.ts).
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Datos, Fila } from '@/lib/tipos';

type Ambito = 'global' | 'estado' | 'localidad';

const SIN_ESTADO = 'Sin estado';

/** 254300 → "4:14.3" (minutos:segundos.décimas) */
function tiempo(ms: number) {
  if (!ms) return '—';
  const m = Math.floor(ms / 60000);
  const s = (ms % 60000) / 1000;
  return `${m}:${s.toFixed(1).padStart(4, '0')}`;
}

function fecha(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('es-VE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

/** Puesto con empates: mismo puntaje y mismo tiempo comparten puesto. */
function conPuesto(rows: Fila[]) {
  let puesto = 0;
  return rows.map((r, i) => {
    const prev = rows[i - 1];
    if (!prev || prev.puntos !== r.puntos || prev.tiempoMs !== r.tiempoMs) puesto = i + 1;
    return { ...r, puesto };
  });
}

function descargarCsv(rows: (Fila & { puesto: number })[], nombre: string) {
  const head = ['Puesto', 'Cédula', 'Nombre', 'Localidad', 'Estado', 'Puntos', 'Tiempo (s)', 'Niveles', 'Terminó', 'Último nivel', 'Registro'];
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
      r.estado ?? '',
      r.puntos,
      (r.tiempoMs / 1000).toFixed(1).replace('.', ','),
      r.niveles,
      r.terminado ? 'Sí' : 'No',
      r.ultimoNivelAt ? new Date(r.ultimoNivelAt).toLocaleString('es-VE') : '',
      new Date(r.registradoAt).toLocaleString('es-VE'),
    ]
      .map(esc)
      .join(';'),
  );
  // BOM + punto y coma: Excel en español lo abre con acentos y columnas bien.
  const blob = new Blob(['﻿' + [head.join(';'), ...lines].join('\r\n')], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = nombre;
  a.click();
  URL.revokeObjectURL(a.href);
}

export default function Panel() {
  const [data, setData] = useState<Datos | null>(null);
  const [error, setError] = useState('');
  const [ambito, setAmbito] = useState<Ambito>('global');
  const [estado, setEstado] = useState('');
  const [localidad, setLocalidad] = useState('');
  const [buscar, setBuscar] = useState('');
  const [soloTerminados, setSoloTerminados] = useState(false);

  const load = useCallback(() => {
    fetch('/api/datos', { cache: 'no-store' })
      .then(async (r) => {
        const body = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(body.error ?? 'No pudimos cargar los datos');
        setData(body as Datos);
        setError('');
      })
      .catch((e: Error) => setError(e.message));
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 30000); // se actualiza solo
    return () => clearInterval(id);
  }, [load]);

  const rows = useMemo(() => data?.rows ?? [], [data]);
  const estados = useMemo(() => [...new Set(rows.map((r) => r.estado ?? SIN_ESTADO))].sort((a, b) => a.localeCompare(b, 'es')), [rows]);
  const localidades = useMemo(
    () =>
      [...new Set(rows.filter((r) => ambito !== 'localidad' || !estado || (r.estado ?? SIN_ESTADO) === estado).map((r) => r.localidad))].sort((a, b) =>
        a.localeCompare(b, 'es'),
      ),
    [rows, ambito, estado],
  );

  const vista = useMemo(() => {
    const q = buscar.trim().toLowerCase();
    // El puesto se calcula dentro del ámbito (estado o localidad); la búsqueda y "solo terminados" solo filtran la lista.
    let base = rows;
    if (ambito !== 'global' && estado) base = base.filter((r) => (r.estado ?? SIN_ESTADO) === estado);
    if (ambito === 'localidad' && localidad) base = base.filter((r) => r.localidad === localidad);
    return conPuesto(base).filter((r) => (!soloTerminados || r.terminado) && (!q || r.nombre.toLowerCase().includes(q) || r.cedula.includes(q)));
  }, [rows, ambito, estado, localidad, buscar, soloTerminados]);

  const titulo =
    ambito === 'estado'
      ? estado
        ? `Estado: ${estado}`
        : 'Elige un estado'
      : ambito === 'localidad'
        ? localidad
          ? `Localidad: ${localidad}`
          : 'Elige una localidad'
        : 'Ranking global';
  const terminados = rows.filter((r) => r.terminado).length;
  const pendienteFiltro = (ambito === 'estado' && !estado) || (ambito === 'localidad' && !localidad);
  const totalNiveles = data?.totalNiveles ?? 4;

  return (
    <main className="min-h-[100dvh]">
      <header className="bg-polar-navy px-4 py-5 text-white sm:px-8">
        <div className="mx-auto flex max-w-6xl flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-polar-yellow">Experiencia UEP</p>
            <h1 className="title-display text-[clamp(28px,5vw,40px)] leading-none">Panel de premiación</h1>
          </div>
          <p className="text-sm text-[#CFE3F7]">{data ? `Actualizado ${fecha(data.generadoAt)} · se actualiza cada 30 s` : 'Cargando…'}</p>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-5 sm:px-8">
        <section className="grid grid-cols-2 gap-3 sm:grid-cols-4" aria-label="Resumen">
          <Stat label="Participantes" value={rows.length} />
          <Stat label={`Completaron los ${totalNiveles} niveles`} value={terminados} />
          <Stat label="Localidades con jugadores" value={new Set(rows.map((r) => r.localidad)).size} />
          <Stat label="Mejor puntaje" value={rows[0]?.puntos ?? 0} />
        </section>

        <section className="mt-5 flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm" aria-label="Filtros">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-xl bg-polar-ice p-1" role="tablist" aria-label="Ámbito">
              {(['global', 'estado', 'localidad'] as const).map((a) => (
                <button
                  key={a}
                  role="tab"
                  aria-selected={ambito === a}
                  onClick={() => setAmbito(a)}
                  className={`h-10 rounded-lg px-4 text-sm font-bold ${ambito === a ? 'bg-polar-navy text-white' : 'text-polar-navy'}`}
                >
                  {a === 'global' ? 'Global' : a === 'estado' ? 'Por estado' : 'Por localidad'}
                </button>
              ))}
            </div>
            {ambito !== 'global' && (
              <select
                aria-label="Estado"
                value={estado}
                onChange={(e) => {
                  setEstado(e.target.value);
                  setLocalidad('');
                }}
                className="h-11 rounded-xl border border-[#CBD5E1] bg-white px-3 text-sm font-semibold"
              >
                <option value="">{ambito === 'estado' ? 'Elige un estado' : 'Todos los estados'}</option>
                {estados.map((e) => (
                  <option key={e}>{e}</option>
                ))}
              </select>
            )}
            {ambito === 'localidad' && (
              <select
                aria-label="Localidad"
                value={localidad}
                onChange={(e) => setLocalidad(e.target.value)}
                className="h-11 rounded-xl border border-[#CBD5E1] bg-white px-3 text-sm font-semibold"
              >
                <option value="">Elige una localidad</option>
                {localidades.map((l) => (
                  <option key={l}>{l}</option>
                ))}
              </select>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="search"
              value={buscar}
              onChange={(e) => setBuscar(e.target.value)}
              placeholder="Buscar por nombre o cédula"
              aria-label="Buscar por nombre o cédula"
              className="h-11 min-w-[220px] flex-1 rounded-xl border border-[#CBD5E1] px-3 text-sm"
            />
            <label className="flex items-center gap-2 text-sm font-semibold">
              <input type="checkbox" checked={soloTerminados} onChange={(e) => setSoloTerminados(e.target.checked)} className="h-4 w-4" />
              Solo quienes completaron todo
            </label>
            <button
              type="button"
              disabled={!vista.length || pendienteFiltro}
              onClick={() =>
                descargarCsv(vista, `experiencia-uep-${(ambito === 'global' ? 'global' : localidad || estado || ambito).toLowerCase().replace(/[^a-z0-9]+/gi, '-')}.csv`)
              }
              className="h-11 rounded-xl bg-polar-yellow px-4 text-sm font-extrabold text-polar-navy disabled:opacity-50"
            >
              Descargar CSV
            </button>
          </div>
        </section>

        {error && <p className="mt-4 rounded-xl bg-[#FDE8E8] p-3 text-sm font-semibold text-[#9B1C1C]">{error}</p>}

        <section className="mt-5" aria-label={titulo}>
          <div className="mb-2 flex items-baseline justify-between gap-2">
            <h2 className="text-lg font-extrabold text-polar-navy">{titulo}</h2>
            {!pendienteFiltro && <span className="text-sm text-polar-slate">{vista.length} participantes</span>}
          </div>
          <div className="overflow-x-auto rounded-2xl bg-white shadow-sm">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-[#EEF3FA] text-xs uppercase tracking-wide text-polar-slate">
                <tr>
                  <th className="px-3 py-3 text-right">#</th>
                  <th className="px-3 py-3">Nombre</th>
                  <th className="px-3 py-3">Cédula</th>
                  <th className="px-3 py-3">Localidad</th>
                  <th className="px-3 py-3">Estado</th>
                  <th className="px-3 py-3 text-right">Puntos</th>
                  <th className="px-3 py-3 text-right">Tiempo</th>
                  <th className="px-3 py-3 text-right">Niveles</th>
                  <th className="px-3 py-3">Último nivel</th>
                </tr>
              </thead>
              <tbody>
                {!pendienteFiltro &&
                  vista.map((r) => (
                    <tr key={r.cedula || r.registradoAt} className="border-t border-[#EEF1F5]">
                      <td className="px-3 py-2.5 text-right font-extrabold text-polar-navy">{r.puesto}</td>
                      <td className="px-3 py-2.5 font-semibold">{r.nombre}</td>
                      <td className="px-3 py-2.5 tabular-nums">{r.cedula}</td>
                      <td className="px-3 py-2.5">{r.localidad}</td>
                      <td className="px-3 py-2.5">{r.estado ?? '—'}</td>
                      <td className="px-3 py-2.5 text-right font-extrabold tabular-nums">{r.puntos}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums">{tiempo(r.tiempoMs)}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums">
                        {r.niveles}/{totalNiveles}
                      </td>
                      <td className="px-3 py-2.5 text-polar-slate">{fecha(r.ultimoNivelAt)}</td>
                    </tr>
                  ))}
                {(pendienteFiltro || (data && !vista.length)) && (
                  <tr>
                    <td colSpan={9} className="px-3 py-8 text-center font-semibold text-polar-slate">
                      {pendienteFiltro ? 'Elige un filtro arriba para ver el ranking.' : 'No hay participantes con ese filtro.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-polar-slate">
            Orden: más puntos primero; a igual puntaje, gana quien tardó menos. El tiempo suma lo que tardó en responder cada nivel (desde que arranca el reloj).
          </p>
        </section>
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold text-polar-slate">{label}</p>
      <p className="mt-1 text-[28px] font-black leading-none tabular-nums text-polar-navy">{value.toLocaleString('es-VE')}</p>
    </div>
  );
}
