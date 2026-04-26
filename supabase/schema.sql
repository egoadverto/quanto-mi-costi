create extension if not exists "pgcrypto";

create table if not exists public.veicoli (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  nome text not null,
  marca text,
  modello text,
  tipo_veicolo text check (tipo_veicolo in ('auto','moto')),
  tipo_energia text check (tipo_energia in ('elettrico','benzina','diesel')),
  unita_default text check (unita_default in ('kWh','L')),
  odometro_iniziale numeric default 0,
  data_creazione date default current_date,
  note text
);

create table if not exists public.rifornimenti (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  veicolo_id uuid not null references public.veicoli(id) on delete cascade,
  data date not null,
  odometro numeric not null,
  quantita numeric not null,
  unita text check (unita in ('kWh','L')),
  prezzo_unitario numeric not null,
  costo_totale numeric not null,
  fornitore text,
  note text
);

create table if not exists public.spese (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  veicolo_id uuid not null references public.veicoli(id) on delete cascade,
  data date not null,
  categoria text check (categoria in (
    'assicurazione',
    'bollo',
    'manutenzione',
    'tagliando',
    'gomme',
    'revisione',
    'accessori',
    'parcheggio',
    'pedaggi',
    'lavaggio',
    'altro'
  )),
  descrizione text,
  importo numeric not null,
  odometro numeric,
  note text
);

alter table public.veicoli enable row level security;
alter table public.rifornimenti enable row level security;
alter table public.spese enable row level security;

drop policy if exists veicoli_select_own on public.veicoli;
create policy veicoli_select_own on public.veicoli
for select using (user_id = auth.uid());

drop policy if exists veicoli_insert_own on public.veicoli;
create policy veicoli_insert_own on public.veicoli
for insert with check (user_id = auth.uid());

drop policy if exists veicoli_update_own on public.veicoli;
create policy veicoli_update_own on public.veicoli
for update using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists veicoli_delete_own on public.veicoli;
create policy veicoli_delete_own on public.veicoli
for delete using (user_id = auth.uid());

drop policy if exists rifornimenti_select_own on public.rifornimenti;
create policy rifornimenti_select_own on public.rifornimenti
for select using (user_id = auth.uid());

drop policy if exists rifornimenti_insert_own on public.rifornimenti;
create policy rifornimenti_insert_own on public.rifornimenti
for insert with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.veicoli v
    where v.id = veicolo_id and v.user_id = auth.uid()
  )
);

drop policy if exists rifornimenti_update_own on public.rifornimenti;
create policy rifornimenti_update_own on public.rifornimenti
for update using (user_id = auth.uid()) with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.veicoli v
    where v.id = veicolo_id and v.user_id = auth.uid()
  )
);

drop policy if exists rifornimenti_delete_own on public.rifornimenti;
create policy rifornimenti_delete_own on public.rifornimenti
for delete using (user_id = auth.uid());

drop policy if exists spese_select_own on public.spese;
create policy spese_select_own on public.spese
for select using (user_id = auth.uid());

drop policy if exists spese_insert_own on public.spese;
create policy spese_insert_own on public.spese
for insert with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.veicoli v
    where v.id = veicolo_id and v.user_id = auth.uid()
  )
);

drop policy if exists spese_update_own on public.spese;
create policy spese_update_own on public.spese
for update using (user_id = auth.uid()) with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.veicoli v
    where v.id = veicolo_id and v.user_id = auth.uid()
  )
);

drop policy if exists spese_delete_own on public.spese;
create policy spese_delete_own on public.spese
for delete using (user_id = auth.uid());
