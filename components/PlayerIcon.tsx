// Ícono del jugador: un símbolo dentro de un círculo de color con borde blanco (estilo ficha de juego).
import { colorOf, simboloLabel, type Icono, type SimboloId } from '@/shared/icono';

/** Dibujo de cada símbolo en una caja de 24×24. `bg` sirve para "recortar" detalles (ventanas, costuras). */
function Glyph({ id, bg }: { id: SimboloId; bg: string }) {
  switch (id) {
    case 'birrete':
      return (
        <>
          <path d="M12 4 1.5 9 12 14l8.2-3.9V16h1.6V9.2z" />
          <path d="M6 12.4v3.8c0 1.6 2.7 3.2 6 3.2s6-1.6 6-3.2v-3.8L12 15.3z" />
        </>
      );
    case 'libro':
      return (
        <>
          <path d="M2.5 5.2c3-1 6.3-.7 8.7 1V20c-2.4-1.6-5.7-1.9-8.7-.9z" />
          <path d="M21.5 5.2c-3-1-6.3-.7-8.7 1V20c2.4-1.6 5.7-1.9 8.7-.9z" />
        </>
      );
    case 'bombillo':
      return (
        <>
          <path d="M12 2.2a6.6 6.6 0 0 0-3.9 11.9c.6.5 1 1.2 1 2v.9h5.8v-.9c0-.8.4-1.5 1-2A6.6 6.6 0 0 0 12 2.2z" />
          <path d="M9.1 18.3h5.8v1.4a1.6 1.6 0 0 1-1.6 1.6h-2.6a1.6 1.6 0 0 1-1.6-1.6z" />
        </>
      );
    case 'cohete':
      return (
        <>
          <path d="M12 1.8c3.4 2.3 5.1 5.8 5.1 9.9v4.6H6.9v-4.6c0-4.1 1.7-7.6 5.1-9.9z" />
          <path d="m6.9 12.2-3.3 3.6v3.4l3.3-1.6zM17.1 12.2l3.3 3.6v3.4l-3.3-1.6zM9.8 17.3h4.4l-.8 4.2h-2.8z" />
          <circle cx="12" cy="9.2" r="2.1" fill={bg} />
        </>
      );
    case 'estrella':
      return <path d="m12 2.3 3 6.1 6.7 1-4.9 4.7 1.2 6.6-6-3.2-6 3.2 1.2-6.6-4.9-4.7 6.7-1z" />;
    case 'trofeo':
      return (
        <>
          <path d="M6.5 3h11v5.2a5.5 5.5 0 0 1-11 0z" />
          <path d="M6.6 4.4H3.8v1.4a3.7 3.7 0 0 0 3.6 3.7l.3-1.6a2.2 2.2 0 0 1-2.3-2.1v-.1h1.2zM17.4 4.4h2.8v1.4a3.7 3.7 0 0 1-3.6 3.7l-.3-1.6a2.2 2.2 0 0 0 2.3-2.1v-.1h-1.2z" />
          <path d="M10.7 13.3h2.6v3.6h-2.6zM7.3 17.5h9.4V21H7.3z" />
        </>
      );
    case 'rayo':
      return <path d="M13.6 1.8 4.6 13.7h6.2L9.9 22.2l9.5-12.4h-6.4z" />;
    case 'corazon':
      return <path d="M12 21s-8-4.9-8-10.7A4.5 4.5 0 0 1 12 7.4a4.5 4.5 0 0 1 8 2.9C20 16.1 12 21 12 21z" />;
    case 'nota':
      return <path d="M8.6 4.6 20.2 2v12.6a3.1 3.1 0 1 1-2-2.9V6.6l-7.6 1.7v8.6a3.1 3.1 0 1 1-2-2.9z" />;
    case 'sol':
      return (
        <>
          <circle cx="12" cy="12" r="4.6" />
          <path
            d="M12 1.8v3M12 19.2v3M1.8 12h3M19.2 12h3M4.8 4.8l2.1 2.1M17.1 17.1l2.1 2.1M4.8 19.2l2.1-2.1M17.1 6.9l2.1-2.1"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
        </>
      );
  }
}

/** Solo el símbolo (sin el círculo), en el color de texto actual. */
export function SimboloSvg({ id, bg = '#FFFFFF', className = '' }: { id: SimboloId; bg?: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <Glyph id={id} bg={bg} />
    </svg>
  );
}

/** Birrete chiquito que se pone el ícono al graduarse. */
function Birrete() {
  return (
    <svg viewBox="0 0 40 24" className="absolute -top-[24%] left-1/2 w-[62%] -translate-x-1/2 -rotate-12 drop-shadow" aria-hidden>
      <path d="M20 2 2 9l18 7 18-7z" fill="#1E1E1E" stroke="#FFFFFF" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M10 12.5v5c0 2 4.5 4 10 4s10-2 10-4v-5L20 16z" fill="#1E1E1E" />
      <path d="M33 9.5v8" stroke="#FFCC53" strokeWidth="2" strokeLinecap="round" />
      <circle cx="33" cy="18.5" r="2" fill="#FFCC53" />
    </svg>
  );
}

export function PlayerIcon({
  icono,
  size,
  className = '',
  graduado = false,
  title,
}: {
  icono: Icono;
  /** Tamaño en px; si no se pasa, ocupa lo que diga `className`. */
  size?: number;
  className?: string;
  graduado?: boolean;
  title?: string;
}) {
  const c = colorOf(icono.color);
  return (
    <span
      role="img"
      aria-label={title ?? `Ícono: ${simboloLabel(icono.simbolo)}`}
      className={`relative inline-flex aspect-square shrink-0 items-center justify-center rounded-full border-[3px] border-white shadow-[0_3px_0_rgba(0,0,0,0.25)] ${className}`}
      style={{ background: c.bg, color: c.fg, ...(size ? { width: size, height: size } : null) }}
    >
      <SimboloSvg id={icono.simbolo} bg={c.bg} className="h-[58%] w-[58%]" />
      {graduado && <Birrete />}
    </span>
  );
}
