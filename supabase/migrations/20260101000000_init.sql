-- Steel trading inventory: Material Master + Inward (MRN).
-- DO NOT MODIFY once applied unless a failing test proves something here is wrong.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Reference tables (the only place reference weights may be edited)
-- ---------------------------------------------------------------------------

create table is808_sections (
  section_type text not null check (section_type in ('ISA', 'ISMC', 'ISMB', 'ISWB')),
  designation  text not null,
  kg_per_m     numeric not null check (kg_per_m > 0),
  primary key (section_type, designation)
);

comment on column is808_sections.designation is
  'Bare size only: "100" for ISMC/ISMB/ISWB, "{a}x{b}x{t}" with a >= b for ISA. The UI prefixes the type.';

-- Seeded sparsely on purpose; the class formula in lib/steel/weight.ts covers the rest.
-- TODO: verify these thicknesses against IS 8329 before production use.
create table di_pipe_classes (
  od_mm        numeric not null check (od_mm > 0),
  class        text not null check (class in ('K7', 'K9', 'K12')),
  thickness_mm numeric not null check (thickness_mm > 0),
  primary key (od_mm, class)
);

-- ---------------------------------------------------------------------------
-- Material master
-- ---------------------------------------------------------------------------

create table materials (
  id               uuid primary key default gen_random_uuid(),
  category         text not null check (category in
                     ('pipe','angle','channel','ibeam','hbeam','rod','sheet','di_pipe','coil')),
  sub_category     text,
  grade            text,
  hsn_code         text,
  manufacturer     text,
  brand            text,
  specs            jsonb not null,
  -- Canonical identity, built server-side by lib/steel/specKey.ts.
  spec_key         text not null,
  -- Always recomputed by lib/steel/weight.ts on save. Persisted for query speed only.
  weight_per_m     numeric not null check (weight_per_m > 0),
  weight_per_piece numeric check (weight_per_piece > 0),  -- null for coil
  weight_source    text not null check (weight_source in
                     ('formula','is808','angle_formula','di_table','di_formula')),
  buy_units        text[] not null,
  sell_units       text[] not null,
  is_active        boolean not null default true,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint materials_spec_key_key unique (spec_key),
  -- Coils are the only category with no length, and therefore no weight per piece.
  constraint materials_coil_has_no_piece_weight check (
    (category = 'coil' and weight_per_piece is null)
    or (category <> 'coil' and weight_per_piece is not null)
  )
);

create index materials_category_idx on materials (category);
create index materials_is_active_idx on materials (is_active);

-- ---------------------------------------------------------------------------
-- Inward (MRN)
-- ---------------------------------------------------------------------------

create type inward_status as enum ('accepted', 'pending_approval', 'approved', 'rejected');

create sequence inward_mrn_seq;

-- MRN-YYYYMM-0001. The sequence is global rather than per-month so numbers are
-- never reused; the month prefix stays human-readable.
create or replace function next_mrn_no() returns text
language sql volatile as $$
  select 'MRN-' || to_char(now() at time zone 'utc', 'YYYYMM') || '-'
         || lpad(nextval('inward_mrn_seq')::text, 4, '0');
$$;

create table inward_entries (
  id                    uuid primary key default gen_random_uuid(),
  mrn_no                text not null unique default next_mrn_no(),
  material_id           uuid not null references materials (id),
  supplier              text,
  vehicle_no            text,
  batch_no              text,
  actual_weight_kg      numeric not null check (actual_weight_kg > 0),
  pieces                integer check (pieces > 0),  -- non-coil: pieces; coil: number of coils
  actual_length_m       numeric check (actual_length_m > 0),  -- optional verification, non-coil only
  theoretical_weight_kg numeric,   -- null for coil
  tolerance_kg          numeric,
  tolerance_pct         numeric,
  calc_length_m         numeric,   -- coil only
  status                inward_status not null,
  approved_by           text,
  approval_reason       text,
  created_by            text,
  created_at            timestamptz not null default now(),
  approved_at           timestamptz,
  -- An approval or rejection must always carry a reason.
  constraint inward_decision_needs_reason check (
    status not in ('approved', 'rejected')
    or (approval_reason is not null and char_length(approval_reason) >= 10)
  )
);

create index inward_entries_material_idx on inward_entries (material_id);
create index inward_entries_status_idx on inward_entries (status);
create index inward_entries_created_at_idx on inward_entries (created_at desc);

-- ---------------------------------------------------------------------------
-- Stock. KG is the base unit; everything else is derived per SKU at read time.
-- Only accepted / approved entries count.
-- ---------------------------------------------------------------------------

create view stock_by_material
with (security_invoker = on) as
select m.id                                    as material_id,
       sum(i.actual_weight_kg)                 as stock_kg,
       sum(i.pieces)                           as stock_pcs,
       sum(i.actual_weight_kg) / m.weight_per_m as stock_m
from materials m
join inward_entries i on i.material_id = m.id
where i.status in ('accepted', 'approved')
group by m.id, m.weight_per_m;

-- ---------------------------------------------------------------------------
-- RLS: one authenticated-role policy for now. Roles/approvals come later.
-- ---------------------------------------------------------------------------

alter table materials        enable row level security;
alter table inward_entries   enable row level security;
alter table is808_sections   enable row level security;
alter table di_pipe_classes  enable row level security;

create policy materials_authenticated on materials
  for all to authenticated using (true) with check (true);
create policy inward_entries_authenticated on inward_entries
  for all to authenticated using (true) with check (true);
create policy is808_sections_authenticated on is808_sections
  for all to authenticated using (true) with check (true);
create policy di_pipe_classes_authenticated on di_pipe_classes
  for all to authenticated using (true) with check (true);
