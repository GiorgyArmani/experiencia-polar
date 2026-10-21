'use client';
// TEMPORAL: prueba visual de los modelos 3D (se borra después).
import dynamic from 'next/dynamic';
import { ESTACIONES } from '@/shared/estaciones';
const LogoAR = dynamic(() => import('@/components/LogoAR'), { ssr: false });
export default function Prueba() {
  const id = typeof window !== 'undefined' ? Number(new URLSearchParams(window.location.search).get('e') ?? 1) : 1;
  const url = ESTACIONES.find((e) => e.id === id)?.modelo ?? '';
  return <main style={{ width: 330, height: 380, background: '#1d3b2a' }}>{url && <LogoAR url={url} className="h-full w-full" />}</main>;
}
