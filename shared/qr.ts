// Un solo QR para toda la experiencia, el mismo impreso en todas las sedes y para todas las trivias:
//
//   <APP_URL>/q/POLAR
//
// Lo que dispara cada escaneo depende del progreso del jugador (lo decide el servidor):
//   1.ª vez → onboarding (oso + datos + sede)
//   luego   → abre la trivia disponible; tras terminarla, el siguiente escaneo abre la siguiente.
//
// Si alguien lo escanea con la cámara del teléfono abre la página /q/POLAR,
// que invita a abrir o instalar la app. Dentro de la app se lee directamente.
// También se aceptan `experienciapolar://q/POLAR` y `POLAR:POLAR`.

export const QR_CODE = 'POLAR';

/** Color de los módulos del QR impreso: azul oscuro UEP (oscuro para que lo lea cualquier cámara). */
export const QR_INK = '#004572';

/** Código que trae el QR (en mayúsculas) o null si el texto no tiene el formato de la experiencia. */
function codeFromQr(raw: string): string | null {
  const value = raw.trim();
  const plain = /^POLAR:(.+)$/i.exec(value);
  if (plain) return plain[1].toUpperCase();

  const path = /^(?:https?:\/\/[^/]+|experienciapolar:\/)\/q\/([^/?#]+)\/?(?:[?#].*)?$/i.exec(value);
  return path ? decodeURIComponent(path[1]).toUpperCase() : null;
}

/** ¿Es el QR de la Experiencia Polar? */
export function isExperienceQr(raw: string): boolean {
  return codeFromQr(raw) === QR_CODE;
}

export function qrUrlFor(baseUrl: string): string {
  return `${baseUrl.replace(/\/$/, '')}/q/${QR_CODE}`;
}
