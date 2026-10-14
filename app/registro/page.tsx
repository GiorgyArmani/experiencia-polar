'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { lookById, stepLook, type LookId } from '@/lib/looks';
import { Chevron, Logos, Screen, Spinner, Stepper } from '@/components/ui';

export default function Registro() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [look, setLook] = useState<LookId>('clasico');
  const [osoNombre, setOsoNombre] = useState('');
  const [form, setForm] = useState({ nombre: '', email: '', telefono: '', sede: '' });
  const [sedes, setSedes] = useState<string[] | null>(null);
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    api
      .me()
      .then((r) => {
        if (r.player) router.replace('/jugar');
        else setSedes(r.sedes);
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

  const current = lookById(look);

  function next() {
    if (!osoNombre.trim()) {
      setError('Ponle nombre a tu oso para continuar');
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
      await api.register({ ...form, osoNombre: osoNombre.trim(), look });
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
        <h1 className="mt-3 text-center text-[26px] font-black uppercase">Crea tu oso</h1>

        <div className="relative mx-auto mt-3 w-full px-[22px]">
          <div className="mx-auto aspect-[314/470] w-[min(314px,72vw)] rounded-[20px] border-4 border-white bg-polar-card p-[7px]">
            <div className="relative h-full w-full overflow-hidden rounded-[20px] border-4 border-white bg-polar-sky">
              <Image src={current.src} alt={`Tu oso: ${current.head}, ${current.body}`} fill sizes="320px" className="object-cover object-[center_35%]" priority />
              <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5">
                <span className="rounded-full bg-polar-ink px-3 py-1.5 text-xs font-extrabold uppercase tracking-wide">Cabeza · {current.head}</span>
                <span className="rounded-full bg-polar-ink px-3 py-1.5 text-xs font-extrabold uppercase tracking-wide">Ropa · {current.body}</span>
              </div>
            </div>
          </div>

          <ArrowRow
            className="top-[16%]"
            labelPrev="Cabeza anterior"
            labelNext="Cabeza siguiente"
            onPrev={() => setLook(stepLook(look, 'head', -1))}
            onNext={() => setLook(stepLook(look, 'head', 1))}
          />
          <ArrowRow
            className="top-[52%]"
            labelPrev="Ropa anterior"
            labelNext="Ropa siguiente"
            onPrev={() => setLook(stepLook(look, 'body', -1))}
            onNext={() => setLook(stepLook(look, 'body', 1))}
          />
        </div>

        <div className="mx-auto mt-4 flex w-[min(314px,80vw)] flex-col gap-1.5">
          <label htmlFor="oso" className="text-sm font-extrabold uppercase tracking-wide">
            Ponle nombre a tu oso
          </label>
          <input
            id="oso"
            value={osoNombre}
            onChange={(e) => setOsoNombre(e.target.value)}
            maxLength={24}
            placeholder="Ej. Copo"
            autoComplete="off"
            className="h-[54px] rounded-full border-[3px] border-white bg-white px-[22px] text-lg font-bold text-polar-ink shadow-input-blue outline-none placeholder:text-[#8A8A8A]"
          />
        </div>

        {error && <p role="alert" className="mx-auto mt-2 w-[min(314px,80vw)] text-sm font-bold text-polar-ink">{error}</p>}

        <div className="mx-auto mt-auto grid w-full max-w-[344px] grid-cols-3 gap-3 px-4 pt-5">
          <Link href="/" className="btn-ghost">Atrás</Link>
          <button type="button" onClick={next} className="btn-game col-span-2">¡Este es mi oso!</button>
        </div>
        <Logos className="mt-2 pb-4" />
      </Screen>
    );
  }

  return (
    <Screen>
      <Stepper step={2} />
      <h1 className="mt-3 text-center text-[26px] font-black uppercase">Tus datos</h1>

      <form id="datos" onSubmit={submit} className="mx-4 mt-3 flex flex-col gap-6 rounded-[20px] bg-white px-6 py-5 text-polar-ink">
        <div className="flex items-center gap-3 border-b border-[#E3E3E3] pb-3.5">
          <Image src={current.src} alt="" width={52} height={52} className="h-[52px] w-[52px] rounded-full border-[3px] border-polar-blue object-cover object-[center_18%]" />
          <div className="flex flex-col">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#5A5A5A]">Tu oso</span>
            <span className="text-lg font-extrabold">{osoNombre}</span>
          </div>
        </div>
        <Field id="nombre" label="Nombre y apellido" autoComplete="name" value={form.nombre} onChange={(v) => setForm({ ...form, nombre: v })} placeholder="María Pérez" />
        <Field id="email" label="Correo electrónico" type="email" autoComplete="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} placeholder="tu@correo.com" />
        <Field id="telf" label="Teléfono" type="tel" autoComplete="tel" value={form.telefono} onChange={(v) => setForm({ ...form, telefono: v })} placeholder="0414 000 0000" />
        <div className="relative">
          <label htmlFor="sede" className="field-label">Sede</label>
          <select id="sede" required value={form.sede} onChange={(e) => setForm({ ...form, sede: e.target.value })} className="field">
            <option value="" disabled>Selecciona tu sede</option>
            {sedes.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <p className="-mt-2 text-[13px] text-polar-muted">Usamos tus datos solo para el juego y la entrega de premios.</p>
      </form>

      {error && <p role="alert" className="mx-6 mt-3 rounded-xl bg-polar-ink px-4 py-2 text-sm font-bold">{error}</p>}

      <div className="mx-auto mt-auto grid w-full max-w-[344px] grid-cols-3 gap-3 px-4 pt-5">
        <button type="button" onClick={() => setStep(1)} className="btn-ghost">Atrás</button>
        <button type="submit" form="datos" disabled={sending} className="btn-game col-span-2">
          {sending ? 'Registrando…' : 'Terminar registro'}
        </button>
      </div>
      <Logos className="mt-2 pb-4" />
    </Screen>
  );
}

function ArrowRow({
  className,
  onPrev,
  onNext,
  labelPrev,
  labelNext,
}: {
  className: string;
  onPrev: () => void;
  onNext: () => void;
  labelPrev: string;
  labelNext: string;
}) {
  const btn =
    'flex h-[60px] w-[60px] items-center justify-center rounded-full bg-white text-polar-blue shadow-arrow transition-transform active:translate-y-[3px] active:shadow-none';
  return (
    <div className={`pointer-events-none absolute inset-x-0 flex justify-between px-[18px] ${className}`}>
      <button type="button" onClick={onPrev} aria-label={labelPrev} className={`pointer-events-auto ${btn}`}>
        <Chevron dir="left" />
      </button>
      <button type="button" onClick={onNext} aria-label={labelNext} className={`pointer-events-auto ${btn}`}>
        <Chevron dir="right" />
      </button>
    </div>
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
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
}) {
  return (
    <div className="relative">
      <label htmlFor={id} className="field-label">{label}</label>
      <input
        id={id}
        type={type}
        required
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="field"
      />
    </div>
  );
}
