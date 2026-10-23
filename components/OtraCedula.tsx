'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { api } from '@/lib/api';
import { stopMusic } from '@/lib/sfx';

// Solo para pruebas: igual que "Simular escaneo", desaparece con NEXT_PUBLIC_DEMO=false (se fija al compilar).
const DEMO = process.env.NEXT_PUBLIC_DEMO === 'true';

/** Cierra la sesión y vuelve a la portada para entrar con otra cédula (pedido UEP: poder jugar una y otra vez). */
export function OtraCedula({ className = '' }: { className?: string }) {
  const router = useRouter();
  const [saliendo, setSaliendo] = useState(false);
  if (!DEMO) return null;

  async function salir() {
    setSaliendo(true);
    stopMusic();
    await api.logout().catch(() => {});
    router.replace('/');
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={salir}
      disabled={saliendo}
      className={`mx-auto h-10 text-sm font-bold text-polar-navy underline underline-offset-2 disabled:opacity-50 ${className}`}
    >
      {saliendo ? 'Saliendo…' : 'Entrar con otra cédula'}
    </button>
  );
}
