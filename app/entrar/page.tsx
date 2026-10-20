'use client';

// El acceso ahora es solo con la cédula en la portada. Esta ruta queda para enlaces viejos.
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Screen, Spinner } from '@/components/ui';

export default function Entrar() {
  const router = useRouter();
  useEffect(() => {
    router.replace(`/${window.location.search}`);
  }, [router]);
  return (
    <Screen>
      <Spinner />
    </Screen>
  );
}
