'use client';

// Reporte de respuestas: qué preguntas costaron más (menos respuestas correctas), qué confundió a la gente
// y cómo le fue a cada localidad. Se ve en la web y se guarda en PDF con el botón (usa la impresión del navegador).
// No muestra nombres ni cédulas: el detalle por persona va solo en el Excel.
import { useCallback, useEffect, useMemo, useState } from 'react';
import { BANCOS, ESTACIONES, type Pregunta } from '@/lib/preguntas';
import type { Conteo, DatosReporte } from '@/lib/tipos';
import { Encabezado } from '../Encabezado';

/** Con menos respuestas que esto el porcentaje no es confiable: se avisa y no entra en "a reforzar". */
const POCAS = 10;
/** Por debajo de este % de acierto, la pregunta se marca para reforzar. */
const UMBRAL = 50;
/** Cuántas preguntas se listan en "Temas a reforzar". */
const TOP = 8;

interface StatPregunta {
  trivia: number;
  idx: number;
  pregunta: Pregunta;
  total: number;
  correctas: number;
  pct: number; // 0..100
  porOpcion: number[];
  peor: number | null; // la opción incorrecta más elegida
}

const pct = (a: number, b: number) => (b ? (a / b) * 100 : 0);
const fmtPct = (v: number) => `${Math.round(v)} %`;
const num = (v: number) => v.toLocaleString('es-VE');
const nombreEst = (id: number) => ESTACIONES.find((e) => e.id === id)?.nombre ?? `Estación ${id}`;

function calcular(conteos: Conteo[], localidad: string): StatPregunta[] {
  const out: StatPregunta[] = [];
  for (const e of ESTACIONES) {
    (BANCOS[e.id] ?? []).forEach((pregunta, idx) => {
      out.push({ trivia: e.id, idx, pregunta, total: 0, correctas: 0, pct: 0, porOpcion: pregunta.options.map(() => 0), peor: null });
    });
  }
  const buscar = new Map(out.map((s) => [`${s.trivia}|${s.idx}`, s]));
  for (const c of conteos) {
    if (localidad && c.localidad !== localidad) continue;
    const s = buscar.get(`${c.trivia}|${c.pregunta}`);
    if (!s) continue;
    s.total += c.n;
    if (c.opcion === s.pregunta.correct) s.correctas += c.n;
    if (c.opcion < s.porOpcion.length) s.porOpcion[c.opcion] += c.n;
  }
  for (const s of out) {
    s.pct = pct(s.correctas, s.total);
    s.porOpcion.forEach((n, i) => {
      if (i !== s.pregunta.correct && n > 0 && (s.peor === null || n > s.porOpcion[s.peor])) s.peor = i;
    });
  }
  return out;
}

const csvEsc = (v: string | number) => {
  const t = String(v);
  return /[";\n\r]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
};
const slug = (v: string) =>
  v
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

function descargarResumen(stats: StatPregunta[], grupo: string) {
  const head = ['Estación', 'Pregunta', 'Respondieron', 'Correctas', '% de acierto', 'Respuesta correcta', 'Incorrecta más elegida', 'Veces elegida', 'Dato a reforzar'];
  const lines = stats
    .filter((s) => s.total)
    .sort((a, b) => a.trivia - b.trivia || a.pct - b.pct)
    .map((s) =>
      [
        `${s.trivia}. ${nombreEst(s.trivia)}`,
        s.pregunta.text,
        s.total,
        s.correctas,
        s.pct.toFixed(1).replace('.', ','),
        s.pregunta.options[s.pregunta.correct],
        s.peor === null ? '' : s.pregunta.options[s.peor],
        s.peor === null ? '' : s.porOpcion[s.peor],
        s.pregunta.ok ?? '',
      ]
        .map(csvEsc)
        .join(';'),
    );
  const blob = new Blob(['﻿' + [head.join(';'), ...lines].join('\r\n')], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `resumen-por-pregunta-${slug(grupo)}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
}

/** El navegador usa el título de la página como nombre del PDF. */
function imprimir(titulo: string) {
  const antes = document.title;
  document.title = titulo;
  window.print();
  document.title = antes;
}

export default function Reporte() {
  const [data, setData] = useState<DatosReporte | null>(null);
  const [error, setError] = useState('');
  const [localidad, setLocalidad] = useState('');
  const [estacion, setEstacion] = useState(0);

  const load = useCallback(() => {
    fetch('/api/reporte', { cache: 'no-store' })
      .then(async (r) => {
        if (r.status === 401) {
          window.location.replace('/entrar');
          return;
        }
        const body = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(body.error ?? 'No pudimos cargar las respuestas');
        setData(body as DatosReporte);
        setError('');
      })
      .catch((e: Error) => setError(e.message));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const conteos = useMemo(() => data?.conteos ?? [], [data]);
  const localidades = useMemo(() => [...new Set(conteos.map((c) => c.localidad))].sort((a, b) => a.localeCompare(b, 'es')), [conteos]);
  const stats = useMemo(() => calcular(conteos, localidad), [conteos, localidad]);

  const porEstacion = ESTACIONES.map((e) => {
    const qs = stats.filter((s) => s.trivia === e.id);
    const total = qs.reduce((a, s) => a + s.total, 0);
    const correctas = qs.reduce((a, s) => a + s.correctas, 0);
    return { ...e, total, correctas, pct: pct(correctas, total), preguntas: qs };
  });
  const enFoco = estacion ? stats.filter((s) => s.trivia === estacion) : stats;
  const total = enFoco.reduce((a, s) => a + s.total, 0);
  const correctas = enFoco.reduce((a, s) => a + s.correctas, 0);
  const confiables = enFoco.filter((s) => s.total >= POCAS);
  const reforzar = [...confiables].sort((a, b) => a.pct - b.pct).slice(0, TOP);
  const bajoUmbral = confiables.filter((s) => s.pct < UMBRAL).length;
  const participantes = data ? (localidad ? data.participantes[localidad] ?? 0 : Object.values(data.participantes).reduce((a, n) => a + n, 0)) : 0;

  const visibles = estacion ? porEstacion.filter((e) => e.id === estacion) : porEstacion;
  const conDatos = porEstacion.filter((e) => e.total);
  const estMasDificil = conDatos.length > 1 ? [...conDatos].sort((a, b) => a.pct - b.pct)[0] : null;
  const masDificil = reforzar[0];

  const grupo = localidad || 'Todo el país';
  const alcance = [grupo, estacion ? `Estación ${estacion} · ${nombreEst(estacion)}` : 'Las 4 estaciones'].join(' · ');
  const fecha = data
    ? new Date(data.generadoAt).toLocaleString('es-VE', { timeZone: 'America/Caracas', dateStyle: 'long', timeStyle: 'short' })
    : '';
  const excelUrl = `/api/reporte/excel?${new URLSearchParams({ ...(localidad && { localidad }), ...(estacion && { estacion: String(estacion) }) })}`;

  return (
    <main className="min-h-[100dvh] pb-12 print:pb-0">
      <Encabezado activo="reporte" estado={data ? `Datos al ${fecha}` : 'Cargando…'} />

      {/* Barra de herramientas: no sale en el PDF */}
      <div className="z-20 border-b border-[#E2E8F0] bg-white/95 backdrop-blur print:hidden lg:sticky lg:top-0">
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-3 px-4 py-3 sm:grid-cols-2 sm:px-8 lg:grid-cols-[1fr_1fr_auto]">
          <Campo label="Localidad">
            <select value={localidad} onChange={(e) => setLocalidad(e.target.value)} className="input">
              <option value="">Todas las localidades</option>
              {localidades.map((l) => (
                <option key={l}>{l}</option>
              ))}
            </select>
          </Campo>
          <Campo label="Estación">
            <select value={estacion} onChange={(e) => setEstacion(Number(e.target.value))} className="input">
              <option value={0}>Las 4 estaciones</option>
              {ESTACIONES.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.id}. {e.nombre}
                </option>
              ))}
            </select>
          </Campo>
          <div className="flex items-end sm:col-span-2 lg:col-span-1">
            <button
              type="button"
              disabled={!total}
              onClick={() => imprimir(`Reporte UEP - ${alcance}`)}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-polar-yellow px-5 text-sm font-extrabold text-polar-navy hover:brightness-95 disabled:opacity-50"
              title="Abre la ventana de impresión: elige «Guardar como PDF»"
            >
              <Icono d="M6 9V3h12v6M6 18H4a1 1 0 0 1-1-1v-6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6a1 1 0 0 1-1 1h-2M7 14h10v7H7z" />
              Guardar PDF
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 sm:px-8 print:max-w-none print:px-0">
        {error && <p className="mt-4 rounded-xl bg-[#FDE8E8] p-3 text-sm font-semibold text-[#9B1C1C] print:hidden">{error}</p>}

        {/* Portada */}
        <section className="mt-8 print:mt-0">
          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-polar-blue">Experiencia UEP · Juego aniversario</p>
          <h2 className="title-display mt-1 text-[clamp(30px,5vw,44px)] leading-[1.05] text-polar-navy">Reporte de respuestas</h2>
          <p className="mt-2 text-sm font-semibold text-polar-slate">
            {alcance}
            {fecha && <span className="font-normal"> · Datos al {fecha}</span>}
          </p>
        </section>

        <section className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4" aria-label="Resumen">
          <Stat label="Participantes que respondieron" value={data ? num(participantes) : '—'} />
          <Stat label="Respuestas analizadas" value={data ? num(total) : '—'} />
          <Stat label="Acierto general" value={total ? fmtPct(pct(correctas, total)) : '—'} />
          <Stat label={`Preguntas con menos de ${UMBRAL} % de acierto`} value={data ? num(bajoUmbral) : '—'} />
        </section>

        {!data && !error && <p className="mt-10 text-center font-semibold text-polar-slate">Cargando respuestas…</p>}
        {data && !total && <p className="mt-10 text-center font-semibold text-polar-slate">Todavía no hay respuestas para estos filtros.</p>}

        {total > 0 && (
          <>
            {/* Hallazgos en texto, para quien no va a leer los gráficos */}
            <Tarjeta titulo="Lo más importante" className="mt-6 border-l-4 border-polar-yellow">
              <ul className="space-y-2 text-[15px] leading-relaxed text-polar-ink">
                <li>
                  En promedio, la gente acertó <b>{fmtPct(pct(correctas, total))}</b> de las preguntas ({num(correctas)} de {num(total)} respuestas).
                </li>
                {estMasDificil && !estacion && (
                  <li>
                    La estación con menos aciertos fue <b>{estMasDificil.nombre}</b> ({fmtPct(estMasDificil.pct)}).
                  </li>
                )}
                {masDificil && (
                  <li>
                    La pregunta más difícil fue «{masDificil.pregunta.text}»: solo acertó el <b>{fmtPct(masDificil.pct)}</b>
                    {masDificil.peor !== null && (
                      <>
                        {' '}
                        y la respuesta incorrecta más elegida fue «{masDificil.pregunta.options[masDificil.peor]}» (
                        {fmtPct(pct(masDificil.porOpcion[masDificil.peor], masDificil.total))})
                      </>
                    )}
                    .
                  </li>
                )}
                <li>
                  {bajoUmbral ? (
                    <>
                      <b>{num(bajoUmbral)}</b> {bajoUmbral === 1 ? 'pregunta tiene' : 'preguntas tienen'} menos de {UMBRAL} % de acierto: son los temas que
                      más conviene reforzar (se detallan abajo).
                    </>
                  ) : (
                    <>Ninguna pregunta quedó por debajo de {UMBRAL} % de acierto.</>
                  )}
                </li>
              </ul>
            </Tarjeta>

            {/* Comparación entre estaciones */}
            {!estacion && (
              <Tarjeta titulo="Acierto por estación" subtitulo="Porcentaje de respuestas correctas en cada estación." className="mt-6">
                <div className="space-y-4">
                  {porEstacion.map((e) => (
                    <div key={e.id} className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1.5 sm:grid-cols-[13rem_1fr_7.5rem]">
                      <span className="text-sm font-bold text-polar-ink">
                        <span className="mr-1.5 text-polar-slate">{e.id}.</span>
                        {e.nombre}
                      </span>
                      <span className="col-span-2 row-start-2 sm:col-span-1 sm:row-start-auto">
                        <Medidor valor={e.pct} vacio={!e.total} alto titulo={`${num(e.correctas)} de ${num(e.total)} correctas`} />
                      </span>
                      <span className="row-start-1 text-right tabular-nums sm:row-start-auto">
                        <b className="text-lg text-polar-navy">{e.total ? fmtPct(e.pct) : '—'}</b>
                        <span className="ml-1.5 text-xs text-polar-slate">{num(e.total)} resp.</span>
                      </span>
                    </div>
                  ))}
                </div>
              </Tarjeta>
            )}

            {/* Temas a reforzar */}
            {reforzar.length > 0 && (
              <section className="mt-8 break-before-page" aria-label="Temas a reforzar">
                <h3 className="text-xl font-black text-polar-navy">Temas a reforzar</h3>
                <p className="mt-1 text-sm text-polar-slate">
                  Las {reforzar.length} preguntas con menos aciertos (con al menos {POCAS} respuestas), con el dato correcto para comunicar.
                </p>
                <ol className="mt-4 space-y-3">
                  {reforzar.map((s, i) => (
                    <li key={`${s.trivia}-${s.idx}`} className="break-inside-avoid rounded-2xl bg-white p-4 shadow-sm print:border print:border-[#E2E8F0] print:shadow-none sm:p-5">
                      <div className="flex gap-4">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-polar-navy text-sm font-black text-white">{i + 1}</span>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold uppercase tracking-wide text-polar-slate">
                            Estación {s.trivia} · {nombreEst(s.trivia)}
                          </p>
                          <p className="mt-0.5 font-bold text-polar-ink">{s.pregunta.text}</p>
                          <div className="mt-3 flex items-center gap-3">
                            <Medidor valor={s.pct} alto titulo={`${num(s.correctas)} de ${num(s.total)} correctas`} />
                            <span className="w-24 shrink-0 text-right text-sm tabular-nums text-polar-slate">
                              <b className="text-lg text-polar-navy">{fmtPct(s.pct)}</b> acertó
                            </span>
                          </div>
                          <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                            <div className="rounded-xl bg-[#EAF6EF] p-3">
                              <dt className="text-xs font-bold uppercase tracking-wide text-[#0B6B34]">✓ Respuesta correcta</dt>
                              <dd className="mt-0.5 font-semibold text-polar-ink">{s.pregunta.options[s.pregunta.correct]}</dd>
                            </div>
                            {s.peor !== null && (
                              <div className="rounded-xl bg-[#FFF4D6] p-3">
                                <dt className="text-xs font-bold uppercase tracking-wide text-[#7A4B00]">✕ Confusión más común · {fmtPct(pct(s.porOpcion[s.peor], s.total))}</dt>
                                <dd className="mt-0.5 font-semibold text-polar-ink">{s.pregunta.options[s.peor]}</dd>
                              </div>
                            )}
                          </dl>
                          {s.pregunta.ok && (
                            <p className="mt-2 text-sm text-polar-slate">
                              <b className="text-polar-navy">Dato a reforzar:</b> {s.pregunta.ok}
                            </p>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ol>
              </section>
            )}

            {/* Detalle por estación */}
            {visibles.map((e) => (
              <section key={e.id} className="mt-8 break-before-page" aria-label={e.nombre}>
                <div className="flex flex-wrap items-end justify-between gap-2">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-polar-blue">Estación {e.id}</p>
                    <h3 className="text-xl font-black text-polar-navy">{e.nombre}</h3>
                  </div>
                  <p className="text-sm text-polar-slate">
                    {e.total ? (
                      <>
                        <b className="text-lg text-polar-navy">{fmtPct(e.pct)}</b> de acierto · {num(e.total)} respuestas
                      </>
                    ) : (
                      'Sin respuestas'
                    )}
                  </p>
                </div>
                <p className="mt-1 text-sm text-polar-slate print:hidden">De la más difícil a la más fácil. Toca una pregunta para ver cómo se repartieron las respuestas.</p>
                <p className="mt-1 hidden text-sm text-polar-slate print:block">De la más difícil a la más fácil.</p>
                <div className="mt-3 overflow-hidden rounded-2xl bg-white shadow-sm print:border print:border-[#E2E8F0] print:shadow-none">
                  <div className="hidden grid-cols-[minmax(0,1fr)_14rem] gap-4 border-b border-[#EEF1F5] bg-[#F6F8FC] px-4 py-2 text-xs font-bold uppercase tracking-wide text-polar-slate sm:grid">
                    <span>Pregunta</span>
                    <span>Respuestas correctas</span>
                  </div>
                  <ol className="divide-y divide-[#EEF1F5]">
                    {[...e.preguntas]
                      .sort((a, b) => Number(!a.total) - Number(!b.total) || a.pct - b.pct || b.total - a.total)
                      .map((s) => (
                        <FilaPregunta key={s.idx} s={s} />
                      ))}
                  </ol>
                </div>
              </section>
            ))}

            {/* Por localidad */}
            {!localidad && <PorLocalidad conteos={conteos} participantes={data?.participantes ?? {}} estacion={estacion} />}
          </>
        )}

        <div className="mt-8 break-inside-avoid rounded-2xl border border-[#E2E8F0] bg-white p-4 text-sm text-polar-slate">
          <p className="font-bold text-polar-navy">Cómo se calculó</p>
          <p className="mt-1">
            A cada participante le tocaron 3 preguntas al azar del banco de cada estación, por eso no todas las preguntas tienen la misma cantidad de
            respuestas. El acierto es el porcentaje de respuestas correctas sobre las respondidas; las que quedaron sin responder porque se acabó el
            tiempo no se cuentan. Con menos de {POCAS} respuestas el porcentaje no es confiable: se marca como «pocas respuestas» y no entra en los temas
            a reforzar. No incluye las cuentas de prueba.
          </p>
        </div>

        {/* Descargas: solo en la web */}
        <section className="mt-6 grid gap-3 print:hidden sm:grid-cols-2" aria-label="Descargas">
          <a href={excelUrl} className="flex items-center gap-3 rounded-2xl border-2 border-polar-navy bg-white p-4 hover:bg-[#EEF3FA]">
            <Icono d="M12 3v12M7 10l5 5 5-5M5 21h14" />
            <span>
              <b className="block text-polar-navy">Excel por participante</b>
              <span className="text-sm text-polar-slate">Qué respondió cada persona, pregunta por pregunta (incluye cédula y nombre).</span>
            </span>
          </a>
          <button
            type="button"
            onClick={() => descargarResumen(enFoco, grupo)}
            className="flex items-center gap-3 rounded-2xl border-2 border-polar-navy bg-white p-4 text-left hover:bg-[#EEF3FA]"
          >
            <Icono d="M12 3v12M7 10l5 5 5-5M5 21h14" />
            <span>
              <b className="block text-polar-navy">Excel resumen por pregunta</b>
              <span className="text-sm text-polar-slate">% de acierto, confusión más común y dato a reforzar de cada pregunta.</span>
            </span>
          </button>
        </section>
      </div>
    </main>
  );
}

function FilaPregunta({ s }: { s: StatPregunta }) {
  const pocas = s.total > 0 && s.total < POCAS;
  const reforzar = s.total >= POCAS && s.pct < UMBRAL;
  return (
    <li className="break-inside-avoid">
      <details className="group">
        <summary className="grid cursor-pointer list-none gap-2 px-4 py-3 hover:bg-[#F8FAFD] sm:grid-cols-[minmax(0,1fr)_14rem] sm:items-center sm:gap-4 [&::-webkit-details-marker]:hidden">
          <div className="min-w-0">
            <p className="text-sm font-bold text-polar-ink">
              {s.pregunta.text}
              {reforzar && (
                <span className="ml-2 inline-flex translate-y-[-1px] items-center gap-1 rounded-full bg-[#FFF4D6] px-2 py-0.5 text-[11px] font-extrabold text-[#7A4B00]">
                  <span aria-hidden>▲</span> Reforzar
                </span>
              )}
            </p>
            <p className="mt-0.5 text-xs text-polar-slate">
              {s.total ? `${num(s.total)} respuestas` : 'Nadie la respondió'}
              {pocas && ' · pocas respuestas'}
              {s.peor !== null && s.pct < 100 && (
                <>
                  {' · '}Más elegida entre las incorrectas: «{s.pregunta.options[s.peor]}» ({fmtPct(pct(s.porOpcion[s.peor], s.total))})
                </>
              )}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Medidor valor={s.pct} vacio={!s.total} tenue={pocas} titulo={`${num(s.correctas)} de ${num(s.total)} correctas`} />
            <span className="w-11 shrink-0 text-right text-sm font-black tabular-nums text-polar-navy">{s.total ? fmtPct(s.pct) : '—'}</span>
            <span className="text-polar-slate transition-transform group-open:rotate-180 print:hidden" aria-hidden>
              ▾
            </span>
          </div>
        </summary>
        <div className="bg-[#FAFBFD] px-4 pb-4 pt-2 print:hidden">
          <p className="text-xs font-bold uppercase tracking-wide text-polar-slate">Cómo se repartieron las respuestas</p>
          <ul className="mt-2 space-y-2">
            {s.pregunta.options.map((op, i) => {
              const esCorrecta = i === s.pregunta.correct;
              const v = pct(s.porOpcion[i], s.total);
              return (
                <li key={i} className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1 sm:grid-cols-[minmax(0,1fr)_10rem_5.5rem]">
                  <span className={`text-sm ${esCorrecta ? 'font-bold' : ''} text-polar-ink`}>
                    {esCorrecta && <span className="mr-1 font-black text-[#0B6B34]">✓ Correcta:</span>}
                    {op}
                  </span>
                  <span className="col-span-2 row-start-2 sm:col-span-1 sm:row-start-auto">
                    <Medidor valor={v} vacio={!s.total} tenue={!esCorrecta} titulo={`${num(s.porOpcion[i])} personas`} />
                  </span>
                  <span className="row-start-1 text-right text-sm tabular-nums text-polar-slate sm:row-start-auto">
                    <b className="text-polar-ink">{fmtPct(v)}</b> ({num(s.porOpcion[i])})
                  </span>
                </li>
              );
            })}
          </ul>
          {s.pregunta.ok && (
            <p className="mt-3 rounded-xl bg-[#EEF3FA] p-3 text-sm text-polar-navy">
              <b>Dato a reforzar:</b> {s.pregunta.ok}
            </p>
          )}
        </div>
      </details>
    </li>
  );
}

// Escala de un solo tono (azul) para la tabla por localidad: más oscuro = más acierto.
const ESCALA = [
  { desde: 0, fondo: '#EEF3FA', texto: '#1E1E1E' },
  { desde: 50, fondo: '#C7D9EE', texto: '#1E1E1E' },
  { desde: 60, fondo: '#8FB2DA', texto: '#1E1E1E' },
  { desde: 70, fondo: '#3F78BD', texto: '#FFFFFF' },
  { desde: 80, fondo: '#0351A3', texto: '#FFFFFF' },
];
const tono = (v: number) => [...ESCALA].reverse().find((e) => v >= e.desde) ?? ESCALA[0];

function PorLocalidad({ conteos, participantes, estacion }: { conteos: Conteo[]; participantes: Record<string, number>; estacion: number }) {
  const filas = useMemo(() => {
    const m = new Map<string, { total: number; ok: number; est: Record<number, { total: number; ok: number }> }>();
    for (const c of conteos) {
      const correcta = BANCOS[c.trivia]?.[c.pregunta]?.correct === c.opcion;
      let f = m.get(c.localidad);
      if (!f) m.set(c.localidad, (f = { total: 0, ok: 0, est: {} }));
      const e = (f.est[c.trivia] ??= { total: 0, ok: 0 });
      e.total += c.n;
      if (correcta) e.ok += c.n;
      if (!estacion || c.trivia === estacion) {
        f.total += c.n;
        if (correcta) f.ok += c.n;
      }
    }
    return [...m]
      .map(([localidad, f]) => ({ localidad, ...f, pct: pct(f.ok, f.total) }))
      .filter((f) => f.total >= POCAS)
      .sort((a, b) => b.pct - a.pct || b.total - a.total);
  }, [conteos, estacion]);
  const fuera = new Set(conteos.map((c) => c.localidad)).size - filas.length;
  const cols = estacion ? ESTACIONES.filter((e) => e.id === estacion) : ESTACIONES;
  if (!filas.length) return null;

  return (
    <section className="mt-8 break-before-page" aria-label="Por localidad">
      <h3 className="text-xl font-black text-polar-navy">Acierto por localidad</h3>
      <p className="mt-1 text-sm text-polar-slate">
        Ordenadas de mayor a menor acierto{estacion ? ` en la estación ${estacion}` : ''}.
        {fuera > 0 && ` No se muestran ${fuera} localidades con menos de ${POCAS} respuestas.`}
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-polar-slate" aria-label="Escala de colores">
        <span className="font-bold">Acierto:</span>
        {ESCALA.map((e, i) => (
          <span key={e.desde} className="flex items-center gap-1">
            <span className="h-3 w-5 rounded-sm" style={{ background: e.fondo }} />
            {i === 0 ? `menos de ${ESCALA[1].desde} %` : i === ESCALA.length - 1 ? `${e.desde} % o más` : `${e.desde}–${ESCALA[i + 1].desde - 1} %`}
          </span>
        ))}
      </div>
      <div className="mt-3 overflow-x-auto rounded-2xl bg-white shadow-sm print:overflow-visible print:border print:border-[#E2E8F0] print:shadow-none">
        <table className="w-full min-w-[640px] border-separate border-spacing-0 text-left text-sm print:min-w-0">
          <thead className="bg-[#F6F8FC] text-xs font-bold uppercase tracking-wide text-polar-slate">
            <tr>
              <th className="px-4 py-2.5">Localidad</th>
              <th className="px-3 py-2.5 text-right">Participantes</th>
              {cols.map((e) => (
                <th key={e.id} className="px-2 py-2.5 text-center" title={e.nombre}>
                  Est. {e.id}
                </th>
              ))}
              {!estacion && <th className="px-3 py-2.5 text-center">Total</th>}
            </tr>
          </thead>
          <tbody>
            {filas.map((f) => (
              <tr key={f.localidad} className="break-inside-avoid">
                <td className="border-t border-[#EEF1F5] px-4 py-2 font-semibold text-polar-ink">{f.localidad}</td>
                <td className="border-t border-[#EEF1F5] px-3 py-2 text-right tabular-nums text-polar-slate">{num(participantes[f.localidad] ?? 0)}</td>
                {cols.map((e) => {
                  const d = f.est[e.id];
                  return <Celda key={e.id} total={d?.total ?? 0} ok={d?.ok ?? 0} />;
                })}
                {!estacion && <Celda total={f.total} ok={f.ok} fuerte />}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Celda({ total, ok, fuerte }: { total: number; ok: number; fuerte?: boolean }) {
  if (!total) return <td className="border-t border-[#EEF1F5] px-2 py-2 text-center text-polar-slate">—</td>;
  const v = pct(ok, total);
  const t = tono(v);
  return (
    <td className="border-t border-white p-0.5" title={`${num(ok)} de ${num(total)} correctas`}>
      <span
        className={`block rounded-md px-2 py-1.5 text-center tabular-nums ${fuerte ? 'font-black' : 'font-semibold'} ${total < POCAS ? 'opacity-60' : ''}`}
        style={{ background: t.fondo, color: t.texto }}
      >
        {fmtPct(v)}
      </span>
    </td>
  );
}

/** Barra horizontal de 0 a 100 %: una sola tinta (azul) sobre una pista gris. */
function Medidor({ valor, vacio, tenue, alto, titulo }: { valor: number; vacio?: boolean; tenue?: boolean; alto?: boolean; titulo?: string }) {
  return (
    <span
      className={`block w-full flex-1 overflow-hidden rounded-full bg-[#E2E8F0] ${alto ? 'h-3.5' : 'h-2.5'}`}
      role="img"
      aria-label={vacio ? 'Sin respuestas' : fmtPct(valor)}
      title={titulo}
    >
      {!vacio && valor > 0 && (
        <span className={`block h-full rounded-full ${tenue ? 'bg-[#8FB2DA]' : 'bg-polar-blue'}`} style={{ width: `${Math.max(valor, 2)}%` }} />
      )}
    </span>
  );
}

function Tarjeta({ titulo, subtitulo, className = '', children }: { titulo: string; subtitulo?: string; className?: string; children: React.ReactNode }) {
  return (
    <section className={`break-inside-avoid rounded-2xl bg-white p-5 shadow-sm print:border print:border-[#E2E8F0] print:shadow-none sm:p-6 ${className}`} aria-label={titulo}>
      <h3 className="text-sm font-extrabold uppercase tracking-wider text-polar-slate">{titulo}</h3>
      {subtitulo && <p className="mt-1 text-sm text-polar-slate">{subtitulo}</p>}
      <div className="mt-4">{children}</div>
    </section>
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
    <div className="break-inside-avoid rounded-2xl bg-white p-4 shadow-sm print:border print:border-[#E2E8F0] print:shadow-none">
      <p className="text-xs font-semibold leading-snug text-polar-slate">{label}</p>
      <p className="mt-1.5 text-[28px] font-black leading-none tabular-nums text-polar-navy">{value}</p>
    </div>
  );
}

function Icono({ d }: { d: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="shrink-0">
      <path d={d} />
    </svg>
  );
}
