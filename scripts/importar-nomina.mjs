// Carga la nómina de UEP (cédula, nombre, localidad, estado) en la tabla `nomina`.
// Solo quien está en la nómina puede entrar al juego, y solo con su cédula.
//
//   node --env-file=.env.local scripts/importar-nomina.mjs nomina.csv
//
// El CSV puede venir separado por coma o punto y coma (lo que exporta Excel). La primera fila son los títulos;
// se reconocen: cédula / cedula / ci / Nº pers., nombre / nombres / nombre completo, localidad / sede, estado.
// Si una cédula ya existe, se actualizan sus datos (se puede volver a correr con una nómina corregida).
// Usa DATABASE_URL o, si no hay, SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (igual que el servidor).
import { readFileSync } from 'node:fs';

const file = process.argv[2];
if (!file) {
  console.error('Uso: node --env-file=.env.local scripts/importar-nomina.mjs <archivo.csv>');
  process.exit(1);
}

const norm = (v) => v.normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase();

function parseCsv(text) {
  text = text.replace(/^﻿/, '');
  const first = text.split(/\r?\n/)[0];
  const sep = (first.match(/;/g) ?? []).length > (first.match(/,/g) ?? []).length ? ';' : ',';
  const rows = [];
  let row = [], cell = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') quoted = false;
      else cell += c;
    } else if (c === '"') quoted = true;
    else if (c === sep) { row.push(cell); cell = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(cell); rows.push(row); row = []; cell = '';
    } else cell += c;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows.filter((r) => r.some((c) => c.trim()));
}

const [header, ...body] = parseCsv(readFileSync(file, 'utf8'));
const col = (...names) => header.findIndex((h) => names.includes(norm(h)));
// "Nº pers." es como viene en el archivo de la UEP (23.10.2026).
const iCed = col('cedula', 'ci', 'c.i.', 'cedula de identidad', 'nº pers.', 'n° pers.', 'no pers.', 'nro pers.');
const iNom = col('nombre', 'nombres', 'nombre completo', 'nombre y apellido', 'nombres y apellidos');
const iLoc = col('localidad', 'sede', 'ubicacion');
const iEst = col('estado');
if (iCed < 0 || iNom < 0 || iLoc < 0) {
  console.error('Faltan columnas. Títulos encontrados:', header.join(' | '));
  console.error('Se necesitan al menos: cédula, nombre y localidad (estado es opcional).');
  process.exit(1);
}

const seen = new Map();
const malas = [];
for (const [n, r] of body.entries()) {
  const cedula = (r[iCed] ?? '').replace(/\D/g, '');
  const nombre = (r[iNom] ?? '').replace(/\s+/g, ' ').trim();
  const localidad = (r[iLoc] ?? '').replace(/\s+/g, ' ').trim();
  const estado = iEst >= 0 ? (r[iEst] ?? '').replace(/\s+/g, ' ').trim() || null : null;
  if (cedula.length < 5 || cedula.length > 10 || !nombre || !localidad) {
    malas.push(n + 2);
    continue;
  }
  seen.set(cedula, { cedula, nombre, localidad, estado });
}
const rows = [...seen.values()];
console.log(`${rows.length} personas válidas${malas.length ? ` · ${malas.length} filas saltadas (líneas ${malas.slice(0, 15).join(', ')}${malas.length > 15 ? '…' : ''})` : ''}`);

const BATCH = 500;
if (process.env.DATABASE_URL) {
  const { default: postgres } = await import('postgres');
  const sql = postgres(process.env.DATABASE_URL, { prepare: false, max: 1 });
  // Por si la tabla todavía no existe en esta base.
  await sql`create table if not exists nomina (cedula text primary key, nombre text not null, localidad text not null, estado text)`;
  for (let i = 0; i < rows.length; i += BATCH) {
    const chunk = rows.slice(i, i + BATCH);
    await sql`insert into nomina ${sql(chunk)} on conflict (cedula) do update set
      nombre = excluded.nombre, localidad = excluded.localidad, estado = coalesce(excluded.estado, nomina.estado)`;
    console.log(`  ${Math.min(i + BATCH, rows.length)}/${rows.length}`);
  }
  const [{ n }] = await sql`select count(*)::int as n from nomina`;
  console.log(`Personas en la tabla nomina: ${n}`);
  await sql.end();
} else if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  for (let i = 0; i < rows.length; i += BATCH) {
    const res = await fetch(`${process.env.SUPABASE_URL.replace(/\/$/, '')}/rest/v1/nomina?on_conflict=cedula`, {
      method: 'POST',
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates,return=minimal',
      },
      body: JSON.stringify(rows.slice(i, i + BATCH)),
    });
    if (!res.ok) {
      console.error('Error de Supabase:', res.status, await res.text());
      process.exit(1);
    }
    console.log(`  ${Math.min(i + BATCH, rows.length)}/${rows.length}`);
  }
} else {
  console.error('Configura DATABASE_URL o SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}
console.log('Listo: nómina cargada.');
