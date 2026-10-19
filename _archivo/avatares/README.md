# Avatares (archivados para reusar)

Código del avatar 2D personalizable que usó **Experiencia UEP** hasta octubre de 2026. La UEP pidió quitar los
avatares (solo íconos, sin personaje interactivo), así que se guardó aquí para reusarlo en otro proyecto.

**No forma parte del build**: la carpeta `_archivo` está excluida en `tsconfig.json` y Tailwind no la escanea.
Se recuperó tal cual del commit `8bedb72` ("avatar fixes").

## Qué hay

| Archivo | Qué es |
|---|---|
| `avatar.ts` | Modelo del avatar: partes (piel, peinado, pelo, ropa, accesorio) con sus colores, `DEFAULT_AVATAR`, `parseAvatar` / `isValidAvatar` (validación en el servidor), `stepAvatar` (flechas ‹ ›) y `randomAvatar` ("Sorpréndeme"). Sin dependencias. |
| `AvatarSvg.tsx` | El dibujo en SVG: persona cabezona estilo Animal Crossing. 9 expresiones (`Mood`), mirada (`look`), parpadeo, birrete de graduado y recorte a la cabeza (`crop="head"`, para listas y ranking). |
| `AvatarEditor.tsx` | Ejemplo: editor con vista previa, una fila de flechas por cada parte y botón "Sorpréndeme". |
| `TapAvatar.tsx` | Ejemplo: avatar "vivo" en el juego. Respira, se menea al tocarlo, tiembla cuando se acaba el tiempo y dice frases según el estado. |
| `frases.ts` | Frases que dice el avatar (en español venezolano neutral) por estado: pregunta, acierto, racha, fallo, apuro, etc. |
| `Talk.tsx` | `Speech`: globo de diálogo que escribe letra a letra con una "voz" de 16 bits. Trae también `SoundToggle` (control de volumen). |

## Cómo reusarlo

1. Copia la carpeta a tu proyecto (React 18 + Tailwind 3). Los archivos se importan entre sí con rutas relativas (`./avatar`).
2. `Talk.tsx` y `TapAvatar.tsx` usaban el módulo de sonido del proyecto (`@/lib/sfx`: `sfx.voice`, `sfx.giggle`, etc.).
   Conecta el tuyo o reemplaza esas llamadas por funciones vacías.
3. Las clases de color `polar-*` (por ejemplo `bg-polar-sky`, `text-polar-blue` o `shadow-arrow`) eran de la paleta UEP:
   cámbialas por las tuyas.
4. Agrega estas animaciones a `tailwind.config.ts` (`theme.extend`). `AvatarSvg` usa `blink`, `zzz` y `sweat`;
   `TapAvatar` usa `breathe`, `wiggle`, `tremble`, `alarm` y `hop`:

```ts
keyframes: {
  blink: { '0%,92%,100%': { transform: 'scaleY(1)' }, '95%': { transform: 'scaleY(0.1)' } },
  breathe: { '0%,100%': { transform: 'translateY(0) scale(1)' }, '50%': { transform: 'translateY(2px) scale(1.01,0.99)' } },
  zzz: { '0%': { transform: 'translate(0,0) scale(0.6)', opacity: '0' }, '30%': { opacity: '1' }, '100%': { transform: 'translate(14px,-34px) scale(1.1)', opacity: '0' } },
  wiggle: { '0%,100%': { transform: 'rotate(0deg)' }, '25%': { transform: 'rotate(-6deg)' }, '75%': { transform: 'rotate(6deg)' } },
  sweat: { '0%': { transform: 'translateY(0)', opacity: '0' }, '20%': { opacity: '1' }, '100%': { transform: 'translateY(10px)', opacity: '0' } },
  hop: {
    '0%,100%': { transform: 'translateY(0) scale(1)' },
    '35%': { transform: 'translateY(-26px) scale(1.02)' },
    '55%': { transform: 'translateY(0) scale(1.03,0.97)' },
    '70%': { transform: 'translateY(-8px)' },
  },
  shake: {
    '0%,100%': { transform: 'rotate(0deg)' }, '15%': { transform: 'rotate(-4deg)' }, '30%': { transform: 'rotate(4deg)' },
    '45%': { transform: 'rotate(-3deg)' }, '60%': { transform: 'rotate(3deg)' }, '75%': { transform: 'rotate(0deg)' },
  },
},
animation: {
  blink: 'blink 4.2s ease-in-out infinite',
  breathe: 'breathe 3s ease-in-out infinite',
  zzz: 'zzz 2.4s ease-out infinite',
  wiggle: 'wiggle 0.5s ease-in-out 2',
  sweat: 'sweat 1.4s ease-in infinite',
  hop: 'hop 1.4s ease-in-out infinite',
  tremble: 'shake 0.9s ease-in-out infinite', // tiembla: se acaba el tiempo
  alarm: 'shake 0.4s ease-in-out infinite', // tiembla más rápido: últimos segundos
},
```

## Uso mínimo

```tsx
import { AvatarSvg } from './AvatarSvg';
import { DEFAULT_AVATAR } from './avatar';

<AvatarSvg avatar={DEFAULT_AVATAR} mood="feliz" className="h-48" title="Tu avatar" />
<AvatarSvg avatar={jugador.avatar} crop="head" graduado className="h-10 w-10 rounded-full" />
```

En el servidor, valida lo que llega del cliente con `isValidAvatar(body.avatar)` y guarda `parseAvatar(body.avatar)`
(en Experiencia UEP se guardaba como `jsonb` en la columna `players.avatar`).
