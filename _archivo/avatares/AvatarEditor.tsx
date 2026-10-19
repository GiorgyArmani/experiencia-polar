// EJEMPLO: editor de avatar (era el paso 1 del registro de Experiencia UEP).
// Flechas ‹ › por cada parte (piel, peinado, pelo, ropa, accesorio) + botón "Sorpréndeme".
// Dependencias: ./avatar, ./AvatarSvg y clases de Tailwind del proyecto original (polar-*, shadow-arrow).
'use client';

import { useState } from 'react';
import { AVATAR_PARTS, DEFAULT_AVATAR, optionOf, randomAvatar, stepAvatar, type Avatar, type AvatarPart } from './avatar';
import { AvatarSvg } from './AvatarSvg';

const PART_LABEL: Record<AvatarPart, string> = { piel: 'Piel', peinado: 'Peinado', pelo: 'Color de pelo', ropa: 'Ropa', accesorio: 'Accesorio' };

/** Editor completo: vista previa grande + una fila con flechas por cada parte. Llama `onChange` en cada cambio. */
export function AvatarEditor({ initial = DEFAULT_AVATAR, onChange }: { initial?: Avatar; onChange?: (a: Avatar) => void }) {
  const [avatar, set] = useState<Avatar>(initial);
  const setAvatar = (a: Avatar) => {
    set(a);
    onChange?.(a);
  };
  return (
    <div>
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
    </div>
  );
}

/** Descripción accesible: "Piel Trigueña, Peinado Corto, …". */
export function describe(a: Avatar) {
  return (Object.keys(AVATAR_PARTS) as AvatarPart[]).map((p) => `${PART_LABEL[p]} ${optionOf(p, a[p]).label}`).join(', ');
}

function Chevron({ dir, size = 22 }: { dir: 'left' | 'right'; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={dir === 'left' ? 'M15 6l-6 6 6 6' : 'M9 6l6 6-6 6'} />
    </svg>
  );
}

function PartRow({ label, value, onPrev, onNext }: { label: string; value: string; onPrev: () => void; onNext: () => void }) {
  const btn =
    'flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-polar-blue shadow-arrow transition-transform active:translate-y-[3px] active:shadow-none';
  return (
    <div className="flex items-center gap-2">
      <button type="button" onClick={onPrev} aria-label={`${label} anterior`} className={btn}>
        <Chevron dir="left" />
      </button>
      <div className="flex h-11 flex-1 flex-col items-center justify-center rounded-full bg-polar-card leading-tight" aria-live="polite">
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#DCEBFF]">{label}</span>
        <span className="text-[15px] font-extrabold">{value}</span>
      </div>
      <button type="button" onClick={onNext} aria-label={`${label} siguiente`} className={btn}>
        <Chevron dir="right" />
      </button>
    </div>
  );
}

