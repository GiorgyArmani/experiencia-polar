// Formato del QR impreso en cada sede (siempre el mismo para todas las trivias):
//
//   https://experienciapolar.aulaciete.com/q/<CODIGO>
//
// Si alguien lo escanea con la cámara del teléfono abre la página /q/<CODIGO>,
// que invita a abrir o instalar la app. Dentro de la app se lee el código directamente.
// También se aceptan `experienciapolar://q/<CODIGO>` y `POLAR:<CODIGO>`.

const CODE = /^[A-Za-z0-9_-]{2,24}$/;

/** Devuelve el código de sede (en mayúsculas) o null si el texto no es un QR de la experiencia. */
export function sedeCodeFromQr(raw: string): string | null {
  const value = raw.trim();
  const plain = /^POLAR:(.+)$/i.exec(value);
  if (plain) return CODE.test(plain[1]) ? plain[1].toUpperCase() : null;

  const path = /^(?:https?:\/\/[^/]+|experienciapolar:\/)\/q\/([^/?#]+)\/?(?:[?#].*)?$/i.exec(value);
  if (path) {
    const code = decodeURIComponent(path[1]);
    return CODE.test(code) ? code.toUpperCase() : null;
  }
  return null;
}

export function qrUrlFor(baseUrl: string, code: string): string {
  return `${baseUrl.replace(/\/$/, '')}/q/${encodeURIComponent(code)}`;
}
