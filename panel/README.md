# Panel de premiación · Experiencia UEP

App **aparte** del juego (`panelpolar.aulaciete.net`). Solo **lee** la tabla `players` de la base del juego y muestra
el ranking para la premiación: puntaje + tiempo, filtro **global / por estado / por localidad**, búsqueda y descarga CSV.
No escribe nada ni comparte código con el juego.

- Orden: más puntos primero; a igual puntaje, menos tiempo (`tiempo_ms`: suma de lo que tardó en cada nivel).
- Todo el sitio pide clave: usuario `uep` + `PANEL_PASSWORD`. Muestra cédulas y nombres: la clave es solo para UEP.
- Se actualiza solo cada 30 s.

## Correr

```bash
cd panel
npm install
cp .env.example .env.local   # PANEL_PASSWORD + la base del juego
npm run dev                  # http://localhost:3001
```

## Desplegar (Vercel, proyecto nuevo)

1. **Add New → Project**, mismo repositorio, **Root Directory: `panel`** (framework Next.js).
2. Variables: `PANEL_PASSWORD` y la base (`DATABASE_URL`, o `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`).
3. **Domains** → `panelpolar.aulaciete.net`, y en el DNS de `aulaciete.net` un CNAME `panelpolar` → `cname.vercel-dns.com`.

El juego sigue en su propio proyecto (raíz del repositorio); los dos despliegues son independientes.

## Base de datos de solo lectura (recomendado)

Así el panel no puede modificar nada aunque alguien obtenga su configuración. En el SQL Editor de Supabase:

```sql
create role panel_lectura with login password 'CAMBIA-ESTA-CLAVE';
grant usage on schema public to panel_lectura;
grant select on public.players to panel_lectura;
-- El juego tiene RLS activado: este usuario necesita permiso explícito para leer.
create policy panel_lee_players on public.players for select to panel_lectura using (true);
```

Luego `DATABASE_URL` = la cadena "Connection pooling" de Supabase con ese usuario
(`postgresql://panel_lectura.<ref-del-proyecto>:CLAVE@...pooler.supabase.com:6543/postgres`) y sin `SUPABASE_*`.
