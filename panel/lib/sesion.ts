// Sesión del panel: una cookie con un hash de la clave (PANEL_PASSWORD). Si cambia la clave, las sesiones viejas caducan.
// Funciona igual en el middleware (edge) y en las rutas (Node): solo usa Web Crypto.
export const COOKIE = 'panel_uep';
export const MAX_AGE = 60 * 60 * 24 * 30; // 30 días

export async function tokenDe(password: string) {
  const data = new TextEncoder().encode(`panel-uep:${password}`);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, '0')).join('');
}
