-- Experiencia Polar: esquema Postgres. Sirve igual para:
--   · Supabase → SQL Editor → pegar y ejecutar.
--   · Postgres en Dokploy → psql "$DATABASE_URL" -f supabase/schema.sql
-- Es idempotente: se puede volver a ejecutar sin perder datos.

create extension if not exists "pgcrypto";

create table if not exists public.players (
  id                uuid primary key default gen_random_uuid(),
  nombre            text not null,                -- nombre completo
  cedula            text unique,                  -- identifica al jugador (solo dígitos)
  email             text unique,                  -- opcional
  telefono          text,                         -- ya no se pide
  sede              text not null,
  oso_nombre        text not null,                -- apodo en el ranking
  avatar            jsonb not null default '{}'::jsonb, -- ícono: { simbolo, color }
  puntos            integer not null default 0,
  completed         integer[] not null default '{}',
  current_trivia    integer,
  current_question  integer not null default 0,
  missed            boolean not null default false,
  trivia_puntos     integer not null default 0,
  last_completed_at timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- Registro UEP: cédula (identifica al jugador), correo opcional, sin teléfono.
alter table public.players add column if not exists cedula text;
create unique index if not exists players_cedula_key on public.players (cedula);
alter table public.players alter column email drop not null;
alter table public.players alter column telefono drop not null;

-- Contrarreloj: cuándo arrancó la trivia en curso y cuándo vio la pregunta actual.
alter table public.players add column if not exists trivia_started_at timestamptz;
alter table public.players add column if not exists question_started_at timestamptz;

-- 3 preguntas por estación sorteadas de un banco de 10: índices del banco que le tocaron en la trivia en curso.
alter table public.players add column if not exists question_ids integer[] not null default '{}';

-- Migración desde la versión PWA (look → avatar). No hace nada en una base nueva.
alter table public.players add column if not exists avatar jsonb not null default '{}'::jsonb;
alter table public.players drop column if exists look;

-- Nómina de UEP (cédula, nombre, localidad, estado): solo quien está aquí puede entrar, y solo con su cédula.
-- Se carga con scripts/importar-nomina.mjs a partir del archivo que envía UEP.
create table if not exists public.nomina (
  cedula     text primary key,                    -- solo dígitos
  nombre     text not null,
  localidad  text not null,
  estado     text
);
alter table public.nomina enable row level security;

-- Estado (para filtrar en el panel) y tiempo total jugando (desempate para la premiación).
alter table public.players add column if not exists estado text;
alter table public.players add column if not exists tiempo_ms integer not null default 0;

-- Claves de consulta: localidad + puntos (leaderboard) y cédula (registro).
create index if not exists players_sede_puntos_idx on public.players (sede, puntos desc);

-- Registro de cada respuesta (auditoría y desempates).
create table if not exists public.answers (
  id          bigserial primary key,
  player_id   uuid not null references public.players(id) on delete cascade,
  trivia      integer not null,
  question    integer not null,
  option_idx  integer not null,
  correct     boolean not null,
  created_at  timestamptz not null default now()
);
create index if not exists answers_player_idx on public.answers (player_id);

-- La app solo accede con la service_role key desde el servidor (API routes),
-- así que activamos RLS sin políticas públicas: el navegador no puede leer ni escribir.
-- (En Postgres de Dokploy no hay clientes públicos; RLS no estorba.)
alter table public.players enable row level security;
alter table public.answers enable row level security;

-- Totales por sede para el ranking "Todas las sedes".
create or replace function public.sede_totals()
returns table (sede text, puntos bigint, jugadores bigint)
language sql stable as $$
  select sede, coalesce(sum(puntos), 0) as puntos, count(*) as jugadores
  from public.players
  group by sede
$$;
