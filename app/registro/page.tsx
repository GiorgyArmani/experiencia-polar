'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { COLORES, DEFAULT_ICONO, SIMBOLOS, simboloLabel, type Icono } from '@/shared/icono';
import type { Sede } from '@/shared/types';
import { PlayerIcon, SimboloSvg } from '@/components/PlayerIcon';
import { Logos, Screen, Spinner, Stepper } from '@/components/ui';
import { Destello } from '@/components/Cargando';

export default function Registro() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [icono, setIcono] = useState<Icono>(DEFAULT_ICONO);
  const [apodo, setApodo] = useState('');
  const [form, setForm] = useState({ nombre: '', cedula: '', email: '', sede: '' });
  const [sedes, setSedes] = useState<Sede[] | null>(null);
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    api
      .me()
      .then((r) => {
        if (r.player) return router.replace('/jugar');
        setSedes(r.sedes);
      })
      .catch(() => setSedes([]));
  }, [router]);

  if (!sedes) {
    return (
      <Screen>
        <Spinner />
      </Screen>
    );
  }

  function next() {
    if (!apodo.trim()) {
      setError('Escribe tu apodo para continuar');
      return;
    }
    setError('');
    setStep(2);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setError('');
    try {
      await api.register({ ...form, apodo: apodo.trim(), icono });
      router.push('/reglas');
    } catch (err) {
      setError((err as Error).message);
      setSending(false);
    }
  }

  if (step === 1) {
    return (
      <Screen>
        <Stepper step={1} />
        <h1 className="title-display mt-3 text-center text-[30px]">Elige tu ícono</h1>

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

        <div className="mx-auto mt-5 flex w-[min(340px,90vw)] flex-col gap-1.5">
          <label htmlFor="apodo" className="text-sm font-extrabold uppercase tracking-wide">
            Tu apodo en el ranking
          </label>
          <input
            id="apodo"
            value={apodo}
            onChange={(e) => setApodo(e.target.value)}
            maxLength={24}
            placeholder="Ej. Mari"
            autoComplete="off"
            className="h-[54px] rounded-full border-[3px] border-white bg-white px-[22px] text-lg font-bold text-polar-ink shadow-input-blue outline-none placeholder:text-[#8A8A8A]"
          />
        </div>

        {error && <p role="alert" className="mx-auto mt-2 w-[min(340px,90vw)] text-sm font-bold text-polar-ink">{error}</p>}

        <div className="mx-auto mt-auto grid w-full max-w-[344px] grid-cols-3 gap-3 px-4 pt-5">
          <Link href="/" className="btn-ghost">Atrás</Link>
          <button type="button" onClick={next} className="btn-game col-span-2">¡Este soy yo!</button>
        </div>
        <p className="mt-4 text-center text-sm font-semibold">
          ¿Ya jugaste en otro teléfono?{' '}
          <Link href="/entrar" className="font-extrabold underline">
            Entra con tu cédula
          </Link>
        </p>
        <Logos className="mt-2 pb-4" />
      </Screen>
    );
  }

  return (
    <Screen>
      <Stepper step={2} />
      <h1 className="title-display mt-3 text-center text-[30px]">Tus datos</h1>

      <form id="datos" onSubmit={submit} className="mx-4 mt-3 flex flex-col gap-6 rounded-[20px] bg-white px-6 py-5 text-polar-ink">
        <div className="flex items-center gap-3 border-b border-[#E3E3E3] pb-3.5">
          <PlayerIcon icono={icono} size={52} />
          <div className="flex flex-col">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#5A5A5A]">Tu apodo</span>
            <span className="text-lg font-extrabold">{apodo}</span>
          </div>
        </div>
        <Field id="cedula" label="Cédula" inputMode="numeric" autoComplete="off" value={form.cedula} onChange={(v) => setForm({ ...form, cedula: v })} placeholder="12345678" />
        <Field id="nombre" label="Nombre completo" autoComplete="name" value={form.nombre} onChange={(v) => setForm({ ...form, nombre: v })} placeholder="María Pérez" />
        <Field id="email" label="Correo electrónico (opcional)" type="email" autoComplete="email" required={false} value={form.email} onChange={(v) => setForm({ ...form, email: v })} placeholder="tu@correo.com" />
        <div className="relative">
          <label htmlFor="sede" className="field-label">Localidad</label>
          <select id="sede" required value={form.sede} onChange={(e) => setForm({ ...form, sede: e.target.value })} className="field">
            <option value="" disabled>Selecciona tu localidad</option>
            {sedes.map((s) => (
              <option key={s.code} value={s.name}>{s.name}</option>
            ))}
          </select>
        </div>
        <p className="-mt-2 text-[13px] text-polar-muted">Usamos tus datos solo para el juego.</p>
      </form>

      {error && <p role="alert" className="mx-6 mt-3 rounded-xl bg-polar-ink px-4 py-2 text-sm font-bold">{error}</p>}

      <div className="mx-auto mt-auto grid w-full max-w-[344px] grid-cols-3 gap-3 px-4 pt-5">
        <button type="button" onClick={() => setStep(1)} className="btn-ghost">Atrás</button>
        <button type="submit" form="datos" disabled={sending} className="btn-game col-span-2">
          {sending ? (
            <>
              <Destello size={20} color="#0E0C4E" /> Registrando…
            </>
          ) : (
            'Terminar registro'
          )}
        </button>
      </div>
      <Logos className="mt-2 pb-4" />
    </Screen>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  autoComplete,
  inputMode,
  required = true,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode'];
  required?: boolean;
}) {
  return (
    <div className="relative">
      <label htmlFor={id} className="field-label">{label}</label>
      <input
        id={id}
        type={type}
        required={required}
        inputMode={inputMode}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="field"
      />
    </div>
  );
}
