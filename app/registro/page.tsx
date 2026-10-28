'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { COLORES, DEFAULT_ICONO, SIMBOLOS, simboloLabel, type Icono } from '@/shared/icono';
import { PlayerIcon, SimboloSvg } from '@/components/PlayerIcon';
import { Logos, Screen, Spinner } from '@/components/ui';
import { CARGA_MIN_MS, Destello, useTiempoMinimo } from '@/components/Cargando';

// Primera vez: después de entrar con la cédula, el jugador elige su ícono (lo que lo identifica en el mapa y el ranking).
export default function Registro() {
  const router = useRouter();
  const [icono, setIcono] = useState<Icono>(DEFAULT_ICONO);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const cargaVista = useTiempoMinimo(CARGA_MIN_MS.pantalla);

  useEffect(() => {
    api
      .me()
      .then((r) => {
        if (!r.player) return router.replace('/');
        setIcono(r.player.icono);
        setReady(true);
      })
      .catch(() => router.replace('/'));
  }, [router]);

  if (!ready || !cargaVista) {
    return (
    <Screen>
      <Spinner />
    </Screen>
  );
  }

  async function guardar() {
  setSending(true);
  setError('');
  try {
    await api.icono(icono);
    router.push('/reglas');
  } catch (err) {
    setError((err as Error).message);
    setSending(false);
  }
  }

  return (
    <Screen>
      <h1 className="title-display mt-8 text-center text-[clamp(30px,10vw,40px)] leading-none text-polar-navy">Elige tu ícono</h1>

      <div className="mx-auto mt-3 flex items-center justify-center">
        <PlayerIcon key={`${icono.simbolo}-${icono.color}`} icono={icono} size={136} className="animate-pop border-[5px] shadow-[0_6px_18px_rgba(14,12,78,0.28)]" title={`Tu ícono: ${simboloLabel(icono.simbolo)}`} />
      </div>

      {/* Tarjeta blanca para que los arcos del fondo no se crucen con los símbolos y colores. */}
      <div className="card-uep mx-auto mt-4 flex w-[min(360px,92vw)] flex-col gap-4 p-4">
      <fieldset>
        <legend className="mb-2 text-sm font-extrabold uppercase tracking-wide text-polar-blue">Símbolo</legend>
        <div className="grid grid-cols-5 gap-2">
          {SIMBOLOS.map((s) => {
            const on = s.id === icono.simbolo;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setIcono({ ...icono, simbolo: s.id })}
                aria-label={s.label}
                aria-pressed={on}
                className={`flex aspect-square items-center justify-center rounded-[14px] border-2 border-polar-navy transition-transform active:translate-y-[2px] ${
                  on ? 'bg-polar-blue text-white shadow-[0_4px_10px_rgba(14,12,78,0.3)]' : 'bg-white text-polar-navy'
                }`}
              >
                <SimboloSvg id={s.id} bg={on ? '#0351A3' : '#FFFFFF'} className="h-[56%] w-[56%]" />
              </button>
            );
          })}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-2 text-sm font-extrabold uppercase tracking-wide text-polar-blue">Color</legend>
        <div className="grid grid-cols-8 gap-1.5">
          {COLORES.map((c) => {
            const on = c.id === icono.color;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setIcono({ ...icono, color: c.id })}
                aria-label={c.label}
                aria-pressed={on}
                className={`aspect-square w-full rounded-full border-[3px] border-white ${on ? 'ring-[3px] ring-polar-navy' : 'shadow-[0_2px_6px_rgba(14,12,78,0.3)]'}`}
                style={{ background: c.bg }}
              />
            );
          })}
        </div>
      </fieldset>
      </div>

      {error && <p role="alert" className="mx-auto mt-2 w-[min(340px,90vw)] rounded-[16px] bg-polar-navy px-4 py-2 text-sm font-bold text-white">{error}</p>}

      <div className="mx-auto mt-auto w-full max-w-[344px] px-4 pt-5">
        <button type="button" onClick={guardar} disabled={sending} className="btn-uep w-full">
          {sending ? (
            <>
              <Destello size={20} color="#FFFFFF" /> Guardando…
            </>
          ) : (
            'Seleccionar'
          )}
        </button>
      </div>
      <Logos className="mt-2 pb-4" />
    </Screen>
  );
}
