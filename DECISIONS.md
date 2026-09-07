# Decisions

Ambiguities resolved during the build. The rule applied throughout: **when in doubt,
keep the SKU stricter.**

## Domain

1. **`SQFT_FACTOR` is 0.7293, not the 0.7525 in the source spec.**
   7.85 kg/m²/mm × 0.092903 m²/sqft = 0.729288. The spec's figure is arithmetically
   wrong. Derivation is a comment in `lib/steel/constants.ts`.

2. **Appendix B's `fromKg(3600, 'SQFT', sheet)` expectation of 6170.4 is off by 0.1.**
   3600 / (0.8 × 0.7293) = 3600 / 0.58344 = **6170.30**. The test asserts the correct
   value. Appendix C's own "6170 sq ft" agrees with it.

3. **DI pipe: the table beats the formula whenever a row exists.**
   The spec's worked example (OD 200, K9, t = 10.5) contradicts its own K9 formula
   (200/20 + 3 = 13). `(200, K9, 10.5)` is seeded so the example reproduces; every
   other OD/class falls back to the formula and is badged "approximate".
   Both the migration and `seedData.ts` carry a "verify against IS 8329" note.

4. **IS 808 designations are stored bare** (`100`, `50x50x6`); the UI prefixes the
   section type. Angle keys normalise to `{a}x{b}x{t}` with `a ≥ b`, so 50×65×6 and
   65×50×6 are the same section.

5. **Missing IS 808 row blocks the save for channel/I-beam/H-beam, but falls back for
   angles.** That is what the spec asks for: angles have a usable geometric
   approximation, rolled sections do not. There is no manual weight entry anywhere.

6. **`spec_key` only includes fields the category declares.** A stray key in the
   `specs` object can never fork a SKU. Numeric-looking strings normalise as numbers
   (`"5.0"` → `5`), everything else lowercases.

7. **Unit support is decided by the category, not by the ticked units.**
   `fromKg` / `toKg` throw for a unit outside the category's buy ∪ sell set — that is a
   physical question. The ticked `buy_units` / `sell_units` are a commercial preference
   and restrict the UI, not the maths. Consequence: the materials list shows "—" in the
   M column for sheets, which have no M unit.

8. **Tolerance is inclusive at exactly ±5%,** with a 1e-9 epsilon so a reading that is
   mathematically on the limit is not flipped by floating-point noise.

9. **Tolerance sign convention:** `tolerance_kg = actual − theoretical`. Negative means
   short-received. Percentages are relative to theoretical.

10. **Actual length on inward is a verification field, never a spec.** Any difference
    from the master length is a hard block with a link to create the correct SKU — it
    never adjusts the calculation. Hidden entirely for coils.

11. **Approve *and* reject both require a reason** (min 10 chars), enforced by a DB
    check constraint, not only the form. The spec only demanded it for approve;
    a rejection without a reason is just as unauditable.

12. **MRN sequence is global, not per-month.** `MRN-YYYYMM-0001` keeps the month
    prefix readable but the counter never resets, so a number is never reused. A
    per-month reset would need a lock or a per-month sequence for no real benefit.

## Infrastructure

13. **`20260101000002_dev_anon_access.sql` grants the `anon` role the same access as
    `authenticated`.** Auth UI is explicitly out of scope, so the app connects with the
    anon key and no session; without this policy RLS would make every screen empty.
    **Delete this migration when sign-in lands.**

14. **`created_by` / `approved_by` are free text**, defaulted to `operator` /
    `manager`, because there are no user accounts yet. They become FKs when auth lands.

15. **Approval is not gated by a role.** There is no auth, so there is no manager role
    to check. The button is present for anyone; the audit trail (`approved_by`,
    `approval_reason`, `approved_at`) is what carries the weight for now.

16. **Category definitions live in code, not the DB.** They drive the form, the weight
    engine and the display-name builder together; splitting them across a table would
    let those three drift apart.
