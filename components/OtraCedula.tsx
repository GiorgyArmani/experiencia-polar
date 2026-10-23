'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { stopMusic } from '@/lib/sfx';

// Solo para pruebas: igual que "Simular escaneo", desaparece con NEXT_PUBLIC_DEMO=false (se fija al compilar).
const DEMO = process.env.NEXT_PUBLIC_DEMO === 'true';

/** Reiniciar: cierra la sesión y vuelve a la portada para entrar con otra cédula (pedido UEP: jugar una y otra vez). */
export function OtraCedula({ className = '' }: { className?: string }) {
  const [saliendo, setSaliendo] = useState(false);
  if (!DEMO) return null;

  async function reiniciar() {
    setSaliendo(true);
    stopMusic();
    await api.logout().catch(() => {});
    // Recarga completa: la portada vuelve a preguntar la sesión (con router.replace('/') desde la portada no pasaba nada).
    window.location.assign('/');
  }

  return (
    <button
      type="button"
      onClick={reiniciar}
      disabled={saliendo}
      className={`mx-auto flex h-11 w-full max-w-[260px] items-center justify-center gap-2 rounded-full border-2 border-polar-navy bg-white px-5 text-[15px] font-bold text-polar-navy transition-transform active:translate-y-[2px] disabled:opacity-50 ${className}`}
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M3 12a9 9 0 1 0 3-6.7" />
        <path d="M3 4v5h5" />
      </svg>
      {saliendo ? 'Reiniciando…' : 'Reiniciar'}
    </button>
  );
}
