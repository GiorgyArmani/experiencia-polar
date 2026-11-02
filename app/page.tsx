'use client';

// Portada. El acceso es solo con la cédula (la nómina de UEP ya trae nombre, localidad y estado).
// Primera vez → elige su ícono → instrucciones. Si ya jugó, sigue donde lo dejó.
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Destello } from '@/components/Cargando';
import { Screen } from '@/components/ui';
import { OtraCedula } from '@/components/OtraCedula';
import { PlayerIcon } from '@/components/PlayerIcon';
import { CONCURSO_TERMINADO } from '@/shared/cierre';
import type { LeaderboardResponse, PublicPlayer } from '@/shared/types';

export default function Inicio() {
  const router = useRouter();
  const [registered, setRegistered] = useState<boolean | null>(null);
  const [cedula, setCedula] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  // Concurso cerrado: datos del jugador y su puesto para la pantalla de "Gracias por participar".
  const [player, setPlayer] = useState<PublicPlayer | null>(null);
  const [ranking, setRanking] = useState<LeaderboardResponse | null>(null);

  useEffect(() => {
    api
      .me()
      .then((r) => {
        setPlayer(r.player);
        setRegistered(Boolean(r.player));
      })
      .catch(() => setRegistered(false));
  }, []);

  useEffect(() => {
    if (!CONCURSO_TERMINADO || !registered) return;
    api.leaderboard().then(setRanking).catch(() => {});
  }, [registered]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setError('');
    try {
      const r = await api.login(cedula);
      if (CONCURSO_TERMINADO) {
        setPlayer(r.player);
        setRegistered(true);
        setSending(false);
        return;
      }
      if (!r.recovered) {
        router.replace('/registro');
        return;
      }
      router.replace('/jugar');
    } catch (err) {
      setError((err as Error).message);
      setSending(false);
    }
  }

  const header = (
    <>
      <Image src="/logos/uep.svg" alt="Universidad Empresas Polar" width={190} height={184} priority className="h-[min(190px,24dvh)] w-auto object-contain" />
      <h1 className="title-display text-[clamp(48px,min(17vw,9dvh),72px)] leading-[0.98] text-polar-navy">
        Experiencia
        <br />
        <span className="text-polar-steel">UEP</span>
      </h1>
    </>
  );

  if (CONCURSO_TERMINADO && registered && player) {
    const sedeMia = ranking?.sedes.find((s) => s.isMine);
    const sedeReal = player.sede !== 'Pruebas' ? player.sede : null;
    return (
      <Screen portada>
        <div className="flex flex-1 animate-fade-in flex-col items-center justify-center px-4 text-center">
          <div className="flex w-full max-w-[360px] flex-col items-center gap-4 rounded-[28px] bg-white/95 px-5 py-6 shadow-[0_8px_28px_rgba(14,12,78,0.18)]">
            <Image src="/logos/uep.svg" alt="Universidad Empresas Polar" width={190} height={184} priority className="h-[min(120px,16dvh)] w-auto object-contain" />
            <h1 className="title-display text-[clamp(38px,min(12vw,7dvh),52px)] leading-[0.98] text-polar-navy">
              ¡Gracias por
              <br />
              <span className="text-polar-steel">participar!</span>
            </h1>
            <p className="text-balance text-base font-semibold text-polar-navy">El concurso de la Experiencia UEP ya terminó.</p>

            <div className="flex w-full flex-col items-center gap-2 rounded-[20px] border-2 border-polar-steel bg-polar-lav px-4 py-4">
              <PlayerIcon icono={player.icono} size={64} className="border-[3px] border-white shadow-[0_4px_10px_rgba(14,12,78,0.25)]" title={player.apodo} />
              <span className="max-w-full truncate text-lg font-bold text-polar-navy">{player.apodo}</span>
              <span className="font-display text-[44px] leading-none text-polar-steel">{player.puntos}</span>
              <span className="text-sm font-bold uppercase tracking-wide text-polar-muted">puntos</span>
              {ranking?.me && (
                <span className="mt-1 text-base font-bold text-polar-navy">
                  Puesto #{ranking.me.rank}
                  {sedeReal ? ` en ${sedeReal}` : ''}
                </span>
              )}
              {sedeReal && sedeMia && (
                <span className="text-sm font-semibold text-polar-muted">
                  Tu localidad quedó #{sedeMia.rank} de {ranking?.sedes.length}
                </span>
              )}
            </div>

            <Link href="/ranking" className="btn-uep w-full max-w-[320px]">
              Ver ranking
            </Link>
          </div>
        </div>
        <OtraCedula siempre label="Consultar otra cédula" className="mb-[max(20px,env(safe-area-inset-bottom))]" />
      </Screen>
    );
  }

  if (registered) {
    return (
      <Screen portada>
        <Link href="/jugar" className="flex flex-1 animate-fade-in flex-col items-center justify-center px-4 text-center" aria-label="Continuar jugando">
          <div className="flex w-full max-w-[360px] flex-col items-center gap-6 rounded-[28px] bg-white/95 px-5 py-6 shadow-[0_8px_28px_rgba(14,12,78,0.18)]">
            {header}
            <span className="btn-uep mt-2 w-full max-w-[320px]">Seguir jugando</span>
          </div>
        </Link>
        <OtraCedula siempre className="mb-[max(20px,env(safe-area-inset-bottom))]" />
      </Screen>
    );
  }

  return (
    <Screen portada>
      <div className="flex flex-1 flex-col items-center justify-center px-4 text-center">
        {/* Recuadro blanco para que los arcos del fondo no choquen con el texto.
            Mientras se consulta la sesión queda invisible pero con su tamaño final (el formulario ya ocupa su lugar),
            así no titila ni salta cuando llega la respuesta. */}
        <div
          aria-hidden={registered === null}
          className={`flex w-full max-w-[360px] flex-col items-center gap-5 rounded-[28px] bg-white/95 px-5 py-6 shadow-[0_8px_28px_rgba(14,12,78,0.18)] ${
            registered === null ? 'invisible' : 'animate-fade-in'
          }`}
        >
        {header}
        <form onSubmit={submit} className="mt-2 flex w-full max-w-[320px] flex-col gap-3">
            <label htmlFor="cedula" className="text-balance text-base font-bold text-polar-navy">
              {CONCURSO_TERMINADO ? 'Ingresa tu cédula para ver tu resultado' : 'Ingresa tu número de cédula para iniciar'}
            </label>
            <input
              id="cedula"
              inputMode="numeric"
              autoComplete="off"
              required
              value={cedula}
              onChange={(e) => setCedula(e.target.value)}
              placeholder="12345678"
              className="h-[56px] rounded-[16px] border-2 border-polar-navy bg-white px-[22px] text-center text-xl font-bold tracking-wider text-polar-navy shadow-[0_6px_18px_rgba(14,12,78,0.15)] outline-none placeholder:text-[#9AA3B5] focus:border-polar-steel focus:ring-4 focus:ring-polar-steel/25"
            />
            {error && (
              <p role="alert" className="rounded-[16px] bg-polar-navy px-4 py-2 text-sm font-bold text-white">
                {error}
              </p>
            )}
            <button type="submit" disabled={sending} className="btn-uep">
              {sending ? (
                <>
                  <Destello size={20} color="#FFFFFF" /> Entrando…
                </>
              ) : CONCURSO_TERMINADO ? (
                'Ver mi resultado'
              ) : (
                'Comenzar'
              )}
            </button>
          </form>
        </div>
      </div>
    </Screen>
  );
}
