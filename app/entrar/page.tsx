'use client';

// "Ya tengo cuenta": entra con la cédula en otro navegador o teléfono y sigue con su oso y sus puntos.
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { qrUrlFor } from '@/shared/qr';
import { Logos, Screen } from '@/components/ui';

export default function Entrar() {
  const router = useRouter();
  const [cedula, setCedula] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);

  // Si este navegador ya tiene sesión, directo al juego.
  useEffect(() => {
    api
      .me()
      .then((r) => r.player && router.replace('/jugar'))
      .catch(() => {});
  }, [router]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setError('');
    try {
      const r = await api.login(cedula);
      // Venía de escanear el QR (abierto en otro navegador): se cumple ese escaneo sin volver a buscar el QR.
      const fromQr = new URLSearchParams(window.location.search).has('qr');
      if (fromQr && r.status?.phase === 'scan') {
        const aviso = await api
          .scan(qrUrlFor(window.location.origin))
          .then(() => '')
          .catch((e: Error) => e.message);
        router.replace(aviso ? `/jugar?aviso=${encodeURIComponent(aviso)}` : '/jugar');
        return;
      }
      router.replace('/jugar');
    } catch (err) {
      setError((err as Error).message);
      setSending(false);
    }
  }

  return (
    <Screen>
      <h1 className="mt-16 text-center text-[30px] font-black uppercase leading-tight">
        ¡Qué bueno
        <br />
        verte otra vez!
      </h1>
      <p className="mx-8 mt-3 text-center text-base font-semibold">Escribe tu cédula y seguimos donde lo dejaste.</p>

      <form onSubmit={submit} className="mx-4 mt-8 flex flex-col gap-4 rounded-[20px] bg-white px-6 py-6 text-polar-ink">
        <div className="relative">
          <label htmlFor="cedula" className="field-label">
            Cédula
          </label>
          <input
            id="cedula"
            inputMode="numeric"
            autoComplete="off"
            required
            value={cedula}
            onChange={(e) => setCedula(e.target.value)}
            placeholder="12345678"
            className="field"
          />
        </div>
        {error && (
          <p role="alert" className="rounded-xl bg-polar-ink px-4 py-2 text-sm font-bold text-white">
            {error}
          </p>
        )}
        <button type="submit" disabled={sending} className="btn-game">
          {sending ? 'Entrando…' : 'Entrar'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm font-semibold">
        ¿Es tu primera vez?{' '}
        <Link href="/registro" className="font-extrabold underline">
          Regístrate
        </Link>
      </p>
      <Logos className="mt-auto pb-4" />
    </Screen>
  );
}
