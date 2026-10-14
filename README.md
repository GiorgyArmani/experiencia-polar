# Experiencia Polar

Web app (PWA) de la trivia con QR para el aniversario de la Universidad Empresas Polar.
Next.js 14 (App Router) + React + TypeScript + Tailwind. Datos en Supabase.

- **experienciapolar.aulaciete.com** → el juego
- **leaderboardpolar.aulaciete.com** → el ranking (mismo despliegue; el `middleware.ts` envía `/` a `/ranking`).
  Para una pantalla de una sede: `https://leaderboardpolar.aulaciete.com/?sede=Sede%20Caracas`

## Flujo

Inicio → **Crea tu oso** (flechas de cabeza y ropa + nombre del oso) → **Tus datos** (nombre, correo, teléfono, sede)
→ Reglas → **Cámara** (lee el QR) → **Trivia** (5 preguntas; si falla: pantalla de error y reintenta)
→ **Trivia superada** → **Timer** de la próxima trivia → … ×4 → **¡Te graduaste!** → Ranking.

Todo lo decide el servidor con su propia hora: el teléfono nunca recibe la respuesta correcta
y no se puede adelantar una trivia cambiando la hora del dispositivo.

## Correr en local

```bash
npm install
cp .env.example .env.local   # sin SUPABASE_* usa memoria (solo pruebas)
npm run dev                  # http://localhost:3000
```

La cámara del navegador solo funciona en `https://` o `localhost`. Para probar en el teléfono usa el despliegue.

## Configuración (`.env`)

| Variable | Qué hace |
| --- | --- |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Base de datos. La service role key va **solo en el servidor**. |
| `GAME_MODE` | `demo` (cada trivia abre `DEMO_WAIT_SECONDS` después de la anterior) o `schedule` (horarios reales). |
| `TRIVIA_WINDOWS` | JSON con `opensAt` / `closesAt` de cada trivia (modo `schedule`). Si una ventana cierra sin jugarla, se salta. |
| `POINTS_PER_CORRECT` | Puntos por respuesta correcta al primer intento. Si falla y reintenta, esa pregunta suma 0. |
| `SEDES` | Lista de sedes del registro, separadas por coma. |
| `NEXT_PUBLIC_QR_VALUE` | Texto exacto del QR impreso. Vacío = acepta cualquier QR. |
| `NEXT_PUBLIC_DEMO` | `true` muestra "Simular escaneo" y "Saltar espera". **Ponlo en `false` el día del evento.** |

Las variables `NEXT_PUBLIC_*` se fijan al compilar: si las cambias, vuelve a desplegar.

## Base de datos (Supabase)

1. Crea el proyecto en Supabase.
2. SQL Editor → pega y ejecuta `supabase/schema.sql`.
3. Copia `Project URL` y la `service_role key` a las variables de entorno.

Tablas: `players` (jugador, oso, sede, puntos, progreso) y `answers` (cada respuesta, para auditoría).
RLS está activo sin políticas públicas: solo el servidor accede.

## Preguntas

Edita `lib/trivias.ts`: 4 trivias × 5 preguntas, cada una con 4 opciones y el índice `correct` (0-3).

## Desplegar

### Dokploy (Docker)
1. Nueva aplicación → origen: este repositorio → Build type: **Dockerfile**.
2. Variables de entorno: las de `.env.example`. Las `NEXT_PUBLIC_*` también como **Build args**.
3. Dominios: `experienciapolar.aulaciete.com` y `leaderboardpolar.aulaciete.com` → puerto `3000`, HTTPS activado.

### Vercel
1. Importa el repositorio (framework Next.js, sin cambios).
2. Agrega las variables de entorno.
3. Domains → agrega los dos subdominios y crea en tu DNS los `CNAME` que indique Vercel.

## QR

Genera un QR con el texto de `NEXT_PUBLIC_QR_VALUE` (por ejemplo `EXPERIENCIA-POLAR`). Es el mismo para todas las trivias.

## Imágenes

`public/osos/` (looks del oso y oso graduado) y `public/logos/`. Para que cualquier cabeza combine con cualquier ropa,
el artista debe entregar el oso base y cada pieza como PNG transparentes del mismo tamaño; luego se apilan como capas
en `app/registro/page.tsx` y `lib/looks.ts`.
