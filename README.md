# Experiencia Polar

Trivia con QR y realidad aumentada ligera para el aniversario de la Universidad Empresas Polar.

```
mobile/      App nativa iOS + Android (Expo SDK 57, React Native, Three.js)  ← lo que usa el jugador
app/, lib/   Servidor Next.js 14: API del juego, leaderboard web, página del QR y versión web de respaldo
shared/      Contrato común (tipos de la API, avatar, formato del QR) — lo importan servidor y app
supabase/    schema.sql (sirve para Supabase y para Postgres en Dokploy)
```

| Dominio | Qué sirve |
| --- | --- |
| **experienciapolar.aulaciete.com** | API (`/api/*`), destino del QR (`/q/<CODIGO>`), universal links y juego web de respaldo |
| **leaderboardpolar.aulaciete.com** | Ranking para pantallas. Una sede: `https://leaderboardpolar.aulaciete.com/?sede=CCS` |

Los dos dominios apuntan al **mismo** despliegue del servidor (`middleware.ts` envía `/` del leaderboard a `/ranking`).

## Gameloop

Hay **un solo QR** (el mismo en todas las sedes). Lo que dispara cada escaneo depende del progreso del jugador:

1. **1.er escaneo → onboarding**: diseña su oso (pelaje, cabeza, ropa, accesorio + nombre, modelo 3D low poly)
   y llena sus datos: **cédula**, nombre completo, correo (opcional) y **localidad** (130, en `lib/localidades.ts`). Se guarda en `players`.
2. **2.º escaneo → abre la trivia** disponible, **contrarreloj**: `TRIVIA_SECONDS` (60) para responder todas las preguntas.
   Correcta = de 100 a 50 puntos según la rapidez en esa pregunta (100 si responde en ≤ 3 s, baja en línea recta hasta 50 a los 15 s).
   Incorrecta = 0 y pasa a la siguiente. Si se acaba el tiempo, la trivia se cierra con lo que sumó.
3. **Espera** con contador hasta que abra la siguiente trivia.
4. **Siguiente escaneo → siguiente trivia**, y así hasta la última.
6. Tras la última: **oso graduado** (birrete y toga) → **leaderboard** de su sede.

El oso acompaña cada pantalla con reacciones: `celebrar`, `duda`, `pensar`, `error` (+ `idle`).
Cada pantalla está armada como una página de cómic: viñetas (`Panel`), cartuchos de narración (`Caption`)
y globos de diálogo (`Bubble`) en `mobile/src/components/comic.tsx`.

### Reglas que impone el servidor

- El servidor decide todo con **su** hora: el teléfono nunca recibe la respuesta correcta y no se adelanta una trivia cambiando el reloj.
- **Horarios por nivel** (`TRIVIA_WINDOWS`): cada trivia tiene ventana `opensAt`–`closesAt`. Se evalúa en cada petición, así que
  no hace falta un cron que "abra" niveles (no hay proceso que se pueda caer). Si una ventana cierra sin jugarla, se salta.
- **Un solo QR**: el servidor decide qué abre cada escaneo según el progreso guardado del jugador.
- Un doble toque no suma dos veces (la actualización es condicional a la pregunta actual).
- El reloj lo lleva el servidor (`trivia_started_at`, `question_started_at`), con 2 s de margen por la latencia. Si el jugador
  cierra la pestaña, la trivia se cierra sola en su siguiente petición al vencer el tiempo.
- Recuperar la partida en otro teléfono: misma **cédula** y mismo primer nombre (sin importar acentos ni mayúsculas).

## Códigos QR

Uno solo, el mismo en todas las sedes y para todas las trivias. Contiene `<APP_URL>/q/POLAR`
(hoy `https://experiencia-polar.vercel.app/q/POLAR`). El servidor lo genera con el dominio de `APP_URL`:

- `<APP_URL>/qr` → **afiche A4** con el estilo Polar (oso, logos, pasos) y botón "Imprimir afiche"
- `<APP_URL>/qr/imagen` → solo el QR en SVG; `?format=png&size=2048` en PNG (agrega `&download` para descargarlo)

Si cambia el dominio (p. ej. a `experienciapolar.aulaciete.com`), hay que **reimprimir el QR** y compilar la app de nuevo con ese dominio.

- Escaneado con la **cámara del teléfono** → `/q/POLAR` dispara el siguiente paso en el navegador:
  sin registro va a `/registro`; registrado abre la trivia disponible y entra a `/jugar` (si aún no abre, muestra el aviso).
  La sesión vive en una cookie, así que el jugador debe usar siempre el mismo navegador.
- También se puede escanear desde la cámara dentro de `/jugar`.

## Configuración del servidor (`.env`)

| Variable | Qué hace |
| --- | --- |
| `APP_URL` | Dominio público del servidor; es el que va dentro del QR. Defecto `https://experiencia-polar.vercel.app`. |
| `DATABASE_URL` | Postgres (Dokploy, o cadena de conexión de Supabase). Tiene prioridad. |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Alternativa vía API de Supabase. La service role key va **solo en el servidor**. |
| `SEDES` | `CODIGO:Nombre` separados por coma. El jugador elige la suya al registrarse; el código se usa en `?sede=` del ranking. |
| `GAME_MODE` | `demo` (cada trivia abre `DEMO_WAIT_SECONDS` después de la anterior) o `schedule` (horarios reales). |
| `TRIVIA_WINDOWS` | JSON con `opensAt` / `closesAt` de cada trivia (modo `schedule`), zona `-04:00`. |
| `POINTS_PER_CORRECT` | Puntos máximos por respuesta correcta (respuesta rápida); el mínimo es la mitad. |
| `TRIVIA_SECONDS` | Segundos para responder toda la trivia (defecto 60). |
| `APP_STORE_URL`, `PLAY_STORE_URL` | Botones de la página del QR. |
| `APPLE_TEAM_ID`, `ANDROID_SHA256_CERT` | Habilitan `/.well-known/apple-app-site-association` y `assetlinks.json`. |
| `NEXT_PUBLIC_DEMO` | `true` muestra "Simular escaneo" y "Saltar espera" (web y app). **`false` el día del evento.** Se fija al compilar. |

Sin base de datos configurada usa memoria (solo pruebas).

## Base de datos

Ejecuta `supabase/schema.sql` (es idempotente y migra la columna `look` de la versión anterior a `avatar`):

- **Supabase**: SQL Editor → pegar y ejecutar.
- **Dokploy**: crea un servicio Postgres, y `psql "$DATABASE_URL" -f supabase/schema.sql`.

Tablas: `players` (jugador, cédula, localidad en la columna `sede`, avatar, puntos, progreso) y `answers` (auditoría). Índice `(sede, puntos desc)` para el ranking.
Para ~2.000 jugadores un Postgres pequeño sobra; el pool por instancia es `DATABASE_POOL` (10).

## Preguntas

`lib/trivias.ts`: 4 trivias × 5 preguntas, 4 opciones y el índice `correct` (0-3). Solo vive en el servidor.

## Servidor: correr y desplegar

```bash
npm install
cp .env.example .env.local
npm run dev                  # http://localhost:3000
```

**Dokploy**: aplicación → Build type **Dockerfile** → variables de `.env.example` (`NEXT_PUBLIC_DEMO` también como build arg)
→ dominios `experienciapolar.aulaciete.com` y `leaderboardpolar.aulaciete.com` → puerto `3000`, HTTPS.

**Vercel**: importa el repo (Next.js), agrega las variables y los dos dominios. Con Supabase usa la URL del pooler en `DATABASE_URL`.

## App nativa (`mobile/`)

```bash
cd mobile
npm install
# Servidor local desde el teléfono: usa la IP de tu PC, no localhost.
EXPO_PUBLIC_API_URL=http://192.168.1.10:3000 npx expo start
```

La app usa módulos nativos (cámara, GL), así que se prueba con un **development build**, no con Expo Go:

```bash
npx eas-cli@latest build --profile development --platform android   # o ios
npx eas-cli@latest build --profile preview --platform android       # APK para testers
npx eas-cli@latest build --profile production --platform all
npx eas-cli@latest submit --platform all
```

- Bundle ID / package: `com.aulaciete.experienciapolar`. Esquema de deep link: `experienciapolar://q/<CODIGO>`.
- El dominio del servidor sale de `EXPO_PUBLIC_API_URL` (defecto `https://experiencia-polar.vercel.app`). `app.config.ts` lo usa
  para la API y para los universal/app links, así que debe coincidir con `APP_URL` del servidor.
- El oso 3D está hecho con primitivas (`mobile/src/components/Bear3D.tsx`). Si el artista entrega un `.glb`, se reemplaza ese
  componente con la misma interfaz (`avatar`, `reaction`, `graduado`).
- `npm run typecheck` y `npx expo-doctor` deben pasar antes de cada build.

## Web de respaldo

`/registro`, `/jugar`, `/ranking` siguen funcionando en el navegador (mismo servidor y mismas reglas), con el oso en SVG 2D.
Sirve si la publicación en las tiendas se retrasa o para quien no pueda instalar la app.
