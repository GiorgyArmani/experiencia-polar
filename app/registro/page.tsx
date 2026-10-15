'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { AVATAR_PARTS, DEFAULT_AVATAR, optionOf, randomAvatar, stepAvatar, type Avatar, type AvatarPart } from '@/shared/avatar';
import type { Sede } from '@/shared/types';
import { AvatarSvg } from '@/components/AvatarSvg';
import { Chevron, Logos, Screen, Spinner, Stepper } from '@/components/ui';

const PART_LABEL: Record<AvatarPart, string> = { piel: 'Piel', peinado: 'Peinado', pelo: 'Color de pelo', ropa: 'Ropa', accesorio: 'Accesorio' };

export default function Registro() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [avatar, setAvatar] = useState<Avatar>(DEFAULT_AVATAR);
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
      await api.register({ ...form, apodo: apodo.trim(), avatar });
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
        <h1 className="title-display mt-3 text-center text-[30px]">Crea tu avatar</h1>

        <div className="relative mx-auto mt-3 flex aspect-square w-[min(240px,56vw)] items-end justify-center overflow-hidden rounded-[20px] border-4 border-white bg-polar-sky">
          <AvatarSvg avatar={avatar} mood="feliz" className="h-[94%]" title={`Tu avatar: ${describe(avatar)}`} />
          <button
            type="button"
            onClick={() => setAvatar(randomAvatar())}
            className="absolute right-2 top-2 rounded-full bg-white px-3 py-1 text-xs font-extrabold text-polar-blue shadow-arrow active:translate-y-[2px] active:shadow-none"
          >
            Sorpréndeme
          </button>
        </div>

        <div className="mx-auto mt-3 flex w-[min(314px,86vw)] flex-col gap-2">
          {(Object.keys(AVATAR_PARTS) as AvatarPart[]).map((part) => (
            <PartRow
              key={part}
              label={PART_LABEL[part]}
              value={optionOf(part, avatar[part]).label}
              onPrev={() => setAvatar(stepAvatar(avatar, part, -1))}
              onNext={() => setAvatar(stepAvatar(avatar, part, 1))}
            />
          ))}
        </div>

        <div className="mx-auto mt-4 flex w-[min(314px,80vw)] flex-col gap-1.5">
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

        {error && <p role="alert" className="mx-auto mt-2 w-[min(314px,80vw)] text-sm font-bold text-polar-ink">{error}</p>}

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
          <span className="block h-[52px] w-[52px] overflow-hidden rounded-full border-[3px] border-polar-blue bg-polar-sky">
            <AvatarSvg avatar={avatar} crop="head" className="h-full w-full" />
          </span>
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
          {sending ? 'Registrando…' : 'Terminar registro'}
        </button>
      </div>
      <Logos className="mt-2 pb-4" />
    </Screen>
  );
}

function describe(a: Avatar) {
  return (Object.keys(AVATAR_PARTS) as AvatarPart[]).map((p) => `${PART_LABEL[p]} ${optionOf(p, a[p]).label}`).join(', ');
}

function PartRow({ label, value, onPrev, onNext }: { label: string; value: string; onPrev: () => void; onNext: () => void }) {
  const btn =
    'flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-polar-blue shadow-arrow transition-transform active:translate-y-[3px] active:shadow-none';
  return (
    <div className="flex items-center gap-2">
      <button type="button" onClick={onPrev} aria-label={`${label} anterior`} className={btn}>
        <Chevron dir="left" size={22} />
      </button>
      <div className="flex h-11 flex-1 flex-col items-center justify-center rounded-full bg-polar-card leading-tight" aria-live="polite">
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#DCEBFF]">{label}</span>
        <span className="text-[15px] font-extrabold">{value}</span>
      </div>
      <button type="button" onClick={onNext} aria-label={`${label} siguiente`} className={btn}>
        <Chevron dir="right" size={22} />
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
