# Out of scope — deliberately not built

Noted rather than built, per the guardrails.

- **Auth & roles.** No sign-in, no manager role. `created_by` / `approved_by` are free
  text and approval is ungated. Landing this means: real user accounts, an FK from
  those columns, a role check on the approve/reject action, and deleting
  `supabase/migrations/20260101000002_dev_anon_access.sql`.
- **Multi-tenant.** No org/branch column anywhere.
- **Outward / sales.** The data model does not block it: `stock_by_material` reads
  from `inward_entries` with a status filter, so an `outward_entries` table joins in as
  a second term without touching materials.
- **Pricing.** No rate, no valuation, no GST beyond the HSN code field.
- **Reports.** No stock ageing, no supplier summary, no movement register.
- **Godown / bin locations.** Stock is per-SKU only.
- **Material edit history.** Editing a material recomputes its weight but keeps no
  audit trail of the change.
- **Batch/heat-number traceability** beyond the free-text `batch_no`.
- **Bulk import** of the material master from a spreadsheet.
- **IS 808 coverage is partial** — only the sections in Appendix A are seeded. Add the
  rest under Settings → IS 808 as they come up.
