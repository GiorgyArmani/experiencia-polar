'use client';

export function PrintButton() {
  return (
    <button type="button" onClick={() => window.print()} className="btn-game">
      Imprimir afiche
    </button>
  );
}
