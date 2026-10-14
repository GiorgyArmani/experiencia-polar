'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Lector de QR con la cámara trasera (html5-qrcode).
 * Llama `onScan` una sola vez por lectura; el padre decide qué hacer.
 */
export default function QrScanner({ onScan, paused = false }: { onScan: (text: string) => void; paused?: boolean }) {
  const [problem, setProblem] = useState<string | null>(null);
  const onScanRef = useRef(onScan);
  const pausedRef = useRef(paused);
  onScanRef.current = onScan;
  pausedRef.current = paused;

  useEffect(() => {
    let scanner: import('html5-qrcode').Html5Qrcode | null = null;
    let stopped = false;

    (async () => {
      const { Html5Qrcode } = await import('html5-qrcode');
      if (stopped) return;
      scanner = new Html5Qrcode('qr-reader', { verbose: false });
      try {
        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: (w, h) => {
            const side = Math.floor(Math.min(w, h) * 0.7);
            return { width: side, height: side };
          } },
          (text) => {
            if (!pausedRef.current) onScanRef.current(text);
          },
          () => {},
        );
      } catch (e) {
        const msg = String((e as Error)?.message ?? e);
        setProblem(
          /permission|NotAllowed/i.test(msg)
            ? 'Necesitamos permiso para usar la cámara. Actívalo en la configuración del navegador y recarga la página.'
            : 'No pudimos abrir la cámara. Prueba con Chrome o Safari actualizados.',
        );
      }
    })();

    return () => {
      stopped = true;
      if (scanner?.isScanning) scanner.stop().catch(() => {});
    };
  }, []);

  return (
    <div className="absolute inset-0">
      <div id="qr-reader" className="h-full w-full [&>div]:!border-0" />
      {problem && (
        <div className="absolute inset-x-6 top-1/2 -translate-y-1/2 rounded-2xl bg-white p-4 text-center text-sm font-semibold text-polar-ink" role="alert">
          {problem}
        </div>
      )}
    </div>
  );
}
