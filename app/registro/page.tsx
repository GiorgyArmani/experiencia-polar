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
      <h1 className="title-display mt-8 text-center text-[30px]">Elige tu ícono</h1>

      <div className="mx-auto mt-3 flex items-center justify-center">
        <PlayerIcon key={`${icono.simbolo}-${icono.color}`} icono={icono} size={136} className="animate-pop border-[5px]" title={`Tu ícono: ${simboloLabel(icono.simbolo)}`} />
      </div>

      <fieldset className="mx-auto mt-4 w-[min(340px,90vw)]">
        <legend className="mb-2 text-sm font-extrabold uppercase tracking-wide">Símbolo</legend>
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
                className={`flex aspect-square items-center justify-center rounded-2xl transition-transform active:translate-y-[2px] ${
                  on ? 'bg-polar-yellow text-polar-navy shadow-game-sm' : 'bg-polar-card text-white'
                }`}
              >
                <SimboloSvg id={s.id} bg={on ? '#FFCC53' : '#003088'} className="h-[56%] w-[56%]" />
              </button>
            );
          })}
        </div>
      </fieldset>

      <fieldset className="mx-auto mt-4 w-[min(340px,90vw)]">
        <legend className="mb-2 text-sm font-extrabold uppercase tracking-wide">Color</legend>
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
                className={`aspect-square w-full rounded-full border-[3px] ${on ? 'border-white ring-4 ring-polar-yellow' : 'border-white/70'}`}
                style={{ background: c.bg }}
              />
            );
          })}
        </div>
      </fieldset>

      {error && <p role="alert" className="mx-auto mt-2 w-[min(340px,90vw)] text-sm font-bold text-polar-ink">{error}</p>}

      <div className="mx-auto mt-auto w-full max-w-[344px] px-4 pt-5">
        <button type="button" onClick={guardar} disabled={sending} className="btn-game w-full">
          {sending ? (
            <>
              <Destello size={20} color="#0E0C4E" /> Guardando…
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
