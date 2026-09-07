# Steel Trading Inventory

Material Master and Inward (MRN) for a steel trading business. Next.js App Router +
Supabase, no separate API layer — server components read, server actions write.

Outward/sales is out of scope; the data model does not block it (see `TODO.md`).

## The rules the app enforces

1. **A SKU is its category plus every technical spec** — length included. Any spec change
   is a different material. Enforced by a unique constraint on `materials.spec_key`, not
   just by the form.
2. **Theoretical weight is derived, never typed.** There is no weight input anywhere.
   `weight_per_m` / `weight_per_piece` are persisted for query speed but always
   recomputed by `lib/steel/weight.ts` on save.
3. **Inward must match an existing SKU exactly.** Specs are read-only on the inward form.
   If the SKU doesn't exist, the form links to the master pre-filled with the category.
4. **Coils are the exception.** No length in the master; inward derives
   `length_m = actual_weight_kg / weight_per_m` and skips the tolerance check.
5. **KG is the base stock unit.** M / NOS / SQFT / SQM are derived per SKU at read time.
6. **±5% tolerance.** Outside it, the entry saves as `pending_approval` and stays out of
   stock until a manager approves it with a reason of at least 10 characters.

## Layout

```
lib/steel/          all domain logic — weight math lives ONLY in weight.ts
  constants.ts        density and section factors (do not modify)
  categories.ts       the 9 categories: fields, units, weight method
  weight.ts           computeWeight() and the area helpers
  units.ts            fromKg / toKg
  specKey.ts          the canonical SKU identity string
  displayName.ts      deterministic per-category names
  inward.ts           tolerance, coil length, status
lib/data/           Supabase reads
app/materials/      master: list, create, edit + saveMaterial action
app/inward/         MRN: list, create, detail + createInward / decideInward actions
app/settings/       IS 808 and DI class tables — the only editable reference weights
supabase/migrations/
tests/              Vitest, 49 cases covering Appendix B and the Appendix C arithmetic
```

## Setup

```bash
npm install
cp .env.example .env.local     # fill in your Supabase URL and anon key
```

Apply the migrations, in order:

```bash
supabase db push               # or: psql "$DATABASE_URL" -f supabase/migrations/<each>.sql
psql "$DATABASE_URL" -f supabase/seed_dev.sql   # optional: one demo SKU per category
```

`20260101000001_seed_reference.sql` loads the IS 808 sections and the DI class rows.
`20260101000002_dev_anon_access.sql` is **dev only** — it grants the `anon` role access
because there is no sign-in yet. Delete it when auth lands.

```bash
npm run dev
npm test          # domain unit tests
npm run typecheck
npm run build
```

## Notes for the next person

- **Never add a weight input.** If a section's weight is unknown, add it under
  Settings → IS 808. That block is deliberate.
- Editing a reference weight does not restate materials already saved — their weight was
  frozen at save time and is recomputed the next time the material is edited.
- `spec_key` is built in exactly one place (`lib/steel/specKey.ts`) and the DB unique
  constraint depends on it. Changing its format needs a backfill migration.
- Ambiguities and where this build deviates from the source spec are in `DECISIONS.md`.
