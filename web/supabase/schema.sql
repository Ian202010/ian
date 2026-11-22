-- Ejecuta esto en Supabase → SQL Editor.
create table if not exists public.citas (
  id          bigint generated always as identity primary key,
  created_at  timestamptz not null default now(),
  nombre      text not null,
  telefono    text not null,
  email       text,
  municipio   text not null,
  direccion   text not null,
  vehiculo    text not null,
  servicio    text not null,
  fecha       date not null,
  hora        text not null,
  notas       text,
  estado      text not null default 'pendiente'
);

alter table public.citas enable row level security;

-- El público (clave anon) solo puede CREAR citas. No puede leerlas, editarlas ni borrarlas.
-- Tú las ves en Supabase → Table Editor → citas.
drop policy if exists "Cualquiera puede crear una cita" on public.citas;
create policy "Cualquiera puede crear una cita"
  on public.citas for insert
  to anon
  with check (true);
