/** Solo el primer nombre: "María Pérez" → "María". */
export function primerNombre(nombre: string) {
  return nombre.trim().split(/\s+/)[0] ?? '';
}
