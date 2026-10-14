-- Experiencia Polar: esquema Postgres. Sirve igual para:
--   · Supabase → SQL Editor → pegar y ejecutar.
--   · Postgres en Dokploy → psql "$DATABASE_URL" -f supabase/schema.sql
-- Es idempotente: se puede volver a ejecutar sin perder datos.

create extension if not exists "pgcrypto";

create table if not exists public.players (
  id                uuid primary key default gen_random_uuid(),
  nombre            text not null,
  email             text not null unique,
  telefono          text not null,
  sede              text not null,
  oso_nombre        text not null,
  avatar            jsonb not null default '{}'::jsonb, -- { pelaje, cabeza, ropa, accesorio }
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

-- Migración desde la versión PWA (look → avatar). No hace nada en una base nueva.
alter table public.players add column if not exists avatar jsonb not null default '{}'::jsonb;
alter table public.players drop column if exists look;

-- Claves de consulta: sede + puntos (leaderboard) y email (registro).
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
